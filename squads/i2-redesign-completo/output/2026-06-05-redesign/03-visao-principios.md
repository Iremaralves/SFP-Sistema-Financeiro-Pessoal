# 03 — Visão & Princípios de Design

**Persona:** Olivia, Design Director
**Data:** 2026-06-07
**Escopo:** Linguagem visual do i2 Finance — manifesto, princípios, tokens, tipografia.
**Filosofia desta fase:** definir a alma ANTES do pixel. Menos é mais.

---

## 1. Manifesto

O i2 Finance não é um app de finanças pessoais. É a mesa onde um casal abre o caderno no fim do dia — mas a caligrafia é digital, o caderno tem três camadas (Pessoal, Empresa, Casal), e o lápis sabe matemática. Ele existe porque Iremar é três pessoas ao mesmo tempo: o homem que paga a luz, o empreendedor que emite nota fiscal, o parceiro que divide a fatura com Juliana. Cada papel pede uma resposta diferente, mas a vida é uma só. O app precisa segurar essa tensão sem fragmentar.

A sensação que ele deve provocar é **calma orientada**. Não a calma vazia de uma tela em branco — a calma específica de quem chega ao escritório de manhã, abre o computador, e em três segundos sabe três coisas: quanto tem, quanto deve, o que precisa fazer hoje. É a calma do dashboard de um avião antes da decolagem: muita informação, zero ruído. Cada elemento que aparece na tela ganhou o direito de estar lá.

Para Iremar, o app é um instrumento de comando. Ele precisa enxergar PF, PJ e Cartão simultaneamente, decidir transferências, fechar o mês com Juliana sem fricção. Ele opera em desktop pela manhã, mobile à noite. Para Juliana, o app é um espelho honesto: "essa é a sua parte deste mês, esses lançamentos ainda precisam de categoria, isso aqui é seu para resolver". Nada além disso. Ela não precisa entender o sistema — precisa que o sistema a entenda.

A identidade visual nasce dessa dualidade. O **dark mode** não é estética da moda — é redução de ruído. O **glassmorphism** não é decoração — é estratificação semântica: o que está vivo flutua, o que é histórico assenta. As **cores de responsável** (azul Iremar, rosa Juliana, âmbar i2, ciano Casal) não são marcas — são linguagem. Quando uma linha brilha azul, Iremar sabe que é dele antes de ler. Cor aqui é gramática, não enfeite.

O i2 Finance é, em uma frase, **um instrumento de decisão financeira a quatro mãos**. Dark, denso, honesto, com hierarquia radical do número que importa e silêncio em todo o resto.

---

## 2. Cinco Princípios de Design

### Princípio 1 — Hierarquia Radical (Um Número Manda)

Toda tela tem **um** número-âncora que carrega a decisão daquela tela. Esse número merece tipografia 2-3x maior que qualquer outro elemento da viewport, espaço respiratório em torno, e zero competição visual. Tudo o mais é coadjuvante.

*Exemplo prático:* no `/dashboard` admin, o "Total da Fatura do Cartão" (ou saldo consolidado do mês, dependendo do contexto) sobe para o topo absoluto, antes de QuickActions. Em mobile 375px, ele ocupa sozinho os primeiros 140-160px de viewport, em tipografia ~40-48px. QuickActions vira fileira horizontal scrollável logo abaixo (Nubank pattern). Em `/lancamentos`, o número-âncora é "Total filtrado". Em `/acerto`, é o "Saldo devedor entre Iremar e Juliana".

### Princípio 2 — Cor é Gramática

Cor de responsável não é decoração — é a primeira camada de leitura. Antes de ler texto, o olho identifica de quem é a linha. Por isso, cor de responsável deve ser **consistente**, **discreta** e **inviolável**: nunca usar azul puro para "info" se azul significa Iremar; nunca usar rosa para "delete" se rosa significa Juliana. Estados (sucesso, erro, alerta) usam neutros calibrados (verde, vermelho, âmbar) que não colidem com responsáveis.

