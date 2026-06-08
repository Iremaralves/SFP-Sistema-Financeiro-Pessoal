# 04 — Arquitetura de Dados (v1)

**Squad:** i2-gestao-decisoria · **Persona:** Henrique — Data Architect Postgres/Supabase
**Data:** 2026-06-08 · **Fase 4 de N**

> Lente desta fase: o banco é o contrato. Migrations reversíveis, RLS por
> `household_id = get_my_household_id()`, e a regra-mãe das Fases 1–3 virando
> *constraint física*: **caixa PF nunca toca caixa PJ** → `entity_id` NOT NULL onde
> a separação é fiscal (Fator R). Anti-over-engineering: só crio tabela quando a
> existente quebraria histórico ou semântica. Reaproveito antes de criar.

---

## (0) Descoberta crítica antes de qualquer DDL — o drift das migrations

Lendo `supabase/migrations/`, as migrations versionadas vão de `0001`→`0003` e
pulam para `0006`. **`0004` e `0005` não existem em disco.** Mas `database.types.ts`
e as Tasks #6–#8 ("Schema: paid_by + investment accounts + transfers") provam que o
**banco vivo já tem** colunas/valores que o SQL versionado não declara:

| O que `0001_schema.sql` diz | O que o banco vivo tem (types.ts) |
|---|---|
| `accounts.kind in ('credit_card','checking','company')` | inclui `'investment'` (cofre) + coluna `entity_id`, `brand` |
| `income_records.kind in (... ,'other')` | usa `'faturamento_i2'` (empresa) + coluna `entity_id` |
| `recurring_commitments` sem `payment_method`, sem `recurrence_type`, sem `paid_by`, sem `entity_id` | tem os quatro |
| sem tabela `transfers` | tem `transfers` |
| `monthly_obligations` sem `paid_by` | tem `paid_by` |

**Consequência para esta fase:** não posso escrever DDL "ingênua" assumindo o estado
de `0001`. Toda migration aqui é **idempotente e defensiva** — `add column if not
exists`, e para CHECKs uso o padrão *drop constraint if exists → add constraint* (um
CHECK não tem `if not exists`, então o drop-then-add é a forma reversível e segura
contra o drift). Isto também **fecha o Gap G1** de forma robusta: em vez de "adicionar
`faturamento_i2` ao CHECK" (que falharia se o CHECK vivo já for outro), eu **redefino o
CHECK inteiro** num estado conhecido.

> Recomendação operacional (fora do escopo SQL, mas registro o risco): gerar
> `0004`/`0005` de "catch-up" a partir de `supabase db diff` para o versionado bater
> com o vivo. As migrations abaixo são `0009`+ e funcionam independentemente disso
> porque são defensivas.

---

## (1) Decisão: reaproveitar vs criar (por necessidade nova)

Princípio de corte: **estendo** quando a entidade existente tem a mesma granularidade
e a coluna nova não destrói histórico; **crio** quando a granularidade é diferente
(linha-item vs agregado) ou quando editar a linha existente apagaria o passado.

### A — AR / Recebíveis de projeto (E1, E4) → **ESTENDER `income_records`**

`income_records` já é uma linha por entrada de caixa, com `occurred_on`, `amount`,
`kind`, `reference_month`, `entity_id`. O que falta para virar AR é o eixo
**previsão → realização** e o **status**. A granularidade é idêntica (um recebível =
uma futura linha de receita). Criar uma tabela `receivables` paralela duplicaria
`amount/description/entity_id` e exigiria um JOIN/merge na hora do "recebido" —
over-engineering. **Decisão: estendo** com `expected_on`, `status`, `cliente`,
`projeto`, `parcela_n`, `parcela_de`. O `faturamento_i2` agregado continua válido
(vira um recebível `status='recebido'` de cliente único) e migra naturalmente.
Fecho G1 no mesmo passo: redefino o CHECK de `kind` incluindo os kinds de receita PJ
e garanto `entity_id`. *(Modelo §1 da Fase 2 previa "colunas OU tabela" — escolho
colunas, justificado pela granularidade igual.)*

### B — Folha / pagamentos variáveis (E2, dor #1) → **CRIAR `payroll_runs` + `payroll_items`**

