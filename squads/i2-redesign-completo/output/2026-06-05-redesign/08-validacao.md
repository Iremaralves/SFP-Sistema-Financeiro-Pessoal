# 08 — Validação Brutal (Iremar Validator)

**Persona:** Iremar — dono, usuário, pagador da conta da Vercel.
**Data:** 2026-06-07
**Filosofia:** bullshit detector ligado. Eu não sou cliente de agência. Eu sou quem abre o app no Uber, no banheiro, no domingo de manhã com café. Se a proposta não me faz a vida mais fácil, é decoração. Decoração é caro.

---

## 1) Verdict final

**Vale parcialmente — vale a Onda 1 e ~70% da Onda 2; o resto é tentação.** A justificativa cabe em uma frase: o app já funciona, o que dói é densidade do dashboard mobile, bug do `/contas`, filtros do `/compromissos` e categorização chata pra Juliana — tudo o mais é "ficou bonito". Se eu fizer só o que ataca esses quatro pontos, ganho 80% do valor com 30% do trabalho. Se eu comprar o pacote inteiro (Cmd+K, sparkline, heatmap, confetti, drag-and-drop reorder de contas, swipe-de-Tinder em categorizar, sankey de acerto, command palette contextual com "marcar Mapfre paga"), eu viro mantenedor de um produto que ninguém pediu e paro de viver minha vida.

---

## 2) 3 propostas que VALEM

**(a) AnchorHero no topo do dashboard mobile com o número que importa.** Esse é o ponto. Hoje eu abro o app de manhã e preciso scrollar pra ver o saldo da i2 ou o total da fatura. É absurdo. Se em 2026 eu ainda preciso rolar três viewports pra responder "quanto tenho?", a culpa não é minha, é da hierarquia. O Princípio 1 (Hierarquia Radical) do output 03 é a única coisa que muda meu dia de fato. Vale isso sozinho.

**(b) Hotfix do bug do `scope` no `/contas/page.tsx`.** Isso nem é redesign. Isso é "tem código quebrado em produção e ninguém percebeu". Linha 73 lendo variável declarada na linha 103 é o tipo de coisa que TS deveria ter pego. Tem que sair antes de qualquer pincelada. Não é negociável.

**(c) Filtros colapsados no `/compromissos` + StatusBadge unificado.** Quatro níveis de filtro empilhados consumindo 1/3 da viewport mobile pra eu responder "o que paguei hoje?" é castigo. Manter só mês + status no topo, jogar entidade e ordenação atrás de um botão "Filtros" com badge de count resolve. E consolidar STATUS_CFG (Bills) com STATUS_CONFIG (Compromissos) em um componente único elimina o bug visual de 0.10 vs 0.12 rgba que ninguém vê mas que prova que o app foi montado por etapas. Tarefa pequena, impacto grande, débito técnico zerado.

---

## 3) 3 propostas que SÃO BULLSHIT

**(a) Cmd+K command palette com ações contextuais ("Marcar Mapfre como paga").** Helena é boa, mas ela trabalhou em Linear. No Linear faz sentido — engenheiros vivem no teclado o dia inteiro. Eu sou empreendedor que abre o app no celular 80% do tempo, e quando abro no MacBook é domingo de manhã com calma. Eu não vou decorar `G+D`, `N+T`, `Cmd+Shift+P`. Vou clicar no menu. Construir command palette, manter palette, fazer palette saber o que é "contextual" (a Mapfre vencendo hoje aparece como ação sugerida — sério?) é trabalho infinito pra um usuário só: eu. Custa caro, eu não uso, e quando uso uma vez por mês perdi a memória do atalho. Corta.

**(b) Swipe-de-Tinder em `/categorizar` mobile com card stack.** A Juliana é minha esposa, não jogadora de Tinder. Card grande de 200px com swipe esquerda/direita/tap-hold significa: 1 tela = 1 item. Hoje ela vê 8 itens por tela e clica. Pra categorizar 32, com cards stackados, ela faz 32 swipes vs 32 cliques — mesma coisa, mas perdendo a visão de "quanto falta visualmente". Lista densa com swipe-para-ação inline (estilo Mail iOS) resolve sem virar app de namoro. E o confetti ao zerar — sério? Ela vai categorizar isso 3x por semana pelo resto da vida. Confetti vira ruído depois da 3ª vez.

