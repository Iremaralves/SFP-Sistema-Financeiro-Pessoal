# 08 — Validação Brutal (na voz do Iremar)

**Squad:** i2-gestao-decisoria · **Persona:** Iremar Validator — dono de PME, paga 6 pessoas toda semana, hoje vive de planilha e cabeça
**Data:** 2026-06-08 · **Fase 8 de 8** · Lente: *isso me tira da planilha ou só fica bonito?*

> Li tudo, da Fase 1 à 7. Vou falar como falo: sem cerimônia. Eu não pago boleto de "modelo
> conceitual". Pago Pedro, Alana, Eduarda, Mayana, eu mesmo e a contadora — toda semana, no
> PIX, com dinheiro que tiro do cofre. A pergunta única é: **na próxima sexta eu fecho a
> folha no app em vez de na planilha?** Tudo abaixo é medido contra isso.

---

## (1) Verdict

Sim — isso resolve a minha dor, **se** a Onda 0 + Onda 1 saírem direito e na ordem certa. O
que me convence não é a beleza dos wireframes, é uma coisa só: alguém finalmente sentou e
modelou que **a folha da semana NÃO é compromisso fixo**. Esse era o erro que eu temia ver
de novo — cadastrar a Eduarda como R$ 500 cravado e me dar um número errado toda vez. A Fase
2 acertou em cheio ao separar "fixa recorrente" (DAS, INSS, pró-labore, lucros) de "rodada de
folha datada com itens variáveis", e a proração da Eduarda (500 × 21/31 = R$ 338,71) com os
dias guardados pra eu conferir de cabeça é exatamente o que me faz confiar no total. O número
R$ 6.338,71 nascendo da soma automática, e logo abaixo "Inter PJ tem R$ 2.000, faltam
R$ 4.338,71, tira R$ 4.000 da Caixinha e R$ 338,71 do NuInvest" — isso é literalmente o que
eu faço de cabeça hoje, com risco de errar. Se a tela me der esses dois números na sexta de
manhã, eu largo a planilha. O resto (receita de projeto, semáforo PF) é importante, mas não é
o que me tira da planilha **da folha** — e a folha é a dor que sangra.

---

## (2) O ESCOPO MÍNIMO que me tira da planilha

Em ordem. Se eu receber **só isto**, paro de usar planilha pra folha. Nada aqui é opcional;
tudo abaixo desta lista é incremento.

1. **Onda 0 inteira (migrations 0009 + 0010 + 0011) aplicada e os types regenerados.** Sem
   `payroll_runs`/`payroll_items` não existe folha; sem o `drop not null` no `occurred_on`
   não existe receita prevista; sem consertar o CHECK do `kind` o cadastro de projeto
   quebra. É chato porque não vejo nada na tela, mas é o alicerce. **E tem que ser feito com
   snapshot antes** (ver risco #1).

2. **Tela `/empresa/semana` com o número-âncora "TOTAL A DESEMBOLSAR".** O `text-6xl` em
   cima, somado automático dos itens. Esse é o número que eu procuro na planilha hoje.

3. **Cadastro de pessoa na folha com a proração ao vivo (o "mini-hero" da Fase 6 §5).**
   Campo `Pessoa`, `Valor cheio`, toggle `Prorar por dias?`, data de início → e o valor se
   formando na tela: "R$ 338,71 · 500 × 21 de 31 dias (desde 11/05)". Sem isso, a Eduarda é
   um erro garantido e eu volto pra planilha só por causa dela.

4. **O card do cofre com o cálculo do resgate.** "Inter PJ tem X → faltam Y → tira Z1 da
   Caixinha + Z2 do NuInvest." Isso é a segunda conta que faço de cabeça toda semana. Aqui eu
   aceito **só o número e a sugestão** no mínimo — o botão que pré-preenche a transferência é
   ótimo, mas se ele atrasar a entrega, me deem o número primeiro e eu transfiro na mão.

5. **Baixa pagamento-a-pagamento (dot tocável; swipe é bônus).** Marcar Pedro pago, Alana
   pago… com o rodapé "X de 6 pagos". É como eu controlo quem já recebeu sem me perder no
   meio. O dot que dá pra tocar resolve; o swipe da Onda 2 é conforto.

**Campos obrigatórios do item de folha, no mínimo:** colaborador, valor base, e (se prorar)
data de início + base de dias. `tipo` e `Fator R` **NÃO podem me travar toda semana** — que
venham com default e fiquem escondidos num "avançado". Já avisei isso na Fase 4b e foi aceito;
estou cobrando que se cumpra.

Repare no que **NÃO** está nesse mínimo: tabs de "A receber", form de projeto, semáforo PF,
DRE com folha. Tudo bom, nada disso me tira da planilha da folha. Por isso ficam de fora do
escopo mínimo.

---

## (3) Três coisas que VALEM muito (na minha voz)

1. **"A Eduarda finalmente não vai mais me dar dor de cabeça."** O dia que começou (11/05) e
   o app já me cospe R$ 338,71 com a conta mostrada do lado — isso me poupa de abrir
   calculadora e me dá segurança de que não estou pagando bolsa cheia pra quem entrou no meio
   do mês. E guarda os dias, então se a estagiária reclamar eu mostro a conta.

2. **"O cofre parou de ser adivinhação."** Hoje eu olho o saldo da Inter PJ, olho a folha,
   faço a subtração na cabeça e torço pra não esquecer um pagamento. O card que faz "total −
   saldo = resgate" e ainda me diz de qual cofre tirar primeiro (Caixinha antes do NuInvest,
   porque resgato na hora) é exatamente o meu raciocínio, só que sem o risco de eu errar a
   subtração às 8h da sexta.