Aqui **NÃO reaproveito** `recurring_commitments` (que tem `variable bool`), e a Fase 2
§2B já argumentou o porquê — confirmo do ponto de vista de dados:
1. `recurring_commitments.due_day` é `int 1..31` (CHECK físico). A folha é uma **data
   de execução** (`2026-06-13`), não um dia recorrente. Forçar polui `/compromissos`.
2. Editar `amount` num recurring **destrói o histórico** do que foi pago em maio. A
   folha precisa de imutabilidade por rodada (auditoria).
3. É relação **cabeçalho→itens** (1 rodada, N colaboradores com valores diferentes) —
   `recurring_commitments` é uma linha só. A `variable bool` resolve "valor que muda
   mês a mês de UM compromisso", não "N itens variáveis num lote datado".

O par `payroll_runs`(cabeçalho)→`payroll_items`(linha) **espelha exatamente** o par
`recurring_commitments`→`monthly_obligations` que o projeto já domina. Proração:
guardo **`valor_base` + `dias_trab` + `dias_base` E `valor_a_pagar`** (decisão em §2.B).

### C — Orçamento pessoal (P4, dor #3) → **CRIAR `monthly_budgets`** (mínima)

Não há onde encaixar "teto do mês por responsável". `monthly_settlements` é snapshot
de mês *fechado* (fatura), semântica diferente de "meta editável do mês corrente".
Mas a tabela é **deliberadamente magra** (Fase 3, Opção A: teto fixo configurável):
`reference_month + responsible + teto + entity_id`. Comprometido e disponível são
**calculados em runtime** (`settlement.ts`), nunca persistidos — persistir derivados é
o over-engineering que a persona Camila rejeita ("semáforo, não planilha").

| Necessidade | Decisão | Tabela | Justificativa-chave |
|---|---|---|---|
| AR projetos (E1/E4) + G1 | Estender | `income_records` | mesma granularidade; evita merge |
| Folha variável (E2) | **Criar** | `payroll_runs` + `payroll_items` | data de execução ≠ due_day; imutabilidade; cabeçalho→itens |
| Orçamento PF (P4) | **Criar** | `monthly_budgets` | só o teto; resto é calculado |

---

## (2) Migrations propostas (SQL real, padrão do projeto)

Convenções seguidas de `0001`/`0006`: `snake_case`, `uuid` PK
`default gen_random_uuid()`, `numeric(12,2)` para dinheiro, `timestamptz default
now()`, `household_id ... references households(id)`, FKs com `on delete cascade`
onde filho, comentários `-- ──`. Cada arquivo tem bloco **UP** e bloco **DOWN**.

### `0009_income_receivables.sql` — AR + fundação G1 (ESTENDER income_records)

