# 04b — Arquitetura de Dados (versão final endurecida)

**Squad:** i2-gestao-decisoria · **Persona:** Henrique — Data Architect Postgres/Supabase
**Data:** 2026-06-08 · **Fase 4b** · Substitui o DDL de `04-data-arch.md`

> A v1 estava conceitualmente sólida (reaproveitar `income_records`, cofre sem tabela,
> proração dupla) mas tinha **dois bloqueios físicos** que a revisão adversarial pegou
> e que eu confirmei lendo o SQL real: (1) `income_records.occurred_on` é `NOT NULL`
> (`0001` l.161) → o ramo "previsto" do CHECK era inalcançável; (2) a RLS de escrita
> sem `WITH CHECK` ancorada num `0002` que contém SQL **inválido** (`for insert delete`,
> l.108). Ambos corrigidos abaixo. O padrão canônico de escrita do projeto é o `0006`
> (`for insert … with check`), não o `0002`.

---

## (1) Changelog — resposta a cada achado dos revisores

**[ALTA] RLS de escrita sem `WITH CHECK` → ACEITO E CORRIGI.** O revisor está certo e
o motivo é sutil: numa policy `FOR ALL`, o INSERT é validado pelo `WITH CHECK`; quando
ausente, ele *cai de volta* no `USING`, mas o `USING` só garante `household_id` **se o
app mandar o household certo** — não impede um payload com `account_id`/`payroll_run_id`
apontando para outro household. Reescrevi **todas** as policies de escrita como ações
explícitas: `for insert with check (…)`, `for update using (…) with check (…)`,
`for delete using (…)` — exatamente o padrão de `0006_fiscal_notes.sql` (l.44–63).
Confirmei lendo `0002` que `accounts`/`income_records` usam `for all using` sem
`with check` — esse é o **defeito latente** que o revisor apontou e que eu **não vou
espelhar**. (Não corrijo as policies legadas nesta fase para não tocar superfície de
regressão da fatura/acerto; registro o débito em §4.)

**[ALTA] A proposta cita `0002` l.108 como padrão, mas é SQL inválido → ACEITO.**
Confirmado lendo o arquivo: l.107–109 traz `create policy "admin manage obligations"
on monthly_obligations for insert delete using (…)`. **`for insert delete` não é
sintaxe Postgres** (uma policy é para UMA ação). Removi toda referência ao `0002` como
modelo. A referência canônica passa a ser `0006`. Nota operacional: ou aquela policy
nunca aplicou como está, ou o banco vivo diverge ainda mais — reforça o drift e a
necessidade do pré-voo de §3 (`select * from pg_policies`).

**[MÉDIA — a mais séria] Falta `drop not null` em `occurred_on` → ACEITO E CORRIGI.**
Confirmado: `0001` l.161 = `occurred_on date not null`. Sem relaxar isso, o ramo
`status in ('previsto','faturado')` do `dates_check` é **fisicamente inalcançável**
(previsto não tem data de caixa, mas a coluna exige uma) — a feature de AR previsto
nasceria morta. Adicionei `alter table income_records alter column occurred_on drop not
null;` no UP do 0009, e o DOWN **restaura** o `not null` (com tratamento de dados, ver
próximo item).

**[MÉDIA] DOWN do 0009 corrompe linhas previstas (occurred_on NULL órfão) → ACEITO E
CORRIGI.** Um DOWN que silenciosamente deixa receitas-fantasma não é reversível. O DOWN
agora é **explícito e seguro**: antes de dropar `expected_on` e re-aplicar o `NOT NULL`,
ele faz `delete from income_records where status <> 'recebido'` (são, por construção,
hipóteses sem caixa — apagá-las ao reverter é a semântica correta) e só então
`alter column occurred_on set not null`. Documentado inline como **destrutivo para
recebíveis não-realizados** — que é o comportamento certo, não um bug.

