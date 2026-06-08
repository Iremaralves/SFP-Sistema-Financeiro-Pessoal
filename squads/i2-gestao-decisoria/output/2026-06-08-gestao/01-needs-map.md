# 01 — Mapa de Necessidades → Decisões

**Squad:** i2-gestao-decisoria · **Persona:** Rui (Product Strategist Fintech)
**Data:** 2026-06-08 · **Fase 1 de N**

> Lente única desta fase: *qual decisão cada tela habilita?* Um número que não muda
> uma decisão é decoração. O cenário-âncora (folha da semana da i2 que o Iremar paga
> no PIX) é o teste de aderência: se a feature não ajuda o Iremar a fechar a folha
> de sexta, ela não passou.

---

## (1) Tabela mestra

Uma linha por necessidade crua (pessoal + empresa). "Existe hoje?" avaliado contra
o código real lido (`dashboard/page.tsx`, `empresa/page.tsx`, `compromissos/page.tsx`,
`settlement.ts`, `database.types.ts`, migrations).

### Pessoal (PF)

| # | Necessidade (cru) | Pergunta de decisão real | Dado(s) necessário(s) | Existe hoje? | Tela onde deve aparecer |
|---|---|---|---|---|---|
| P1 | Quais contas ainda vou pagar | "O que falta sair da minha conta este mês?" | `recurring_commitments` boleto/pix + `monthly_obligations.status` do mês | **Sim** | Dashboard (BillsCard) + /compromissos (filtro "A pagar") |
| P2 | Quais contas vencem essa semana | "Preciso pagar algo nos próximos 7 dias?" | `due_day` + data de hoje → janela de 7 dias, status pendente | **Parcial** — só há corte por mês (overdue/today/upcoming), não há recorte "esta semana" | Dashboard (faixa "Esta semana") + /compromissos |
| P3 | Quais valores vou receber | "Quanto entra na minha conta e quando?" | `income_records` PF (pro_labore, juliana_transfer) com `occurred_on` | **Parcial** — total do mês existe (aReceberTotal), mas sem datas e o atalho "A receber" aponta pra /empresa (escopo errado) | Dashboard (IncomeCard) |
| P4 | Ainda posso usar o cartão? Como está o orçamento? | "Se eu gastar R$ X agora, estouro o mês?" | Fatura aberta (ciclo) + teto/orçamento mensal + entradas previstas | **Não** — mostra total da fatura, mas não há conceito de teto/orçamento nem "saldo de gasto disponível" | Dashboard (AnchorHero PF) |
| P5 | Fatura, divisão, minha parte e impacto no orçamento | "Quanto da fatura é minha e quanto sobra do meu mês depois dela?" | `calculateInvoiceSettlement` (iremarPart/julianaPart/i2Part) + `calculatePersonalCashflow` | **Parcial** — settlement e cashflow existem no core, mas `calculatePersonalCashflow` não está plugado em nenhuma tela de decisão | /lancamentos + /acerto + Dashboard |

### Empresa (PJ)

| # | Necessidade (cru) | Pergunta de decisão real | Dado(s) necessário(s) | Existe hoje? | Tela onde deve aparecer |
|---|---|---|---|---|---|
| E1 | Quais contas vou receber e quando (projetos/clientes) | "Que dinheiro de cliente entra e em que data?" | `income_records` PJ por projeto/cliente com data prevista vs realizada | **Não** — só existe 1 linha de `faturamento_i2` agregada por mês (e o kind nem está no CHECK do banco) | /empresa (nova seção "A receber") |
| E2 | Quais contas vou pagar e quando | "O que a i2 deve pagar e em que dia?" | `recurring_commitments` PJ (DAS, INSS, pró-labore, lucros) + folha variável da semana | **Parcial** — fixas existem (DRE lista 4); a **folha semanal variável (Pedro, Alana, Eduarda, Mayana, contadora) não existe** | /empresa + /compromissos?entidade=i2 |
| E3 | Quanto tirar do cofre pros pagamentos do dia/semana | "Quanto transfiro de Caixinha/NuInvest → Inter PJ pra cobrir a folha?" | Σ(pagamentos da janela) − saldo Inter PJ atual = gap a resgatar do cofre | **Não** — saldo de contas existe (/contas, AnchorHero Empresa), mas não há "total a desembolsar na semana" nem cálculo do gap vs cofre | /empresa (novo "Caixa da semana") |
| E4 | Cadastrar entradas de projetos novos | "Registrar que fechei o projeto X por R$ Y, recebível em Z" | Form de receita PJ com cliente/projeto, valor, data prevista, entity_id=i2 | **Não** — só há `FaturamentoForm` (1 valor agregado/mês), sem cliente, sem projeto, sem data prevista | /empresa (novo form "Nova entrada de projeto") |

