# 06 — Desktop Specs (1280–1920px)

**Persona principal:** Helena — Desktop Productivity Specialist (ex-Linear, ex-Notion)
**Mentora cruzada:** Sofia — Senior Visual Designer (manutenção da gramática visual)
**Data:** 2026-06-07
**Escopo:** especificação tela-a-tela do i2 Finance em desktop largo (1280–1920px), considerando a vida real de Iremar — MacBook 14" no escritório de manhã, monitor externo 27" 1440p à noite, eventual ultrawide do parceiro. Helena escreve assumindo que ninguém abre o app no celular em desktop; aqui é teclado, mouse, atalho, densidade.
**Premissa-base:** desktop não é mobile esticado. O usuário não rola — ele varre. Ele não toca — ele aponta. Ele não procura na tela — ele invoca Cmd+K. Aproveitar 1440px é dever, não opção: cada coluna ociosa é informação que o Iremar foi obrigado a buscar em outra rota.

Geometria de referência: viewport canônica de design 1440×900 (MacBook Pro 14" escala efetiva). Sidebar fixa 240px à esquerda. Top bar 56px. Conteúdo útil: ~1200×844px no canônico, ~1680×1024px em monitores 27", até ~2400×1200 em ultrawide (clampamos conteúdo em `max-width: 1680px` centrado para evitar linhas de leitura absurdas — sidebar e top bar continuam full-width, mas o canvas interno respira centralizado).

---

## Convenções globais desktop

- **Sidebar fixa 240px** (não colapsa em ≥1280px; em 1024–1279px colapsa para 64px com tooltip). Glass `--surface-glass` com borda direita `--border-default`. Conteúdo agrupado por seção (ver §"Sidebar Desktop v2").
- **Top bar sticky 56px**: glass, contém breadcrumb à esquerda, `ProfileScopeToggle` centralizado, hint de Cmd+K + avatar à direita.
- **Densidade base:** linhas de lista 36px (mobile usava 56–72px). Tipografia base de tabela: `--text-sm` 14/20. Valores monetários em `--text-sm` 14/20 600 + tabular-nums. Headers de coluna em `--text-xs` 12/16 500 uppercase tracking-wide `--text-tertiary`.
- **Hover é informação, não decoração.** Toda linha hover-able revela: highlight de fundo 4% white, borda esquerda de cor de responsável engrossa para 3px, ações inline aparecem à direita (edit, dup, delete em ícone 16px com tooltip via `title=`). Hover delay 60ms para evitar piscadas durante varredura.
- **Right-click = menu de contexto** em qualquer linha. Replica long-press do mobile. Sempre inclui: Editar · Duplicar · Mudar responsável · Excluir · Copiar valor.
- **Drag-and-drop** habilitado em: reorder de contas (`/contas`), drag de transação entre categorias em `/categorizar` (alternativo ao swipe), arrastar CSV/OFX em qualquer ponto da janela em `/importar` (drop-zone full-window com overlay).
- **Atalhos de teclado** seguem três famílias: navegação `G + letra` (G+D dashboard, G+L lançamentos…), criação `N + letra` (N+L novo lançamento, N+T transferência), ação universal `Cmd+K`. Tudo cancelável com `Esc`.
- **Multi-pane (master-detail)** é o padrão em telas-lista: clicar uma transação NÃO navega — abre drawer 480px à direita mantendo a lista visível, sublinhando a linha selecionada. Drawer é sticky e scrolla independente da lista.
- **Tooltips** com `--surface-2` 6px radius, 200ms delay, `--text-xs`. Atalho de teclado, quando existe, aparece como chip `kbd` à direita da label.
- **Foco visível e ordenado.** Cada elemento interativo recebe ring 2px `--accent-iremar` em focus-visible. Tab-order segue leitura (sidebar → top bar → conteúdo) e respeita `inert` em painéis fechados.
- **Densidade vs respiro:** ver §"Densidade vs respiro" para a regra completa. Resumo: KPIs/Hero respiram (números grandes 64px, padding 32px); listas/tabelas densificam (linhas 36px, padding 12/16); formulários ficam no meio (inputs 40px, gap 16px).

---

## 1) /dashboard (Admin — Iremar)

**O que muda vs mobile:**

- **Grid de 12 colunas** com gutter 24px. AnchorHero deixa de ser full-width — vive em colunas 1–7 (~700px), liberando colunas 8–12 (~480px) para um painel "Hoje" persistente (compromissos vencendo hoje + acerto pendente + 3 últimas transações da conta-foco).
- **AnchorHero desktop**: número-âncora migra para `--text-3xl` 64/72 700. Ao seu lado, em coluna interna direita, sparkline expandida (180×56 em vez de 80×40 do mobile) com tooltip por ponto (hover mostra "12 mai · saldo R$ 44.200"). Delta vs mês anterior ganha barra horizontal mini-comparativa de 4 meses (mini bar-chart, não sparkline). Animação inicial: contagem-up do número em 480ms `emphasized`, sparkline desenha-se 600ms `decel` em paralelo.
- **QuickActions** deixa de ser fileira horizontal scrollável — vira **strip 4 cards full-width** ocupando linha inteira abaixo do AnchorHero, cada card 280×120 com hover revelando "última ação rápida" (ex: card "Transferir" hover → "Última: R$ 1.500 Itaú → Inter i2, ontem"). Click executa, hover informa.
- **BillsCard e IncomeCard** ficam lado a lado em colunas 1–6 e 7–12, cada um com 8 itens visíveis (mobile mostrava 3). Header dos cards ganha mini-toggle "Esta semana / Este mês / Vencidos" — tab interna.
- **Grid 4×1 de AccountCards** (Itaú PF, Inter i2, Cartão Itaú, Cartão Inter) ocupa linha completa, cada card 320×180 com sparkline 120×40, saldo grande, label e um botão-ícone hover "extrato" (16px) que abre drawer lateral 480px com últimos 30 lançamentos.
- **Widget "Patrimônio Líquido"** (desktop-only — ver §"Dashboard widgets desktop-only") aparece como hero secundário no terço inferior da viewport: gráfico de área 100% width × 240px altura, 12 meses, com toggle "Empilhado por conta / Total". Mobile não tem essa seção.

**Hover states:**
- AccountCard hover → eleva `translateY(-2px)` + shadow-md, revela 3 botões inline (Extrato · Nova transação · Reconciliar).
- BillsCard row hover → fundo `rgba(255,255,255,0.04)`, ícones Pagar/Adiar/Editar aparecem à direita.
- Sparkline hover → tooltip com ponto exato + scrubber vertical.
- QuickAction card hover → reveal de microcopy contextual + atalho `kbd` (ex: "Transferir · N+T").

**Atalhos de teclado:**
- `G+D` foca dashboard.
- `N+L` abre modal "Novo lançamento".
- `N+T` abre modal "Nova transferência".
- `Cmd+K` abre command palette.
- `Cmd+1..4` troca entre as 4 contas no widget Patrimônio (cycle de séries).
- `Cmd+Shift+P/E/T` troca ProfileScope Pessoal/Empresa/Tudo (P/E/T mnemonic).

**Multi-pane:** não aplicável no /dashboard (é destino, não lista). Mas clicar em qualquer linha de BillsCard abre drawer 480px à direita com detalhe do compromisso, mantendo o dashboard à esquerda. Drawer fecha com Esc ou click fora.

---

## 2) /dashboard (Operator — Juliana)

**O que muda vs mobile:** Juliana raramente abre em desktop. Mas Helena reconhece: quando abre, é pra fazer categorização em massa com teclado. Então o dashboard operator desktop redireciona o foco — AnchorHero menor (col 1–5), e **um painel lateral fixo (col 6–12) "Categorizar agora"** que mostra os 5 próximos itens da fila de categorização inline, com botões `[I]remar [J]uliana [C]asal` por linha + atalhos de teclado correspondentes. Ela categoriza 5 sem sair do dashboard.

**Hover states:** linhas da fila revelam preview do merchant (logo grande 48px) à direita.
**Atalhos:** `G+C` vai para /categorizar full. `I/J/C` em foco na linha aplica responsável e avança.
**Multi-pane:** o painel inline já é multi-pane.

---

## 3) /lancamentos

**O que muda vs mobile:**

- **Layout master-detail clássico**: lista ocupa col 1–8 (largura ~720px), drawer de detalhe col 9–12 (~480px). Quando nenhuma linha selecionada, drawer mostra "AnchorHero do filtro" (Σ filtrado, count, distribuição por responsável em barra empilhada horizontal).
- **TransactionRow muda densidade** de 56px para **36px de altura**. Conteúdo da linha agora horizontal: [borda 2px responsável] · ícone categoria 16px · descrição truncada · chip categoria · conta · data · responsável (avatar 20px) · valor (right-aligned, tabular-nums) · ícones de ação inline (visíveis em hover).
- **Header de colunas** sticky abaixo do sub-header, clicável para ordenar (asc/desc indicado por chevron). Colunas: Descrição · Categoria · Conta · Data · Resp · Valor.
- **Filtros** deixam de ser sheet — viram **filter bar inline** sticky logo abaixo do header da página, com chips removíveis + um botão `+ Filtro` que abre menu dropdown com tipos de filtro disponíveis (Período, Conta, Categoria, Responsável, Tipo, Status, Tag).
- **Paginação virtualizada**: scroll mostra ~22 linhas (36px × 22 = 792px) por viewport canônica; em 27" ~28 linhas. Scroll infinito com sentinel.
- **Seleção múltipla**: checkbox aparece no hover do canto esquerdo da linha. Click no checkbox seleciona linha, Shift+click seleciona range, Cmd+click seleciona individual. Com seleção ativa, aparece **bulk action bar** sticky no topo: "23 selecionados · R$ 4.870 · [Categorizar em lote] [Mudar responsável] [Excluir]".

**Hover states:**
- Linha hover → fundo `rgba(255,255,255,0.04)`, ícones inline `[edit][dup][⋯]` revelam à direita do valor.
- Hover em chip de categoria → micro-popover com "Total nesta categoria no período: R$ 1.840".
- Hover em data → "Há 3 dias" tooltip.
- Hover em valor negativo → sublinha em vermelho-soft.

**Atalhos de teclado:**
- `G+L` vai para /lancamentos.
- `/` foca a busca dentro da filter bar.
- `F` abre dropdown "+ Filtro".
- `J/K` move seleção para baixo/cima (vim-style, Linear pattern).
- `Enter` abre drawer de detalhe da linha selecionada.
- `E` edita inline o campo focado.
- `Cmd+A` seleciona tudo na página atual.
- `Cmd+Backspace` exclui selecionados (com confirmação modal).
- `Cmd+Shift+C` categorizar selecionados em lote.

**Multi-pane:** master-detail é o cerne da tela. Click em linha sublinha + abre drawer. `J/K` percorre lista mantendo drawer aberto e atualizando seu conteúdo (Linear inbox vibe).

---

## 4) /lancamentos/[id] (Detalhe)

**O que muda vs mobile:** em desktop, **nunca** é tela cheia. Sempre vive como drawer 480px à direita de `/lancamentos`. Acesso por URL direta (compartilhamento de link) renderiza a página com a lista no fundo carregada e o drawer aberto sobre.

- **Drawer header** 56px: título "Detalhe" + chevron up/down (J/K equivalente) para próximo/anterior na lista + close `×`.
- **AnchorHero compacto** dentro do drawer: valor em 32px (vs 48 mobile) + chip status, ocupa 96px.
- **Bloco de metadados** em duas colunas dentro do drawer (480px é largo o suficiente): Conta | Data, Responsável | Categoria, Parcela | Tag. Edição inline com double-click no campo.
- **Histórico de edições** colapsado no rodapé do drawer ("Editado 2 vezes · ver histórico" → expande lista com timestamps).
- **Travas visuais**: campos travados ganham ícone cadeado + tooltip "Editar na compra original (#1284) →" — link que muda o drawer para a compra-mãe.

**Hover states:** double-click em metadado para editar inline. Hover no cadeado revela tooltip + link.

**Atalhos:**
- `E` modo edição (foca primeiro campo).
- `Esc` fecha drawer.
- `J/K` próximo/anterior preservando posição na lista.
- `Cmd+D` duplica.
- `Cmd+Backspace` exclui (com confirm).

---

## 5) /lancamentos/novo

**O que muda vs mobile:** vira **modal central** (não bottom sheet), `max-width: 560px`, height auto até max 720px. Backdrop com blur 60% sobre o `/lancamentos` ou tela origem.

- **Tabs segmentadas** no topo do modal: Despesa · Receita · Transferência. `Cmd+1/2/3` alterna.
- **Form em duas colunas** quando há espaço (560px → duas colunas de 264px com gap 32). Valor + Data lado a lado. Conta + Responsável lado a lado. Categoria + Tag lado a lado. Descrição full-width. Toggle Recorrente full-width.
- **Foco automático no Valor**. Tab navega na ordem natural.
- **CTA "Adicionar"** no rodapé do modal, alinhado à direita, com botão secundário "Cancelar" à esquerda. `Cmd+Enter` submete.

**Hover states:** mostra atalhos em `kbd` dentro do botão Adicionar (`⌘↵`).

**Atalhos:** `N+L` abre. `Esc` fecha (com confirm se há dados). `Cmd+Enter` salva. `Cmd+Shift+Enter` salva e abre um novo (criação em série, Linear pattern).

---

## 6) /compromissos

**O que muda vs mobile:** densidade tabela full, similar a `/lancamentos`. Master-detail idem.

- **Toggle de view** no header: **Lista (default desktop)** · **Calendário** · **Timeline**.
  - Lista: tabela densa 36px/linha.
  - Calendário: grid 7×5/6 mês inteiro, cada célula 160×120 mostra até 3 compromissos com chip valor + responsável. Click em célula expande sheet inferior dentro da página (drawer bottom 60% height) com lista do dia.
  - Timeline: linha do tempo horizontal scrollável, marcos pelos dias, alturas dos chips proporcionais ao valor.
- **Group headers por semana** colapsáveis (chevron).
- **Coluna "Vencimento"** com badge contextual (Hoje · Em 3 dias · Atrasado 2 dias).
- **Bulk pay**: seleção múltipla → "Marcar pagos (4) · R$ 1.890".

**Hover states:** linha hover revela `[Pagar] [Adiar 7d] [Editar]` à direita. Cell de calendário hover engrossa borda e revela "Σ R$ X".

**Atalhos:**
- `G+P` vai para /compromissos.
- `V+L/C/T` alterna view (List/Calendar/Timeline).
- `J/K` navega lista.
- `P` marca pago.
- `A` adia 7 dias.
- `Cmd+→/←` próximo/anterior mês no calendário.

**Multi-pane:** lista + drawer detalhe (480px).

---

## 7) /contas

**O que muda vs mobile:**

- **Grid 3×N de AccountCards** maiores (340×220px) com sparkline 30d em 280×64, saldo grande 32px, e seção interna "Últimos 5 lançamentos" inline (apenas em desktop — mobile fica só com saldo).
- **AnchorHero "Patrimônio Líquido"** ocupa banda superior full-width 1×120px com gráfico de área 12 meses como background sutil (opacity 18%).
- **Seção "Cartões"** em grid 2×N abaixo, mostrando barra de progresso de fatura grande e detalhada (com marcação de "fechamento" no ponto exato do ciclo).
- **Drag-and-drop** para reordenar contas — handle aparece no hover do canto esquerdo do card.

**Hover states:** AccountCard hover eleva + revela actions "Extrato · Reconciliar · Nova transação · Editar".

**Atalhos:** `G+B` (Bank/contas). `R` reconcilia conta selecionada. `Enter` abre extrato.

**Multi-pane:** click em AccountCard abre drawer 560px à direita com extrato completo (não navega para sub-rota).

---

## 8) /empresa

**O que muda vs mobile:**

- **Layout dashboard-like 12 col** específico de PJ.
- **DRE Hero**: 3 colunas grandes — Receita / Despesas / Resultado — cada uma com valor 48px, sparkline 6 meses, delta YoY.
- **Tabs internas** Resumo · Notas · Fluxo · Obrigações. Conteúdo abaixo da hero.
- **Resumo desktop**: grid 4×2 de KPI cards (Faturamento MTD, Margem%, MRR, Ticket médio, Inadimplência, DSO, Burn, Runway projetado). Cada card ~280×140 com sparkline + delta.
- **Painel "Notas pendentes"** em col lateral 4–wide, sempre visível independente da tab — Helena assume que NF é a dor recorrente do Iremar PJ.

**Hover states:** KPI card hover revela "Decomposição →" link que abre drawer com breakdown.

**Atalhos:** `G+E` empresa. `V+R/N/F/O` alterna tabs. `N+N` nova nota fiscal.

---

## 9) /empresa/notas

**O que muda vs mobile:** tabela densa idêntica em padrão a `/lancamentos`. Colunas: Nº · Cliente · Valor · Emissão · Vencimento · Status · Ações. Bulk send (enviar várias notas por email). Drawer detalhe à direita com preview do PDF da nota inline (iframe 480×680).

**Atalhos:** `N+N` nova nota. `P` baixa PDF da selecionada. `M` marca como recebida.

---

## 10) /categorizar

**O que muda vs mobile (e aqui a diferença é grande):** em desktop, **swipe não existe** — Helena substitui por **fluxo de teclado puríssimo, estilo Superhuman/Linear**.

- **Layout split**: col 1–2 (sidebar interna) com filtros/scope · col 3–8 (lista densa de pendentes, 36px/linha) · col 9–12 (painel de foco: card do item selecionado em destaque com merchant logo grande, contexto histórico, sugestão ML).
- **Hotkeys exclusivos da tela** (mostrados em rodapé sticky como `kbd` cheat sheet):
  - `I` atribui a Iremar e avança.
  - `J` atribui a Juliana e avança.
  - `C` atribui a Casal e avança.
  - `2` atribui a i2 (admin).
  - `1..9` aceita uma das 9 categorias sugeridas do painel direito.
  - `Cmd+1..9` aplica + categoria em um único toque.
  - `Space` confirma sugestão default.
  - `J/K` move foco lista.
  - `S` marca para "revisar depois" (vai pro fim da fila).
  - `B` bulk-apply: aplica responsável+categoria atuais a todos os similares (modal de confirmação).
  - `U` desfaz última atribuição.
- **Indicador de progresso sticky no topo**: barra 4px width-100% com proporção feita/restante. Contador "27 de 32 feitas · 5 restantes".
- **Empty state celebrado** ao zerar: confetti das 4 cores 1.5s + "Tudo em dia · Próxima fatura: 8 dias" + atalho `G+D` para voltar pro dashboard.

**Hover states:** hover na linha revela botões [I][J][C] gigantes 32px com tooltip de atalho.

**Multi-pane:** o painel de foco direito É o multi-pane permanente.

---

## 11) /acerto

**O que muda vs mobile:**

- **Layout 2-col**: col 1–7 mostra "Acerto atual" com hero "Iremar deve R$ 380 à Juliana" + lista de composição (linhas 36px). Col 8–12 mostra "Histórico de acertos" como lista cronológica de cards 96px cada (data, valor, direção, status).
- **Visualização de fluxo**: pequeno diagrama sankey-like entre os dois avatares (Iremar ↔ Juliana) com setas de espessura proporcional ao valor — apenas desktop.
- **Editor inline de %** na coluna "responsabilidade" da composição: 50/50, 60/40 etc — slider duplo + input numérico.
- **CTA "Fechar acerto"** vira botão prominente no topo do hero col-7, com atalho `Cmd+Shift+F` (Fechar). Confirmação modal.

**Hover states:** linha de composição hover revela "Editar %" e "Excluir do acerto".

**Atalhos:** `G+A` acerto. `Cmd+Shift+F` fechar acerto. `H` foca histórico.

---

## 12) /mes

**O que muda vs mobile:** Helena pondera deprecar mas a IA da Fase 04 manteve. Em desktop, vira espelho read-only de `/relatorios?periodo=mes-anterior` com layout idêntico aos relatórios. Tabela completa + KPI grid + gráficos. Sem editor — tudo travado.

**Atalhos:** `G+M` vai para /mes. `←/→` mês anterior/seguinte.

---

## 13) /transferencias

**O que muda vs mobile:** filtro de `/lancamentos` com view especializada — tabela densa, mas com **coluna de fluxo** mostrando "De → Para" como mini-diagrama horizontal por linha em vez de texto. Bulk export para CSV.

**Atalhos:** `N+T` nova transferência (atalho global). Mesmos atalhos de `/lancamentos` aplicam.

---

## 14) /relatorios

**O que muda vs mobile:** aqui o desktop brilha — Helena chama isso de "BI doméstico".

- **Sidebar interna 200px** com presets ("Junho fechado", "YTD", "Comparativo 12m", "Custom") + filtros avançados (período custom, contas, responsáveis, categorias, tags). Salvar preset (`Cmd+S` dentro da página).
- **Canvas** ocupa o restante (~1000px+) com layout dashboard-like:
  - AnchorHero "Resultado do período" no topo (col 1–6) + 4 KPIs (col 7–12, grid 2×2).
  - Gráfico principal 100% width × 360px (vs 280 mobile) — chart de área receitas vs despesas com toggle Empilhado/Comparativo.
  - Grid 3×2 de mini-charts: top categorias (barras horizontais), distribuição por responsável (donut), evolução por conta (linhas), fluxo entre contas (sankey), ticket médio por mês (barras), variação YoY (waterfall).
- **Tabela inferior**: lista completa de transações do período, filtrável, exportável.
- **Export**: CSV, PDF, XLSX. Botão `[Exportar ▾]` no topo direito.

**Hover states:** todo chart tem tooltips por ponto + crosshair vertical. Hover em segmento de barra/donut isola visualmente (dim em 30% nos outros).

**Atalhos:** `G+R` relatórios. `Cmd+S` salvar preset. `Cmd+E` exportar (abre menu). `P` print-friendly (modo otimizado para impressão).

---

## 15) /importar

**O que muda vs mobile:**

- **Drop-zone full-window**: arrastar OFX/CSV/PDF para qualquer ponto da janela ativa overlay azul `--accent-iremar-soft` 30% com "Solte para importar".
- **Layout 3-step horizontal** (não vertical empilhado): step indicator visual no topo (Upload → Revisar → Confirmar), conteúdo no canvas.
- **Step Revisar**: tabela densa de 38 transações detectadas com colunas Incluir (checkbox) · Descrição · Valor · Data · Conta sugerida · Categoria sugerida · Responsável sugerido. Edição inline em qualquer célula. Bulk edit possível.
- **Painel lateral direito** mostra estatísticas em tempo real: "138 incluídas · 4 ignoradas · R$ 12.430 total · 89% auto-categorizadas".

**Atalhos:** `Cmd+O` abre file picker. `Cmd+Enter` confirma import. `A` toggle all included.

---

## 16) /backups

**O que muda vs mobile:** layout dashboard com hero de status + tabela de histórico de backups (data, tamanho, tipo, ações). Configurações em coluna lateral (toggles + agendamento avançado). Botão "Restaurar de arquivo" com upload.

**Atalhos:** `G+S` settings/backups. `Cmd+B` backup agora.

---

## 17) /login

**O que muda vs mobile:** **layout 2-col split-screen**.
- Col esquerda 50% width: hero visual — logo i2 grande 240px com glow multicor animado + tagline + ilustração ambient de gráficos sutis em background.
- Col direita 50% width: form centralizado max-width 400px com Email + Senha + CTA "Entrar" + OAuth Google.
- Background do canvas usa gradient sutil radial das 4 cores de responsável em opacity 6% (assinatura visual).

**Atalhos:** `Enter` em qualquer campo submete.

---

## Sidebar Desktop v2 — proposta de novo layout

Largura 240px fixa em ≥1280px, colapsa para 64px (apenas ícones) em 1024–1279px com tooltip on hover. Conteúdo:

```
┌─────────────────────────────────┐
│ [logo i2]  i2 Finance        ⇆ │  ← header sidebar 56px, ⇆ collapse toggle
├─────────────────────────────────┤
│                                 │
│ GESTÃO DIÁRIA                   │  ← label --text-xs --text-tertiary uppercase
│   ◉  Dashboard           G+D    │
│   ≡  Lançamentos         G+L    │
│   ✓  Compromissos        G+P    │
│   ◍  Contas              G+B    │
│   ✦  Categorizar  (32)   G+C    │  ← badge inline count
│                                 │
│ ANÁLISE                         │
│   ⊞  Relatórios          G+R    │
│   ⇋  Acerto              G+A    │
│   ▣  Empresa             G+E    │
│                                 │
│ SISTEMA                         │
│   ↥  Importar            G+I    │
│   ⌬  Backups             G+S    │
│                                 │
├─────────────────────────────────┤
│ [scope chip: Pessoal ▾]         │  ← ProfileScopeToggle compact aqui também?
│                                 │     NÃO — só no top bar (canônico único)
│                                 │     Esse espaço fica vazio ou vira
│                                 │     "Atalhos salvos" do usuário.
├─────────────────────────────────┤
│ [avatar] Iremar Alves       ⋯  │  ← footer sticky com menu (Sair, Settings)
└─────────────────────────────────┘
```

**Princípios da sidebar:**
- **Três grupos visuais separados** com label uppercase em `--text-xs` `--text-tertiary` e gap de 20px entre grupos. Cada item de menu 36px altura, ícone 16px + label 14/20 + atalho `kbd` à direita em `--text-tertiary`.
- **Estado ativo**: fundo `rgba(79,143,255,0.08)`, borda esquerda 2px `--accent-iremar`, label em `--text-primary`. Ícone ganha cor primary.
- **Hover**: fundo `rgba(255,255,255,0.04)`, label `--text-primary`.
- **Badge condicional**: Categorizar mostra contador inline `(32)` em chip pill 18px altura `--accent-juliana-soft`. Some quando = 0.
- **Não duplicar ProfileScopeToggle aqui** — vive só no top bar (regra do Princípio 5).
- **Collapse mode (64px)**: só ícones visíveis, tooltip on hover mostra label + atalho. Grupos viram dividers horizontais sutis.
- **Footer**: avatar 28px + nome + `⋯` que abre menu (Configurações, Aparência, Sair). Sempre sticky no fundo.

**Por que três grupos?** Espelha exatamente a IA da Fase 04 (Gestão Diária / Análise / Sistema). Helena defende isso sem rodeios — agrupar por natureza reduz scan time. Iremar nunca confunde "Backups" (sistema) com "Compromissos" (diário).

---

## Command Palette (Cmd+K)

**Trigger:** `Cmd+K` (mac) / `Ctrl+K` (win/linux) em qualquer tela. Também `/` quando foco não está em input.

**Visual:** modal centrado 640px de largura, posicionado a 20% do topo. Backdrop blur 40%. Border `--border-strong`. Shadow `--shadow-lg`. Padding 0, scroll interno.

**Estrutura:**

```
╔════════════════════════════════════════════════╗
║ 🔍  Buscar ação, ir para tela, criar…       ⌘K║  ← input 56px, foco auto
╠════════════════════════════════════════════════╣
║ AÇÕES SUGERIDAS (sem query)                   ║
║   ↳  Novo lançamento                  N+L     ║
║   ↳  Nova transferência               N+T     ║
║   ↳  Marcar Mapfre como paga                  ║  ← contextual (compromisso vencendo)
║   ↳  Fechar acerto de Maio                    ║  ← contextual
║                                                ║
║ IR PARA                                       ║
║   →  Dashboard                        G+D     ║
║   →  Lançamentos                      G+L     ║
║   →  Compromissos                     G+P     ║
║   →  …                                        ║
║                                                ║
║ TROCAR ESCOPO                                  ║
║   ⇆  Pessoal                          ⌘⇧P     ║
║   ⇆  Empresa                          ⌘⇧E     ║
║   ⇆  Tudo                             ⌘⇧T     ║
║                                                ║
║ FILTRAR (contextual à página)                  ║
║   ▾  Filtrar por: Mês = Maio                  ║
║   ▾  Filtrar por: Responsável = Juliana       ║
╚════════════════════════════════════════════════╝
```

**Categorias expostas:**

1. **Navegação** — todas as 16 rotas com atalho `G+letra`.
2. **Criação** — Novo lançamento, Nova transferência, Novo compromisso, Nova conta, Nova nota fiscal.
3. **Ações em selecionados** (contextual a lista com seleção): Categorizar em lote, Mudar responsável, Excluir, Exportar.
4. **Ações de tela atual** (contextual): em `/compromissos` "Marcar X como paga" se houver item focado; em `/acerto` "Fechar acerto"; em `/relatorios` "Salvar preset" e "Exportar".
5. **Trocar escopo** — Pessoal / Empresa / Tudo (visível apenas para admin).
6. **Trocar mês ativo globalmente** — "Ir para Maio", "Ir para Junho", "Ir para Junho 2025".
7. **Configurações rápidas** — Tema (sempre dark, mas pronto pra futura troca), Densidade (compacto/confortável), Idioma.
8. **Atalhos diretos** — "Rodar acerto agora", "Importar CSV", "Fazer backup".

**Comportamento:**
- Fuzzy search (digite "marc map" → encontra "Marcar Mapfre como paga").
- `↑↓` navega resultados, `Enter` executa, `Esc` fecha.
- Resultados agrupados por categoria com headers `--text-xs` uppercase.
- Atalho de teclado exibido à direita de cada item quando existir.
- Histórico de 5 ações recentes aparece no topo se input vazio.
- Ações destrutivas (Excluir) pedem confirmação antes de executar.

**Por que isso muda a vida do Iremar:** Helena prevê que em 2 semanas Iremar para de usar a sidebar para navegar e usa Cmd+K para tudo. É o mesmo padrão que ela vê em qualquer usuário de Linear/Superhuman — sidebar vira mapa visual, Cmd+K vira teclado.

---

## Densidade vs respiro

Regra única: **quanto mais analítico, mais denso. Quanto mais decisório, mais respiro.**

| Contexto | Densidade | Tipografia | Padding | Exemplos |
|---|---|---|---|---|
| **Número-âncora / Hero** | Respiro máximo | `--text-3xl` 64/72 700 | 32–48 | Patrimônio líquido, Saldo i2, Acerto |
| **KPI cards** | Respiro médio | Valor `--text-xl` 32, label `--text-xs` | 24 | Receita MTD, Margem%, MRR |
| **Cards de conta** | Médio | Valor `--text-lg` 24, nome `--text-md` 18 | 20 | AccountCard, CardCreditoCard |
| **Formulários** | Médio | Inputs 40px altura, label `--text-sm` | gap 16 | /lancamentos/novo, /importar |
| **Listas / tabelas** | Denso máximo | Linha 36px, texto `--text-sm` 14/20 | 12 horizontal, 8 vertical | /lancamentos, /compromissos, /categorizar |
| **Sidebars / menus** | Denso | Itens 36px, texto `--text-sm` | 12 | Sidebar v2, dropdowns |
| **Tooltips / popovers** | Denso | `--text-xs` 12/16 | 8 | Hover hints, atalhos |

**Aumentar tipografia/spacing quando:**
- O elemento carrega uma decisão (hero, KPI primário, CTA destrutivo).
- O usuário vai parar para ler (empty state, confirmação modal).
- Há solidão visual proposital (login, primeiro acesso).

**Reduzir quando:**
- O usuário vai varrer (listas, tabelas, sidebars).
- O elemento é repetitivo (rows, chips, tags).
- Há mais valor em ver muitos itens do que em ler poucos.

**Regra de ouro Helena**: linha de tabela em desktop deve caber 22 linhas/viewport canônica (1440×900 menos chrome ~744px úteis ÷ 36 ≈ 20,6 ≈ 22 com header sticky). Se cabe menos, está respirando demais.

---

## Dashboard widgets desktop-only

Estes widgets **não aparecem em mobile** — surgem só a partir de ≥1280px, ocupando o espaço extra de 480px que sobra ao lado do AnchorHero principal ou na banda inferior:

1. **Sparkline 30d com tooltip por ponto** ao lado do número-âncora. 180×56. Hover revela "12 mai · saldo R$ 44.200" + scrubber vertical. Mobile só vê sparkline silenciosa.

2. **Mini bar-chart comparativo de 4 meses** abaixo da sparkline (mar-abr-mai-jun). 4 barras verticais 12px width, altura proporcional, cor de responsável. Mobile não tem.

3. **Gráfico de área "Patrimônio líquido 12 meses"** na banda inferior (full-width × 240px). Empilhado por conta com toggle "Empilhado/Total/Linhas". Hover crosshair. Mobile mostra só o valor consolidado.

4. **"Heatmap" semanal de gastos** — grid 7×8 (8 semanas) com células coloridas por intensidade de gasto. Hover mostra "Sem 23 · R$ 1.840 · 12 transações". Inspiração GitHub contributions. Mobile não cabe.

5. **"Próximos 7 dias" timeline horizontal** — barra horizontal 100% width × 60px com marcos de compromissos. Hover mostra detalhe. Substitui parte do BillsCard em desktop com visão temporal. Mobile mantém apenas lista.

6. **"Distribuição por responsável" donut** — 160×160 mostrando % de gastos do mês por Iremar/Juliana/Casal/i2. Hover isola fatia. Mobile só vê valores em texto.

7. **"Top 5 categorias do mês" bar horizontal** — 5 barras horizontais com valor à direita. Mobile mostra como lista vertical scrollável.

8. **"Velocidade de gasto" gauge** — semicírculo mostrando "Gasto X% acima/abaixo do mês passado neste dia do ciclo". Indicador para Iremar saber se está acelerando demais. Desktop-only por exigir espaço lateral de explicação.

9. **"Recorrências detectadas" lista** — pequeno painel listando padrões recorrentes detectados automaticamente ("Netflix R$ 39,90 mensal", "Salário fixo dia 5"). Permite confirmar/ignorar inline. Mobile não tem.

10. **"Próximo acerto" mini-card** — sempre visível em col lateral, mostra "Iremar deve R$ 380 à Juliana · fecha em 6 dias" com mini-progress do ciclo. Mobile vê isso em card separado abaixo, desktop mantém persistente.

Estes widgets respeitam o **Princípio 1 (Hierarquia Radical)**: não competem com o número-âncora, vivem em colunas laterais ou em banda inferior. Tipografia secundária (16–24px max), cores dessaturadas. O número-âncora continua reinando absoluto em 64/72 700.

---

## Encerramento

Desktop é teclado, hover, multi-pane e Cmd+K. A sidebar agrupa por natureza (Diário/Análise/Sistema), a top bar carrega escopo + breadcrumb + invocação, o canvas usa 12 colunas com seriedade. Listas densificam até 22 linhas/viewport. Formulários viram modal centrado. Detalhe vira drawer 480px à direita preservando contexto. Categorização em desktop é teclado puro — I/J/C/2 — porque Helena sabe que ninguém clica 32 botões se pode digitar 32 teclas.

O número-âncora cresce para `--text-3xl` 64/72, ganha sparkline expandida, delta comparativo, e — apenas em desktop — vizinhos analíticos (heatmap, donut de responsável, gauge de velocidade) que viram instrumento de varredura. Mobile vê o número. Desktop vê o número e seu ecossistema.

A gramática de cor (azul/rosa/âmbar/ciano) continua inviolável. Glass permanece restrito a sidebar, top bar, modais e drawers. Cards de conteúdo sólidos. Bold só no número-âncora. Inter Tight com tabular-nums em todo valor monetário. O dark mode OLED é a base imutável.

Helena entrega o desktop assim: para Iremar abrir no domingo de manhã, sentar com café, e em três cliques ou três atalhos saber se Junho fecha no positivo. Para Juliana — quando excepcionalmente abrir o MacBook — categorizar 32 itens em 90 segundos com J/J/C/I/I/C. Para ambos: nada de scroll desnecessário, nada de coluna ociosa, nada de procurar onde clicar.

A próxima fase pode entrar em componentes específicos (StatusBadge, PageHeader, TransactionRow) ou em padrões de motion mais finos. A base de layout desktop está posta. Densidade calibrada, atalhos canônicos, multi-pane padrão, Cmd+K como espinha dorsal.

Linear-style, mas com a calma do i2.