**[MÉDIA] `dates_check` quebra o INSERT legado do app que não conhece `status` →
RESOLVIDO pelo default.** O `Insert` atual de `income_records` (types.ts l.84) não envia
`status` nem `expected_on`. Com `status default 'recebido'` + `expected_on` nullable +
`occurred_on` que o app **sempre** manda hoje (l.84), o ramo `recebido` do CHECK passa
sem mudar o app. A Fase 5 é que passa a setar `status` e omitir `occurred_on` para
previstos — agora possível porque relaxei o `NOT NULL`. Sem regressão no caminho atual.

**[MÉDIA] Sem CHECK status↔entity_id (vazamento Fator R no income_records) → ACEITO
PARCIAL, com correção pragmática.** O revisor tem razão: deixei o gap aberto e o
declarei "fechado (G5)" indevidamente. Não dá para amarrar `kind PJ ↔ entidade i2` por
CHECK puro sem hardcodar o UUID da i2 (acoplaria a migration ao seed — anti-padrão).
**Correção que adoto:** (a) torno `entity_id` **NOT NULL** em `income_records` (com
backfill defensivo para a entidade Família dos legados PF, único default seguro), de
modo que toda receita tenha lado fiscal explícito; (b) a coerência `kind↔tipo de
entidade` fica num **trigger leve** (valida que kinds PJ exigem entidade `business` e
kinds PF exigem `personal`/`shared`), porque o trigger pode consultar `entities.type`
sem hardcode de UUID. Assim o Fator R fica blindado sem acoplar a migration ao seed.
**Registro honesto:** isto fecha G5 de verdade; a v1 não fechava.

**[BAIXA] `total_a_desembolsar` materializado = mesmo anti-pattern que rejeito no
orçamento → ACEITO PARCIAL.** É incoerência de princípio, reconheço. **Mantenho a
materialização** (é cabeçalho de lote, leitura quente da tela "Caixa da semana", e o
revisor concorda que é defensável), mas: (a) paro de vendê-la como "calculado nunca
digitado"; (b) documento como decisão consciente de cache; (c) crio a VIEW
`payroll_runs_v` como **fonte de verdade alternativa** (soma ao vivo) para auditoria/
reconciliação se o trigger e o materializado divergirem após restore/backfill. O
materializado é conveniência; a VIEW é a verdade.

**[BAIXA] Índice de `payroll_items` não cobre `household_id` (RLS filtra por ele) →
ACEITO E CORRIGI.** Troquei `idx_payroll_items_run (payroll_run_id)` por
`(household_id, payroll_run_id)` — serve a RLS direta e a leitura quente por run.

**[REJEITO — nada a mudar] "Guardar dias + valor é over-engineering?"** Não; o revisor
**concorda** que guardar `dias_trab + dias_base + valor_a_pagar` é a modelagem certa
(valor = fato imutável; dias = auditabilidade). Mantido sem alteração. Idem
**cofre = nenhuma tabela** e **estender income_records vs criar receivables** — ambos
elogiados pelos revisores. Mantidos.

**[Feedback do Iremar — UX, não-DDL, mas modela defaults] ACEITO.** "Não me faça
escolher bolsa/rpa nem Fator R toda semana." → o **banco** mantém as colunas `tipo`/
`fator_r` (são fato fiscal necessário ao DRE), mas elas ganham `default` e a Fase 5
**pré-preenche por colaborador** (Eduarda nasce `bolsa`, Pedro `salario`). "Deixe salvar
recebível com o mínimo." → `cliente`, `projeto`, `parcela_*` são **todos nullable**
(já eram); só `amount`, `expected_on`/`occurred_on` e `entity_id` são obrigatórios.
"Status com nome técnico." → label é camada de UI (Vou receber / Notei / Caiu); o banco
guarda o enum estável. "O drift não pode quebrar minha fatura." → §4 garante isso por
construção (zero `alter`/`drop` em `monthly_settlements`, `transactions`,
`monthly_obligations`).

---

## (2) Migrations finais (UP + DOWN reversível, RLS, índices)

Convenções de `0001`/`0006`: `snake_case`, `uuid` PK `gen_random_uuid()`,
`numeric(12,2)` dinheiro, `household_id references households(id)`, RLS via
`get_my_household_id()`/`get_my_role()`. **Todo CHECK usa drop-then-add** (idempotente
contra o drift). **Toda escrita RLS usa ações explícitas com `WITH CHECK`** (padrão
`0006`).