---

## (2) Top 3 dores (ranqueadas por impacto na vida do Iremar)

### 🥇 #1 — Folha da semana da i2 não existe no app (E2 + E3 + E4 combinados)

**Por que é #1:** é a decisão de maior frequência (toda semana), maior valor
(R$ ~6.000+ por rodada) e maior risco operacional (pagar gente atrasado, ou
descapitalizar a Inter PJ). Hoje o Iremar faz isso de cabeça/planilha paralela —
o app é **cego** justamente no momento em que ele mais decide dinheiro.

O cenário-âncora expõe três buracos de uma vez:
- **Não vê o total a desembolsar** (Pedro 1.200 + Alana 550 + Eduarda proporcional
  + Mayana 750 + Iremar 3.000 + contadora 500). A i2 só tem 4 compromissos *fixos*
  cadastrados (pró-labore, lucros, DAS, INSS) — a **folha variável da equipe não tem
  representação** em `recurring_commitments` nem em lugar nenhum.
- **Não calcula quanto tirar do cofre** (Caixinha/NuInvest → Inter PJ). O dado de
  saldo existe (`accounts` kind=investment e kind=company), mas ninguém faz a conta
  `desembolso − saldo Inter PJ = resgate necessário`.
- **Eduarda é estágio proporcional** (começou 11/05, não é R$500 cheio). Não há
  nenhum mecanismo de proração — hoje seria erro garantido se cadastrado como fixo.

Impacto: alto × frequência semanal × risco de pagar pessoas errado = topo absoluto.

### 🥈 #2 — Receita de projetos PJ é invisível (E1 + E4)

**Por que é #2:** sem ver o que *entra* da i2, o Iremar decide a folha e os resgates
do cofre **no escuro do lado da receita**. Hoje a empresa só registra um número
agregado de `faturamento_i2` por mês (e, criticamente, esse `kind` nem está no CHECK
constraint do banco — ver Gap G1). Não há cliente, não há projeto, não há data
prevista de recebimento. Resultado: o app responde "quanto a i2 deve pagar" pela
metade, mas não responde "a i2 tem caixa pra isso?". É a contraparte de receita da
dor #1 — por isso vem logo atrás, não junto: a folha tem prazo duro; a receita é o
colchão que dá segurança pra decidir o resgate.

### 🥉 #3 — Orçamento PF sem teto: "ainda posso usar o cartão?" não tem resposta (P4)

**Por que é #3:** é dor pessoal de alta frequência (toda compra), mas de risco menor
que as duas de empresa porque o Iremar tem pró-labore fixo e a fatura é dividida. O
app mostra o *total* da fatura aberta (AnchorHero), mas não existe conceito de
**teto/orçamento** nem de **saldo de gasto disponível**. A pergunta "se eu passar o
cartão agora, estouro?" não é respondível — só dá pra ver o acumulado, nunca a folga.
Fica em #3 porque informa conforto, não evita um pagamento atrasado de salário.

---

## (3) Jobs-to-be-done

1. **Quando** chega sexta de pagar a equipe, **eu quero** ver numa tela o total
   exato da folha da semana (com a bolsa da Eduarda já prorada pelos dias
   trabalhados), **pra** transferir o valor certo no PIX sem abrir planilha.

2. **Quando** vou pagar a folha da i2, **eu quero** saber quanto resgatar de
   Caixinha/NuInvest pra deixar na Inter PJ, **pra** não descapitalizar o cofre nem
   deixar a conta da empresa no vermelho.

3. **Quando** fecho um projeto novo, **eu quero** registrar cliente, valor e data
   prevista de recebimento em segundos, **pra** ver o caixa futuro da i2 e decidir
   pagamentos com segurança.

4. **Quando** abro o app de manhã no escopo Pessoal, **eu quero** ver o que vence
   nos próximos 7 dias e o que ainda vou receber, **pra** não esquecer nenhum boleto
   nem ser pego de surpresa.

5. **Quando** penso em uma compra grande no cartão, **eu quero** ver quanto ainda
   posso gastar dentro do meu orçamento do mês, **pra** decidir na hora sem estourar.

---

