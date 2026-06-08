# 05 — Mobile Specs (375–430px)

**Persona principal:** Tarik — Mobile UX Engineer (ex-PicPay, ex-Inter)
**Mentora:** Sofia — Senior Visual Designer (refino visual)
**Data:** 2026-06-07
**Escopo:** especificação tela-a-tela do i2 Finance em mobile, considerando alcance do polegar, gestos nativos, e densidade calibrada do princípio 3.
**Premissa-base:** o polegar de Iremar/Juliana é o ponteiro. Tudo o que é "primário" mora abaixo da linha imaginária de 60% da tela. Tudo o que é leitura mora acima. Modal central é exceção; bottom sheet é regra.

Geometria de referência: viewport 375×812 (iPhone 13 mini é o pior caso útil). Header sticky 56px, BottomNav 64px + safe-area-bottom (16–34px). Sobra "janela de leitura" de ~660px no pior caso. FAB central do BottomNav fica a ~80px do bottom — alcance natural do polegar direito e esquerdo.

---

## Convenções globais

- **Header sticky** (56px): backdrop-filter blur 24px sobre `--surface-glass`. Conteúdo: logo i2 compacto à esquerda, `ProfileScopeToggle` (pill compacta 32px) ao centro-direita, avatar 32px ao far-right. Em telas com back, logo cede lugar ao ícone `<Back/>` 44×44 tappable.
- **BottomNav** (64px + safe-area): glass com `--shadow-glass`. 5 slots — [Início] [Lançamentos] [+ FAB] [Compromissos] [Mais]. FAB central elevado +12px, 56×56, círculo, `--accent-iremar` default (azul Iremar) ou `--accent-juliana` se sessão = Juliana. Ícone "+" 24px. Ripple suave em tap.
- **Touch target mínimo:** 44×44 (Apple HIG). Itens de lista podem ser 56px de altura mas área tappable estende às bordas. Ícones-only devem ter padding pra compor 44×44.
- **Tipografia mobile:** número-âncora `--text-2xl` (48/56, weight 700). Títulos de card `--text-md` (18/26, 600). Corpo `--text-sm` (14/20, 500). Microcopy `--text-xs`.
- **Padding lateral global:** 16px (`--space-4`). Em cards aninhados, padding interno 16px também. Conteúdo nunca cola na borda do device.
- **Safe areas:** `env(safe-area-inset-bottom)` no BottomNav e em sheets; `env(safe-area-inset-top)` no header. Notch e home indicator nunca sobrepõem conteúdo crítico.
- **Pull-to-refresh:** todas as telas-lista (Lançamentos, Compromissos, Categorizar, Compromissos, Contas) recebem PTR nativo com spinner customizado (3 pontos i2 pulsando azul→rosa→âmbar→ciano).
- **Long-press = menu de contexto** em itens de lista. Haptic-like feedback (vibração 10ms) ao abrir.
- **Skeleton states** durante load: blocos cinza `--surface-2` com shimmer 1.4s linear-infinite. Skeleton respeita layout final pra evitar reflow.

---

## 1) /dashboard (Admin — Iremar)

**Layout mobile (375px):**
- Header sticky (56px): logo + ProfileScopeToggle (Pessoal/Empresa/Tudo) + avatar.
- **Hero do número-âncora** (160px): full-width card sólido `--surface-1`, padding 20px. Label "Saldo consolidado · Junho" em `--text-xs --text-tertiary`, valor "R$ 47.320" em `--text-2xl` (48px, 700, tabular-nums), abaixo sparkline 30d (altura 40px) + delta "+R$ 3.120 vs maio" em verde. Cor do delta varia (verde/vermelho). Animação de entrada `emphasized` 320ms (count-up dos dígitos).
- **QuickActions** (84px): fileira horizontal scrollável (Nubank pattern). 4 atalhos de 80×80: Cartão (com mini-progress de fatura), A pagar (badge "3" vermelho), A receber, Transferir. Scroll snap-x. Padding lateral 16px com peek do 5º card (insinuação de scroll).
- **BillsCard** ("A pagar — próximos 7 dias"): card sólido `--surface-1`, title "A pagar" + chip count "3", lista de 3 itens com borda esquerda 2px colorida (âmbar=i2, azul=Iremar). Cada item 56px. CTA secundário "Ver todos (12)" no rodapé do card.
- **IncomeCard** ("A receber"): mesmo padrão, com cor de status verde.
- **Cards de saldo por conta**: 2×2 grid de cards pequenos (Itaú PF, Inter i2, Cartão Itaú, Cartão Inter). Cada um 140px altura, com nome, saldo e mini-sparkline.
- Espaço inferior: 80px de respiro pro BottomNav não cortar o último card.