### `0009_income_receivables.sql` — AR + G1 + G5 (ESTENDER income_records)

```sql
-- ════════════════════════════════════ UP ════════════════════════════════════
-- (1) Defensivo contra drift: garantir entity_id (banco vivo já tem — Task #7)
alter table income_records
  add column if not exists entity_id uuid references entities(id);

-- (2) Eixo previsão→realização + contexto cliente/projeto/parcela (todos nullable)
alter table income_records
  add column if not exists expected_on date,
  add column if not exists status text not null default 'recebido',
  add column if not exists cliente text,
  add column if not exists projeto text,
  add column if not exists parcela_n int,
  add column if not exists parcela_de int;

-- (3) CRÍTICO: relaxar occurred_on. Previsto/faturado NÃO têm data de caixa.
--     Sem isto o ramo 'previsto' do dates_check é inalcançável (achado [MÉDIA]).
alter table income_records alter column occurred_on drop not null;

-- (4) G5: entity_id NOT NULL com backfill seguro (toda receita tem lado fiscal).
--     Backfill p/ a entidade personal do household (único default sem ambiguidade).
update income_records ir
   set entity_id = (
     select e.id from entities e
      where e.household_id = ir.household_id and e.type = 'personal'
      order by e.created_at limit 1)
 where ir.entity_id is null;
alter table income_records alter column entity_id set not null;

-- (5) G1: redefinir CHECK de kind em estado conhecido (drop-then-add)
alter table income_records drop constraint if exists income_records_kind_check;
alter table income_records add constraint income_records_kind_check
  check (kind in (
    'pro_labore','i2_reimbursement','juliana_transfer','other',  -- PF legado
    'faturamento_i2','projeto','servico_recorrente'              -- receita PJ
  ));

-- (6) Máquina de estados de AR
alter table income_records drop constraint if exists income_records_status_check;
alter table income_records add constraint income_records_status_check
  check (status in ('previsto','faturado','recebido'));

-- (7) Coerência de parcela: ambas ou nenhuma; 1 <= n <= de
alter table income_records drop constraint if exists income_records_parcela_check;
alter table income_records add constraint income_records_parcela_check
  check (
    (parcela_n is null and parcela_de is null)
    or (parcela_n is not null and parcela_de is not null
        and parcela_n >= 1 and parcela_n <= parcela_de)
  );

-- (8) Coerência de caixa: recebido exige occurred_on; previsto/faturado exigem expected_on
alter table income_records drop constraint if exists income_records_dates_check;
alter table income_records add constraint income_records_dates_check
  check (
    (status = 'recebido' and occurred_on is not null)
    or (status in ('previsto','faturado') and expected_on is not null)
  );

-- (9) G5 — coerência kind↔entidade SEM hardcode de UUID (trigger lê entities.type)
create or replace function income_records_fator_r_guard()
returns trigger language plpgsql as $$
declare v_type text;
begin
  select type into v_type from entities where id = new.entity_id;
  if new.kind in ('projeto','servico_recorrente','faturamento_i2')
     and v_type <> 'business' then
    raise exception 'Receita PJ (kind=%) exige entity_id de entidade business', new.kind;
  end if;
  if new.kind in ('pro_labore','juliana_transfer')
     and v_type = 'business' then
    raise exception 'Receita PF (kind=%) não pode ter entity_id de entidade business', new.kind;
  end if;
  return new;
end;
$$;
create trigger income_records_fator_r_guard_trg
  before insert or update on income_records
  for each row execute function income_records_fator_r_guard();

comment on column income_records.expected_on is 'Data prevista (regime de caixa). NULL quando recebido.';
comment on column income_records.status is 'previsto|faturado|recebido. Só recebido vira saldo.';

-- ═══════════════════════════════════ DOWN ════════════════════════════════════
-- DESTRUTIVO POR DESIGN: apaga recebíveis não-realizados (hipóteses sem caixa),
-- senão dropar expected_on deixaria occurred_on NULL órfão (achado [MÉDIA]).
-- drop trigger if exists income_records_fator_r_guard_trg on income_records;
-- drop function if exists income_records_fator_r_guard();
-- delete from income_records where status <> 'recebido';
-- alter table income_records drop constraint if exists income_records_dates_check;
-- alter table income_records drop constraint if exists income_records_parcela_check;
-- alter table income_records drop constraint if exists income_records_status_check;
-- alter table income_records drop column if exists parcela_de;
-- alter table income_records drop column if exists parcela_n;
-- alter table income_records drop column if exists projeto;
-- alter table income_records drop column if exists cliente;
-- alter table income_records drop column if exists status;
-- alter table income_records drop column if exists expected_on;
-- alter table income_records alter column occurred_on set not null;  -- restaura 0001
-- -- entity_id: mantém NOT NULL? Não — antes do 0009 era nullable. Restaura:
-- alter table income_records alter column entity_id drop not null;
-- -- Restaura CHECK de kind ao estado pós-drift (com faturamento_i2 que o app usa):
-- alter table income_records drop constraint if exists income_records_kind_check;
-- alter table income_records add constraint income_records_kind_check
--   check (kind in ('pro_labore','i2_reimbursement','juliana_transfer','other','faturamento_i2'));
```