## (4) Gap analysis — o que o app NÃO responde hoje e por quê

**G1 — `faturamento_i2` está quebrado na origem (ligação a E1, E4, dor #2).**
`empresa/page.tsx` (l.102) filtra `kind === 'faturamento_i2'`, mas a migration
`0001_schema.sql` (l.164) define o CHECK como
`kind in ('pro_labore','i2_reimbursement','juliana_transfer','other')`. O valor
`faturamento_i2` **não está no constraint** — e `income_records.entity_id` aparece
no `database.types.ts` mas **nenhuma migration o adiciona**. Ou seja: o DRE da
empresa depende de um INSERT que o banco pode rejeitar, e a separação PF/PJ da
receita repousa numa coluna possivelmente inexistente. Antes de construir E1/E4
é obrigatório uma migration reversível que (a) acrescente os kinds de receita PJ ao
CHECK e (b) garanta `entity_id` em `income_records`. **Risco direto ao Fator R**:
sem `entity_id` confiável, receita PF e PJ se misturam.

**G2 — Não existe modelo de folha variável semanal (dor #1, E2).**
`recurring_commitments` tem `recurrence_type` incluindo `weekly`, mas é pensado para
valor fixo recorrente (due_day 1–31). A folha da i2 é: (a) variável por pessoa,
(b) com proração (Eduarda), (c) paga numa data de execução, não num "dia do mês".
Modelar a Eduarda como compromisso fixo de R$500 produziria erro. Falta uma noção de
**rodada de pagamento / lote de folha** com itens variáveis e regra de proração.
Sem isso, o "total a desembolsar" (núcleo do cenário-âncora) é incalculável.

**G3 — Não há "Caixa da semana" nem cálculo de resgate do cofre (dor #1, E3).**
Os ingredientes existem isolados: `accounts` distingue `investment` (cofre:
Caixinha/NuInvest) de `company` (Inter PJ), e `/contas` mostra saldos. Mas ninguém
cruza **Σ pagamentos da janela − saldo Inter PJ = resgate necessário**. A
infraestrutura de `transfers` (cofre → Inter PJ) já existe; falta a *tela de decisão*
que diz o número e oferece a transferência. É um gap de orquestração/UI, não de dados.

**G4 — Recorte "esta semana" inexistente (P2).**
Tanto `dashboard` quanto `compromissos` raciocinam por **mês** (overdue/today/
upcoming dentro do mês corrente). A necessidade crua é "o que vence nos próximos
7 dias", que cruza fronteira de mês. Falta um filtro/seção de janela móvel de 7 dias.

**G5 — Receita PF sem datas e atalho com escopo trocado (P3).**
O dashboard soma `aReceberTotal` mas o `IncomeCard` e o atalho "A receber" do
`QuickActions` (escopo pessoal) apontam para `/empresa` — escopo errado e quebra a
regra de nunca misturar PF/PJ na navegação. Além disso `income_records` tem
`occurred_on`, mas a UI não usa a data para responder "quando recebo".

**G6 — Orçamento/teto PF não existe (dor #3, P4).**
Não há tabela nem campo de orçamento mensal por responsável/categoria. O
`calculatePersonalCashflow` em `settlement.ts` calcula saldo (entradas − saídas) mas
**não está plugado em nenhuma tela** e não há teto contra o qual comparar. "Posso
usar o cartão?" é estruturalmente sem resposta hoje — exige decisão de produto
(definir teto manual vs derivado da média) antes de implementar.

**G7 — DRE conta despesa de cartão e fixas, mas é cego à folha (E2, consistência).**
`empresa/page.tsx` soma `despesasTx` (cartão PJ) + `despesasFixed` (4 compromissos).
Quando a folha variável passar a existir (G2), o DRE precisa incorporá-la, senão o
"resultado estimado" subestima o desembolso real da i2 — induzindo o Iremar a achar
que sobra mais caixa do que sobra.

---

### Síntese para a próxima fase

O caminho crítico é claro e encadeado: **G1 (consertar a fundação de dados de
receita PJ) → G2 (modelar folha variável + proração) → G3 (tela "Caixa da semana"
com resgate do cofre) → E4/E1 (cadastro e visão de projetos)**. As dores P2/P3/P4
(pessoal) são quick wins de UI sobre dados que já existem (exceto orçamento, que
exige decisão de produto). Tudo isso respeitando: nunca misturar PF/PJ (`entity_id`),
migrations reversíveis com RLS, e o profile scope já existente.
