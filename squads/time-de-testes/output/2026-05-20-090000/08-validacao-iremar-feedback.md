# Validação Iremar Feedback — 2026-05-20

> Squad time-de-testes (Ana QA Lead + Diego DBA + Carol Tester de Fluxo)
> Escopo: 4 mudanças do dia 2026-05-20 antes do próximo passo

---

## ✅ Aprovados

### Mudança 1 — BillsCard (parcial)
- **Componente `BillsCard.tsx` existe e renderiza** corretamente nos 2 dashboards
  (`DashboardAdmin.tsx:11,252` e `DashboardOperator.tsx:8,132-134`). Paridade Admin × Operator OK.
- Estado vazio ("Tudo em dia!") funciona quando `bills.length === 0` (BillsCard.tsx:29-43).
- Layout responsivo: usa `grid-cols-3` para mini stats, `slice(0,5)` para lista compacta,
  link `/compromissos` clicável. Mobile-first com `rounded-2xl p-4`.
- Filtro por responsabilidade na page existe:
  `bills.filter(b => b.paid_by === 'juliana' || b.responsible === 'juliana' || b.responsible === 'casal')`
  (page.tsx:134). Lógica está correta para o escopo da Juliana.
- Filtro `payment_method !== 'credit_card'` aplicado (page.tsx:89) — não polui com cartão.
- Filtro `!paidSet.has(c.id)` aplicado (page.tsx:90) — só mostra não-pagas.
- Sort por urgência (overdue > today > upcoming) implementado (page.tsx:104-109).

### Mudança 2 — BottomNav
- `NAV_ADMIN` tem o novo slot "A Pagar" → `/compromissos` (BottomNav.tsx:9-14). ✅
- "Importar" foi movido para `MAIS_ITEMS` no drawer (BottomNav.tsx:31-40, linha 33). ✅
- Sidebar desktop (`Sidebar`) renderizada acima (BottomNav.tsx:67) — preserva navegação completa.
- `NAV_OPERATOR` (linhas 16-22) **continua com "Importar"** na bottom nav, conforme regra do memory
  ("Juliana: não remover Importar da nav").
- Drawer "Mais" tem todos os items, inclusive Importar para admin (linha 33).

### Mudança 3 — i2-historico-import v2
- `squad.yaml` agora tem `version: "2.0"` e bloco `mudanca_escopo` explícito (linhas 11, 13-21). ✅
- Foco em ESTRUTURA (categorias × subcategorias, centros de custo, contas, formas de pagamento) — pipeline tem 3 stages: `analise_estrutura`, `recomendacoes`, `plano_implementacao` (linhas 43-106). ✅
- Memory.md inclui seção "Mudança de escopo v2 (2026-05-20)" (memories.md:40-47). ✅
- Regra crítica reforça "NUNCA importar transactions (escopo v1 — descartado)" (linha 37).
- Centro de custos identificado como gap a avaliar (não criar cegamente).

### Mudança 4 — i2-backup-restore (estrutura)
- Squad criado com pipeline coerente: `design → implementacao_cli → integracao_app → testes` (squad.yaml:51-128). ✅
- Persona Alex DevOps configurado em `squad-party.csv` (verificado).
- Memory.md com regras permanentes (5 regras herdadas de company.md, linhas 31-35). ✅
- Plano técnico realista: JSON via Supabase JS client (não pg_dump direto), Supabase Storage como primário, CLI local como redundância (squad.yaml:40-49).
- Comandos pnpm bem nomeados: `backup:create`, `backup:list`, `backup:restore` (squad.yaml:82-84).

### Validação Banco (Diego)
- **14/14 tables existem** no Supabase `jvfdzcouychlfxxnzams`:
  `accounts, categories, categorization_rules, csv_imports, entities, fiscal_notes, households, income_records, monthly_obligations, monthly_settlements, profiles, recurring_commitments, transactions, transfers`. ✅
- Regras permanentes presentes nos memories de `time-de-testes`, `i2-backup-restore`, `i2-historico-import` (validado via Read). ✅

---

## ⚠️ Pontos de atenção

