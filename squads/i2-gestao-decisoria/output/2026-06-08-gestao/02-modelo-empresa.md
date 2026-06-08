# 02 — Modelo Financeiro Empresarial (i2 Soluções Digitais)

**Squad:** i2-gestao-decisoria · **Persona:** Beatriz (Controller / Gestão de Caixa PME)
**Data:** 2026-06-08 · **Fase 2 de N**

> Lente desta fase: penso em **regime de caixa**, não em DRE bonita. A pergunta que
> governa tudo é a do Iremar na sexta: *"quanto eu preciso TER na Inter PJ hoje, e de
> onde tiro o que falta?"*. O DRE atual de `empresa/page.tsx` responde "deu lucro?" —
> eu preciso responder "tem dinheiro na conta pra pagar a folha?". São perguntas
> diferentes e o modelo tem que separá-las. Aqui defino o **modelo conceitual + regras**;
> SQL fica para a Fase 3. O teste de aderência continua sendo o cenário-âncora.

---

## (1) Contas a Receber (AR) — o que entra de cliente, e quando

Hoje a i2 tem **uma** linha de receita por mês: `income_records.kind='faturamento_i2'`,
um número agregado preenchido pelo `FaturamentoForm`. Isso responde "quanto faturei",
mas é cego ao que importa pro caixa: **qual cliente paga, quando, e se já é certo**.

### Modelo conceitual

A unidade de AR é o **recebível** (uma promessa de entrada de caixa), não a "receita do
mês". Um recebível tem:

| Campo | Para que serve a decisão |
|---|---|
| `cliente` / `projeto` | "De quem é esse dinheiro?" — agrupa e dá contexto |
| `valor_previsto` | quanto deve entrar |
| `data_prevista` | **a data é o coração** — é o que coloca a entrada na linha do tempo do caixa |
| `status` (previsto / faturado / recebido) | o eixo confiança → caixa real |
| `parcela_n / parcela_de` | projeto fechado em N×; cada parcela é um recebível próprio |
| `entity_id` = i2 | **inegociável** — separa do caixa PF (ver §5) |
| `income_record_id` (quando recebido) | liga o recebível à receita realizada já existente |

### A máquina de estados — "previsto" vs "confirmado"

O Iremar precisa distinguir **dinheiro que talvez entre** de **dinheiro que vai entrar**
de **dinheiro que já entrou**. Três estados, uma direção:

```
PREVISTO ──(emiti a NF)──▶ FATURADO ──(caiu na conta)──▶ RECEBIDO
 hipótese                  compromisso firme            caixa real
```

- **previsto** — o Iremar fechou o projeto de boca, ou estima que o cliente X recorrente
  paga ~R$ Y. Entra no **planejador** como *colchão*, mas com desconto de confiança.
  **Nunca** vira base pra decidir um pagamento. É o "se tudo der certo".
- **faturado** — NF emitida (existe `fiscal_notes` ligando a um `income_record`). Agora é
  compromisso firme do cliente. Entra no fluxo previsto **cheio**, com data de vencimento
  real. Para o regime de caixa, ainda não é dinheiro — mas é o melhor proxy de que vai ser.
- **recebido** — o dinheiro caiu. Vira `income_records` realizado (`occurred_on` = data do
  crédito) e idealmente uma `transaction` de entrada na Inter PJ. **Só este estado conta
  como saldo disponível** no planejador de cofre.

**Regra de ouro do planejador:** o déficit de caixa **só pode ser coberto por saldo real
(recebido)** ou resgate de cofre — **nunca** por recebível previsto. Previsto/faturado
aparecem como *horizonte* ("semana que vem entram R$ 4.000"), nunca como *saldo de hoje*.
Isso protege o Iremar de pagar a folha contando com dinheiro que ainda não chegou — o erro
clássico de quem confunde competência com caixa.

### Reaproveitamento (regra do squad: reusar antes de criar)

