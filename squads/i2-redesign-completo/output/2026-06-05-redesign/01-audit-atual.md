# 01 — Auditoria do Estado Atual do i2 Finance

**Persona:** Marcus, Senior Product UX Strategist
**Data:** 2026-06-05
**Escopo:** Redesign completo das 16 telas + componentes core
**Filosofia desta auditoria:** descrever o que está, sem inventar feature. Mapear fricção real para Iremar (admin desktop+mobile) e Juliana (operator mobile-only).

---

## 1) Tabela das 16 telas

| Rota | Função | Hierarquia visual atual | Fricções observadas (1-3) |
|---|---|---|---|
| `/login` | Auth Supabase email/senha | Tela mínima, centralizada, sem header/nav. | (1) Sem branding/contexto i2; (2) sem indicação de qual perfil o usuário está logando; (3) sem recuperação visível de senha. |
| `/dashboard` (Admin) | Visão geral fatura + acerto + bills | Header com toggle de perfil + saudação → QuickActions (4 cards) → BillsCard+IncomeCard (grid 2) → Hero fatura+Donut → Equação Iremar+Juliana → Casal+i2 → Juliana transferir+Entradas → últimos lançamentos | (1) Densidade extrema — 9 blocos verticais empilhados, scroll de tela sem fim em mobile; (2) Hero "Total da fatura" desce abaixo de QuickActions e Bills, perdendo destaque do número-âncora; (3) DonutSplit some abaixo de `xl:` — em md/lg o "distribuição" some sem aviso. |
| `/dashboard` (Operator) | Visão pra Juliana — sua parte | Header rosa → QuickActions → BillsCard → Hero+barra% → Equação Juliana → CTA grande "+ Adicionar" → 2 atalhos (Categorizar+Acerto) → últimos lançamentos | (1) CTA "+ Adicionar" duplica o "+" do BottomNav (redundância); (2) atalhos Categorizar+Acerto repetem o que já está em QuickActions+Drawer "Mais"; (3) hero usa `julianaRatio` como largura da barra, mas a label diz só "Sua parte: X%" — falta âncora de valor absoluto. |
| `/lancamentos` | Lista filtrada de transações | Header com período + botão Novo → Filtros (chips) → TransactionList | (1) Header não revela total filtrado em destaque (vem dentro de `<Filtros>`); (2) muitos filtros (mes, responsavel, origem, ordem, min, max, q) — sem persistência visual clara dos ativos; (3) sem agrupamento por dia/mês na lista, scroll vira parede. |
| `/lancamentos/[id]` | Edit transação | Form padrão | (1) Compras de cartão travam valor/data/conta sem explicar visualmente; (2) faltam breadcrumbs/contexto de "qual fatura"; (3) ações primárias (Salvar/Excluir) podem ficar fora de viewport mobile. |
| `/lancamentos/novo` | Nova transação | Form padrão | (1) Acessado via FAB rosa/azul mas sem diferenciação visual de tipo (despesa × receita × transferência); (2) defaults pouco inteligentes (conta padrão, data hoje); (3) keyboard mobile cobre Salvar. |
| `/compromissos` | Contas fixas recorrentes | Header → seletor mês → tabs entidade (Todas/Fam/i2) → pills status (Todos/A pagar/Pagos/Atrasados) → pills ordenação → Seção Boleto/PIX → Seção Cartão | (1) **3 níveis de filtro empilhados** no header (mes + entidade + status + ordem) — barulho visual brutal em 375px; (2) Boleto e Cartão separados sem total consolidado mensal no topo; (3) status do cartão depende de heurística por descrição (`slice(0,8)`) — falsos positivos visíveis. |
| `/contas` | Patrimônio + saldos por conta | Header → cartão Patrimônio glass → grids por kind (checking/company/credit_card/investment) | (1) **Bug**: a variável `scope` é lida em linha 73 antes de ser declarada em linha 103 (`accounts.filter(... scope)` antes do `const scope = await ...`) — code smell sério, pode resultar em `undefined`/erro; (2) split percentual de fatura ocupa espaço numa página que deveria ser sobre saldos; (3) ícones de banco existem mas não há saldo projetado / variação mês. |
| `/empresa` | DRE i2 + faturamento + compromissos PJ | Header → seletor mês → faturamento+pro-labore → compromissos PJ → notas fiscais | (1) Redirect para `/dashboard` se escopo=pessoal — UX confusa (o link existe no menu mas dispara redirect); (2) DRE não tem visualização gráfica/comparativa de meses; (3) form de faturamento fica no meio da página, sem destaque. |
| `/empresa/notas` | NFs vinculadas a recebimentos | Lista | (1) Profundidade nav (Drawer > Empresa > Notas) sem breadcrumb; (2) sem visual diferenciado entre NF emitida × paga × pendente; (3) acesso quase exclusivo pelo Drawer "Mais" — atalho de QuickActions só aparece em escopo empresa. |
| `/categorizar` | Bulk-categorizar transações unassigned | Header com 2 stats (count + total) → lista `CategorizarItem` | (1) `CategorizarItem` provavelmente expande inline — sem swipe rápido típico do mobile categorizador; (2) "Voltar" cai no dashboard sem rastro do progresso; (3) sem batch-apply ("aplicar a todos do mesmo merchant"). |
| `/acerto` | Fechamento Iremar × Juliana | Resumo do split | (1) Acessível em 2 lugares (sidebar + drawer) mas sem CTA óbvio quando há saldo devedor; (2) sem histórico de acertos passados; (3) regra do dia 13 (fechamento) não é visualmente clara. |
| `/mes` | Resumo do mês fechado (operator) | Resumo | (1) Operator-only mas título "Fechamento" colide com cartão "Acerto Casal" na linguagem; (2) sem comparação mês-anterior; (3) baixo uso provável dado redundância com /relatorios. |
| `/transferencias` | Movimentações entre contas | Lista + form | (1) Conceito pouco aparente no dashboard — usuário precisa lembrar que existe; (2) sem ícones direcionais (de → para) padronizados; (3) acesso só pela sidebar (admin) ou drawer. |
| `/relatorios` | Gráficos / resumos | Cards de relatório | (1) Sem hierarquia entre relatórios (qual é o "principal"?); (2) provável carga lenta sem skeleton; (3) sem export/share. |
| `/importar` | Upload CSV cartão + Drive | Header → ImportClient → Histórico | (1) Heurística `/^NU_\d/i` esconde extratos NU_* — usuário não tem visibilidade do filtro; (2) histórico mostra "X inseridas / Y dup." mas sem link pra ver o que entrou; (3) sem indicador de "última atualização Drive". |
| `/backups` | Snapshots pré-mudança | Lista | (1) Função critical-path mas escondida no drawer; (2) sem labels claros sobre "o que esse backup contém"; (3) sem dry-run/preview do restore. |