### `0010_payroll.sql` — Folha variável com proração (CRIAR)

```sql
-- ════════════════════════════════════ UP ════════════════════════════════════
create table if not exists payroll_runs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  entity_id       uuid not null references entities(id),   -- SEMPRE i2 (Fator R)
  account_id      uuid references accounts(id),            -- Inter PJ
  referencia      text not null,
  reference_month date not null,
  data_pagamento  date not null,
  status          text not null default 'rascunho'
                    check (status in ('rascunho','confirmada','paga')),
  total_a_desembolsar numeric(12,2) not null default 0,    -- CACHE materializado (ver VIEW)
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists payroll_items (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  payroll_run_id  uuid not null references payroll_runs(id) on delete cascade,
  colaborador     text not null,
  tipo            text not null default 'salario'
                    check (tipo in ('salario','bolsa','pro_labore','servico','rpa')),
  fator_r         text not null default 'folha'
                    check (fator_r in ('folha','nao_folha')),
  valor_base      numeric(12,2) not null,
  dias_trab       int,
  dias_base       int,
  valor_a_pagar   numeric(12,2) not null,
  pago            boolean not null default false,
  paid_on         date,
  transaction_id  uuid references transactions(id),
  notes           text,
  created_at      timestamptz default now(),
  constraint payroll_items_proracao_check check (
    (dias_trab is null and dias_base is null)
    or (dias_trab is not null and dias_base is not null
        and dias_trab >= 0 and dias_base > 0 and dias_trab <= dias_base)
  )
);

-- Cache do total (decisão consciente: leitura quente; a VIEW abaixo é a verdade)
create or replace function payroll_recalc_total()
returns trigger language plpgsql as $$
declare v_run uuid := coalesce(new.payroll_run_id, old.payroll_run_id);
begin
  update payroll_runs r
     set total_a_desembolsar = coalesce(
           (select sum(valor_a_pagar) from payroll_items where payroll_run_id = v_run), 0),
         updated_at = now()
   where r.id = v_run;
  return null;
end;
$$;
create trigger payroll_items_recalc
  after insert or update or delete on payroll_items
  for each row execute function payroll_recalc_total();

create trigger payroll_runs_updated_at
  before update on payroll_runs
  for each row execute function set_updated_at();   -- reusa 0001 l.171

-- Fonte de verdade alternativa p/ reconciliação (achado [BAIXA])
create or replace view payroll_runs_v as
  select r.*,
         coalesce((select sum(i.valor_a_pagar) from payroll_items i
                    where i.payroll_run_id = r.id), 0) as total_calculado
    from payroll_runs r;

-- ── Índices ──
create index if not exists idx_payroll_runs_pay
  on payroll_runs (household_id, data_pagamento);
create index if not exists idx_payroll_runs_status
  on payroll_runs (household_id, status);
create index if not exists idx_payroll_items_run
  on payroll_items (household_id, payroll_run_id);   -- cobre RLS + leitura quente

-- ── RLS (padrão 0006: ações explícitas com WITH CHECK; admin-only, folha é sensível) ──
alter table payroll_runs  enable row level security;
alter table payroll_items enable row level security;

create policy "admin see payroll runs" on payroll_runs for select
  using (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin insert payroll runs" on payroll_runs for insert
  with check (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin update payroll runs" on payroll_runs for update
  using (household_id = get_my_household_id() and get_my_role() = 'admin')
  with check (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin delete payroll runs" on payroll_runs for delete
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

create policy "admin see payroll items" on payroll_items for select
  using (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin insert payroll items" on payroll_items for insert
  with check (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin update payroll items" on payroll_items for update
  using (household_id = get_my_household_id() and get_my_role() = 'admin')
  with check (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin delete payroll items" on payroll_items for delete
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ═══════════════════════════════════ DOWN ════════════════════════════════════
-- drop view if exists payroll_runs_v;
-- drop trigger if exists payroll_runs_updated_at on payroll_runs;
-- drop trigger if exists payroll_items_recalc on payroll_items;
-- drop function if exists payroll_recalc_total();
-- drop table if exists payroll_items;   -- cascade drop das policies/índices junto
-- drop table if exists payroll_runs;
```

