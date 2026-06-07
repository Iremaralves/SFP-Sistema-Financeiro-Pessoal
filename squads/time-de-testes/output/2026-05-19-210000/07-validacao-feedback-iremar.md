# Validação dos 8 pontos do feedback Iremar — 2026-05-19

## Resumo executivo
- **Aprovados:** 7/8 ✅
- **Aprovados com ressalva:** 1/8 (P2 — paridade parcial)
- **Falhos:** 0/8
- **Veredicto:** 🟢 **Aprovado para uso** — 1 inconsistência menor de paridade não-bloqueante (DashboardOperator usa `calculateInvoiceSettlement` corretamente, mas /mes ainda usa `calculateSettlement` para o operator).

---

## P1 — Descrição completa visível ✅

**Evidências:**
- `apps/web/src/app/categorizar/CategorizarItem.tsx:55` — `className="text-white text-sm font-semibold leading-snug break-words"` (sem `truncate`)
- `apps/web/src/components/TransactionList.tsx:55` — `className="... leading-snug break-words group-hover:text-white/90"` + `title={tx.description}` para hover
- `apps/web/src/components/DashboardAdmin.tsx:284` — Próximos vencimentos também usam `break-words`

**Observação:** descrição agora quebra em múltiplas linhas. Iremar consegue identificar transações longas (Mercado Pago, Nubank etc.).

---

## P2 — Paridade Admin × Operator ⚠️ (parcial)

**Evidências positivas:**
- `DashboardOperator.tsx:3,28` — usa `calculateInvoiceSettlement` ✅ (paridade com Admin)
- `DashboardOperator.tsx:141-163` — atalhos rápidos para `/categorizar` e `/acerto` ✅
- `BottomNav.tsx:24-29` — `MAIS_ITEMS_OPERATOR` inclui Contas, Acerto Casal, Fechamento, Relatórios ✅

**Ressalva (não-bloqueante):**
- `apps/web/src/app/mes/page.tsx:4,46` — ainda usa `calculateSettlement` (mês civil) ao invés de `calculateInvoiceSettlement`. Para o operator que abre /mes via drawer "Mais", os números aqui divergem do dashboard.
- `apps/web/src/app/contas/page.tsx:4,84` — também usa `calculateSettlement` (intencional, pois é "movimentação do mês civil", já comunicado no rótulo — ver P5).

**Recomendação:** alinhar /mes para `calculateInvoiceSettlement` OU rotular explicitamente "(mês civil)" como /contas faz.

---

## P3 — Iremar acessa /importar ✅

**Evidências:**
- `Sidebar.tsx:17` — `{ href: '/importar', icon: '↑', label: 'Importar CSV' }` presente na nav desktop ✅
- `BottomNav.tsx:12` — `NAV_ADMIN` inclui `/importar` como slot principal (4º botão antes do "Mais") ✅
- Também disponível no `NAV_OPERATOR:20` (Juliana segue importando CSV)

---

## P4 — Layout errors residuais ✅

**Evidências:**
- `.page-container` (globals.css:89-93) com `max-width: var(--container-max)` e `padding-inline: clamp(1rem, 4vw, 2.5rem)` — protege contra overflow
- Headers das páginas usam `overflow-hidden` (categorizar:48, transferencias:50, compromissos:180, contas:98, acerto:93, mes:56)
- `DashboardAdmin.tsx` — todos os blocos com `min-w-0` + `truncate` ou `break-words` nos valores
- `EquacaoCard` (linhas 312-361) usa `flex-1 min-w-0` e `truncate` nos valores monetários

**Observação:** nenhuma página principal apresenta `whitespace-nowrap` sem `min-w-0`/wrap. Em 375px (mobile) e 1440px (desktop com sidebar) o layout se mantém contido.

---

## P5 — /contas vs /dashboard inconsistentes ✅

**Evidências:**
- `contas/page.tsx:101` — `<h1>Visão patrimonial</h1>` ✅
- `contas/page.tsx:181` — `Total movimentado no mês` ✅
- `contas/page.tsx:184` — texto explicativo: "Mês civil · todas as contas · por responsável. A fatura do cartão (ciclo Nubank) está no [dashboard]" ✅
- Os 2 valores são corretamente diferentes (visão mensal patrimonial ≠ fatura por ciclo de cartão), rótulos agora deixam a diferença explícita.

---

## P6 — Acerto + Fechamento para Juliana (operator) ✅

