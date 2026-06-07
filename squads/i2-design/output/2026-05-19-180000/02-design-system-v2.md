# Design System v2 — i2 Finance

**Agente:** Rafa (Senior Product Designer)
**Base:** auditoria de Laura (`01-audit-desktop.md`)

---

## 1. Tokens — paleta editável via CSS vars

Tudo migra para variáveis CSS no `:root`, com **fallback que mantém o look atual**. O usuário poderá futuramente sobrescrever via UI ou localStorage.

```css
:root {
  /* Surfaces */
  --bg-base: #000000;
  --surface-1: rgba(255,255,255,0.04);
  --surface-2: rgba(255,255,255,0.06);
  --surface-3: rgba(255,255,255,0.09);
  --border-soft: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.14);

  /* Accents — editáveis */
  --accent-iremar: #3b82f6;
  --accent-iremar-2: #6366f1;
  --accent-juliana: #ec4899;
  --accent-juliana-2: #f472b6;
  --accent-i2: #f59e0b;
  --accent-i2-2: #d97706;
  --accent-casal: #06b6d4;
  --accent-invest: #10b981;

  /* Text */
  --text-1: rgba(255,255,255,0.95);
  --text-2: rgba(255,255,255,0.60);
  --text-3: rgba(255,255,255,0.40);
  --text-4: rgba(255,255,255,0.25);

  /* Layout */
  --container-max: 1400px;
  --container-px: 1rem;
  --sidebar-w: 15rem;
}

[data-theme="light"] {
  --bg-base: #fafafa;
  --surface-1: rgba(0,0,0,0.03);
  --surface-2: rgba(0,0,0,0.05);
  --surface-3: rgba(0,0,0,0.08);
  --border-soft: rgba(0,0,0,0.08);
  --border-strong: rgba(0,0,0,0.14);
  --text-1: rgba(0,0,0,0.92);
  --text-2: rgba(0,0,0,0.60);
  --text-3: rgba(0,0,0,0.40);
  --text-4: rgba(0,0,0,0.25);
}
```

## 2. Breakpoints + container

```
sm  640   — celular grande
md  768   — tablet / sidebar aparece
lg  1024  — desktop pequeno
xl  1280  — desktop normal (alvo principal do redesign)
2xl 1536  — desktop grande
```

**Wrapper `.page-container`:**
```css
.page-container {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2.5rem);
}
```

## 3. Grids responsivos por página

| Página | Mobile | md (≥768) | xl (≥1280) |
|---|---|---|---|
| dashboard | 1col | 2col cards pessoas | hero 2/3 + sparkline 1/3, depois 3col KPIs |
| contas | 1col | 2col | 3col |
| compromissos | 1col | 2col | 3col |
| empresa (DRE) | 1col | DRE 60% + KPIs 40% | mesmo + gráfico |
| relatórios | 1col | 1col + chart maior | chart full + table sob |

## 4. Gráficos SVG nativos (sem libs)

3 componentes leves, ~80 linhas cada:

### `<Sparkline>` — para hero do dashboard
- Linha simples 6 pontos (últimos 6 meses)
- `<path>` com `stroke="url(#grad)"`, sombra suave, ponto final destacado
- ~60 linhas TS

### `<BarChart>` — para /relatorios fluxo
- Barras pareadas receita/despesa por mês
- Grid horizontal sutil, tooltip via `<title>` SVG nativo
- ~120 linhas TS

### `<DonutSplit>` — para dashboard
- Donut com 4 fatias (iremar/juliana/casal/i2)
- Texto central com total
- ~80 linhas TS

## 5. Tema light/dark/system

- Atributo `data-theme` no `<html>`
- `ThemeProvider` mínimo (~40 linhas, sem next-themes para evitar dependência)
- Persistência em `localStorage('i2-theme')`
- Toggle de 3 estados no Sidebar footer: ☀ Light · ☾ Dark · ◐ Auto
- Light mode é **opcional** — base permanece OLED dark conforme regra.

## 6. Microinterações criativas (perfumarias)

- **Hover lift sutil** em cards clicáveis: `translateY(-2px)` + sombra colorida da paleta (~150ms ease-out).
- **Counter-up** nos valores monetários quando entram em viewport: anima de 0 ao valor final (~700ms).
- **Easter egg:** ao clicar 7x no logo i2 da sidebar, ativa "modo glitch" que aplica `filter: hue-rotate(animação)` por 3s na paleta.
- **Glow no item ativo da sidebar:** pulse muito sutil no border (4s loop).
- **Cards entrando:** stagger fade-in (50ms entre cada) no primeiro render.

## 7. Componentes a refatorar / criar

| Componente | Status | Mudança |
|---|---|---|
| `Sidebar.tsx` | refatorar | usar CSS vars + theme toggle |
| `BottomNav.tsx` | refatorar | esconder no md+ se já tem sidebar (já faz, ok) |
| `DashboardAdmin.tsx` | refatorar | grid responsivo + sparkline + donut |
| `globals.css` | refatorar | adicionar vars + utilitários (`.page-container`, `.card`, `.lift-hover`) |
| `Sparkline.tsx` | **novo** | gráfico de linha |
| `BarChart.tsx` | **novo** | gráfico de barras |
| `DonutSplit.tsx` | **novo** | gráfico donut |
| `ThemeToggle.tsx` | **novo** | toggle de tema |
| `app/layout.tsx` | refatorar | aplicar tema antes de hydratar |

## 8. Top 3 implementações (impacto vs esforço) — para Bruno

1. **Tokens CSS + container responsivo + grids md/xl em dashboard, contas, empresa, relatórios**
   *Pega 70% dos problemas (G1, G2, G4, G7, G8). Esforço baixo. Não cria componente novo.*

2. **Componentes de gráfico SVG (`Sparkline`, `BarChart`, `DonutSplit`) e aplicá-los em /dashboard e /relatorios**
   *Resolve G3. Esforço médio. Visual ENORME ganho.*

3. **ThemeProvider mínimo + ThemeToggle no Sidebar (light/dark/system)**
   *Resolve G8 e abre futuro de paleta editável. Esforço baixo.*

Microinterações (perfumarias) entram **junto** com (1) — custo marginal zero quando já se está mexendo nos cards.