---

## 2) Inconsistências entre telas

**A. Headers divergem.** Cada tela reinventa o header:
- Dashboard usa `pt-14 md:pt-8 pb-6` com radial-gradient específico por papel (azul Iremar / rosa Juliana).
- Lançamentos e Compromissos usam `pt-14 pb-4 border-bottom` + radial mais sutil.
- Contas usa `pt-14 pb-6 border-bottom` (sem o `pb-4` dos outros).
- Categorizar usa `pt-14 md:pt-8 pb-5` com radial amber.
- Importar usa `pt-14 pb-5` puro, sem radial-gradient.
A altura, paddings e presença de gradient não seguem regra única.

**B. Botão "Novo/Nova" inconsistente.**
- `/lancamentos`: `+ Novo` (masculino).
- `/compromissos`: `+ Nova` (feminino).
- `/lancamentos/novo` (FAB do BottomNav): só `+` sem rótulo.
- DashboardOperator usa CTA gigante `+ Adicionar lançamento` separado do FAB.
Mesma ação (criar), 4 tratamentos visuais distintos.

**C. Filtros pill — duas linguagens.**
- `/compromissos` usa pills arredondados com background colorido por status.
- `/lancamentos` usa `<Filtros>` (subcomponente) com lógica própria.
Não existe um `<FilterPill>` compartilhado — cada tela reimplementa.