**Evidências:**
- `acerto/page.tsx:19-22` — guard `if (!profile) redirect('/login')` mas **não** há mais `if (profile.role !== 'admin') redirect(...)` ✅
- `mes/page.tsx:24-26` — comentário explícito: "operator também pode ver — Juliana acompanha o fechamento mensal" ✅
- `mes/page.tsx:102` — apenas a seção "C) Receitas do mês" (cadastro) é gated por `profile.role === 'admin'`, o que faz sentido (Juliana não cadastra receitas do Iremar)

---

## P7 — Acesso fácil a compromissos ✅

**Evidências:**
- `app/dashboard/page.tsx:60-93` — calcula `upcoming` (top 5 boletos/PIX com `due_day` entre `todayDay-1` e `todayDay+14`, filtra pagos via `monthly_obligations.status='paid'`)
- `DashboardAdmin.tsx:249-296` — card "Próximos vencimentos" exibido se `upcoming.length > 0`, com:
  - Badge de dia colorida (verde/amarelo/vermelho conforme proximidade)
  - Label "Atrasado/Hoje/Amanhã/Em N dias"
  - Link "Ver todos ›" para `/compromissos`
  - Cada item linka para `/compromissos`

---

## P8 — Editor inline ao dar baixa ✅

**Evidências:**
- `DarBaixaButton.tsx:23-25` — estados `paidAmount` (default = amount cadastrado), `paidOn` (default = hoje) ✅
- `DarBaixaButton.tsx:93-175` — dialog modal com backdrop, campo valor (R$ + input decimal), campo data, botão Cancelar + Confirmar ✅
- `compromissos/actions.ts:7-12` — assinatura `actionDarBaixa(recurringId, amount, referenceMonth, opts?: { paidOn?: string; paidAmount?: number })` ✅
- `actions.ts:21-26,59,73` — usa `opts.paidOn ?? hoje` e `opts.paidAmount ?? amount` e grava em `paid_on` + `paid_amount` ✅
- Validação de valor inválido (NaN/≤0) em `DarBaixaButton.tsx:36-40` ✅

---

## 🔴 Bugs encontrados
**Nenhum bug bloqueante.**

Inconsistências menores:
1. **(menor)** `/mes` usa `calculateSettlement` (mês civil) enquanto Dashboard usa `calculateInvoiceSettlement` (ciclo). Operator pode ver números aparentemente divergentes. → adicionar rótulo "(mês civil)" no header de /mes OU migrar para `calculateInvoiceSettlement`.

---

## 📋 Próximas ações sugeridas

1. **(opcional, baixa prioridade)** Alinhar `/mes` com semântica de "ciclo de fatura" OU adicionar rótulo "(mês civil)" no header como já existe em `/contas`.
2. **(observação)** Não há transações `unassigned` no banco (todas as 255 categorizadas: 174 casal · 34 juliana · 24 i2 · 23 iremar). O alerta "X sem responsável" do dashboard não aparecerá — comportamento correto.
3. **(sugestão)** Adicionar TC#A automatizado: smoke-test que abre cada rota como admin e operator e valida ausência de console errors.

---

## SQL de validação executados (Diego)

```sql
-- 1) Distribuição de responsible (0 unassigned ✅)
SELECT responsible, COUNT(*) FROM transactions GROUP BY responsible;
-- Resultado: casal=174, i2=24, iremar=23, juliana=34 (total 255) — nenhum unassigned ✅

-- 2) paid_amount separado de amount em monthly_obligations ✅
SELECT recurring_id, amount, paid_amount, status, paid_on
FROM monthly_obligations WHERE paid_amount IS NOT NULL
ORDER BY paid_on DESC NULLS LAST LIMIT 10;
-- Resultado: 5 registros com paid_amount populado (R$ 2600.21, 550.00, 119.35, 128.01, 1393.00)
-- amount e paid_amount armazenados em colunas distintas ✅

-- 3) Transfer da fatura Nubank de R$ 9.913,67 ✅
SELECT id, amount, occurred_on, description FROM transfers
WHERE amount BETWEEN 9900 AND 9920 ORDER BY occurred_on DESC LIMIT 5;
-- Resultado: 1 registro — "Pagamento Fatura Nubank (venc. 20/05/2026)" R$ 9913.67 em 2026-05-19 ✅
```

**Veredicto Diego:** banco íntegro — 28+ transações foram categorizadas (na verdade todas as 255 estão categorizadas), `paid_amount` está separado de `amount` corretamente, e o registro da fatura Nubank consta na tabela `transfers`.