**(c) Heatmap GitHub-style, sankey de acerto, gauge de velocidade de gasto, donut de distribuição por responsável, mini-bar comparativo de 4 meses, sparkline expandida com scrubber, e mais 5 widgets desktop-only no dashboard.** Isso é dashboard de BI corporativo. Eu tenho 1 empresa, 1 esposa, 1 cartão Casal e 1 i2. Eu não preciso de "velocidade de gasto vs ciclo anterior expressa em gauge semicircular". Eu preciso saber se tem saldo pra pagar a Mapfre. Cada widget desses é: dado pra buscar, gráfico pra renderizar, edge case pra tratar (mês sem dado, mês com 1 dia, mês incompleto), e bug pra caçar quando o number-anchor não bate com o donut. Helena entregou um lookbook do Stripe, não um app pro meu uso real.

---

## 4) 5 riscos reais

**(1) Inter Tight muda altura de linha em ~todo lugar.** Mesmo a Onda 1 sendo "invisível", trocar fonte global em app com 16 telas e 60+ componentes vai cortar algum texto, vai mudar ellipsis em algum chip, vai estourar algum botão. Vai. O Diego escreveu "se algum card cortou texto ou sumiu linha, ajustar antes do merge" — isso quer dizer 2-3h só revisando viewport mobile + desktop em cada rota. E provavelmente vou achar um bug em produção 3 dias depois.

**(2) Refatoração de `TransactionRow` quebra o card de "últimos lançamentos" no dashboard.** O Diego mencionou. Esse componente é usado em 3+ lugares (Lançamentos, Dashboard Admin, Dashboard Operator, /mes provavelmente também). Mexer nele com prop dual de densidade (56px mobile / 36px desktop) é convite a regressão silenciosa em um dos consumidores.

**(3) Juliana abre o app e não acha alguma coisa.** Mover o ProfileScopeToggle, mudar QuickActions de grid 2×2 pra fileira horizontal scrollável, trocar "+ Adicionar lançamento" no corpo por só o FAB do BottomNav — cada uma dessas decisões individualmente faz sentido, somadas viram "cadê aquele botão verde grande?". Juliana não vai ler release notes. Ela vai me perguntar no WhatsApp, e cada pergunta dela é -1 ponto de confiança no app.

**(4) Swipe gestures em listas conflitam com pull-to-refresh e scroll vertical.** Em mobile mid-tier (Android dela), gesto horizontal mal-calibrado pode ser interpretado como scroll vertical e vice-versa. Threshold de 40% da largura pra ativar é teoria — na prática vai ter falso-positivo, ela vai categorizar errado, vai tentar desfazer, vai xingar.

**(5) Trabalho infinito de manutenção.** 17 componentes novos (PageHeader, AnchorHero, Sparkline, QuickActions v2, BillsCard v2, IncomeCard v2, StatusBadge, FilterBar, CompromissoRow, WeekGroupHeader, TransactionRow, DayHeader, SwipeableRow, TransactionDrawer, AccountCard, CardCreditoCard, AccountSheet, CommandPalette, Toast, Skeleton, EmptyState, KeyboardCheatSheet, BulkApplyCallout, Sheet base, e por aí vai). Cada um vira ponto de manutenção quando o Tailwind v5 sair, quando o Next 16 quebrar algo, quando eu quiser mudar a cor do âmbar. Hoje tenho ~20 componentes. Passar pra ~40 dobra a superfície de bug.

---

## 5) Escopo enxuto — fim de semana de Iremar (80% do valor)

Se eu tenho sábado de manhã + domingo à tarde, faço **isto e só isto**:

**1. Hotfix do bug do `scope` em `/contas/page.tsx`.** 15 minutos. Não pode esperar. Sai como commit isolado, hoje à noite.

**2. AnchorHero no `/dashboard` (admin + operator) — só o componente, sem sparkline, sem delta, sem mini-bar-chart.** Só o número grande no topo, label discreta, e pronto. Move QuickActions pra baixo. Resolve o problema #1 do audit em 2-3h.