*Exemplo prático:* o `StatusBadge` para "pago/atrasado/em dia" usa verde-musgo, vermelho-tijolo e âmbar-mostarda — tons dessaturados que coexistem com azul/rosa/ciano sem competir. A borda esquerda 2px de itens de lista carrega a cor do responsável (azul, rosa, ciano, âmbar). Lint-rule no projeto: hex de azul puro `#3b82f6` só pode aparecer ligado à variável `--accent-iremar`.

### Princípio 3 — Densidade Calibrada (Mobile-First, Desktop-Powerful)

Em 375px, respiro é luxo, mas legibilidade é direito. Listas devem caber 6-8 itens por viewport sem aglomeração. Em desktop ≥1024px, a mesma lista deve caber 18-24 itens — sem reformular layout, apenas reduzindo row-height e ativando colunas auxiliares (Linear pattern). A densidade nasce de tipografia precisa, dividers de 1px em 8% de opacidade, ícones de 14-16px e espaçamentos múltiplos de 4.

*Exemplo prático:* `TransactionRow` tem altura 56px em mobile (avatar+desc 2 linhas+valor) e 36px em desktop (avatar+desc 1 linha+colunas extras: conta, categoria, data). Mesmo componente, dois modos. Em `/categorizar`, mobile usa swipe gestures; desktop adiciona checkbox múltiplo + atalhos de teclado.

### Princípio 4 — Glass é Estratificação, Não Maquiagem

O efeito glass (background blur + transparência) tem **um único propósito**: indicar elementos que flutuam sobre o conteúdo (modais, drawers, sticky headers, FABs). Cards de conteúdo regular usam superfícies sólidas (`--surface-1`, `--surface-2`). Misturar glass por toda parte achata a hierarquia. Reserve o efeito para o que precisa parecer "acima".

*Exemplo prático:* o BottomNav é glass (flutua sobre o scroll). O sticky header da página é glass. O drawer "Mais" é glass. Mas `BillsCard`, `IncomeCard`, `TransactionRow` são superfícies sólidas com borda 1px sutil — não glass. Eliminar todos os `const glass = {...}` inline dos dashboards e contas; usar variant `<Card variant="solid|elevated|glass">`.

### Princípio 5 — Uma Ação, Um Caminho Canônico

Cada ação no app tem **uma** entrada visualmente dominante. Atalhos podem existir, mas devem ser visivelmente secundários (atalho de teclado, item no drawer overflow, link contextual). Duplicar CTA no corpo + nav inferior + sidebar gera paralisia de escolha e dilui o aprendizado.

*Exemplo prático:* "Novo Lançamento" tem **um** botão primário: o FAB do BottomNav em mobile, o botão `+ Novo` no header da página em desktop. CTA gigante no corpo do `DashboardOperator` sai. "Categorizar" e "Acerto" vivem no QuickActions do dashboard — não duplicam como cards separados abaixo. "Trocar perfil" vive no header (compact pill). Sidebar e Drawer não replicam o toggle.

---

## 3. Paleta Refinada

### Base (Background & Surfaces)

| Token | Hex | Uso |
|---|---|---|
| `--bg-base` | `#070A0F` | Fundo absoluto da página. OLED-friendly. |
| `--bg-elevated` | `#0C1118` | Fundo de seções elevadas (drawer aberto, modal backdrop). |
| `--surface-1` | `#0F141C` | Card padrão (sólido). |
| `--surface-2` | `#141A24` | Card destacado / hover. |
| `--surface-3` | `#1A222E` | Input field, chip selecionado. |
| `--surface-glass` | `rgba(255,255,255,0.05)` | Apenas elementos flutuantes (BottomNav, drawer, sticky header). |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Divider de lista. |
| `--border-default` | `rgba(255,255,255,0.10)` | Borda de card. |
| `--border-strong` | `rgba(255,255,255,0.16)` | Borda de input focado. |

### Texto

| Token | Hex | Uso |
|---|---|---|
| `--text-primary` | `#F2F5F9` | Títulos, valores grandes, número-âncora. |
| `--text-secondary` | `#9AA5B5` | Labels, descrições, metadados. |
| `--text-tertiary` | `#5E6878` | Hints, placeholders, "vs. mês anterior". |
| `--text-inverse` | `#070A0F` | Texto sobre botão primário claro. |