`income_records` já tem `occurred_on`, `description`, `amount`, `kind`, `reference_month`,
`entity_id`. Falta-lhe **data prevista** ≠ data realizada e **status**. O modelo conceitual
de AR não exige tabela nova nesta fase: estende-se `income_records` com a noção de
*previsão vs realização* (a Fase 3 decide se via colunas `expected_on`+`status` ou tabela
`receivables` dedicada). O `faturamento_i2` agregado vira um caso particular — o mês inteiro
de um cliente único — e migra naturalmente para recebíveis por cliente conforme o Iremar
cadastrar projetos.

> **Pré-requisito de fundação (Gap G1 da Fase 1):** o CHECK de `income_records.kind` em
> `0001_schema.sql:164` é `('pro_labore','i2_reimbursement','juliana_transfer','other')` —
> **`faturamento_i2` não está lá**. O DRE depende de um INSERT que o banco pode rejeitar.
> AR não se constrói sem antes consertar isso (Fase 3, migration reversível).

---

## (2) Contas a Pagar (AP) — duas naturezas que NÃO podem morar juntas

A i2 paga duas coisas estruturalmente diferentes, e tratá-las igual é a raiz do problema.

### Natureza A — Fixas recorrentes (já existem)

Pró-labore Iremar R$ 5.000 (dia 5, pix) · Retirada de lucros R$ 3.000 (dia 5, pix) ·
DAS R$ 2.600,21 (dia 20, boleto) · INSS R$ 550 (dia 20, boleto). Moram em
`recurring_commitments` (valor + `due_day` + `payment_method` + `recurrence_type=monthly`)
e materializam status em `monthly_obligations`. **Característica:** mesmo valor, mesmo dia,
todo mês. O modelo está certo pra elas — não mexer.

### Natureza B — Folha variável (não existe; é a dor #1)

Pedro 1.200 · Alana 550 · Eduarda (proporcional) · Mayana 750 · Iremar 3.000 · Contadora
500. **Característica oposta:** muda de valor, muda de pessoa, e é paga numa **data de
execução** ("a folha dessa semana"), não num dia fixo do mês.

**Por que NÃO cabe em `recurring_commitments`:**
1. Cadastrar Eduarda como compromisso fixo de R$ 500 produz **erro garantido** — ela é
   proporcional (§3). `recurring_commitments` não tem proração.
2. `due_day` é "dia do mês" (1–31). A folha é uma **rodada datada**, não um dia recorrente.
   Forçar isso polui a tela `/compromissos` (que raciocina por dia do mês) com itens que
   não têm dia fixo.
3. Pessoas entram/saem, valores oscilam (hora extra, bônus). Editar `amount` num
   `recurring` destrói o histórico do que de fato foi pago em maio.

### Proposta conceitual — Rodada de Folha (payroll run) + Itens

Modela-se a folha como um **lote datado com itens variáveis**, espelhando o par
`recurring_commitments`→`monthly_obligations` (cabeçalho + linhas) que o projeto já domina:

```
RODADA DE FOLHA (cabeçalho)              ITEM DE FOLHA (linha)
─────────────────────────                ─────────────────────
referencia: "Folha 1ª sem jun"           colaborador: "Pedro"
data_pagamento: 2026-06-13 (sexta)       valor_base: 1200,00
entity_id: i2  (sempre)                  proracao: { dias_trab, dias_base } | null
status: rascunho/confirmada/paga         valor_a_pagar: 1200,00 (calculado)
total_a_desembolsar: Σ itens             pago: bool / paid_on
                                         tipo: salario | bolsa | pro_labore | servico
```

Regras do modelo:
- **`entity_id = i2` obrigatório** em toda rodada (Fator R / não misturar PF — §5).
- O **total a desembolsar** da rodada é `Σ valor_a_pagar` — exatamente o número que o
  Iremar busca na sexta. É calculado, nunca digitado.
- O **pró-labore do Iremar (3.000 nessa folha)** é um item da rodada *com tipo
  `pro_labore`* — porque entra no caixa da folha — mas continua marcado distintamente para
  o Fator R (§5). A **retirada de lucros NÃO entra na folha**: é compromisso fixo (Natureza
  A), não remuneração de trabalho.
- Cada item vira (na Fase 3) um lançamento de saída na Inter PJ quando pago, alimentando o
  DRE — fechando o **Gap G7** (DRE hoje é cego à folha e por isso superestima o caixa que
  sobra).