**D. "Glass" como const inline vs. classe `.glass`.**
O CSS já define `.glass`, mas DashboardAdmin, DashboardOperator e ContasPage redefinem inline `const glass = { background: rgba(255,255,255,0.06), ... }`. Resultado: blur de 20px duplicado, e a tipagem manual diverge da definição CSS (rgba 0.06 vs `var(--surface-2)`).

**E. Cores por responsável — uso parcial das CSS vars.**
- Dashboard usa `var(--accent-iremar)`/`var(--accent-juliana)` na maioria dos lugares.
- BottomNav hardcoda `#3b82f6` para "+", e `#60a5fa` para active dot.
- Sidebar hardcoda os mesmos valores em `accentActive` ao invés de usar var.
Quando o squad pediu "azul=Iremar", a tabela de tokens existe, mas só ~60% dos componentes consultam.

**F. Spacing.** Páginas usam `space-y-3` (dashboard) vs `space-y-5` (compromissos) vs `space-y-2.5` (categorizar) sem critério aparente. Cards usam `rounded-2xl` em alguns lugares e `rounded-3xl` em outros (hero), também sem regra escrita.

**G. Status visual de "pago/atrasado".**
- BillsCard tem `STATUS_CFG` com `overdue/today/upcoming`.
- Compromissos tem `STATUS_CONFIG` com `paid/overdue/today/upcoming`.
Duas tabelas, dois nomes, cores quase iguais mas não idênticas (overdue rgba 0.10 vs 0.12).

**H. ProfileScopeToggle posicionamento.**
- Dashboard (Admin/Operator): no header, ao lado do badge de role.
- Sidebar: card próprio com label "Visualizando".
- Drawer "Mais": dentro do drawer, label "Visualizando".
Mesmo controle, 3 posições/tratamentos.

---

## 3) Top 10 problemas em ordem de impacto

**#1 — Densidade vertical do Dashboard Admin em mobile.**
*Telas:* `/dashboard` (admin).
*Problema:* 9 blocos verticais (QuickActions, alerta, A pagar, A receber, Hero fatura, Equação Iremar, Equação Juliana, Casal+i2, Transferir+Entradas, lançamentos). Em 375px, scroll de >2500px só pra ver tudo. O número-âncora "Total da fatura" só aparece após 3-4 viewports.
*Impacto Iremar:* abrir o app pela manhã e levar 3+ scrolls pra "qual o estado das contas hoje?" — a métrica de glance está enterrada.
*Sugestão inicial:* promover Hero da fatura para topo (antes de QuickActions), e converter blocos secundários em tabs ou accordion.

**#2 — Bug latente em `/contas/page.tsx`.**
*Telas:* `/contas`.
*Problema:* uso de `scope` em linha 73 antes do `const scope = ...` da linha 103. Em runtime, TS deveria barrar, mas como é `await` server component a ordem real depende do bundler. Risco real de crash ou filtro silenciosamente errado.
*Impacto Iremar:* pode estar vendo lista de contas filtrada errada agora sem perceber.
*Sugestão:* mover `getEffectiveScope` para o topo antes de qualquer filtro.

**#3 — Filtros empilhados em `/compromissos`.**
*Telas:* `/compromissos`.
*Problema:* 4 níveis de filtro (mes + entidade + status + ordenação) consumindo 1/3 da viewport mobile antes da primeira conta aparecer.
*Impacto Iremar:* fricção pra ação simples ("o que paguei hoje?"); *Impacto Juliana:* pra ela quase nunca importa entidade — sempre é pessoal/casal.
*Sugestão:* colapsar entidade e ordenação atrás de botão "Filtros" com badge de count; manter só mês + status no topo.

**#4 — Redundância de CTAs e atalhos.**
*Telas:* `/dashboard` (operator + admin).
*Problema:* QuickActions tem "Cartão", "A pagar", "A receber", "Contas". BottomNav tem "+", "Lançamentos", "A Pagar", "Início", "Mais". DashboardOperator ainda adiciona CTA "+Adicionar" + 2 cards "Categorizar/Acerto". Mesmas ações apresentadas 2-3x.
*Impacto Juliana:* paralisia de escolha — qual é o canônico? Aprendizado custoso.
*Sugestão:* QuickActions é a "barra principal" do dashboard; BottomNav só tem nav (sem duplicar "A Pagar"); remover CTAs redundantes do corpo.