### Cores de Responsável (gramática — inviolável)

| Token | Hex | Variações | Uso |
|---|---|---|---|
| `--accent-iremar` | `#4F8FFF` | light `#7BAAFF` / strong `#2D6FE0` | Iremar (PF admin). |
| `--accent-juliana` | `#FF6BA8` | light `#FF93BF` / strong `#E04A87` | Juliana (PF operator). |
| `--accent-i2` | `#FFB547` | light `#FFCB7A` / strong `#E09020` | i2 Soluções (PJ). |
| `--accent-casal` | `#4DD4D4` | light `#7FE3E3` / strong `#2BB0B0` | Compartilhado (split). |

### Estados Semânticos

| Token | Hex | Uso |
|---|---|---|
| `--status-success` | `#5EBE7F` | Pago, em dia, receita confirmada. |
| `--status-warning` | `#E8B23E` | Vence hoje, atenção, NF pendente. |
| `--status-danger` | `#E15A5A` | Atrasado, saldo negativo, erro. |
| `--status-info` | `#7B8BA8` | Neutro informativo (não colide com Iremar). |

Cada cor de estado tem versão **soft** (rgba 12% para backgrounds de badge) e **strong** (hex sólido para texto/ícone).

---

## 4. Tokens — CSS Variables

```css
:root {
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Spacing (base 4) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.40);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.45);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.55);
  --shadow-glass: 0 8px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.06);
  --shadow-glow: 0 0 24px rgba(79,143,255,0.25); /* glow azul Iremar default; troca via --glow-color */

  /* Motion */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;

  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --easing-emphasized: cubic-bezier(0.3, 0, 0, 1);
  --easing-decel: cubic-bezier(0, 0, 0, 1);
  --easing-accel: cubic-bezier(0.3, 0, 1, 1);
}
```

**Regra de motion:** elementos que entram (sheet, drawer, toast) usam `decel`; elementos que saem usam `accel`; transições contínuas (hover, focus) usam `standard`. `Emphasized` para a entrada do número-âncora no dashboard (animação inicial de load).

---

## 5. Tipografia

### Recomendação: **Inter Tight** (variable, weights 400/500/600/700)

**Por quê.** Inter Tight tem o espaçamento horizontal levemente reduzido em relação ao Inter padrão, o que ganha 8-12% de densidade em tabelas (Linear-style) sem perder legibilidade. Os numerais são tabulares por padrão na variant `Inter Tight` — crucial para alinhamento de valores monetários em coluna. Geist é alternativa válida (tem tabular nums também), mas Inter Tight tem melhor renderização em densidades pequenas (12-13px) que vamos usar em listas desktop. IBM Plex Sans foi descartada pelo desenho mais "técnico-frio" que conflita com a calma orientada do manifesto.