### `0011_monthly_budgets.sql` — Orçamento PF (CRIAR, mínima)

```sql
-- ════════════════════════════════════ UP ════════════════════════════════════
create table if not exists monthly_budgets (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  entity_id       uuid not null references entities(id),   -- Família (PF)
  reference_month date not null,
  responsible     text not null
                    check (responsible in ('iremar','juliana','casal')),
  teto            numeric(12,2) not null check (teto >= 0),
  derivar_da_renda boolean not null default false,
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (household_id, reference_month, responsible)
);
-- Comprometido/disponível: CALCULADOS em runtime (settlement.ts). Não persistir.

create trigger monthly_budgets_updated_at
  before update on monthly_budgets
  for each row execute function set_updated_at();

-- ── RLS (household VÊ; admin gerencia — padrão 0006 explícito) ──
alter table monthly_budgets enable row level security;
create policy "household see budgets" on monthly_budgets for select
  using (household_id = get_my_household_id());
create policy "admin insert budgets" on monthly_budgets for insert
  with check (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin update budgets" on monthly_budgets for update
  using (household_id = get_my_household_id() and get_my_role() = 'admin')
  with check (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin delete budgets" on monthly_budgets for delete
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ═══════════════════════════════════ DOWN ════════════════════════════════════
-- drop trigger if exists monthly_budgets_updated_at on monthly_budgets;
-- drop table if exists monthly_budgets;
```

> **Cofre (E3):** sem migration. Orquestração em `packages/core` sobre
> `accounts.kind='investment'` + `transfers` + `payroll_runs.total_a_desembolsar`.
> `deficit = Σ desembolso − saldo Inter PJ`; cada resgate pré-preenche um `transfers`.

---

## (3) Ordem de aplicação + snapshot/backup

**Backup antes de tudo:** o projeto já tem o bucket `backups` (`0008`). Tirar snapshot
do banco vivo (pg_dump ou Supabase backup point) **antes do 0009** — é o único passo
irreversível-na-prática (o backfill de `entity_id` e o `set not null` reescrevem dados).

**Pré-voo (read-only, obrigatório, por causa do drift):**
```sql
-- 1) Confirmar o estado real das policies (0002 contém SQL inválido — não confiar nele)
select tablename, policyname, cmd, qual, with_check from pg_policies
 where tablename in ('income_records','accounts','monthly_obligations');
-- 2) Linhas que quebrariam o dates_check (recebido sem data)
select count(*) from income_records where occurred_on is null;        -- esperado 0
-- 3) Linhas sem entity_id (serão backfilladas p/ personal — conferir se é aceitável)
select count(*) from income_records where entity_id is null;
-- 4) Conferir que existe exatamente 1 entidade personal por household (alvo do backfill)
select household_id, count(*) from entities where type='personal' group by 1;
```