**Componentes-chave:** `AnchorHero`, `QuickActions`, `BillsCard`, `IncomeCard`, `AccountCard`, `ProfileScopeToggle`, `Sparkline`, `DeltaBadge`.

**Touch targets críticos:**
- QuickAction card: 80×80 (ok, > 44).
- ProfileScopeToggle pill: cada segmento 56×32 — área expandida via padding tappable pra 56×44.
- Itens de BillsCard: 56px altura, full-width tappable.
- Avatar header: 32×32 visual mas wrapper 44×44.

**Gestures:**
- Pull-to-refresh no scroll do dashboard.
- Swipe horizontal nos QuickActions.
- Tap em qualquer card de conta → drawer inferior com extrato resumido (30d).
- Long-press em item de BillsCard → menu: "Marcar como paga · Editar · Adiar 1 semana".

**Mudanças vs atual:**
- AnchorHero substitui os dois cards desencontrados de saldo/fatura no topo.
- QuickActions vira fileira horizontal scrollável (era grid 2×2 que comia 240px).
- ProfileScopeToggle migra de cima da página para dentro do header sticky.
- Mantém cores de responsável por conta (azul/âmbar) e estrutura de BillsCard/IncomeCard.
- Remove duplicidade de CTAs grandes "Novo lançamento" no corpo (vive só no FAB).

---

## 2) /dashboard (Operator — Juliana)

**Layout mobile:**
- Header sticky (56px): logo + avatar (Juliana NÃO vê ProfileScopeToggle — escopo é fixo "Pessoal").
- **AnchorHero "Sua parte da fatura"**: card sólido com cor de accent rosa sutil na borda esquerda 2px. Valor "R$ 1.247" em 48px + label "42% da fatura · fecha em 8 dias" abaixo. Barra de progresso fina 4px mostrando posição no ciclo.
- **CategorizeCallout**: card de 120px com fundo `--accent-juliana-soft` (rgba 12%), ícone, texto "32 compras esperando você", CTA inline "Categorizar agora →". Aparece SÓ quando count > 0; some quando zerado e dá lugar a empty state ilustrado "Tudo em dia".
- **Lista "Últimas categorizadas hoje"**: 5 itens 56px com cor de quem ficou. Footer "Ver histórico completo".
- **Próximo acerto**: card compacto "Próximo acerto: 13/06 · Iremar te deve R$ 380".

**Componentes-chave:** `AnchorHero`, `CategorizeCallout`, `TransactionRow` (compact), `AcertoPreviewCard`.

**Touch targets críticos:** CTA "Categorizar agora" — botão 48px altura full-width interno do card. Itens da lista 56px.

**Gestures:**
- Pull-to-refresh.
- Tap em "Categorizar agora" leva direto pro fluxo de categorização (jornada B otimizada).
- Swipe horizontal no card "Próximo acerto" → revela ação "Ver detalhes".

**Mudanças vs atual:**
- Remove o CTA gigante "Novo lançamento" do corpo (Juliana raramente cria, e quando cria usa o FAB do BottomNav).
- AnchorHero foca em "sua parte da fatura" — único número que importa pra ela.
- CategorizeCallout substitui o card seco de "X pendentes".
- Empty state ganha ilustração quando zera.
- Mantém ausência de ProfileScopeToggle (escopo é decisão de admin).

---

## 3) /lancamentos

**Layout mobile:**
- Header sticky (56px): back + título "Lançamentos" + ícone filtro à direita (com dot de badge se filtros ativos).
- **Sub-header sticky** (72px): número-âncora "R$ 12.430 · 87 lançamentos" + chips de filtro removíveis (Mês · Junho · Responsável: Iremar · Conta: Inter i2). Chips com `×` de remoção 24×24.
- **Lista densa** de TransactionRow 56px: avatar/ícone categoria 32px + descrição (1 linha, ellipsis) e meta-linha "categoria · conta · data" 12px + valor à direita (tabular-nums, 16px 600, vermelho se débito). Borda esquerda 2px colorida por responsável.
- **Group headers** entre dias: "QUI · 5 jun · R$ –320" sticky-mini, altura 32px.
- FAB do BottomNav cobre a função "+".

**Componentes-chave:** `TransactionRow`, `FilterChip`, `DayHeader`, `FilterSheet`.

**Touch targets críticos:**
- TransactionRow: 56px, full-width tappable.
- FilterChip com `×`: 32px altura mas wrapper 44×44 pro chip e 44×44 pro `×` (separados).
- Ícone de filtro no header: 44×44.