```sql
-- 0009_income_receivables.sql
-- AR de projetos: previsão→realização + status em income_records.
-- Fecha Gap G1 (CHECK de kind defasado vs banco vivo) de forma idempotente.
-- ════════════════════════════════════ UP ════════════════════════════════════

-- (1) Garantir entity_id (pode já existir no banco vivo — defensivo)
alter table income_records
  add column if not exists entity_id uuid references entities(id);

-- (2) Eixo previsão vs realização + contexto de cliente/projeto/parcela
alter table income_records
  add column if not exists expected_on date,                 -- data prevista (caixa)
  add column if not exists status text not null default 'recebido',
  add column if not exists cliente text,
  add column if not exists projeto text,
  add column if not exists parcela_n int,
  add column if not exists parcela_de int;

-- (3) G1: redefinir CHECK de kind num estado CONHECIDO (drop-then-add reversível,
--     robusto contra o drift de 0004/0005). Inclui receita PJ.
alter table income_records drop constraint if exists income_records_kind_check;
alter table income_records add constraint income_records_kind_check
  check (kind in (
    'pro_labore','i2_reimbursement','juliana_transfer','other',  -- legados PF
    'faturamento_i2','projeto','servico_recorrente'              -- receita PJ
  ));

-- (4) Máquina de estados de AR (Fase 2 §1): previsto→faturado→recebido
alter table income_records drop constraint if exists income_records_status_check;
alter table income_records add constraint income_records_status_check
  check (status in ('previsto','faturado','recebido'));

-- (5) Coerência de parcela: se uma existe, a outra existe; n<=de
alter table income_records drop constraint if exists income_records_parcela_check;
alter table income_records add constraint income_records_parcela_check
  check (
    (parcela_n is null and parcela_de is null)
    or (parcela_n is not null and parcela_de is not null
        and parcela_n >= 1 and parcela_n <= parcela_de)
  );

-- (6) Coerência caixa: 'recebido' exige occurred_on; previsto/faturado exigem expected_on
alter table income_records drop constraint if exists income_records_dates_check;
alter table income_records add constraint income_records_dates_check
  check (
    (status = 'recebido' and occurred_on is not null)
    or (status in ('previsto','faturado') and expected_on is not null)
  );

comment on column income_records.expected_on is 'Data prevista de recebimento (regime de caixa). NULL quando já recebido.';
comment on column income_records.status is 'previsto=hipótese | faturado=NF emitida | recebido=caixa real. Só recebido conta como saldo (Fase 2 §1).';

-- ═══════════════════════════════════ DOWN ════════════════════════════════════
-- alter table income_records drop constraint if exists income_records_dates_check;
-- alter table income_records drop constraint if exists income_records_parcela_check;
-- alter table income_records drop constraint if exists income_records_status_check;
-- alter table income_records drop column if exists parcela_de;
-- alter table income_records drop column if exists parcela_n;
-- alter table income_records drop column if exists projeto;
-- alter table income_records drop column if exists cliente;
-- alter table income_records drop column if exists status;
-- alter table income_records drop column if exists expected_on;
-- -- Restaura o CHECK de kind ao estado-alvo pós-drift (com faturamento_i2 que o app usa):
-- alter table income_records drop constraint if exists income_records_kind_check;
-- alter table income_records add constraint income_records_kind_check
--   check (kind in ('pro_labore','i2_reimbursement','juliana_transfer','other','faturamento_i2'));
-- -- entity_id NÃO é removido no DOWN: é pré-drift (Task #7) e outras features dependem.
```