**Ordem (alicerce → topo):**
```
0009_income_receivables   -- 1º: G1+G5, fundação de toda receita PJ; mexe em dados
0010_payroll              -- depende de entities, accounts, transactions
0011_monthly_budgets      -- independente; último (menor prioridade)
```
0010 e 0011 não dependem entre si. Só 0009 é pré-requisito conceitual.

**Pós-migração:** `pnpm db:types` para regenerar `database.types.ts` (hoje placeholder
manual, l.82–85). Sem isso o front não enxerga `status`/`expected_on`/`payroll_*`.

---

## (4) Checklist de não-regressão

Garantir que **nada que o Iremar usa hoje quebra** (fatura, acerto com a Juliana, contas).

**Banco / migrations:**
- [ ] Aplicar 0009→0010→0011 sobre cópia do banco vivo (não na prod primeiro).
- [ ] `down` de cada uma roda limpo e re-`up` funciona (idempotência do drift).
- [ ] `select count(*) from income_records where occurred_on is null` = 0 antes do 0009.
- [ ] Inserir receita legada **sem** `status`/`expected_on` (payload atual do app,
      types.ts l.84) → continua passando (default `recebido` + `occurred_on` presente).
- [ ] Tentar `kind='projeto'` com `entity_id` da Família → trigger **rejeita** (G5).
- [ ] Tentar `kind='projeto'` com `entity_id` da i2 → aceita.
- [ ] Inserir previsto (`status='previsto'`, `occurred_on` NULL, `expected_on` setado)
      → aceita (prova que o `drop not null` destravou o ramo).

**Telas intocadas (regressão zero esperada):**
- [ ] `/acerto` (`monthly_settlements`): fechar/ver um mês — nenhuma coluna alterada.
- [ ] Fatura no dashboard (`settlement.ts` sobre `transactions`): split Iremar/Juliana
      idêntico antes e depois (rodar o cenário do mês fechado e comparar números).
- [ ] `/compromissos` (`monthly_obligations`/`recurring_commitments`): listar, dar baixa,
      filtrar — não tocamos essas tabelas.
- [ ] `/contas` (`accounts`/`transfers`): saldos e transferência — intocados.
- [ ] Login da Juliana (operator): **não vê** `payroll_runs`/`payroll_items` (RLS
      admin-only); **vê** o teto dela em `monthly_budgets`; PF-only preservado.

**RLS (o achado [ALTA]):**
- [ ] Como operator, `insert` em `payroll_runs` → **negado** (sem policy de insert p/ ela).
- [ ] Como admin, `insert` em `payroll_items` com `household_id` de **outro** household
      → **negado** pelo `with check` (era o buraco da v1).
- [ ] Como admin do household A, `select` em `payroll_runs` do household B → vazio.

**Reconciliação do materializado:**
- [ ] Após inserir/editar/apagar itens, `total_a_desembolsar` = `total_calculado` da
      VIEW `payroll_runs_v` (trigger coerente).

**Cenário-âncora (folha 1ª sem jun):**
- [ ] Criar run "Folha 1ª sem jun", data_pagamento 13/06, account Inter PJ, entity i2.
- [ ] Itens: Pedro 1.200, Alana 550, Mayana 750, Iremar 3.000, Contadora 500, **Eduarda
      prorada** (`valor_base=500, dias_trab=21, dias_base=31, valor_a_pagar=338,71`).
- [ ] `total_a_desembolsar` = 6.338,71 (soma automática, sem calculadora).
- [ ] Projeto novo: `cliente` + `amount` + `expected_on`, `status='previsto'`, resto
      NULL → salva (mínimo, sem formulário de cartório).

**Veredicto da v1 endereçado:** os dois bloqueios físicos (occurred_on NOT NULL e RLS
sem WITH CHECK ancorada em SQL inválido) estão corrigidos. DDL pronto para `apply` após
o backup e o pré-voo.

**Débito técnico registrado (não nesta fase):** as policies legadas de `0002`
(`income_records`, `accounts` etc. com `for all using` sem `with check`, e a inválida
`monthly_obligations` l.108) têm o mesmo defeito latente. Não as toco agora para não
ampliar a superfície de regressão da fatura; fica um `0012_rls_hardening.sql` futuro
para reescrevê-las no padrão `0006`.
```