**Gestures:**
- Pull-to-refresh.
- **Swipe direita em TransactionRow** → revela ação "Marcar paga" (verde). Swipe completo executa direto com toast "Desfazer".
- **Swipe esquerda em TransactionRow** → ação "Editar" (azul) e "Excluir" (vermelho) reveladas.
- Long-press → menu de contexto com Editar, Duplicar, Mudar responsável, Excluir.
- Tap simples → vai pra `/lancamentos/[id]` full-screen.
- Tap no ícone filtro → bottom sheet de filtros sobe 75% da tela.

**Mudanças vs atual:**
- Linha vira borda 2px colorida (substitui chip "Iremar/Juliana" repetido por linha — recupera 60px de largura).
- Filtros viram chips removíveis no sub-header em vez de modal separado.
- Group headers por dia diminuem trabalho de leitura.
- Swipe gestures substituem botões inline de ação.
- Mantém densidade 56px e tabular-nums nos valores.

---

## 4) /lancamentos/[id] (Detalhe)

**Layout mobile (full-screen):**
- Header (64px): back + título "Detalhe" + ícone de overflow `⋯` (44×44) com menu Excluir/Duplicar.
- **AnchorHero** (140px): valor grande "R$ –380,00" em 48px (vermelho se débito), categoria e merchant abaixo, chip de status (Pago/Pendente).
- **Bloco de metadados** (cards sólidos empilhados): Conta · Data · Responsável · Categoria · Parcela X de Y · Observações. Cada linha 56px, tap abre sheet de edição daquele campo.
- **Travas visuais**: campos travados (compras de cartão) mostram ícone cadeado e fundo `--surface-2` mais escuro com tooltip "Editar na compra original".
- **Anexos** (se houver): grid 3×N de thumbs 100×100 (recibos, NF). Tap abre lightbox.
- **Botão "Excluir"** no rodapé com cor `--status-danger` outline, 48px altura, full-width.

**Componentes-chave:** `AnchorHero`, `MetaRow`, `LockedFieldChip`, `AttachmentGrid`, `EditFieldSheet`.

**Touch targets críticos:** MetaRow tap area 56px full-width. Botão Excluir 48px. Overflow `⋯` 44×44.

**Gestures:**
- Swipe-down a partir do header → fecha (volta pra lista). Conflict-safe: só aciona se scrollY=0.
- Tap em MetaRow → sheet inferior de edição do campo (com handle drag-down).