**#5 — Heurística frágil de "fatura paga" em `/compromissos`.**
*Telas:* `/compromissos`, `/dashboard`.
*Problema:* status do compromisso de cartão de crédito é inferido por `description.slice(0, 8)` matching em txDescriptions — falsos positivos quase certos (ex: "Netflix" e "Net 2024").
*Impacto Iremar:* status verde "pago" mostrado quando não foi pago — perda de confiança no app.
*Sugestão:* vincular compromisso ↔ transação por `recurring_id` (já existe em monthly_obligations) também para crédito.

**#6 — Inconsistência de tokens (glass, accents, status).**
*Telas:* todas.
*Problema:* CSS tem tokens (`--accent-iremar`, `.glass`, `--surface-2`), mas ~40% dos componentes hardcodam rgba ou hex.
*Impacto:* trocar a paleta exige tour por 16 arquivos. Bugs visuais sutis (overdue 0.10 × 0.12).
*Sugestão:* eliminar `const glass = {...}` inline; criar `<StatusBadge>` único; lint-rule banindo `rgba(255,255,255,0.0X)` solto.

**#7 — Headers de página sem identidade compartilhada.**
*Telas:* todas.
*Problema:* cada página reinventa pt/pb/gradient. Não há `<PageHeader>` componente.
*Impacto:* sensação de "app montado por etapas". *Iremar mobile* sente o "salto" de altura ao navegar entre telas.
*Sugestão:* `<PageHeader title subtitle action accent>` único, consumido por todas as 16 rotas.

**#8 — DashboardOperator sem âncora numérica em destaque.**
*Telas:* `/dashboard` (operator).
*Problema:* Hero diz "Sua parte: 42% da fatura" mas o valor absoluto (R$ X) está na Equação 1 scroll abaixo. Juliana precisa fazer cálculo mental.
*Impacto Juliana:* glance impossível — precisa scroll pra responder "quanto devo este mês?".
*Sugestão:* colocar `julianaPart` (valor absoluto) ao lado de `totalFatura`, em destaque equivalente.

**#9 — Status do cartão em `/categorizar` sem mecanismos de batch.**
*Telas:* `/categorizar`.
*Problema:* até 100 transações, cada uma com seu `CategorizarItem`. Sem "aplicar mesmo responsável aos próximos 5 do Mercado Livre".
*Impacto Juliana:* tarefa repetitiva. Categorizar 80 lançamentos = 80 cliques.
*Sugestão:* swipe gestures (esquerda=Iremar, direita=Juliana, manter=Casal) + "aplicar a similares" como soft-suggest.

**#10 — Toggle de perfil em 3 lugares sem hierarquia.**
*Telas:* dashboard header, sidebar, drawer "Mais".
*Problema:* mesmo controle replicado. Em mobile + sidebar + drawer = usuário não sabe qual é o "oficial".
*Impacto Iremar:* troca de escopo é ação importante (Pessoal/Empresa/Tudo) — multiplicada visualmente, parece menor do que é.
*Sugestão:* canônico no header (compact pill) + remoção do sidebar/drawer (ou degradar pra atalho de teclado em desktop).

---

## Resumo executivo

A base é **sólida tecnicamente** (tokens CSS, perfis, scope, ciclo de fatura, glassmorphism consistente em cor) mas **acumula débito visual** por evolução incremental: cada feature adicionou seu header próprio, seus pills próprios, seu CTA próprio.

O redesign deve priorizar três pilares:
1. **Hierarquia clara em mobile** — Hero antes de listas, ações secundárias colapsadas, sem scroll vertical infinito.
2. **Tokens enforçados** — eliminar inline-styles em favor de variantes (`<Card variant="glass">`, `<StatusBadge status="overdue">`, `<PageHeader accent="iremar">`).
3. **Eliminação de redundância** — uma ação, um caminho canônico. QuickActions é o painel, BottomNav é navegação, Drawer é overflow.

A próxima fase deve atacar #1, #2 (bug) e #3 antes de tocar polimento. O bug do `/contas` deve sair como hotfix imediato.