> O `faturamento_i2 = R$ 8.550 "7 colaboradores"` que está no seed (`0003_seed.sql:66`) é
> justamente esta folha **achatada num número só**. O modelo de rodada a desdobra em itens
> auditáveis, com a proração correta da Eduarda embutida.

---

## (3) Proração da bolsa da Eduarda — a conta explícita

Eduarda: bolsa de estágio de **R$ 500 cheios/mês**, começou em **11/05/2026**. Pagar R$ 500
no primeiro mês é pagar a mais; o modelo tem que prorar pelos dias do vínculo.

### Definição da regra: dias CORRIDOS (calendário), não dias úteis

**Escolho dias corridos** e justifico:
1. **Bolsa de estágio é benefício mensal proporcional ao período de vínculo**, não salário
   por dia trabalhado. A proporção natural é "fração do mês em que ela esteve vinculada".
2. **Determinismo e auditabilidade:** dias corridos não dependem de calendário de feriados
   (que muda por cidade/ano e exige tabela externa). O Iremar consegue **conferir de
   cabeça** — virtude crítica num app de decisão. Dias úteis introduzem ambiguidade
   (sábado conta? feriado municipal?) que gera disputa com o estagiário.
3. **Consistência com folha de estágio na prática PME:** o proporcional de bolsa quase
   sempre roda por dias corridos do mês.

> *Ressalva de Controller:* para **salário CLT** com desligamento no meio do mês, o padrão é
> dias trabalhados sobre **30** (avos). Como aqui é **admissão de bolsa**, uso a base "dias
> do mês civil" (maio = 31), que é mais favorável e transparente ao estagiário. O modelo
> guardará `dias_trab` e `dias_base` no item, então a regra fica explícita e revisável — não
> enterrada num número mágico.

### A conta (maio/2026)

- Início do vínculo: **11/05**. Dias com vínculo em maio = de 11 a 31 inclusive.
- **Dias trabalhados** = 31 − 11 + 1 = **21 dias**
- **Dias base** = dias corridos de maio = **31**
- Valor cheio = **R$ 500,00**

```
valor_prorado = valor_cheio × (dias_trab / dias_base)
              = 500,00 × (21 / 31)
              = 500,00 × 0,677419…
              = 338,7096…
              ≈ R$ 338,71
```

**Número final: Eduarda recebe R$ 338,71 referente a maio/2026.** A partir de junho (mês
cheio: vínculo de 01 a 30), recebe os **R$ 500,00** integrais — a proração só incide no mês
de admissão (e incidiria de novo num eventual mês de desligamento).

O item de folha guarda `valor_base=500`, `proracao={dias_trab:21, dias_base:31}`,
`valor_a_pagar=338,71`. O cálculo é puro e testável (cabe em `packages/core`, ao lado de
`settlement.ts`), e a tela mostra o "porquê" do valor — o Iremar nunca vê um número órfão.

---

## (4) PLANEJADOR DE COFRE — o coração do modelo