**3. ProfileScopeToggle só no header. Remove de sidebar e drawer.** 30 minutos. Elimina redundância sem inventar nada.

**4. Filtros do `/compromissos` colapsados — mês + status no topo, resto atrás de botão "Filtros".** 2h. Resolve problema #3.

**5. StatusBadge unificado** entre BillsCard e CompromissoRow. 1h. Resolve débito técnico, deixa o app coerente.

**6. Borda esquerda 2px colorida nas linhas de Lançamentos e Compromissos**, removendo chips redundantes de "Iremar/Juliana". 2h. Recupera espaço horizontal, mais bonito sem inventar.

**7. Swipe-pra-marcar-paga em `/compromissos` (só direita = pago, com toast "Desfazer").** 2h. É a única microinteração que me poupa tempo de verdade — eu marco 8-12 contas pagas por mês.

Total: ~10h de trabalho concentrado. **Fica de fora:** Inter Tight (não vale o risco neste escopo), Cmd+K, command palette, sparkline, delta, heatmap, widgets desktop-only, swipe-Tinder em categorizar, confetti, count-up animado, drag-and-drop, multi-pane drawer, sankey de acerto, calendário em compromissos, presets de relatório, drop-zone full-window, gauge de velocidade, mini-bar comparativo, atalhos `G+letra`/`N+letra`, e o cheat sheet de keyboard.

Tudo o que ficou de fora pode ser feito **depois**, individualmente, se eu sentir falta. Mas **eu duvido que vou sentir falta de >2 itens dessa lista**. E os que eu sentir, faço sob demanda, não preventivamente.

---

## 6) Pergunta aberta — o que ainda preciso decidir

**Qual é o número-âncora certo do `/dashboard` admin quando `scope=Tudo`?** Os outputs disseram "Saldo consolidado" e "Patrimônio líquido" e "Total da fatura" em momentos diferentes, e isso me incomoda. Cada um desses números responde uma pergunta diferente: saldo consolidado responde "quanto tenho líquido agora?", patrimônio responde "quanto vale meu balanço?", fatura responde "quanto vou pagar dia X?". Eu abro o app 5x por dia — qual dessas perguntas eu faço mais? Honestamente, é "tem saldo na i2 pra pagar X?" ou "quanto tá a fatura do cartão?". Patrimônio líquido eu olho 1x por mês, no domingo. Então o número-âncora não deveria ser fixo — deveria depender do escopo. Em `scope=Pessoal`, anchor = saldo consolidado PF + fatura cartão Itaú. Em `scope=Empresa`, anchor = saldo i2. Em `scope=Tudo`, anchor = ??? (e essa é a pergunta).

Outra coisa que preciso decidir antes de começar: **vou de fato fazer isso em 1 fim de semana, ou vou parcelar nas 3 ondas do Diego?** Se parcelar, preciso aceitar que vou abrir 6-8 PRs em 2 semanas e que vou ter o app em estado "meio redesign" no meio do caminho — o que pode ser pior pra Juliana do que viver com o app atual. Talvez melhor: faço o escopo enxuto (item 5 acima) tudo de uma vez em um fim de semana, valido por 2 semanas, e só aí decido se algo mais vale a pena.

Última decisão pendente: **a Juliana sabe que vou mexer no app?** Porque mover botão sem avisar é receita pra ela achar que quebrou. Aviso prévio + screenshot do "antes e depois" no WhatsApp resolve em 1 minuto.

---

## Encerramento

O squad entregou trabalho de alta qualidade. Marcus mapeou bem, Olivia escreveu manifesto que eu até concordo, Tarik e Helena especificaram com competência, Diego planejou execução decente. Mas a soma das partes ultrapassa o problema. **O i2 Finance não tem problema de design — tem 4 pontos de fricção pontuais.** Atacá-los pontualmente entrega o resultado. Redesenhar tudo entrega bonito + débito.

Vou de Onda 1 + recortes da Onda 2. O resto fica como referência. Se em 2 meses eu reler isso e quiser Cmd+K, sei onde encontrar o doc.

Não é bullshit dar input ambicioso. É bullshit aceitar tudo o que pediram.