**Mudanças vs atual:**
- Layout vertical sem grid lateral (mobile = stack).
- Campos travados visualmente diferenciados (resolve confusão de #5 do audit).
- Excluir sai do header pro rodapé (zona segura, menos tap acidental).
- AnchorHero unifica leitura primária.
- Anexos virám grid em vez de lista.

---

## 5) /lancamentos/novo

**Layout mobile (sheet inferior — Tarik prefere sheet aqui):**
- Sheet sobe 85% da tela com handle drag-down 4×40px no topo.
- Título "Novo lançamento" + `×` 44×44 à direita.
- **Tabs segmentadas** (44px): Despesa · Receita · Transferência. Cor da tab ativa segue tipo (vermelho/verde/ciano).
- **Form vertical**:
  - Valor (input grande 48px texto, tabular-nums, foco automático ao abrir, teclado numérico).
  - Conta (select que abre sheet aninhada com lista de contas + saldo).
  - Categoria (select que abre sheet com categorias agrupadas e busca).
  - Data (chip "Hoje" default, tap abre sheet com calendário compacto).
  - Responsável (segmented control 3-way: Iremar/Juliana/Casal — Iremar admin vê 4 opções incluindo i2).
  - Descrição (textarea 2 linhas).
  - Toggle "Recorrente" → revela campos extras (frequência, fim).
- **CTA fixa no rodapé do sheet** (acima safe-area): botão primário "Adicionar" 56px, cor por tipo. Disabled até valor e categoria preenchidos.

**Componentes-chave:** `BottomSheet`, `SegmentedTabs`, `AmountInput`, `SelectSheet`, `DatePickerSheet`, `ResponsibleToggle`, `PrimaryButton`.

**Touch targets críticos:**
- Tabs: 44px altura.
- Inputs: 56px altura.
- CTA "Adicionar": 56px.
- Handle drag-down: área expandida 44×44 (visual 4×40 mas hit-area maior).

**Gestures:**
- Drag-down no handle ou em qualquer ponto do header → fecha sheet (com confirmação se há dados preenchidos).
- Swipe lateral entre tabs (Despesa/Receita/Transferência).
- Teclado numérico aparece automaticamente no input de valor.

**Mudanças vs atual:**
- Vira bottom sheet em vez de página fullscreen (preserva contexto da tela debaixo).
- Tabs segmentadas no topo substituem dropdown de tipo.
- Foco automático no valor (Iremar entra escrevendo valor em 1s).
- CTA fixa no rodapé sempre visível (não some com scroll).
- Defaults inteligentes (conta mais usada, data=hoje).

---

## 6) /compromissos

**Layout mobile:**
- Header sticky: back + "Compromissos" + ícone filtro.
- **Sub-header**: número-âncora "R$ 8.940 · 12 a pagar em Junho" + tabs "A pagar · Pagos · Todos".
- **Lista agrupada por semana**: "Semana 23 · 02–08 jun" como group header, itens 64px abaixo. Cada item: ícone categoria 36px + descrição + dia da semana + valor + StatusBadge (Atrasado/Vence hoje/Em dia).
- Borda esquerda 2px colorida por responsável.
- Itens "vence hoje" ganham fundo `--status-warning-soft` sutil.
- FAB do BottomNav adiciona compromisso.

**Componentes-chave:** `CompromissoRow`, `StatusBadge`, `WeekGroupHeader`, `Tabs`.

**Touch targets críticos:** Row 64px. Tabs 44px. Filtro 44×44.

**Gestures:**
- Pull-to-refresh.
- **Swipe direita** → "Marcar paga" (verde) com toast "Desfazer".
- **Swipe esquerda** → "Adiar 7 dias" (âmbar) e "Excluir" (vermelho).
- Long-press → menu completo.

**Mudanças vs atual:**
- Group headers por semana ajudam a antecipar concentrações de gasto.
- Swipe pra marcar paga substitui botão "Pagar" inline em cada card.
- Tabs A pagar/Pagos/Todos substituem filtro genérico.
- Borda colorida em vez de chip de responsável.
- Mantém StatusBadge mas com 3 estados unificados (consolida STATUS_CFG do audit).

---

## 7) /contas

**Layout mobile:**
- Header sticky: back + "Contas" + ícone `+` adicionar conta.
- **AnchorHero**: "Patrimônio líquido: R$ 47.320" + delta vs mês anterior.
- **Lista de contas** como cards sólidos 96px:
  - Avatar/logo do banco 48px + nome ("Inter i2") + tipo ("Conta corrente PJ") + cor de accent na borda esquerda.
  - Saldo grande à direita em tabular-nums.
  - Mini-sparkline 30d 60×24 entre nome e saldo.
- **Seção "Cartões"** abaixo: cards de cartão de crédito com progress de fatura (barra 4px) e "fatura atual R$ X · vence dia Y".
- **Seção "Investimentos"** (futuro/colapsada): card "Tesouro Selic R$ 2.000".

**Componentes-chave:** `AccountCard`, `CardCreditoCard`, `Sparkline`, `AnchorHero`.

**Touch targets críticos:** AccountCard 96px full-width tappable. Botão `+` 44×44.

**Gestures:**
- Pull-to-refresh.
- Tap em conta → bottom sheet com extrato resumido (30 últimos lançamentos) + ações "Editar · Ver extrato completo · Reconciliar saldo".
- Long-press → menu rápido com "Reconciliar saldo · Editar · Arquivar".

**Mudanças vs atual:**
- AnchorHero "Patrimônio líquido" como número macro.
- Sparkline em cada conta.
- Separação visual cartões vs contas correntes.
- Tap abre sheet em vez de navegar (preserva contexto).
- Mantém cor de accent por conta.

---

## 8) /empresa

**Layout mobile:**
- Header sticky: back + "Empresa · i2 Soluções" + escopo trava em "Empresa" (ProfileScopeToggle visualmente desabilitado aqui, com tooltip "Esta tela é específica de PJ").
- **AnchorHero "DRE Junho"**: Receita / Despesas / Resultado em 3 linhas grandes. Resultado em 48px com cor (verde/vermelho).
- **Tabs**: Resumo · Notas · Fluxo.
- **Resumo**: cards de KPI (Faturamento MTD, Margem %, MRR projetado).
- **Notas pendentes**: callout "3 notas pra emitir · R$ 12.500" com CTA "Ver notas →".
- **Próximas obrigações fiscais**: lista com DAS, DARF, etc.

**Componentes-chave:** `DREHero`, `KPICard`, `NotasCallout`, `ObligationRow`.

**Touch targets críticos:** Tabs 44px. CTA "Ver notas" 44px. ObligationRow 56px.

**Gestures:**
- Pull-to-refresh.
- Swipe horizontal entre tabs.
- Tap em KPI → sheet com decomposição.

**Mudanças vs atual:**
- Vira tela de DRE puro (resolve fricção #22 do audit).
- Toggle visualmente travado evita confusão.
- KPIs ganham hierarquia em vez de cards homogêneos.
- Mantém cor âmbar i2 como signature.
- Notas viram callout no topo (não escondida em sub-rota difícil).

---

## 9) /empresa/notas

**Layout mobile:**
- Header sticky: back + "Notas fiscais" + filtro.
- **Sub-header**: "8 emitidas · R$ 24.300 · Junho" + tabs "A emitir · Emitidas · Canceladas".
- **Lista de NotaRow** 72px: número da nota + cliente + valor + status badge + data emissão.
- FAB do BottomNav muda contextualmente pra "+ Nova nota" (cor âmbar).

**Componentes-chave:** `NotaRow`, `StatusBadge`, `Tabs`, `ContextualFAB`.

**Touch targets críticos:** NotaRow 72px. Tabs 44px. FAB 56×56.

**Gestures:**
- Swipe direita → "Marcar como recebida".
- Swipe esquerda → "Cancelar nota" (com confirmação).
- Long-press → menu completo.
- Tap → detalhe da nota full-screen.

**Mudanças vs atual:**
- Tabs estado consolidam visão.
- FAB contextual (âmbar) sinaliza "Nova nota" sem precisar de CTA separado.
- Lista densa, sem cards inflados.

---

## 10) /categorizar

**Layout mobile (tela mais crítica do Juliana flow):**
- Header sticky: back + "Categorizar" + contador "32 pendentes".
- **AnchorHero compacto** (88px): "R$ 2.890 sem categoria" + barra progress fina mostrando "0 de 32 feitas". Atualiza em tempo real `emphasized` 320ms.
- **Card-stack tipo Tinder** OU **lista swipeable**:
  - Opção A (recomendada por Tarik): cards full-width 200px com merchant grande, valor, data, categoria sugerida (chip pré-preenchido).
  - Cada card oferece 3 ações por gesto:
    - **Swipe direita** → Juliana (rosa).
    - **Swipe esquerda** → Iremar (azul).
    - **Tap-hold 300ms** → Casal (ciano).
  - Indicadores visuais durante drag: lateral revela cor + label do responsável.
- **Sticky footer-CTA "Categorizar similares"** quando há padrão detectado: "Aplicar 'Casal/Transporte' a 3 Ubers similares →".
- Empty state final: ilustração + "Tudo em dia · Próxima fatura fecha em 8 dias".

**Componentes-chave:** `SwipeCard`, `CategoryChipSuggested`, `BulkApplyCallout`, `EmptyStateIllustrated`.

**Touch targets críticos:**
- SwipeCard: 200px altura, swipe ativa a partir de 40% da largura.
- Tap-hold detection: 300ms.
- CategoryChip: 44px altura para edição rápida.

**Gestures:**
- Swipe horizontal direção responsável.
- Tap-hold → Casal.
- Tap simples no card → expande inline mostrando metadados (hora, parcela, link "histórico do merchant").
- Tap no chip de categoria → sheet de seleção de categoria.
- Pull-to-refresh recarrega.

**Microinteração:** **Confetti sutil** ao categorizar a última (item 32 → empty state) — partículas nas 4 cores (azul/rosa/âmbar/ciano) caindo por 1.2s. Haptic-like via animação de scale-bounce no contador "0 pendentes".

**Mudanças vs atual:**
- Swipe gestures substituem botões radio "Iremar/Juliana/Casal".
- Categoria sugerida pré-preenchida (ML de padrões anteriores).
- Bulk apply em padrões repetidos (3 Ubers, 5 mercados).
- Confetti + empty state ilustrado celebram conclusão.
- AnchorHero com barra progress motiva ("0 de 32").

---

## 11) /acerto

**Layout mobile:**
- Header sticky: back + "Acerto" + ícone histórico.
- **AnchorHero**: "Iremar deve R$ 380 à Juliana · fecha 13/06" — valor em 48px com cor accent ciano (Casal). Sub-label "Acerto de Maio". Avatar duplo (Iremar + Juliana) sobreposto.
- **Detalhamento**: lista de itens que compõem o acerto (compras Casal, divisões, ajustes manuais). Cada linha 56px com descrição + valor + responsabilidade %.
- **Histórico**: card colapsado "6 acertos anteriores · ver histórico".
- **CTA primária**: "Fechar acerto agora" — botão 56px full-width cor ciano.

**Componentes-chave:** `AcertoHero`, `AcertoItemRow`, `AcertoHistoryCard`, `PrimaryButton`.

**Touch targets críticos:** CTA "Fechar acerto" 56px. AcertoItemRow 56px. Avatar duplo 44×44 wrapper.

**Gestures:**
- Tap em item da composição → sheet com detalhe (pode editar % de responsabilidade).
- Tap no histórico colapsado → expande inline.
- Pull-to-refresh.

**Mudanças vs atual:**
- AnchorHero deixa claro quem deve a quem (resolve confusão direcional do audit).
- Lista de composição transparente (auditável).
- CTA "Fechar acerto" único e dominante.
- Cor ciano (Casal) como signature da tela.

---

## 12) /mes

**Layout mobile (operator):**
- Header sticky: back + "Mês fechado · Maio" + select mês (chip "Maio ▾").
- **AnchorHero**: "Sua parte: R$ 1.180 · 38%" — espelha o número-âncora do dashboard mas pra mês passado.
- **Resumo categórico**: 5 cards horizontais scrolláveis (Mercado, Transporte, Lazer, Casa, Outros) com valor e % do total.
- **Lista completa de lançamentos do mês**: TransactionRow 56px, sem filtros editáveis (mês trava).
- CTA "Ir pro acerto deste mês →" no rodapé.

**Componentes-chave:** `AnchorHero`, `CategoryScrollCard`, `TransactionRow`, `MonthSelectChip`.

**Touch targets críticos:** MonthSelectChip 44px. CategoryScrollCard 120×100. CTA 56px.

**Gestures:**
- Swipe lateral nos category cards.
- Tap no chip "Maio ▾" → sheet com lista de meses anteriores.
- Tap em category card → filtra a lista abaixo (highlight).

**Mudanças vs atual:**
- Foca em "sua parte" (Juliana).
- Category cards scrolláveis dão visão rápida.
- Tela read-only (não edita mês fechado).

---

## 13) /transferencias

**Layout mobile:**
- Header sticky: back + "Transferências" + filtro.
- **Sub-header**: total transferido no mês + chip "Junho".
- **Lista de TransferRow** 64px: De → Para (com setas) + valor + data + status. Borda colorida ciano (sempre, transferência é interna).
- FAB BottomNav abre sheet "Nova transferência".

**Componentes-chave:** `TransferRow`, `NovaTransferenciaSheet`.

**Touch targets críticos:** TransferRow 64px. Filtro 44×44.

**Gestures:**
- Swipe esquerda → "Excluir" (com confirmação).
- Tap → detalhe da transferência full-screen.
- Pull-to-refresh.

**Mudanças vs atual:**
- Vira filtro/atalho de Lançamentos (rota mantida).
- Visual de setas "De → Para" em vez de duas linhas separadas.
- Sheet de nova transferência com defaults inteligentes (conta mais usada).

---

## 14) /relatorios

**Layout mobile:**
- Header sticky: back + "Relatórios" + select período.
- **Tabs**: Visão Geral · Categorias · Fluxo · Comparativo.
- **Visão Geral**: AnchorHero com "Resultado do período" + 4 KPIs em 2×2 (Receitas, Despesas, Patrimônio Δ, Taxa de poupança).
- **Gráfico principal**: área chart 280px altura (receitas vs despesas mês a mês, 6 meses).
- **Top 5 categorias**: lista horizontal scrollável.
- **CTA "Exportar PDF"** no rodapé.

**Componentes-chave:** `Tabs`, `KPIGrid`, `AreaChart`, `CategoryRanking`, `ExportButton`.

**Touch targets críticos:** Tabs 44px. CTA Exportar 56px. KPI card 160×100.

**Gestures:**
- Swipe horizontal entre tabs.
- Pinch no gráfico → zoom temporal.
- Tap em ponto do gráfico → tooltip com valor exato.
- Pull-to-refresh.

**Mudanças vs atual:**
- Tabs organizam visualizações (em vez de tela única longa).
- Charts mobile-otimizados (300px altura max, tooltips touch-friendly).
- Export como ação primária (relatórios são para compartilhar).

---

## 15) /importar

**Layout mobile:**
- Header sticky: back + "Importar extrato" + ícone help.
- **Estado 1 — Upload**: card central com ícone grande, "Arraste o arquivo OFX/CSV ou tap aqui pra escolher". Suporte: OFX, CSV, PDF.
- **Estado 2 — Processando**: progress bar + "Lendo 142 transações..." + cancel.
- **Estado 3 — Revisão**: lista de transações detectadas com toggle "incluir/ignorar" e tentativa de auto-categorização. Cada linha 56px.
- **CTA "Importar 138 transações"** sticky no rodapé.

**Componentes-chave:** `FileUploadCard`, `ProgressIndicator`, `ReviewRow`, `StickyPrimaryButton`.

**Touch targets críticos:** Upload card full-width 200px altura, tap em qualquer ponto. Toggle 44×24. CTA 56px.

**Gestures:**
- Tap → file picker nativo iOS/Android.
- Swipe esquerda em ReviewRow → "Ignorar" (cinza).
- Pull-to-refresh recarrega lista de revisão.

**Mudanças vs atual:**
- Three-state machine clara (Upload/Processando/Revisão).
- Sem stepper — tudo no mesmo flow contínuo.
- Auto-categorização visível antes de confirmar (transparência).

---

## 16) /backups

**Layout mobile:**
- Header sticky: back + "Backups".
- **AnchorHero**: "Último backup · há 3 horas" + ícone status (verde/âmbar/vermelho).
- **CTA primária**: "Fazer backup agora" — botão 56px full-width.
- **Lista de backups**: BackupRow 64px com data + tamanho + ícone download.
- **Configurações**: card com toggles "Backup automático diário", "Notificar falhas".

**Componentes-chave:** `BackupStatusHero`, `BackupRow`, `SettingsCard`, `PrimaryButton`.

**Touch targets críticos:** CTA 56px. BackupRow 64px. Toggle switches 44×24.

**Gestures:**
- Tap em backup → sheet com "Baixar · Restaurar · Excluir".
- Pull-to-refresh atualiza status.

**Mudanças vs atual:**
- Status hero indica saúde instantânea.
- Empty state ilustrado se nunca houve backup.
- Toggles ao invés de telas de config separadas.

---

## 17) /login

**Layout mobile:**
- Sem header (tela única).
- **Logo i2** centralizado no terço superior, 120×120 com glow sutil multicor.
- **Frase tagline**: "Sua mesa financeira a quatro mãos" em `--text-md` `--text-secondary`.
- **Form vertical centro-inferior** (acima da linha de polegar):
  - Input email (56px altura, ícone @).
  - Input senha (56px altura, ícone olho pra mostrar/ocultar).
  - Link "Esqueci minha senha" alinhado à direita.
- **CTA primária**: "Entrar" — botão 56px full-width azul Iremar default.
- **Divider** "ou" + botão "Continuar com Google" (48px outline).
- Rodapé: "Não tem conta? · Falar com Iremar" (operator não auto-cadastra).

**Componentes-chave:** `LogoMark`, `Input`, `PasswordInput`, `PrimaryButton`, `OAuthButton`.

**Touch targets críticos:** Inputs 56px. CTAs 56px. Link "Esqueci" 44px hit-area. Olho da senha 44×44.

**Gestures:**
- Autofill nativo (suporta password managers iOS/Android).
- Return no email pula pra senha; Return na senha submete.
- Pull-to-refresh desabilitado.

**Mudanças vs atual:**
- Logo recebe glow multicor sutil (azul + rosa + âmbar + ciano em radial) — primeira pincelada da identidade.
- Foco no fluxo curto: 2 campos + 1 botão.
- Continue with Google se houver OAuth (acelera login do Iremar).
- Form vive na metade inferior (zona do polegar).

---

# Padrões mobile-first do i2 (10 regras unificadoras)

1. **Polegar manda no layout.** Conteúdo de leitura ocupa o terço superior. CTAs primárias, FAB, ações decisivas vivem do meio pra baixo. Nenhuma ação destrutiva mora no canto superior direito sem confirmação.

2. **Bottom sheet > modal central.** Tudo o que cria/edita sobe de baixo com handle drag-down. Modal central só para confirmações destrutivas (Excluir, Sair) em desktop. Em mobile, mesmo essas viram sheet com botões empilhados.

3. **Swipe é gesto-padrão em listas.** Direita = ação positiva (pagar, atribuir Juliana, marcar feito). Esquerda = ação negativa ou secundária (editar, excluir, adiar). Tap-hold = ação especial (Casal, bulk apply). Long-press = menu de contexto.

4. **Touch target nunca abaixo de 44px.** Ícones-only ganham padding até compor 44×44. Inputs e CTAs primárias têm 56px (Iremar com luvas no inverno ou Juliana segurando café). Toggle switches 44×24 com hit-area expandido.

5. **Sticky headers são glass, conteúdo é sólido.** O glass do princípio 4 (estratificação) aplica-se ao header sticky, BottomNav e sheets. Cards de conteúdo são sólidos `--surface-1`. Glass por toda parte achata hierarquia.

6. **Borda esquerda 2px = responsável.** Cor de accent em listas (azul/rosa/âmbar/ciano) substitui chips repetidos. Recupera 60–80px de largura por linha, viabiliza densidade desktop sem reformular componente.

7. **Pull-to-refresh em toda lista; pull-to-dismiss em sheets.** Convenção iOS/Android consolidada — não inventar. PTR usa loader 3 pontos i2 (4 cores). Sheets fecham com drag-down do handle ou de qualquer ponto do header.

8. **Tabular-nums em todo valor monetário.** Números alinham vertical. Junto com Inter Tight, garante leitura de coluna em listas. Aplicar via CSS global em `.value` e em headers de tabela.

9. **Safe areas respeitadas.** BottomNav adiciona `env(safe-area-inset-bottom)`. Sheets que vão até o topo respeitam `env(safe-area-inset-top)`. Nunca conteúdo crítico sob notch ou home indicator.

10. **Skeleton screens sempre, spinners quase nunca.** Loading state respeita layout final pra evitar reflow. Shimmer 1.4s linear-infinite. Spinners só pra ações pontuais (botão em estado loading) — nunca pra page load.

---

# Microinterações sugeridas

- **Confetti ao zerar /categorizar**: partículas nas 4 cores caindo 1.2s, intensidade proporcional ao count que zerou (32 itens → 32 partículas). Som opcional (toggle em settings) — chime curto 200ms.

- **Haptic-via-motion** (web não tem Vibration API consistente, então simulamos com motion): scale-bounce 1.0→1.06→1.0 em 240ms `emphasized` em CTAs que confirmam ação importante (marcar paga, fechar acerto, importar).

- **Count-up no número-âncora**: quando o valor muda (saldo após transferência, parte da fatura após categorização), dígitos animam contando-up em 320ms `emphasized`. Visualiza a mudança em vez de "trocar de número silenciosamente".

- **Borda esquerda pulsa ao adicionar item**: ao criar novo lançamento, a borda 2px da nova linha pulsa 3x na cor do responsável (3 × 200ms) antes de assentar. Dá feedback "isso é o que você acabou de criar".

- **Sparkline desenha-se ao abrir**: no AnchorHero do dashboard, a sparkline 30d desenha-se da esquerda pra direita em 400ms `decel`. Reforça que é viva, não estática.

- **Toast com countdown visual**: toasts que tem "Desfazer" mostram barra fina inferior decrescente em 8s. Ao zerar, toast some. Antes disso, tap em "Desfazer" reverte ação.

- **Swipe reveal com cor antes da ação**: durante o drag de uma TransactionRow, fundo da row tinge gradualmente na cor da ação (verde/vermelho). Antes de soltar, usuário enxerga o que vai acontecer. Threshold de 40% da largura aciona; abaixo disso, volta com spring.

- **FAB pulsa com badge contextual**: quando há ação sugerida (ex: "13 lançamentos pra revisar"), FAB ganha dot vermelho 8px com count e pulso lento (scale 1.0→1.05 em 2s loop). Tap revela contexto.

- **Empty states ilustrados com micro-animação**: ilustração de "tudo em dia" tem um pequeno movimento idle (folha balança, planta respira) 4s loop — sinaliza que sistema está vivo, não congelado.

- **ProfileScopeToggle com transition de tela inteira**: ao trocar de Pessoal→Empresa→Tudo, conteúdo da tela faz crossfade 200ms com leve translate-y(8px). Cores de accent dos cards mudam smoothly em 320ms. Comunica "você está vendo outra camada do mesmo lugar".

- **Spinner de pull-to-refresh com 4 cores**: 3 pontos pulsando em sequência azul→rosa→âmbar→ciano. Reforça a marca em micro-momento de espera.

- **Number-anchor entra com weight transition**: ao carregar dashboard pela primeira vez, número-âncora começa weight 400 e transiciona pra weight 700 em 400ms `emphasized`. Sensação de "consolidando o valor".

---

## Encerramento

Mobile aqui não é "desktop menor" — é o terreno-padrão onde Iremar decide no Uber e Juliana categoriza no sofá. O polegar é o cursor. O sheet é o modal. O swipe é o clique. A densidade nasce de tipografia precisa, borda 2px colorida, e cards de 56–72px que cabem 6–8 por viewport sem aglomerar.

A hierarquia radical (Princípio 1) acomoda-se via AnchorHero em cada tela — sempre 140–160px no topo com o número que decide. A gramática de cores (Princípio 2) vira borda esquerda 2px em listas, signature de cor em CTAs contextuais, accent sutil em backgrounds de callout. O glass (Princípio 4) restringe-se a header sticky, BottomNav e sheets. Tudo o mais é sólido.

Próxima fase: traduzir cada uma dessas especificações em wireframes navegáveis, validando alcance de polegar e contagem de taps por jornada crítica.

Tarik aprova. Sofia refinaria os micro-easings. O usuário pega o celular no semáforo e o app não atrapalha.
