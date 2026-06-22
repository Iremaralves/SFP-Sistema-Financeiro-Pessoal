# Validação + Plano — Iremar (dono falando)

> Eu li o diagnóstico da Beatriz, a arquitetura do Marcus e o mockup do design. Abaixo é a
> minha opinião de quem vai usar isso toda semana, não de quem desenhou. Pergunta que guia
> tudo: **isso me ajuda a decidir, ou só é bonito?**

---

## 1. O diagnóstico bate com a minha realidade?

**Bate, e me surpreendeu para o lado bom.** O ponto mais importante o diagnóstico acertou
em cheio: **meu problema não é faltar dinheiro, é não sobrar.** Eu sempre tive a sensação de
que o mês "evapora" e não sabia onde. A frase "o aperto está todo no comportamento de consumo
via cartão, não na estrutura" é exatamente o que eu sentia mas não conseguia nomear. Isso já
justifica o trabalho.

Acertou também na separação **PF × PJ**. Para mim isso é inegociável — o que a i2 paga (DAS,
INSS, as assinaturas de Anthropic/Supabase reembolsadas) não pode entrar no meu bolso pessoal,
senão o Fator R vira bagunça e eu tomo decisão errada. Ver a i2 aparecer só como segmento
"reembolsado" na fatura, sem poluir minha folga, é precisamente como eu raciocino.

**O que faltou:**

1. **A folga +R$ 139 está fotografada num único mês.** Eu não sei se esse mês foi típico ou
   foi um mês ruim/bom. Falta o diagnóstico dizer "isso é a média dos últimos 3 ciclos ou é foto
   de junho?". Como dono, eu desconfio de número de um mês só — meu pró-labore é fixo, mas os
   **lucros (R$ 3.000)** variam com o caixa da i2. Em mês que a empresa aperta, esses 3.000
   podem não vir, e aí minha folga de R$ 139 vira -R$ 2.800. **Isso é o maior risco e o
   diagnóstico não destacou.** A renda de R$ 8.000 não é tão garantida quanto a tabela sugere.

2. **Não falou de 13º das escolas / sazonais.** Material escolar, matrícula, IPVA/IPTU que eu
   pago parcelado — tem meses que estouram. Um orçamento de PF com filhos em escola tem picos.

**O que exagerou (pouco):** a Farmácia (R$ 276) entrou na lista de "vazamentos", mas remédio
de filho não é vazamento, é fixo disfarçado. Concordo em monitorar, mas não tratar como
restaurante. O mockup já acertou ao deixar farmácia "sem teto" e neutra — então no fim ficou ok.

**Veredito do diagnóstico: 9/10.** Honesto, com número que fecha (o cross-check me deu
confiança), e me disse a verdade que eu não queria ouvir (R$ 726 em comer fora é meu, não da Ju).

---

## 2. O dashboard responde minhas perguntas NUM OLHAR?

Vou ser duro aqui, porque é o que importa.

**Contas — as 5 perguntas:**
- *Tem algo atrasado?* → SIM, grita no topo (Terapia atrasada). ✅ Num olhar.
- *Quais faltam pagar?* → SIM, BillsCard com "ainda falta R$ 320". ✅
- *Próximos pagamentos?* → SIM, lista ordenada por dia. ✅
- *Total do mês?* → SIM, R$ 4.960,79. ✅
- *Total da semana?* → SIM, o WeekStrip é exatamente o que me faltava. ✅ **Esse bloco sozinho
  já vale o projeto** — é a pergunta que eu fazia toda segunda-feira na mão.

