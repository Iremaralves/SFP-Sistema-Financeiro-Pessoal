# 07 — Plano de Implementação em Ondas

**Squad:** i2-gestao-decisoria · **Persona:** Diego — Frontend Implementation Lead
**Data:** 2026-06-08 · **Fase 7 de N** · Ondas sem downtime

> Lente desta fase: **enviar valor em incrementos que rodam sozinhos em produção**. Cada
> onda é mergeável e reversível por si, nunca depende de uma onda futura para "ficar
> certa", e nunca quebra o que o Iremar e a Juliana já usam (fatura, acerto, contas,
> compromissos). Priorizo implacável: a Onda 1 é a folha da empresa — é ela que tira o
> Iremar da planilha. Tudo o resto desce em ordem decrescente de dor (Fase 1: dor #1 →
> dor #2 → dor #3). O teste de aderência continua sendo a folha-âncora de R$ 6.338,71.
> Toda a base de dados (Fase 4b) e todo o desenho de tela (Fases 5/6) já estão prontos;
> aqui é só a sequência de execução, os arquivos, as server actions, o rollback e a
> validação de cada uma. Numeração de migration segue o que existe (até `0008`); o plano
> 4b já reservou `0009`/`0010`/`0011`.

---

## Mapa das ondas (visão de 30 segundos)

| Onda | Entrega | Dor | Esforço | Bloqueia |
|---|---|---|---:|---|
| **0 — Dados** | Migrations 4b aplicadas, types regenerados | fundação | **4–6h** | tudo |
| **1 — Planejador da empresa** | `/empresa/semana`: total + cofre + baixa | **#1** | **16–22h** | — |
| **2 — A receber + projetos** | timeline de recebíveis + form de projeto | #2 | **10–14h** | — |
| **3 — Orçamento pessoal** | semáforo + week-ahead + AnchorHero PF | #3 | **12–16h** | — |
| **4 — Polish + proração refinada** | DRE com folha, defaults por pessoa, edge cases | — | **8–12h** | — |

As Ondas 1–4 só dependem da Onda 0. Entre si são independentes — dá pra paralelizar 2 e
3 se houver mais de uma mão. **A Onda 1 sai primeiro e sozinha justifica o esforço.**

---

## Onda 0 — Dados (fundação, sem UI)

**Objetivo:** deixar o banco pronto pra Ondas 1–3 sem tocar em nenhuma tela. Snapshot →
aplicar `0009`/`0010`/`0011` (Fase 4b) → regenerar types → provar não-regressão.

**Arquivos a criar:**
- `supabase/migrations/0009_income_receivables.sql` — AR + G1 + G5 (estende `income_records`).
- `supabase/migrations/0010_payroll.sql` — `payroll_runs` + `payroll_items` + trigger de total + VIEW.
- `supabase/migrations/0011_monthly_budgets.sql` — teto PF.

DDL é **cópia literal** do bloco final de `04b-data-arch-final.md §2` — não reescrever, já
foi endurecido contra os dois bloqueios físicos (`occurred_on NOT NULL`, RLS sem
`WITH CHECK`). Convenção do projeto: `0006_fiscal_notes.sql` é o padrão canônico de RLS
(ações explícitas com `with check`), **não** o `0002` (que contém SQL inválido).

**Arquivos a mudar:**
- `packages/db/src/database.types.ts` — regenerar via `pnpm db:types` após aplicar. Hoje é
  placeholder manual; sem isto o front não enxerga `status`/`expected_on`/`payroll_*`.

**Server actions:** nenhuma (onda de dados).

**Sequência de execução (ordem do 4b §3):**
1. **Snapshot** do banco vivo antes de tudo (bucket `backups` do `0008`, ou Supabase
   backup point). É o único passo irreversível-na-prática (o backfill de `entity_id` e o
   `set not null` reescrevem dados).
2. **Pré-voo read-only** (4b §3): `select … from pg_policies` (o `0002` mente sobre o
   estado real — drift), `count(*) where occurred_on is null` (esperado 0),
   `count(*) where entity_id is null`, e confirmar 1 entidade `personal` por household.
3. Aplicar **em branch/cópia primeiro** (`mcp supabase create_branch` ou banco de staging),
   nunca direto na prod.
4. Ordem: `0009` → `0010` → `0011`. Só `0009` é pré-requisito conceitual; `0010`/`0011`
   são independentes entre si.
5. `pnpm db:types`.

**Rollback:** cada migration traz o bloco `DOWN` comentado (4b §2). Aplicar na ordem
inversa `0011` → `0010` → `0009`. **Atenção ao DOWN do `0009`:** é destrutivo por design
— apaga `income_records` com `status <> 'recebido'` antes de re-aplicar o `NOT NULL` em
`occurred_on` (senão deixa linhas-fantasma órfãs). É o comportamento correto, mas o
snapshot do passo 1 é a rede de segurança real.

**Como validar (checklist 4b §4, condensado):**
- `down` de cada uma roda limpo e `up` re-roda (idempotência contra drift — todo CHECK usa
  drop-then-add).
- Inserir receita legada **sem** `status`/`expected_on` (payload atual do app) → passa
  (default `recebido` + `occurred_on` presente). **Zero regressão no INSERT atual.**
- `kind='projeto'` com `entity_id` da Família → trigger **rejeita** (G5 blinda Fator R).
  Com `entity_id` da i2 → aceita.
- Inserir previsto (`status='previsto'`, `occurred_on` NULL, `expected_on` setado) →
  aceita (prova que o `drop not null` destravou o ramo).
- **Telas intocadas:** `/acerto`, fatura no dashboard, `/compromissos`, `/contas` — rodar
  cada uma antes e depois e comparar números. Esperado: idênticos (nenhuma das tabelas
  delas foi alterada).
- **RLS:** como operator (Juliana), `insert` em `payroll_runs` → negado; como admin,
  `insert` com `household_id` de outro household → negado pelo `with check`.
- **Reconciliação:** após mexer em `payroll_items`, `total_a_desembolsar` =
  `total_calculado` da VIEW `payroll_runs_v`.

> **Critério de merge:** todos os checks verdes na cópia/branch, snapshot guardado, types
> commitados. Só então `merge_branch` pra prod. Esta onda não muda comportamento visível —
> é seguro mergear sozinha e deixar repousar.

---

## Onda 1 — Planejador de pagamentos da empresa (DOR #1)

**Esta é a entrega que tira o Iremar da planilha.** É `/empresa/semana` da Fase 6 §1: o
número-âncora (total a desembolsar), o card do cofre (quanto resgatar), a baixa
pagamento-a-pagamento, e o cadastro de pessoa com proração. Se eu só pudesse entregar uma
coisa deste squad inteiro, seria esta onda.

**Cálculo puro primeiro (em `packages/core`, testável, sem banco):**
- `packages/core/src/payroll.ts` (NOVO):
  - `proratePayrollItem({ valorBase, diasTrab, diasBase })` → `valorAPagar`
    (`valorBase × diasTrab / diasBase`, arredondado a 2 casas como o `round` do
    `settlement.ts`). Eduarda: `500 × 21/31 = 338,71`. Função pura, espelha a Fase 2 §3.
  - `daysInMonth(refMonth)` e `daysWorkedFrom(startDate, refMonth)` (dias corridos do mês
    civil — Eduarda começou 11/05 → 21 de 31).
- `packages/core/src/cofre.ts` (NOVO):
  - `planCofreResgate({ totalDesembolso, saldoInterPj, cofres: [{id, nome, saldo}] })` →
    `{ deficit, alocacoes: [{cofreId, valor}], faltaResidual }`. É o algoritmo de 5 passos
    da Fase 2 §4: `deficit = max(0, total − saldoOp)`, aloca por ordem de prioridade
    (Caixinha antes de NuInvest) sem estourar cada cofre, e devolve `faltaResidual > 0`
    quando os cofres não cobrem. **Só conta saldo real**, nunca previsto (regra de ouro).
- `packages/core/src/index.ts` (MUDAR): exportar `proratePayrollItem`, `planCofreResgate`,
  `daysInMonth`, `daysWorkedFrom`.
- `packages/core/src/__tests__/payroll.test.ts` e `cofre.test.ts` (NOVOS): cobrir a
  âncora (R$ 6.338,71), o déficit (R$ 4.338,71 → Caixinha 4.000 + NuInvest 338,71), e o
  edge de cofre insuficiente (folha 12k → faltaResidual 1.000). Cálculo puro = teste
  barato e blindagem do número que o Iremar mais confia.

**Telas a criar:**
- `apps/web/src/app/empresa/semana/page.tsx` (NOVO) — server component. Carrega a rodada
  ativa (ou a mais próxima por `data_pagamento`), seus `payroll_items`, saldo da Inter PJ
  (`accounts.kind='company'` + Σ transactions, mesma conta que `/contas` já faz) e saldos
  dos cofres (`accounts.kind='investment'`). Layout da Fase 6 §1 (mobile 375px) + §6
  (duas colunas no desktop, card cofre sticky). Empty state = CTA "Montar folha desta
  semana".
- `apps/web/src/app/empresa/semana/loading.tsx` (NOVO) — skeleton (copiar padrão de
  `empresa/loading.tsx`).

**Componentes a criar:**
- `apps/web/src/components/PayrollAnchor.tsx` — número-âncora `text-6xl` lendo
  `payroll_runs.total_a_desembolsar` (Fase 6 §1B).
- `apps/web/src/components/CofreCard.tsx` — saldo Inter PJ → déficit → alocação por cofre
  → botão "Transferir do cofre". Consome `planCofreResgate`. Trata os 3 estados de borda
  (déficit 0 = verde "nada a resgatar"; déficit normal; cofres não cobrem = vermelho com
  ponte pra A Receber). (Fase 6 §1C + estados de borda.)
- `apps/web/src/components/PayrollItemRow.tsx` — linha de pessoa com swipe-to-pay
  (reaproveitar o componente da Onda 2 já existente em `/compromissos`) + dot tocável.
  Eduarda mostra "21 de 31 dias (desde 11/05)" inline (o "porquê", nunca número órfão).
- `apps/web/src/components/PayrollItemForm.tsx` — bottom-sheet de "+ Adicionar pessoa"
  com mini-hero de cálculo ao vivo (Fase 6 §5). Roda `proratePayrollItem` no cliente
  enquanto digita.

**Componentes a mudar:**
- `apps/web/src/components/QuickActions.tsx` ou o dashboard da empresa — adicionar atalho
  "Folha da semana" → `/empresa/semana` (escopo Empresa/Tudo apenas).
- `apps/web/src/app/empresa/page.tsx` — link discreto no header pro Planejador (sem fundir
  DRE de competência com caixa).

**Server actions (`apps/web/src/app/empresa/semana/actions.ts`, NOVO — admin-only, padrão
do `transferencias/actions.ts`: getUser → checar role admin → operar com `household_id`):**
- `actionCriarRodada({ referencia, dataPagamento, referenceMonth })` → insere
  `payroll_runs` (`entity_id` = i2, `account_id` = Inter PJ, `status='rascunho'`).
- `actionAdicionarItem({ runId, colaborador, valorBase, prorar, diasTrab, diasBase, tipo,
  fatorR })` → calcula `valorAPagar` no servidor (re-roda `proratePayrollItem`, nunca
  confia no cliente), insere `payroll_items`. O trigger `payroll_recalc_total` (0010)
  atualiza o total — o Iremar vê o número subir sem calculadora.
- `actionEditarItem` / `actionRemoverItem` (mantêm o total coerente via trigger).
- `actionDarBaixaItem({ itemId })` → `payroll_items.pago=true` + `paid_on` + cria a
  `transaction` de saída na Inter PJ (alimenta o DRE, fecha Gap G7). **Pagar a pessoa e
  abastecer a conta são fatos distintos** (Fase 6 §1) — esta action não move dinheiro de
  cofre.
- `actionMarcarTodosPagos({ runId })` — baixa em lote.
- **Cofre:** o botão "Transferir do cofre" **reaproveita** `actionCriarTransferencia`
  (`transferencias/actions.ts`, já existe e cria os 2 lançamentos + registro). O
  Planejador só pré-preenche origem/destino/valor (Caixinha→Inter PJ, NuInvest→Inter PJ)
  e abre a tela de confirmação. **Nunca executa transferência no automático** (regra do
  ambiente). Gap G3 é UI sobre dados existentes — não há action nova de transferência.

**Rollback:** UI nova em rota nova (`/empresa/semana`) — reverter = `git revert` do PR.
Não toca tabelas existentes além de inserir `transactions` na baixa (mesma mecânica de
`/compromissos`/`/transferencias`, já em produção). O banco da Onda 0 fica; a tela some
sem efeito colateral. Feature-flag opcional: esconder o atalho até a UI passar no QA.

**Como validar — o cenário-âncora inteiro:**
1. Criar rodada "Folha 1ª sem jun", `data_pagamento` 13/06, conta Inter PJ.
2. Adicionar Pedro 1.200, Alana 550, Mayana 750, Iremar 3.000 (pró-labore), Contadora 500
   (serviço/nao_folha), e **Eduarda prorada** (valorBase 500, início 11/05 → mini-hero
   mostra R$ 338,71 ao vivo).
3. **Número-âncora = R$ 6.338,71** (soma automática via trigger, sem digitar).
4. Card cofre com Inter PJ R$ 2.000 → "faltam R$ 4.338,71 · Caixinha R$ 4.000 + NuInvest
   R$ 338,71". Tocar "Transferir" → abre `/transferencias` pré-preenchido.
5. Swipe em cada pessoa → `pago=true` + transaction na Inter PJ; rodapé "6 de 6 pagos".
6. Edge: folha de 12k → card vermelho "cofres não cobrem, faltam R$ 1.000", botão de
   transferência desabilitado.
7. **Não-regressão:** `/empresa` (DRE) e `/contas` continuam idênticos; Juliana (operator)
   **não vê** `/empresa/semana` (RLS admin-only + escopo).
8. Testes de `payroll.ts`/`cofre.ts` verdes no CI.

---

## Onda 2 — A receber + cadastro de projeto (empresa)

Resolve a dor #2 (receita PJ invisível). É a contraparte de receita da Onda 1: o colchão
que dá segurança pra decidir o resgate do cofre. Fase 6 §2 (timeline) + §4 (form).

**Telas a criar/mudar:**
- `apps/web/src/app/empresa/semana/page.tsx` (MUDAR) — adicionar tabs `[A pagar] [A receber]`
  (Fase 6 §2/§3). A aba "A pagar" (default) unifica fixas (`monthly_obligations` PJ) +
  folha agregada (item colapsado que leva ao Planejador da Onda 1). A aba "A receber" lê
  `income_records` `entity_id=i2`, ordenado por `expected_on`/`occurred_on`, agrupado por
  janela (resolve G4), com as 3 faixas de confiança (recebido verde / faturado âmbar /
  previsto cinza). **Nunca soma previsto no número de caixa.**

**Componentes a criar:**
- `apps/web/src/components/ReceivableRow.tsx` — linha de recebível com ícone por status
  (✅🧾◌) e cor por confiança.
- `apps/web/src/components/ProjetoForm.tsx` — bottom-sheet (Fase 6 §4): só `cliente`,
  `valor`, `data prevista` obrigatórios; projeto e parcelas opcionais; toggle "Já emiti a
  NF?" (Não→previsto, Sim→faturado). Preview ao vivo das parcelas.
- `apps/web/src/components/APagarTimeline.tsx` — unifica fixas + folha por data real.

**Server actions (`empresa/semana/actions.ts`, ESTENDER):**
- `actionCadastrarProjeto({ cliente, projeto?, valor, dataPrevista, parcelas?, faturado })`
  → insere 1..N `income_records` (`entity_id`=i2, `kind='projeto'`, `status` previsto|
  faturado, `expected_on`=data, `occurred_on`=NULL, `parcela_n/de` quando parcelado). O
  trigger `fator_r_guard` (0009) blinda PF/PJ — invisível ao usuário.
- `actionMarcarRecebido({ incomeId, dataCredito })` → promove pra `recebido`, grava
  `occurred_on`, opcionalmente cria `transaction` de entrada na Inter PJ. **Único ponto em
  que previsto vira saldo**, exige toque explícito.

**Rollback:** UI aditiva na rota da Onda 1 + actions novas. `git revert`. O
`FaturamentoForm` atual (número agregado) coexiste intocado — vira o caso degenerado.

**Como validar:**
- Cadastrar "Acme — site, R$ 5.000, 12/06, 2×, NF emitida" → cria 2 `income_records`
  faturados (2.500 cada, 12/06 e 12/07). Salva com o mínimo (sem campos de cartório).
- Tabs alternam; "A receber" lista por data, faixas de confiança distintas; total previsto
  do mês **não** mistura recebido com previsto no mesmo número de caixa.
- "Marcar como recebido" promove status, grava `occurred_on`, atualiza o saldo que a Onda 1
  usa no cofre.
- Cadastrar projeto com `entity_id` PF → trigger rejeita (prova G5 ao vivo).

---

## Onda 3 — Orçamento pessoal + semáforo + week-ahead (pessoal)

Resolve a dor #3 ("posso usar o cartão?"). 100% PF — `entity_id=Família`, sem um único
número da i2. Fases 3 + 5. Pode rodar em paralelo com a Onda 2 (não compartilham código).

**Cálculo em `packages/core`:**
- `packages/core/src/budget.ts` (NOVO):
  - `computeBudgetState({ teto, iremarPart, boletosPfPendentes })` →
    `{ comprometido, disponivel, folgaPct, state: 'verde'|'amarelo'|'vermelho' }`.
    Thresholds da Fase 3 §2 (verde >30%, amarelo 10–30%, vermelho <10% ou negativo).
    **`julianaPart` e `i2Part` NÃO entram no comprometido** (Fase 3 §5) — reembolso vira
    "a receber", não reduz gasto.
  - Exportar no `index.ts` + teste cobrindo as 3 cores e a regra de exclusão de reembolso.

**Telas a mudar:**
- `apps/web/src/app/dashboard/page.tsx` (ou o `DashboardAdmin`) — no escopo Pessoal,
  ordem A→B→C→D (Fase 5 §5): AnchorHero PF → BudgetGauge → WeekAhead → Bills/Income.

**Componentes:**
- `apps/web/src/components/AnchorHero.tsx` (MUDAR, aditivo) — props novas
  `faturaIremarPart`, `budgetPct`, `budgetState` (Fase 5 §1). No escopo Pessoal o número
  grande = `iremarPart` (não `faturaTotal` cru). Retrocompatível: sem a prop, cai no
  comportamento atual.
- `apps/web/src/components/BudgetGauge.tsx` (NOVO) — semáforo cor+número+barra empilhada+
  frase + estado não-configurado com botão "Definir teto" (Fase 5 §2).
- `apps/web/src/components/WeekAhead.tsx` (NOVO) — janela de 7 dias: a pagar
  (`monthly_obligations` PF na janela, resolve G4) + a receber (`income_records` PF por
  `expected_on`) + evento de fechamento de fatura (Fase 5 §3).
- `apps/web/src/components/IncomeCard.tsx` (MUDAR) — fix `hrefMore="/empresa"` → destino PF
  (Gap G5) + linha `julianaPart` como "a receber" datada.
- `apps/web/src/components/QuickActions.tsx` (MUDAR) — atalho "A receber" → destino PF.

**Server actions (`apps/web/src/app/dashboard/budget-actions.ts`, NOVO):**
- `actionSalvarTeto({ referenceMonth, teto, derivarDaRenda })` → upsert em
  `monthly_budgets` (`entity_id`=Família, `responsible='iremar'`, unique por mês). Default
  sugerido na 1ª vez = média das saídas PF dos últimos 3 meses (Fase 3 §1 Opção A),
  apresentado como sugestão editável.

**Rollback:** `AnchorHero`/`IncomeCard`/`QuickActions` são mudanças aditivas e
retrocompatíveis (props opcionais, fix de href) → `git revert` seguro. `BudgetGauge`/
`WeekAhead` são componentes novos. `monthly_budgets` (0011) já está em produção (Onda 0).

**Como validar:**
- Sem teto → semáforo neutro "Defina seu teto"; com teto R$ 8.000, fatura `iremarPart`
  R$ 2.100 + boletos R$ 740 → comprometido 2.840, disponível 5.160, folga 64% → 🟢.
- Forçar fatura alta → 🟡 e 🔴 nos thresholds certos.
- **Reembolso da Juliana NÃO derruba o semáforo** (não entra no comprometido) — só aparece
  como "a receber".
- WeekAhead mostra boleto que vence em 6 dias mesmo cruzando virada de mês (G4); evento
  "fatura fecha dia 13" aparece na janela.
- **Zero número da i2** em qualquer bloco PF (Fator R blindado na navegação e no cálculo).
- IncomeCard e QuickActions "A receber" levam a destino PF, não `/empresa`.

---

## Onda 4 — Polish + folha com proração refinada

Fecha as arestas que não bloqueiam valor mas elevam a qualidade. É a onda "depois que tudo
funciona".

**Itens:**
- **DRE incorpora a folha (Gap G7):** `apps/web/src/app/empresa/page.tsx` (MUDAR) — somar
  os `payroll_items` pagos do mês ao `despesasFixed`/`despesasTx`, senão o "resultado
  estimado" superestima o caixa que sobra. Marcador `fator_r` separa o que conta no Fator R
  (pró-labore, salário, bolsa) do que não conta (lucros, serviço PJ) — Fase 2 §5.
- **Defaults por colaborador (feedback 4b):** ao reusar uma pessoa de rodada anterior,
  pré-preencher `tipo`/`fator_r` (Eduarda nasce bolsa/folha, contadora serviço/nao_folha).
  Autocomplete de `colaborador` a partir de `payroll_items` históricos. "Não me faça
  escolher Fator R toda semana."
- **Proração refinada:** suporte ao mês de **desligamento** (proração simétrica à admissão)
  e ao mês cheio (junho: Eduarda volta a R$ 500, toggle "prorar" OFF). Validar que
  `dias_base` segue dias civis do mês de referência (maio 31, junho 30).
- **Estados de borda do Planejador:** rodada já paga vira comprovante read-only; ponte "A
  Receber" no card vermelho de cofre insuficiente (mostrar o faturado que entra na semana
  como horizonte, nunca saldo).
