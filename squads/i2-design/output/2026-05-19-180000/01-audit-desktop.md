# Auditoria UX Desktop — i2 Finance

**Agente:** Laura (UX Strategist)
**Viewport-alvo:** 1280px / 1440px / 1920px
**Data:** 2026-05-19

---

## Achados Gerais (válidos em todas as páginas)

| # | Problema | Impacto | Páginas |
|---|---|---|---|
| G1 | **Nenhuma página tem `max-w-*` no container interno.** Conteúdo cola na borda direita em telas largas. Linhas de texto e cards alongam infinitamente. | Alto | Todas |
| G2 | **Tudo é coluna única.** O layout mobile-first nunca vira grid no desktop. Sobra 60–70% de espaço lateral vazio em 1440px. | Alto | dashboard, contas, compromissos, empresa, relatorios |
| G3 | **Sem gráficos visuais.** Relatórios mostra fluxo de caixa em **lista de números**, sem barras nem linha acumulado. Splits no dashboard são números soltos — pediam donut/bar. | Alto | relatorios, dashboard, empresa |
| G4 | **Padding lateral fixo `px-4` / `px-5`** mesmo em desktop. Em 1920px o conteúdo flutua coladinho na sidebar. | Médio | Todas |
| G5 | **Header `pt-14` mobile-first** desperdiça altura útil no desktop (≈56px de topo vazio sem motivo). | Médio | Todas |
| G6 | **BottomNav fica reservando `pb-28`** mesmo no desktop, onde a sidebar substitui a nav. Desperdiça 112px de viewport. | Médio | Todas |
| G7 | **Densidade de informação subutilizada.** Cards de R$ ocupam linha inteira — em desktop caberiam 3–4 por linha sem perda de legibilidade. | Alto | dashboard, contas, empresa |
| G8 | **Sem indicação visual de troca de tema/paleta.** Cores hard-coded em `style={{ background: 'rgba(59,130,246,...)' }}` por todo lado — impossível para o usuário trocar. | Médio | Todas |
| G9 | **Sem microinterações.** Hover states ausentes (apenas `active:scale` mobile). No desktop o cursor não tem feedback claro de elementos clicáveis. | Médio | Todas |
| G10 | **Tipografia escala pouco.** `text-2xl` no hero em 1920px parece minúsculo. Não há clamp() nem variantes responsivas. | Médio | dashboard, empresa, relatorios |

---

## Página por página

### `/dashboard` (admin)
- Hero "Total da fatura" → ocupa linha cheia. Em desktop poderia ser **2/3 + 1/3 com mini-gráfico ao lado**.
- Cards "Iremar / Juliana" empilhados → deveriam ser **2 colunas lado a lado** ≥ md.
- Grid "Casal + i2" já é `grid-cols-2` mas no desktop poderia ser **4 colunas** com Juliana-transferir e Entradas.
- **Falta:** donut de splits, sparkline de últimos 6 meses, indicador de tendência (▲▼).

### `/contas`
- Lista de contas → 1 por linha. Em desktop caberiam 2–3 por linha em grid.
- **Falta:** gráfico stacked-bar comparando splits.

### `/compromissos`
- Cards de contas fixas → 1 coluna. Desktop comportaria **kanban-like 3 colunas (pago / vencendo / atrasado)** ou grid 2–3 colunas.
- **Falta:** mini-calendário visual com vencimentos.

### `/lancamentos`
- Lista de transações em coluna única, ok no mobile. Desktop ganharia **filtros laterais fixos** (à direita) ou tabela densa.

### `/empresa`
- DRE em coluna única. Em desktop pediam **DRE à esquerda + KPIs à direita + gráfico de margem**.
- Seletor de mês com setas `‹ ›` — em desktop deveria virar **dropdown nativo + timeline horizontal**.

### `/relatorios`
- "Fluxo de Caixa" mostra meses como **cards empilhados de texto**. Pediam **bar chart** clarinho e visual.
- "Contas a Pagar/Receber" → listas, sem nenhuma visualização de volume.
- **Falta criminoso:** gráfico de barras (receitas vs despesas), linha de resultado acumulado.

### `/acerto`
- Tela já tem boa hierarquia mobile, mas em desktop fica como uma "tira" central de 600px no meio de um vazio enorme. Precisa de **max-w-3xl + cards laterais com histórico de acertos**.

### `/transferencias`
- Apenas 111 linhas. Provavelmente formulário simples. Desktop: **form à esquerda + histórico à direita**.

---

## Inconsistências detectadas

1. **Padding header** varia: `pt-14 pb-6` (dashboard) vs `pt-14 pb-5` (empresa/relatorios). Padronizar.
2. **Border-radius** mistura `rounded-3xl` (hero), `rounded-2xl` (cards), `rounded-xl` (mini), sem regra clara.
3. **Cores via `style=`** competem com classes Tailwind — em alguns lugares `bg-amber-400/8` e em outros `rgba(245,158,11,0.08)`. Padronizar via CSS vars.
4. **Tabular-nums** ora via classe `.tabular`, ora via `style={{ fontVariantNumeric: 'tabular-nums' }}`. Unificar.

---

## Prioridades (impacto vs esforço)

| Prioridade | Item | Esforço | Impacto |
|---|---|---|---|
| **P0** | Container responsivo (max-width + grid wrapper) | Baixo | Alto |
| **P0** | CSS vars para paleta editável (`--accent-iremar`, `--accent-juliana`, `--accent-i2`) | Baixo | Alto |
| **P0** | Gráfico SVG nativo (barras receitas vs despesas em /relatorios + sparkline no dashboard) | Médio | Alto |
| P1 | ThemeProvider (light/dark/system) | Médio | Médio |
| P1 | Grid 2/3 colunas em dashboard/contas/empresa no md+ | Baixo | Alto |
| P2 | Hover states e microinterações desktop | Baixo | Médio |
| P2 | Tipografia responsiva (clamp ou breakpoint variants) | Baixo | Médio |