### A1 — Divergência entre briefing e realidade do banco
- Briefing diz: **10 pendentes / R$ 11.841,96 / 5 atrasadas + 1 vence hoje + 3 a vencer + Reserva Segurança**.
- Banco real (queries Diego, ver SQL #2 e #3):
  - **11 pagos** (Reserva, Tesouro, Escola Helena, Pró-labore, Plano saúde, IPTU, IPVA, INSS, DAS, Feira, Apartamento)
  - **6 pendentes não-cartão**: Retirada lucros (5/overdue R$ 3.000), Condomínio (10/overdue R$ 250), Terapia (10/overdue R$ 220), Escola Isabela (19/overdue R$ 950), Internet (20/today R$ 100), Seguro carro (28/upcoming R$ 246,96)
  - **Total pendente: R$ 4.766,96** (e não R$ 11.841,96)
  - Distribuição: 4 atrasadas + 1 vence hoje + 1 a vencer (não 5+1+3+Reserva)
- **Possíveis causas:**
  (a) Briefing foi escrito antes das baixas de 19/05 (DAS R$ 2.600,21 + INSS R$ 550 + IPTU R$ 119,35 + IPVA R$ 128,01 = R$ 3.397,57 já baixados);
  (b) Reserva de Segurança JÁ foi paga (status='paid' em monthly_obligations), portanto não aparece mais no card — comportamento esperado pelo filtro `!paidSet.has(c.id)`.
- **Não é bug do código** — o BillsCard reflete fielmente o estado do banco. Apenas o briefing está desatualizado.

### A2 — Card de Juliana ficará VAZIO no mês corrente
- Aplicando o filtro `paid_by === 'juliana' || responsible === 'juliana' || responsible === 'casal'` às 6 pendentes:
  - Nenhuma tem `paid_by='juliana'` (as 3 da Juliana — Plano saúde, Apartamento, Feira — já foram pagas).
  - Nenhuma tem `responsible='juliana'` ou `responsible='casal'` (todas são 'iremar' ou 'i2').
- **Resultado:** o card da Juliana renderiza estado vazio ("Tudo em dia!"). Tecnicamente correto, mas vale o aviso porque o briefing esperava que ela visse algo.
- Recomendação: criar TC de regressão para o próximo mês (quando as bills da Juliana voltarem a aparecer pendentes).

### A3 — `DashboardOperator` esconde BillsCard quando bills=[] (inconsistência sutil)
- Em `DashboardAdmin.tsx:252` o BillsCard é renderizado SEMPRE — quando vazio mostra o estado "Tudo em dia!".
- Em `DashboardOperator.tsx:132-134` só renderiza quando `bills.length > 0` — Juliana NUNCA verá o estado feel-good "Tudo em dia!".
- **Inconsistência de UX** entre os dois dashboards. O memory já alerta sobre paridade Admin × Operator (regra 5).
- Sugestão de correção (1 linha):
  ```tsx
  // DashboardOperator.tsx — remover o guard, deixar o componente decidir
  <BillsCard bills={bills} accent="var(--accent-juliana)" />
  ```

### A4 — `dueDateStr` usa mês corrente fixo
- `page.tsx:100` monta `dueDateStr` com `m+1` (mês atual). Funciona para o mês vigente, mas se algum dia o card mostrar "próximo mês", precisará rolar mês. Não é bug agora; é debt para iteração futura.

### A5 — Squad i2-backup-restore só tem estrutura (pipeline não rodou)
- Pasta `_investigations/` e `output/` ainda vazias além do `squad.yaml`. É **planejamento**, não execução.
- Antes do primeiro `pnpm backup:create` real ir para produção, recomendamos: rodar o pipeline do squad, validar TC1–TC5 listados no yaml e revisitar este squad.

---

## ❌ Bloqueadores

**Nenhum bloqueador encontrado.** Código está coerente, banco íntegro, paridade preservada.
A divergência numérica (A1) é apenas o briefing defasado vs. baixas já registradas, não falha de implementação.

---

## 📋 Recomendações para próxima rodada

1. **Corrigir A3** (paridade BillsCard Admin × Operator) — 1 linha. Remove o `bills.length > 0 &&` no DashboardOperator.
2. **Atualizar briefing futuro** com queries do banco antes de listar números esperados — a defasagem A1 só vai crescer.
3. **Rodar o squad i2-backup-restore** (pipeline real) ANTES de qualquer migration do squad i2-historico-import v2 — bate com a regra permanente 2 ("SEMPRE criar ponto de restore").
4. **TC de regressão BillsCard mensal:** validar quando vira mês novo (1º de junho) que as bills da Juliana reaparecem corretamente filtradas.
5. **TC de paridade rota:** abrir `/compromissos` nos 2 logins e conferir que os dois veem a UI correta — usa nova entrada do NAV_ADMIN.
6. **A4:** considerar `addMonths`/`startOfMonth` helpers para o `dueDateStr` antes de implementar visão multi-mês.
7. Validar manualmente em mobile real (não só DevTools): o card com 6 bills + mini stats não deve quebrar em telas <360px.

---

## SQL executados

```sql
-- #1 confere existência das 14 tables core
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
  AND table_name IN ('profiles','households','entities','accounts','categories',
                     'categorization_rules','recurring_commitments','monthly_obligations',
                     'transactions','income_records','fiscal_notes','transfers',
                     'csv_imports','monthly_settlements')
ORDER BY table_name;
-- Resultado: 14 rows ✅

-- #2 contagens de obligations do mês corrente
WITH ref AS (SELECT date_trunc('month', CURRENT_DATE)::date AS rm)
SELECT
  (SELECT COUNT(*) FROM monthly_obligations mo, ref
     WHERE mo.reference_month=ref.rm AND mo.status='paid') AS pagos,
  (SELECT COUNT(*) FROM recurring_commitments rc
     WHERE rc.active=true
       AND COALESCE(rc.payment_method,'boleto')<>'credit_card'
       AND rc.id NOT IN (SELECT recurring_id FROM monthly_obligations mo, ref
                          WHERE mo.reference_month=ref.rm AND mo.status='paid')) AS pendentes,
  (SELECT COALESCE(SUM(rc.amount),0) FROM recurring_commitments rc
     WHERE rc.active=true
       AND COALESCE(rc.payment_method,'boleto')<>'credit_card'
       AND rc.id NOT IN (SELECT recurring_id FROM monthly_obligations mo, ref
                          WHERE mo.reference_month=ref.rm AND mo.status='paid')) AS valor_pendente;
-- Resultado: pagos=11, pendentes=6, valor=R$ 4.766,96

-- #3 detalhe das 6 pendentes com status calculado
WITH paid AS (SELECT recurring_id FROM monthly_obligations
              WHERE reference_month=date_trunc('month',CURRENT_DATE)::date AND status='paid')
SELECT rc.description, rc.due_day, rc.amount, rc.payment_method, rc.paid_by,
  CASE WHEN rc.due_day < EXTRACT(DAY FROM CURRENT_DATE)::int THEN 'overdue'
       WHEN rc.due_day = EXTRACT(DAY FROM CURRENT_DATE)::int THEN 'today'
       ELSE 'upcoming' END AS status
FROM recurring_commitments rc
WHERE rc.active=true
  AND COALESCE(rc.payment_method,'boleto')<>'credit_card'
  AND rc.id NOT IN (SELECT recurring_id FROM paid)
ORDER BY rc.due_day;
-- Resultado: 4 overdue + 1 today + 1 upcoming
--   Retirada lucros (5/3000), Condomínio (10/250), Terapia (10/220),
--   Escola Isabela (19/950), Internet (20/100), Seguro carro (28/246.96)

-- #4 todas as recurring + status do mês
SELECT mo.recurring_id, rc.description, mo.status, mo.paid_amount, mo.reference_month
FROM monthly_obligations mo
LEFT JOIN recurring_commitments rc ON rc.id=mo.recurring_id
WHERE mo.reference_month=date_trunc('month',CURRENT_DATE)::date
ORDER BY mo.status, rc.due_day;
-- Resultado: 11 rows todas 'paid' (Reserva, Tesouro, Escola Helena, Pró-labore,
--   Plano saúde, IPTU, IPVA, INSS, DAS, Feira, Apartamento)
```