**Cartão:**
- *Fatura atual / divisão / parte minha?* → SIM. A SplitBar + EquacaoCard ("1.582 + casal÷2 =
  2.899") responde sem eu calcular. Era o que mais me dava trabalho na mão. ✅
- *Posso usar o cartão?* → o semáforo no topo responde. ✅

**Onde AINDA me obriga a pensar/calcular:**

1. **O semáforo está mostrando R$ 0,00 / 116% / "Freia".** Isso me confunde no primeiro olhar:
   se já estourei o teto, por que ainda existe um número "disponível"? E o pior — esse estado
   "vermelho travado" é o estado de **fim de ciclo**, quando não dá mais para fazer nada.
   No dia 3 do ciclo eu preciso ver "pode gastar R$ 1.800 ainda". **O mockup só mostra o pior
   caso.** Preciso ver os dois estados (começo de ciclo verde, fim vermelho) pra confiar.

2. **A folga "+R$ 139" e a folga "~R$ 415 se frear" aparecem em blocos diferentes** (HealthVerdict
   e NudgeCard). Eu tenho que ligar os dois na cabeça. Não é num olhar — é num olhar e meio.

3. **O WeekStrip mostra R$ 100 mas o BillsCard diz "falta R$ 320".** Onde estão os outros R$ 220?
   (é a Terapia atrasada, que não está "nesta semana" porque já venceu). Faz sentido na lógica,
   mas **bate o olho e parece inconsistente.** Atrasado precisa aparecer no WeekStrip também, ou
   o número da semana precisa dizer "+ R$ 220 atrasado".

---

## 3. A ajuda de gestão está clara e acionável?

**Sim — e é a melhor parte.** O que transforma isso de "planilha bonita" em "assistente":

- **HealthVerdict "Frear ou fazer mais dinheiro?"** responde a pergunta que eu de fato faço
  como dono. E responde certo: *frear, não fazer mais.* Isso me poupa de ir atrás de mais
  faturamento (esforço alto) quando a alavanca é cortar comer fora (esforço baixo).
- **Fixo × Variável** com "o controlável é o menor" — perfeito. Me tira a sensação de impotência:
  eu não preciso mexer em escola/poupança, só nos R$ 2.632.
- **NudgeCard "comer fora passou R$ 726, segura e a folga triplica"** — isso é ouro. É um número,
  uma ação, um resultado. É o que eu pago um consultor pra dizer.
- **O saved-pill "você está poupando R$ 1.800"** — reforço positivo. Como dono eu vivo no medo;
  ver que estou guardando me tira o pânico e me deixa decidir com cabeça fria. Manter.

**O que ainda não está acionável o suficiente:**
- O NudgeCard mostra **uma** ação. Bom pra não me sobrecarregar, mas quero um jeito de ver as
  outras 2-3 sem perder o foco (um "+2 sugestões"). Coaching de verdade não dá só um conselho.
- Falta o **gancho do alívio futuro**: o diagnóstico fala que Airbnb/Gilberto/Thomas terminam em
  1-3 meses e liberam ~R$ 300. Isso é a melhor notícia do meu mês e **não aparece em lugar nenhum
  do mockup.** Quero ver "mês que vem sobra +R$ 300, manda pra reserva".

---

## 4. Veredito: aprovo pra virar código?

**APROVO.** A escada de decisão (alerta → posso gastar? → semana → fatura → saúde) é
exatamente como minha cabeça funciona, na ordem certa. Reaproveita 6 componentes, não pede
banco novo, e responde 13 de 13 perguntas com no máximo um detalhe de cálculo restante. Não é
bonito por ser bonito — cada bloco ganhou o lugar dele por frequência de uso. Vai pra código.

**Top 3 ajustes antes/durante (condição da aprovação):**

1. **Semáforo dinâmico, não travado no vermelho.** Tem que mostrar o "disponível" real do dia
   (teto − parte atual), verde no começo do ciclo. O estado de R$ 0/116% só pode aparecer quando
   for verdade. E reconciliar o número "disponível" com o estado da pill (não pode dizer R$ 0 e
   ter barra).

2. **Conectar folga atual ↔ folga potencial num só lugar**, e puxar o **alívio das parcelas que
   terminam** pra dentro (HealthVerdict ou um mini-card). É a informação que mais muda minha
   decisão de poupar vs. gastar.

3. **Atrasado tem que bater entre WeekStrip e BillsCard.** Hoje some da semana e confunde.
   Atrasado é mais urgente que "esta semana", não menos.

(Itens não-bloqueantes pro futuro: marcar a renda de lucros como "variável/estimada" pra eu não
me iludir com a folga; e validar a folga contra média de 3 ciclos quando tiver histórico.)

---

## 5. Plano de implementação em ondas

Princípio: **entregar valor de decisão na ordem em que eu uso**, reaproveitando o que já existe.
Onda 1 já tem que ser usável sozinha.

### Onda 1 — "O urgente e o da semana" (sai primeiro)
*O que mais mexe na minha rotina e exige menos código novo.*
- **AlertStack** (Zona 0): migra o alerta de unassigned (linha 145) pro topo + faixa de atrasado
  + faixa de teto estourado. Reusa estilo do alerta atual. **Inclui o ajuste #3** (atrasado
  reconciliado).
- **WeekStrip** (Zona 2): bloco novo, mas é só uma janela de data sobre `bills` que já existe.
  Baixo custo, altíssimo valor — é a pergunta órfã.
- **BillsCard**: reaproveitado quase intacto, já está pronto. Só recebe o WeekStrip como irmão.
- **Calibrar BudgetGauge** pro teto R$ 2.500 e **corrigir o estado dinâmico (ajuste #1)** — promover
  pra Zona 1 como herói. Esse é o coração; entra na Onda 1 mesmo dando trabalho.

*Resultado da Onda 1: abro o app e respondo "tá tudo bem? o que pago essa semana? posso gastar?"
— já vale ser publicado.*

### Onda 2 — "A fatura em detalhe"
*Consulta, não pânico — por isso depois.*
- **SplitBar** no mobile (substitui o donut, que já é `hidden xl`). 4 cores, reusa
  `calculateInvoiceSettlement` que já existe.
- **EquacaoCard** filtrado só pro Iremar no Pessoal (tira a da Juliana).
- **AnchorHero** rebaixado pra Zona 3 (já existe, só muda de lugar).

### Onda 3 — "A ajuda de gestão" (o coração do pedido)
*Transforma painel em assistente. Precisa dos 2 helpers novos em `@i2fin/core`.*
- **HealthVerdict + CommittedRing** + saved-pill: traduz a seção 4 do diagnóstico. **Inclui
  ajuste #2** (folga atual ↔ potencial + alívio das parcelas que terminam).
- **FixVarBreakdown**: precisa do `splitFixedVariable(transactions)`.
- **VariableThermometers**: precisa do `categoryTotals` + tetos por categoria (espelha `budget.ts`).
- **NudgeCard**: regra de "a 1 ação do mês" + o "+2 sugestões".

### Onda 4 — polimento e confiança no dado (não bloqueia)
- Marcar lucros como renda variável/estimada.
- Folga contra média de 3 ciclos (quando houver histórico de fechamentos).
- Remover de vez o Sparkline fake do mobile (dado falso quebra confiança — já estava na lista).
- QuickActions descem pra Zona 5.

**Por que essa ordem:** Onda 1 é o que eu uso todo dia e custa menos (reusa `bills`, sem helper
novo). Onda 3 é a mais valiosa estrategicamente mas é a que precisa de código novo testável —
deixo ela amadurecer com helpers bem feitos em vez de empurrar tudo junto. Cada onda é publicável
sozinha. **Começa pelos atrasados + semana + impacto do cartão, exatamente como deve ser.**