3. **"O total da folha aparece sozinho e some o medo de esquecer alguém."** Adicionei seis
   pessoas, o número subiu de R$ 6.000 pra R$ 6.338,71 na minha frente. Não digitei o total,
   não confiei na minha memória. Se faltar gente, o número está menor do que eu espero e eu
   percebo na hora. Isso é o que a planilha me dava com fórmula — agora o app dá, e ainda
   separa o que conta no Fator R.

---

## (4) Três coisas que são PERFUMARIA (bonito, mas não muda meu dia)

1. **As três faixas de confiança no "A receber" (recebido verde / faturado âmbar / previsto
   cinza tracejado).** Conceitualmente certo, e eu entendo por que "previsto nunca vira
   saldo". Mas no meu dia real eu sei de cabeça o que cada cliente me deve e quando. Bonito
   pra um dashboard de investidor; não é o que me faz pagar a folha. Me dá uma lista simples
   com cliente/valor/data e tá ótimo — a estética das três cores pode esperar a Onda 4.

2. **A "ponte pro horizonte" no card vermelho de cofre insuficiente** ("entra R$ 4.000 do
   cliente X na quinta, esperar ou negociar prazo?"). Engenhoso, mas se meu cofre não cobre a
   folha eu já estou com um problema que nenhum texto na tela resolve — vou atrás do cliente
   ou seguro pagamento de qualquer jeito. O alerta vermelho "faltam R$ 1.000" basta; a
   sugestão sofisticada é enfeite.

3. **A barra de orçamento empilhada do semáforo PF** (fatura índigo + boletos azul-claro +
   sobra cinza, com três micro-legendas). A cor (verde/amarelo/vermelho) + o número
   "disponível" já respondem "posso passar o cartão?". A barra estratificada é capricho
   visual de designer. E sejamos honestos: **o semáforo PF inteiro é a minha menor dor** —
   tenho pró-labore fixo e divido a fatura com a Juliana. É a Onda 3, e tudo bem ser a Onda 3.

---

## (5) Cinco riscos reais

1. **A Onda 0 pode estar mais perigosa do que o plano admite — o banco vivo provavelmente já
   diverge dos arquivos de migration (drift).** Confirmei no SQL: `0001_schema.sql` define
   `accounts.kind check (... 'credit_card','checking','company')` — **`investment` NÃO está
   lá** (linha 28). Mas a Caixinha e o NuInvest já existem como contas de investimento no
   banco vivo (Task #7 fez isso). Ou seja: ou o CHECK foi alterado direto no banco fora das
   migrations, ou essas contas violam o constraint. O mesmo vale pra `income_records.kind`
   (linha 164 não tem `faturamento_i2`, mas o DRE usa). **Risco:** aplicar 0009 com
   drop-then-add por cima de um estado que ninguém sabe qual é. O pré-voo `select * from
   pg_policies` da Fase 4b é obrigatório, não opcional — e eu quero ver o resultado dele
   **antes** de qualquer `apply`. Se rodarem direto na prod sem snapshot e sem pré-voo, podem
   quebrar minha fatura e meu acerto com a Juliana, que são as únicas coisas que já funcionam.

2. **O DOWN do 0009 é destrutivo de propósito — ele APAGA receita.** Está escrito: `delete
   from income_records where status <> 'recebido'`. Faz sentido na teoria (são hipóteses sem
   caixa), mas no meu mundo significa que, se eu cadastrar 10 projetos previstos e por
   qualquer motivo precisarem reverter a migration, **eu perco os 10 cadastros** e nem fico
   sabendo. Quero um aviso explícito disso e o snapshot guardado, senão "reversível" vira
   propaganda enganosa.

3. **O total materializado (`total_a_desembolsar`) pode mentir pra mim depois de um
   restore.** A própria Fase 4b admitiu: é um cache mantido por trigger, e existe uma VIEW
   `payroll_runs_v` que é "a verdade". Se em algum restore o cache divergir do real, eu vou
   olhar um número errado na tela mais crítica que tenho e transferir o valor errado do
   cofre. O "badge de divergência" ficou pra Onda 4 — ou seja, na Onda 1 eu posso ter um
   número materializado sem ninguém me avisar se ele bateu com a soma real. Quero que a Onda 1
   **leia da VIEW ou compare**, não que confie cego no cache.

4. **Cadastro de folha pode virar trabalho repetido toda semana e me empurrar de volta pra
   planilha.** Se toda sexta eu tiver que redigitar Pedro, Alana, Mayana, Iremar, contadora —
   mesmo valor, mesma gente — do zero, a planilha (que eu só copio e colo) ganha de novo. O
   plano fala em "autocomplete de colaborador" e "defaults por pessoa", mas isso está na **Onda
   4**. Risco real: a Onda 1 entrega uma tela linda que dá preguiça de alimentar. Quero pelo
   menos um **"duplicar rodada anterior"** já na Onda 1, ou a folha continua sendo fricção.

5. **A baixa cria uma `transaction` na Inter PJ — e isso pode bagunçar o saldo que o próprio
   cofre usa.** O plano diz que marcar pago grava `payroll_items.pago` + cria saída na Inter
   PJ (pra alimentar o DRE, Gap G7). Certo. Mas o card do cofre calcula `deficit = total −
   saldo Inter PJ`. Se eu transfiro do cofre (entra dinheiro na Inter PJ) **e** dou baixa nos
   pagamentos (sai dinheiro da Inter PJ), preciso ter certeza de que o saldo que o cofre lê
   não conta a folha duas vezes nem entra em loop visual ("agora faltam mais ainda"). É um
   dado que eu não tenho na cabeça no momento e que, se calculado errado, me faz resgatar
   demais ou de menos. Esse fluxo precisa de teste de ponta a ponta antes de eu confiar.

---

## (6) Decisões que preciso tomar ANTES (não dá pra começar sem)

1. **Proração: dias corridos ou dias úteis?** A Fase 2 decidiu **dias corridos sobre o mês
   civil** (maio = 31), e eu **concordo** — é o que eu confiro de cabeça e não depende de
   tabela de feriado. Decisão tomada: **dias corridos, base = dias do mês de referência.**
   Mas registro: a Eduarda é bolsa de estágio; se um dia eu contratar CLT, a base muda pra 30
   avos. Quero que o campo `dias_base` fique editável pra esse caso, não cravado em "dias do
   mês".

2. **De onde vem o teto do orçamento PF?** A Fase 3 propôs teto fixo configurável (Opção A)
   com sugestão = média de 3 meses. **Aceito a Opção A como default.** Mas isso é decisão de
   Onda 3 — não trava a folha. Deixo decidido pra não voltar ao assunto: **teto fixo que eu
   digito, sugestão editável, sem derivar da renda no começo.**

3. **Cofre: tira da Caixinha ou do NuInvest primeiro?** Regra do squad: **Caixinha primeiro**
   (resgate instantâneo), NuInvest depois. **Confirmo** — é o meu comportamento. Mas quero o
   "editar resgate" pra inverter quando o NuInvest estiver rendendo algo que eu não queira
   resgatar. Isso o plano já previu; só estou cravando que a ordem-padrão é Caixinha.

4. **A contadora conta no Fator R ou não?** A Fase 2 marcou contadora como `servico` /
   `nao_folha` (não conta), com a ressalva "se for autônoma com RPA, conta". **Eu preciso
   confirmar com a minha contadora** se ela me emite NF como PJ ou se é RPA — porque isso muda
   o Fator R de verdade. **Decisão pendente do mundo real, não do app.** Até eu confirmar,
   deixa default `nao_folha` (mais conservador) e editável.

5. **Os R$ 3.000 que eu recebo na folha são pró-labore ou retirada de lucros?** A Fase 2 tem
   uma sutileza importante: pró-labore conta no Fator R, lucros não. Na folha-âncora os meus
   R$ 3.000 estão como pró-labore. **Mas eu já tenho pró-labore de R$ 5.000 fixo (dia 5) E
   retirada de lucros de R$ 3.000 fixo (dia 5).** Então o que são esses R$ 3.000 da folha
   semanal? Isso eu tenho que esclarecer **antes** de cadastrar, senão duplico remuneração e
   estouro meu Fator R com número errado. **Decisão minha, urgente, antes da Onda 1.**

6. **Aplico a Onda 0 na produção como? Branch do Supabase, staging, ou direto?** O plano
   pede "branch/cópia primeiro". Eu preciso decidir se tenho ambiente de staging de verdade
   ou se vou usar `create_branch` do Supabase. **Não aplico nada na prod sem ter essa
   resposta** — é a casa onde minha fatura e meu acerto já moram.

---

## (7) Recomendação final

**Faço a Onda 0 + Onda 1, parо, uso por duas ou três semanas reais de folha, e SÓ DEPOIS
decido o resto.** Não faço tudo de enfiada.

Justificativa, do meu jeito: o plano inteiro é 50–70h. A Onda 0 + Onda 1 é 20–28h — menos de
metade — e entrega **100% da dor que sangra**. A folha é semanal, é R$ 6k+, e é onde eu erro
hoje. As Ondas 2, 3 e 4 são reais, mas nenhuma me tira da planilha **da folha**: a receita de
projeto eu já controlo de cabeça, o semáforo PF é minha menor dor (pró-labore fixo + fatura
dividida), e o polish é polish. Gastar 30h em receita PJ e orçamento pessoal antes de eu ter
fechado **uma** folha de verdade no app é construir o segundo andar antes de morar no
primeiro.

Tem um motivo a mais, e é o que mais pesa pra mim: **eu preciso descobrir, usando de
verdade, se a Onda 1 me tira mesmo da planilha ou se ela me dá trabalho novo.** O risco #4
(redigitar a folha toda semana) só aparece quando eu uso. Se na segunda folha eu já estiver
xingando porque tenho que redigitar Pedro e Alana, então a prioridade da Onda 2/3 muda — eu
quero "duplicar rodada" e autocomplete (que estão na Onda 4) **antes** de receita PJ. Ou
seja: usar a Onda 1 me dá o dado que reordena o resto do roadmap. Decidir agora fazer tudo é
decidir no escuro o que vem depois da folha; e a lição deste app inteiro (vê o histórico de
tarefas) é que cada coisa que eu botei em produção e usei me ensinou o próximo passo.

Concretamente:
- **Semana 1:** Onda 0, com snapshot, pré-voo e aplicação em branch. Eu quero ver o resultado
  do `pg_policies` e a confirmação de não-regressão da fatura/acerto antes do merge.
- **Semana 2:** Onda 1, mas com **dois itens da Onda 4 puxados pra dentro**: "duplicar rodada
  anterior" e o autocomplete de colaborador. Sem isso a folha tem fricção e eu não testo de
  verdade. E a leitura do total via VIEW, não cache cego (risco #3).
- **Depois:** eu fecho duas folhas reais. Se funcionou e me tirou da planilha, aí sim Onda 2
  (receita) ou Onda 3 (PF) — e a ordem entre elas eu decido pela dor que aparecer no uso, não
  agora.

Resumo na minha voz: **não me vendam as cinco ondas. Me entreguem a folha funcionando, com o
mínimo de fricção pra eu não voltar pra planilha, e me deixem provar que funciona antes de
pagar pelo resto.** Se a Onda 1 me fizer fechar a folha de sexta sem abrir a planilha — e eu
acho que faz — vocês compraram o direito de construir o resto. Antes disso, é fé, e eu não
pago folha com fé.