- **Reconciliação visível:** badge sutil se `total_a_desembolsar` divergir de
  `payroll_runs_v.total_calculado` (após restore/backfill) — usa a VIEW como verdade.
- **Acessibilidade do semáforo:** cor nunca sozinha (emoji + label + forma), contraste
  ≥ 4.5:1 (Fase 5 §2).

**Server actions:** ajustes incrementais nas actions das Ondas 1–3; nenhuma nova
estrutural.

**Rollback:** mudanças localizadas (`empresa/page.tsx`, defaults nos forms) → `git revert`
por item. Nenhuma migration.

**Como validar:**
- DRE de junho com folha paga reflete o desembolso real (resultado estimado cai, fica
  honesto). Fator R soma só `folha` (3.000 pró-labore conta; 3.000 lucros e contadora não).
- Reusar Eduarda em julho → tipo/Fator R já vêm preenchidos; mês cheio paga R$ 500.
- Time-de-testes valida o fluxo real de ponta a ponta nos dois logins.

---

## Priorização — por que esta ordem entrega 80% do valor

A regra é a Fase 1: **dor #1 (folha) > dor #2 (receita PJ) > dor #3 (orçamento PF)**, e
"competência/polish" por último. A **Onda 1 sozinha** resolve a decisão de maior
frequência (semanal), maior valor (R$ 6k+/rodada) e maior risco (pagar gente errado /
descapitalizar a Inter PJ) — é literalmente o momento em que o app é cego hoje. Por isso
ela vem logo após a fundação de dados e antes de tudo.

A Onda 2 vem em seguida porque receita PJ é o **colchão** que dá segurança pro resgate da
Onda 1 (sem ela, o Iremar decide a folha no escuro do lado da receita), mas tem prazo mais
mole que a folha — por isso #2, não junto. A Onda 3 (pessoal) é alta frequência mas baixo
risco (pró-labore fixo, fatura dividida) e pode ser paralelizada. A Onda 4 é refinamento:
o app já funciona ao fim da Onda 3; ela só o deixa honesto e confortável.

**Caminho crítico real:** Onda 0 (4–6h) → Onda 1 (16–22h). Em ~3 dias de trabalho focado o
Iremar fecha a folha de sexta no app, com a Eduarda prorada, vendo o total e quanto tirar
do cofre — sem planilha. Esse é o marco de sucesso; o resto é incremento sobre uma base que
já paga a equipe certo. Total das 5 ondas: **50–70h**, mergeável em incrementos sem
downtime, cada um reversível por `git revert` (UI) ou `DOWN` + snapshot (dados).