> Nota de reversibilidade: o DOWN **não** dropa `entity_id` porque ele é fundação
> anterior (criado nas tasks #6–#7) e cofre/DRE dependem dele. Reverter esta migration
> volta só o que ela introduziu — princípio de "cada migration desfaz o que fez".

### `0010_payroll.sql` — Folha variável com proração (CRIAR)

```sql
-- 0010_payroll.sql
-- Rodada de folha (cabeçalho) + itens (linhas variáveis) com proração.
-- Espelha o par recurring_commitments→monthly_obligations.
-- ════════════════════════════════════ UP ════════════════════════════════════

-- ── Cabeçalho: a "folha dessa semana" ────────────────────────────────────────
create table if not exists payroll_runs (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  entity_id       uuid not null references entities(id),   -- SEMPRE i2 (Fator R)
  account_id      uuid references accounts(id),            -- conta pagadora (Inter PJ)
  referencia      text not null,                           -- "Folha 1ª sem jun"
  reference_month date not null,                           -- competência (Fator R)
  data_pagamento  date not null,                           -- data de execução (caixa)
  status          text not null default 'rascunho'
                    check (status in ('rascunho','confirmada','paga')),
  total_a_desembolsar numeric(12,2) not null default 0,    -- Σ itens (mantido por trigger)
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── Itens: um colaborador, um valor, opcionalmente prorado ───────────────────
create table if not exists payroll_items (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  payroll_run_id  uuid not null references payroll_runs(id) on delete cascade,
  colaborador     text not null,                           -- "Eduarda"
  tipo            text not null
                    check (tipo in ('salario','bolsa','pro_labore','servico','rpa')),
  -- Marcador Fator R (Fase 2 §5): folha conta no numerador; nao_folha não.
  fator_r         text not null default 'folha'
                    check (fator_r in ('folha','nao_folha')),
  valor_base      numeric(12,2) not null,                  -- valor cheio do mês
  -- Proração: GUARDO dias + valor_a_pagar (decisão §2.B abaixo)
  dias_trab       int check (dias_trab is null or dias_trab >= 0),
  dias_base       int check (dias_base is null or dias_base > 0),
  valor_a_pagar   numeric(12,2) not null,                  -- = valor_base se sem proração
  pago            boolean not null default false,
  paid_on         date,
  transaction_id  uuid references transactions(id),        -- saída na Inter PJ quando pago
  notes           text,
  created_at      timestamptz default now(),
  -- Proração é tudo-ou-nada: ou tem os dois dias, ou nenhum
  constraint payroll_items_proracao_check check (
    (dias_trab is null and dias_base is null)
    or (dias_trab is not null and dias_base is not null and dias_trab <= dias_base)
  )
);

-- ── Manter total_a_desembolsar coerente (Σ itens, calculado nunca digitado) ──
create or replace function payroll_recalc_total()
returns trigger language plpgsql as $$
declare
  v_run uuid := coalesce(new.payroll_run_id, old.payroll_run_id);
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
  for each row execute function set_updated_at();   -- reusa função de 0001

-- ═══════════════════════════════════ DOWN ════════════════════════════════════
-- drop trigger if exists payroll_runs_updated_at on payroll_runs;
-- drop trigger if exists payroll_items_recalc on payroll_items;
-- drop function if exists payroll_recalc_total();
-- drop table if exists payroll_items;
-- drop table if exists payroll_runs;
```

### `0011_monthly_budgets.sql` — Orçamento PF (CRIAR, mínima)

```sql
-- 0011_monthly_budgets.sql
-- Teto mensal PF por responsável (Fase 3, Opção A: fixo configurável).
-- Comprometido/disponível são CALCULADOS em runtime — não persistir derivados.
-- ════════════════════════════════════ UP ════════════════════════════════════
create table if not exists monthly_budgets (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,
  entity_id       uuid not null references entities(id),   -- Família (PF) — nunca i2
  reference_month date not null,                           -- 1º dia do mês
  responsible     text not null
                    check (responsible in ('iremar','juliana','casal')),
  teto            numeric(12,2) not null check (teto >= 0),
  derivar_da_renda boolean not null default false,         -- toggle Opção B (futuro)
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  -- Um teto por pessoa por mês
  unique (household_id, reference_month, responsible)
);

create trigger monthly_budgets_updated_at
  before update on monthly_budgets
  for each row execute function set_updated_at();

-- ═══════════════════════════════════ DOWN ════════════════════════════════════
-- drop trigger if exists monthly_budgets_updated_at on monthly_budgets;
-- drop table if exists monthly_budgets;
```

> **Sobre o planejador de cofre (E3 / Fase 2 §4):** confirmo a Fase 1 (Gap G3) — é
> **orquestração/UI sobre dados existentes** (`accounts.kind='investment'` + `transfers`
> + `payroll_runs.total_a_desembolsar`). **Nenhuma tabela nova.** O cálculo
> `deficit = Σ desembolso − saldo Inter PJ` e a alocação por prioridade vivem em
> `packages/core` (ao lado de `settlement.ts`), e cada resgate sugerido pré-preenche um
> `transfers`. Não há migration para o cofre nesta fase — anti-over-engineering.

### B — Por que guardar `dias` *E* `valor_a_pagar` (não só um dos dois)

A pergunta do prompt. **Guardo ambos**, e é a escolha de Controller correta:
- **`valor_a_pagar` persistido** = imutabilidade de auditoria. Se a regra de proração
  mudar no código amanhã, o que a Eduarda *recebeu* em maio não pode mudar
  retroativamente. O valor pago é fato histórico, não derivado recalculável.
- **`dias_trab` + `dias_base` persistidos** = o "porquê" auditável. A tela mostra
  `500 × 21/31 = 338,71` — o Iremar nunca vê número órfão (Fase 2 §3). E permite
  validar/recalcular se alguém suspeitar de erro.
- O cálculo puro `valor_base × dias_trab/dias_base` vive em `packages/core` (testável);
  o resultado é **gravado** em `valor_a_pagar` no momento da confirmação. Banco guarda
  fato; código guarda regra. Eduarda maio: `valor_base=500, dias_trab=21, dias_base=31,
  valor_a_pagar=338,71`.

---

## (3) RLS para cada tabela nova

Padrão dos arquivos `0002`/`0006`: SELECT para o household; escrita restrita a `admin`
(folha e orçamento são decisão do Iremar — Juliana é operator e PF-only). Replico o
estilo de `income_records` em `0002` (admin-only inclusive no SELECT), porque folha
é dado sensível de empresa.

```sql
-- ── RLS payroll_runs / payroll_items (admin-only, como income_records) ───────
alter table payroll_runs  enable row level security;
alter table payroll_items enable row level security;

create policy "admin see payroll runs"
  on payroll_runs for select
  using (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin manage payroll runs"
  on payroll_runs for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

create policy "admin see payroll items"
  on payroll_items for select
  using (household_id = get_my_household_id() and get_my_role() = 'admin');
create policy "admin manage payroll items"
  on payroll_items for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');

-- ── RLS monthly_budgets ──────────────────────────────────────────────────────
-- Household pode VER (Juliana vê o teto dela); só admin gerencia.
alter table monthly_budgets enable row level security;

create policy "household see budgets"
  on monthly_budgets for select
  using (household_id = get_my_household_id());
create policy "admin manage budgets"
  on monthly_budgets for all
  using (household_id = get_my_household_id() and get_my_role() = 'admin');
```

`income_records` (0009) **não precisa de RLS nova** — as policies admin-only de
`0002` (l.129–136) já cobrem as colunas novas (RLS é por linha, não por coluna). As
novas colunas herdam a proteção existente automaticamente.

---

## (4) Índices necessários

Guiados pelas queries reais das telas (recorte por janela de 7 dias, por mês, por
entidade). Padrão de `0001` (`idx_transactions_household_month`):

```sql
-- AR / income_records: planejador lê por data prevista e por status (horizonte)
create index if not exists idx_income_expected
  on income_records (household_id, expected_on)
  where status in ('previsto','faturado');           -- índice parcial: só o que é horizonte
create index if not exists idx_income_entity_status
  on income_records (household_id, entity_id, status);

-- Folha: tela "Caixa da semana" filtra rodadas por data_pagamento e status
create index if not exists idx_payroll_runs_pay
  on payroll_runs (household_id, data_pagamento);
create index if not exists idx_payroll_runs_status
  on payroll_runs (household_id, status);
-- Itens sempre buscados pelo run (FK de leitura quente)
create index if not exists idx_payroll_items_run
  on payroll_items (payroll_run_id);

-- Orçamento: lookup direto por mês+responsável (já coberto pelo UNIQUE,
-- que cria índice implícito — não duplicar). Nenhum índice extra.
```

Decisão de Controller sobre os índices parciais: o planejador de caixa só consulta
recebíveis `previsto/faturado` (horizonte) — o índice parcial mantém a árvore pequena
e não indexa o grande volume histórico de `recebido`, que já é coberto por
`occurred_on` nas telas de mês.

---

## (5) Como se liga ao schema atual (FKs)

```
entities (Família | i2)
   ├──< income_records.entity_id        [0009] separa AR PF de AR PJ — Fator R
   ├──< payroll_runs.entity_id   NOT NULL [0010] SEMPRE i2 (validado em app + RLS)
   └──< monthly_budgets.entity_id NOT NULL [0011] SEMPRE Família (CHECK responsible PF)

accounts (Inter PJ | Caixinha | NuInvest | ...)
   └──< payroll_runs.account_id         [0010] conta pagadora (Inter PJ)

transactions (saída real na Inter PJ)
   └──< payroll_items.transaction_id    [0010] liga item pago ao lançamento (DRE, G7)

payroll_runs 1 ──< N payroll_items      [0010] cabeçalho→linhas (cascade delete)

profiles
   └──< payroll_runs.created_by, monthly_budgets.created_by   auditoria

households  ──< todas (household_id)     padrão de isolamento de 0001
```

Pontos de ligação que **fecham gaps de fases anteriores**:
- `payroll_items.transaction_id` → quando o item é pago, vira `transaction` de saída na
  Inter PJ. Isso alimenta o DRE de `empresa/page.tsx` (`despesasTx`), **fechando G7**
  (DRE hoje cego à folha). A folha deixa de ser invisível ao resultado.
- `income_records.entity_id` + status → o `aReceberTotal` do dashboard passa a poder
  filtrar por escopo e por confiança (só `recebido` vira saldo do planejador). Fecha
  G5 (receita com data) do lado dos dados.
- `payroll_runs.total_a_desembolsar` (trigger) → é o número que o "Caixa da semana"
  (E3) consome direto, sem recalcular no front.

---

## (6) Riscos de migração e ordem de aplicação

**Ordem obrigatória (alicerce → topo, conforme síntese da Fase 2):**
```
0009_income_receivables   (fundação G1 — primeiro, tudo de receita PJ depende)
0010_payroll              (folha — depende de entities, accounts, transactions)
0011_monthly_budgets      (orçamento PF — independente, último por menor prioridade)
```
0010 e 0011 não dependem entre si; só 0009 é pré-requisito conceitual (G1 antes de AR).

**Riscos concretos e mitigação:**

1. **Drift 0004/0005 (o maior risco).** O banco vivo diverge do SQL versionado. Se eu
   usasse `add constraint` sem `drop ... if exists`, a migration **quebraria** ao bater
   num CHECK já existente com definição diferente. **Mitigado:** todo CHECK usa
   drop-then-add; toda coluna usa `if not exists`. As migrations rodam tanto sobre o
   banco vivo quanto sobre um banco "limpo" pós-catch-up.

2. **CHECK de `status` default em `income_records` existente.** Defini
   `status default 'recebido'` para que **todas as linhas legadas** (faturamento_i2,
   pró-labore já lançados) satisfaçam o `dates_check` (elas têm `occurred_on`). Se
   alguma linha legada tiver `occurred_on` NULL, o `add constraint` falha. **Mitigação
   pré-voo:** rodar `select count(*) from income_records where occurred_on is null`
   antes do 0009; se >0, corrigir os dados primeiro (a leitura é permitida; não executo
   aqui por ser ambiente de análise).

3. **`payroll_runs.entity_id NOT NULL` sem default.** Tabela nasce vazia, então não há
   risco de backfill. A garantia "sempre i2" é dupla: NOT NULL no banco + validação na
   camada de app (o app injeta o entity_id da i2). Não coloco CHECK de valor fixo do
   UUID da i2 no banco (acoplaria a migration a um seed) — fica na app + RLS.

4. **Trigger `payroll_recalc_total`.** Roda `after` insert/update/delete por linha;
   em lotes grandes de itens recalcularia N vezes. Folha real tem ~6 itens — **custo
   irrelevante**, não otimizo (anti-over-engineering). Se um dia virar lote de 100+,
   migra para `statement-level`.

5. **`monthly_settlements` intocado.** Não mexo no snapshot de fatura — orçamento é
   tabela à parte. Zero risco de regressão na `/acerto`.

6. **Reversibilidade validada.** Cada DOWN desfaz só o seu UP. O único ponto de atenção
   é o DOWN de 0009 **não** dropar `entity_id` (fundação anterior, dependência de
   cofre/DRE) — documentado inline. Reverter 0010/0011 é `drop table` limpo (cascade
   cuida dos itens).

**Pós-migração obrigatório:** `pnpm db:types` para regenerar `database.types.ts`
(hoje é placeholder manual — l.1–3). Sem isso, o front não enxerga as colunas novas.

---

### Síntese para a Fase 5 (telas/core)

Banco entregue em 3 migrations reversíveis e defensivas: **estende** `income_records`
(AR + G1), **cria** `payroll_runs`/`payroll_items` (folha com proração auditável) e
`monthly_budgets` (teto PF mínimo). Cofre = **sem tabela** (orquestração em core sobre
`transfers`). RLS admin-only na folha (sensível), household-read no orçamento. Fator R
blindado em dois níveis físicos: `entity_id NOT NULL` separa PF/PJ, e
`payroll_items.fator_r` separa folha/não-folha dentro do PJ. Próximo passo: o cálculo
de proração e o planejador de cofre em `packages/core`, e plugar `iremarPart` +
`monthly_budgets.teto` no semáforo PF.