Esta é a pergunta de maior frequência e maior risco (Fase 1, dor #1). O Iremar tem o
dinheiro **guardado no cofre** (Caixinha Nubank + NuInvest, `accounts.kind='investment'`) e
**paga pela Inter PJ** (`kind='company'`). A folha não cabe no saldo operacional — ele
**resgata do cofre** o que falta. O planejador automatiza esse cálculo, hoje feito de cabeça.

### Entradas do modelo

- **Horizonte** escolhido: `hoje` | `essa semana` (próx. 7 dias) | `esse mês`. Recorta o
  conjunto de pagamentos por `data_pagamento`/`due_date` — resolve também o **Gap G4**
  (recorte "esta semana" inexistente).
- **Conjunto de pagamentos** no horizonte: itens de rodada de folha (§2B) + obrigações
  fixas PJ vencendo (§2A, de `monthly_obligations` ainda pendentes).
- **Saldo operacional** da Inter PJ (já calculado em `/contas`: `opening_balance` + Σ
  transactions da conta).
- **Saldos dos cofres** (Caixinha, NuInvest) — fontes de resgate, com **prioridade**.

### O algoritmo (5 passos)

```
1. total_desembolso = Σ pagamentos do horizonte
2. saldo_op        = saldo atual Inter PJ (apenas dinheiro RECEBIDO; nunca previsto — §1)
3. deficit         = max(0, total_desembolso − saldo_op)
4. se deficit = 0  → "Inter PJ cobre a folha. Nada a resgatar." (fim)
5. senão           → alocar 'deficit' entre os cofres por ordem de prioridade,
                     sem estourar o saldo de cada cofre:
                        para cada cofre na ordem:
                          resgate = min(saldo_cofre, restante)
                          restante -= resgate
                     se restante > 0 ao fim → ALERTA: cofres não cobrem (faltam R$ X)
```

**Ordem de resgate (regra padrão):** drenar primeiro o cofre de **maior liquidez / menor
custo de oportunidade** — Caixinha Nubank (rende ~CDI, resgate instantâneo) antes de
NuInvest (pode ter aplicação com prazo/imposto). O Iremar pode sobrepor manualmente. A
sobra de `deficit` após esgotar cofres é o sinal vermelho que ele precisa ver **antes** de
prometer pagamento.

### Resolvendo o cenário-âncora COM NÚMEROS

Folha da semana (com Eduarda já prorada em §3 — uso o valor de maio R$ 338,71 como exemplo
do mês de admissão):

| Pessoa | Valor |
|---|---:|
| Pedro | 1.200,00 |
| Alana | 550,00 |
| Eduarda (prorada, 21/31 dias) | 338,71 |
| Mayana | 750,00 |
| Iremar (pró-labore) | 3.000,00 |
| Contadora | 500,00 |
| **Total a desembolsar** | **R$ 6.338,71** |

Premissas de saldo (assumidas pra exemplo, conforme briefing):
- Saldo Inter PJ (operacional) = **R$ 2.000,00**
- Caixinha Nubank = **R$ 4.000,00** (prioridade 1)
- NuInvest = **R$ 5.000,00** (prioridade 2)

```
Passo 1 — total_desembolso = 6.338,71
Passo 2 — saldo_op (Inter PJ) = 2.000,00
Passo 3 — deficit = 6.338,71 − 2.000,00 = 4.338,71
Passo 4 — deficit > 0 → precisa resgatar
Passo 5 — alocação por prioridade:
          • Caixinha Nubank: min(4.000,00 ; 4.338,71) = 4.000,00  → restante 338,71
          • NuInvest:        min(5.000,00 ;   338,71) =   338,71  → restante 0,00
```

**Saída do planejador para o Iremar (a tela "Caixa da semana"):**

> **Folha dessa semana: R$ 6.338,71**
> Inter PJ tem R$ 2.000,00 → **faltam R$ 4.338,71**.
> Pra cobrir, resgate do cofre:
> • **Caixinha Nubank → R$ 4.000,00**
> • **NuInvest → R$ 338,71**
> Depois de resgatar, a Inter PJ fica com R$ 6.338,71 — exatamente o da folha. ✅
> *(Cofre restante após resgate: Caixinha R$ 0 · NuInvest R$ 4.661,29)*

Cada resgate sugerido vira um pré-preenchimento da **transferência cofre→Inter PJ** —
infraestrutura `transfers` **já existe** (`/transferencias`). O planejador é, portanto, um
gap de **orquestração/UI sobre dados existentes** (Gap G3), não de fundação de dados.

**Caso de borda que o algoritmo já trata:** se a folha fosse R$ 12.000 com os mesmos
cofres, o Passo 5 esgotaria Caixinha (4.000) + NuInvest (5.000) = 9.000, sobrando déficit de
1.000 — o planejador dispara **alerta vermelho "cofres não cobrem, faltam R$ 1.000"**,
evitando que o Iremar prometa um pagamento que a i2 não tem caixa pra honrar. É exatamente o
momento em que o recebível **faturado** da §1 vira informação de horizonte ("entra R$ 4.000
quinta — espere ou negocie prazo"), sem nunca ser tratado como saldo.

---

## (5) Regime de caixa × competência — e a blindagem do Fator R

### Os dois regimes coexistem no modelo, sem se contaminar

- **Caixa** (quando o dinheiro entra/sai) → governa o **planejador de cofre** (§4). Só conta
  o que **caiu** (recebido) ou o que **vai sair** numa data. É o regime da decisão de sexta.
- **Competência** (a que mês a receita/despesa pertence) → governa o **DRE** de
  `empresa/page.tsx` e o **Fator R** (apuração tributária). A NF de maio é competência de
  maio mesmo que o cliente pague em junho.

O modelo de AR (§1) separa os dois explicitamente: **data prevista/realizada** (caixa) vs
**`reference_month`/`competencia`** (competência, já existente em `income_records` e
`fiscal_notes`). Um recebível faturado em maio recebido em junho conta para o **Fator R de
maio** (competência) mas só entra no **saldo de junho** (caixa). Misturar isso é o erro que
faz o empresário PME achar que tem caixa quando só tem nota emitida.

### Fator R — a regra fiscal que o modelo PRECISA preservar

Fator R = **folha de pagamento (12 meses) ÷ receita bruta (12 meses)**. Se ≥ 28%, a i2 se
enquadra no **Anexo III** do Simples (alíquota menor) em vez do Anexo V (alíquota maior).
Para PME de serviços, manter o Fator R acima de 28% é decisão tributária de alto valor.

**O que conta como "folha" para o Fator R:**
- ✅ **Pró-labore** (Iremar R$ 5.000 + os R$ 3.000 da folha-âncora se forem pró-labore) —
  **conta**, porque é remuneração de trabalho com encargos (INSS).
- ✅ **Salários/bolsa** da equipe (Pedro, Alana, Eduarda, Mayana) — **contam**.
- ❌ **Retirada de lucros** (R$ 3.000 fixo, dia 5) — **NÃO conta**. É distribuição de
  resultado, não remuneração. Entra no Fator R como **zero**.
- ❌ Pagamento de **PJ/serviço terceirizado** (ex.: contadora, se emite NF como PJ) — **NÃO
  conta** como folha; é despesa de serviço. *(Se a contadora for autônoma com RPA, conta.)*

**Como o modelo blinda isso:** cada item de folha (§2B) e cada compromisso fixo (§2A)
carrega um marcador de **natureza para Fator R** — `folha` (pró-labore, salário, bolsa,
RPA) vs `nao_folha` (lucros, DAS, INSS pago, serviço PJ). Assim:
1. O **planejador de caixa** soma **tudo** (precisa do desembolso total, R$ 6.338,71).
2. O **cálculo do Fator R** soma **só os marcados `folha`** — separando, no exemplo, os
   R$ 3.000 de pró-labore (conta) dos R$ 3.000 de lucros (não conta), mesmo saindo no
   mesmo dia pela mesma conta.

A **separação PF×PJ** (`entity_id`, regra inviolável do squad) é o primeiro nível de
blindagem: receita e folha da i2 vivem em `entity_id=i2`; nada de PF entra no numerador nem
no denominador do Fator R. O segundo nível é o marcador `folha`/`nao_folha` **dentro** do
PJ. Sem os dois, o Fator R fica errado e a i2 pode cair no Anexo V por erro de classificação
— exatamente o risco que o Gap G1 (entity_id frágil) expõe e que a Fase 3 fecha primeiro.

---

### Síntese para a Fase 3 (implementação)

Ordem obrigatória, do alicerce ao topo:
1. **Fundação de dados** (Gap G1): migration reversível que (a) inclui os kinds de receita
   PJ no CHECK de `income_records`, (b) garante `entity_id`, (c) adiciona `investment` ao
   CHECK de `accounts.kind` — que hoje **nem existe no SQL** (`0001_schema.sql:28`), só nos
   types. Sem isto, cofre e AR repousam em colunas/valores que o banco pode rejeitar.
2. **AR** (§1): previsão vs realização + status em `income_records` (ou tabela `receivables`).
3. **Folha variável** (§2B): rodada + itens, com proração (§3) em `packages/core`.
4. **Planejador de cofre** (§4): orquestração sobre `accounts` + `transfers` existentes.
5. **Marcador Fator R** (§5) atravessando folha e fixas.

Tudo mobile-first 375px, dark glass, escopo PJ (âmbar), respeitando o profile scope e a
regra-mãe: **nunca misturar caixa PF com PJ**.
