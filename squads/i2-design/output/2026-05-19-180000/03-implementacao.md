# Implementação — Ciclo 1

**Agente:** Bruno (Frontend Dev)
**Build:** ✓ `pnpm --filter web build` passou (compiled in 3.7s, 20/20 páginas geradas)

## O que foi implementado (3 prioridades P0)

### 1. Design tokens via CSS variables (paleta editável)
**Arquivo:** `apps/web/src/app/globals.css`

- Adicionados tokens `:root` para surfaces, accents (iremar/juliana/i2/casal/invest), text levels e layout (`--container-max: 1400px`, `--sidebar-w: 15rem`).
- Bloco `[data-theme="light"]` com paleta clara (opcional, dark continua padrão).
- Compatibilidade: variáveis `--glass-bg` / `--glass-border` mantidas para não quebrar `.glass`.
- Adicionados utilitários: `.page-container`, `.lift-hover` (hover apenas em devices `hover:hover`), `.fade-up`, `.fade-up-stagger` (com `:nth-child` delays), `.pulse-active`, `.hide-scrollbar`.
- Respeita `prefers-reduced-motion`.

### 2. Container responsivo + grids desktop
Todas as páginas principais ganharam wrapper `.page-container` + padding `md:px-8`:

- `apps/web/src/app/dashboard/page.tsx` (via DashboardAdmin)
- `apps/web/src/app/relatorios/page.tsx`
- `apps/web/src/app/empresa/page.tsx`
- `apps/web/src/app/contas/page.tsx`
- `apps/web/src/app/compromissos/page.tsx`
- `apps/web/src/app/lancamentos/page.tsx`
- `apps/web/src/app/acerto/page.tsx` (max 56rem — formulário centralizado)
- `apps/web/src/app/transferencias/page.tsx` (max 56rem)

Grids no DashboardAdmin:
- Hero 2/3 + Donut 1/3 a partir de `xl` (1280px).
- Equação Iremar / Equação Juliana lado-a-lado em `md`.
- Casal + i2 + "Juliana transferir" + Entradas em grid 2col mobile → 4col md.

### 3. ThemeProvider + ThemeToggle (light/dark/system)
**Arquivos novos:**
- `apps/web/src/components/ThemeProvider.tsx` — provider mínimo (~65 linhas), zero libs, persistência em `localStorage('i2-theme')`, escuta `prefers-color-scheme`.
- `apps/web/src/components/ThemeToggle.tsx` — 3 botões (☀ ☾ ◐), `role="radiogroup"` acessível.

**Wiring:**
- `apps/web/src/app/layout.tsx` — wrap em `<ThemeProvider>` + script inline pre-hydration que aplica `data-theme` antes do React montar (evita FOUC e mismatch).
- `apps/web/src/components/Sidebar.tsx` — toggle injetado no footer, acima da linha do nome/logout.

### Gráficos SVG nativos (bônus do mesmo ciclo)
**Arquivos novos** (sem libs externas):
- `apps/web/src/components/charts/Sparkline.tsx` — linha + área gradiente + ponto final destacado (~70 linhas).
- `apps/web/src/components/charts/BarChart.tsx` — barras pareadas, grid, legenda, tooltip via `<title>` SVG (~120 linhas).
- `apps/web/src/components/charts/DonutSplit.tsx` — donut N-fatias com label central (~80 linhas).

**Aplicados em:**
- `DashboardAdmin`: Sparkline no hero (md+), Donut split (xl+) ao lado direito.
- `/relatorios` tab Fluxo: BarChart 12 meses receitas vs despesas no topo da seção.

### Microinterações
- `.lift-hover` aplicado em cards clicáveis (alerta unassigned, link i2 → empresa).
- `.fade-up-stagger` no container do dashboard — cards entram com delay escalonado de 50ms.
- Hover lift desativado em touch devices via `@media (hover: hover)`.

## Arquivos modificados (resumo)

```
apps/web/src/app/globals.css                          ~120 linhas (era 32)
apps/web/src/app/layout.tsx                           +script + ThemeProvider
apps/web/src/components/Sidebar.tsx                   +ThemeToggle
apps/web/src/components/DashboardAdmin.tsx            grids + charts + lift
apps/web/src/app/relatorios/page.tsx                  BarChart + container
apps/web/src/app/empresa/page.tsx                     container
apps/web/src/app/contas/page.tsx                      container
apps/web/src/app/compromissos/page.tsx                container
apps/web/src/app/lancamentos/page.tsx                 container
apps/web/src/app/acerto/page.tsx                      container (56rem max)
apps/web/src/app/transferencias/page.tsx              container (56rem max)
```

## Arquivos criados

```
apps/web/src/components/ThemeProvider.tsx
apps/web/src/components/ThemeToggle.tsx
apps/web/src/components/charts/Sparkline.tsx
apps/web/src/components/charts/BarChart.tsx
apps/web/src/components/charts/DonutSplit.tsx
```

## Restrições respeitadas

- Zero `npm install` — nenhuma lib nova.
- Dark mode permanece base; light é opt-in via toggle.
- `mobile-first` preservado — todas as novas regras são progressive enhancement (`md:`, `xl:`).
- Cores legadas em `rgba(...)` continuam funcionando lado-a-lado com `var(--accent-*)`.
- Reduced motion respeitado.

## Build

```
✓ Compiled successfully in 3.7s
✓ Generating static pages (20/20)
```