**Fallback stack:** `'Inter Tight', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Numerais:** sempre `font-variant-numeric: tabular-nums` em valores monetários, datas e percentuais.

### Escala

| Token | Size | Line-height | Weight padrão | Uso |
|---|---|---|---|---|
| `--text-xs` | 12px | 16px | 500 | Microcopy, labels de chip, timestamps. |
| `--text-sm` | 14px | 20px | 500 | Texto secundário, descrições de transação. |
| `--text-base` | 16px | 24px | 500 | Corpo padrão. |
| `--text-md` | 18px | 26px | 600 | Títulos de card. |
| `--text-lg` | 24px | 32px | 600 | Títulos de seção, valores médios. |
| `--text-xl` | 32px | 40px | 600 | Valor de card destaque. |
| `--text-2xl` | 48px | 56px | 700 | Número-âncora mobile. |
| `--text-3xl` | 64px | 72px | 700 | Número-âncora desktop hero. |

**Pesos disponíveis:**
- 400 (regular) — corpo de leitura longa (raro no app, talvez relatórios).
- 500 (medium) — default de todo texto.
- 600 (semibold) — títulos, valores secundários.
- 700 (bold) — número-âncora, e SÓ ele. Nada mais usa 700.

Bold em 700 é reservado: ele é o "tom de voz forte" da hierarquia radical. Se tudo é bold, nada é.

---

## 6. Mudanças vs Identidade Atual

### MANTER (não tocar — é a alma do produto)

- **Dark mode OLED.** Identidade definida pela regra do squad. Não há discussão de light mode.
- **Cores de responsável (azul/rosa/âmbar/ciano).** Já funcionam como gramática. Apenas refinar hex e nomear variações light/strong.
- **Glassmorphism como conceito.** Mas reduzir uso ao seu papel real (estratificação, item 4 dos princípios).
- **ProfileScopeToggle como controle central.** Conceito permanece — só consolidar em um único lugar (header).
- **Ciclo de fatura como visão dominante do dashboard.** Continua sendo a tela-âncora do Iremar.

### REFINAR (existe, mas mal aplicado)

- **Uso de glass.** Hoje aparece em todo card (`const glass = {...}` inline). Restringir a elementos flutuantes. Cards de conteúdo ganham variant sólida.
- **Tokens CSS.** Existem mas ~40% dos componentes hardcodam rgba/hex. Eliminar inline-styles, criar variants tipadas (`<Card variant>`, `<StatusBadge status>`, `<PageHeader accent>`).
- **Headers de página.** Cada tela inventa pt/pb/gradient. Criar `<PageHeader>` único consumido pelas 16 rotas.
- **Spacing e radius.** `space-y-3` vs `space-y-5` vs `space-y-2.5` sem critério. Padronizar em múltiplos de 4 via tokens `--space-*`. Radius: cards grandes usam `--radius-xl` (24px), cards padrão `--radius-lg` (16px), chips/inputs `--radius-md` (10px), pills `--radius-full`.
- **Tipografia.** Migrar de fonte default Tailwind para Inter Tight com tabular-nums em valores.
- **Botão de criar.** Padronizar rótulo "Novo lançamento", "Novo compromisso" (consistência de gênero/forma) em todos os contextos.

### ADICIONAR (novo, mas dentro do escopo de redesign)

- **Sparkline + delta** ao lado de KPIs (Stripe pattern). Hoje só temos valor; adicionar mini-gráfico de 30 pontos + "vs. mês anterior" transforma extrato em instrumento.
- **Command palette (Cmd+K)** em desktop. Atalho universal para Iremar admin desktop — não é feature nova de produto, é shortcut de navegação. Mobile não recebe (Juliana não pede).
- **Drawer lateral para detalhe** em desktop (clicar em transação abre drawer mantendo lista). Mobile mantém navegação normal.
- **Filtros como pills removíveis** com badge de count em `/lancamentos`, `/categorizar`, `/compromissos`.
- **Swipe gestures em `/categorizar`** mobile (esquerda=Iremar, direita=Juliana, manter=Casal).
- **Borda esquerda 2px colorida** em itens de lista pela cor de responsável (Linear pattern). Substitui chips redundantes de "Iremar"/"Juliana" em cada linha.
- **`<StatusBadge>` único.** Consolidar `STATUS_CFG` (BillsCard) e `STATUS_CONFIG` (Compromissos) em um componente com prop `status`.
- **Empty states ilustrados.** Hoje listas vazias mostram texto seco. Pequenas ilustrações monocromáticas (linha 1px) em `--text-tertiary` para `/categorizar` sem itens, `/lancamentos` sem resultados de filtro, `/backups` vazio.

---

## Encerramento

A linguagem está posta. O dark é estratégia, não moda. O glass é arquitetura, não enfeite. As cores são gramática, não decoração. O número-âncora manda, o resto serve. A densidade respeita a tela pequena e premia a tela grande.

Próxima fase: traduzir esses princípios em wireframes das 16 telas, começando pelo `/dashboard` (admin + operator) — onde a hierarquia radical resolve o problema #1 da auditoria.

Menos é mais. E o pouco que sobra precisa ser exato.
