# 03 — Modelo de Orçamento Pessoal (Iremar PF)

**Squad:** i2-gestao-decisoria · **Persona:** Camila — Finanças Pessoais
**Data:** 2026-06-08 · **Fase 3 de N**

> Lente desta fase: **semáforo simples > planilha**. O Iremar não quer um relatório de
> fim de mês; ele quer, no segundo em que pensa "passo o cartão nessa compra?", uma
> resposta de uma cor. Verde = vai. Amarelo = pensa. Vermelho = não. Todo o modelo
> abaixo existe pra alimentar essas três cores com honestidade — sem inventar folga que
> não existe nem assustar quando há colchão. Aqui é a contraparte PF do regime de caixa
> da Fase 2: lá a pergunta era "tem dinheiro na Inter PJ?"; aqui é "tem espaço no meu
> mês?". E o pilar inegociável é o mesmo das duas fases: **caixa PF nunca se mistura
> com PJ** (Fator R). O que entra de pró-labore é renda PF; o que a i2 paga é da i2.

---

## (1) Orçamento mensal — teto, comprometido, disponível

O modelo PF tem **três números e uma subtração**, nada além disso:

```
TETO            quanto o Iremar se permite gastar no mês (decisão dele)
COMPROMETIDO    o que já está "carimbado": fatura do cartão (parte dele) + boletos PF
DISPONÍVEL      = TETO − COMPROMETIDO   ← este é o número do semáforo
```

### O que entra em COMPROMETIDO (e o que NÃO entra)

| Item | Entra? | Por quê |
|---|---|---|
| Parte do Iremar na fatura aberta (`settlement.iremarPart`) | **Sim** | é gasto dele que já aconteceu, só não foi cobrado ainda |
| Boletos/PIX PF pendentes do mês (`monthly_obligations` PF, status pending) | **Sim** | saída certa da conta dele este mês |
| Parte da **Juliana** na fatura (`julianaPart`) | **Não** | ele paga a fatura inteira, mas ela reembolsa — é repasse, não gasto dele (ver §5) |
| Parte da **i2** na fatura (`i2Part`) | **Não** | despesa da empresa; reembolsada pela i2 — **jamais** entra no orçamento PF |
| Pró-labore / retirada de lucros | **Não** (é renda, alimenta o TETO, não o comprometido) | |

**Princípio:** comprometido é só "meu dinheiro que já tem dono". Isso é o que faz o
disponível ser confiável — se eu inflasse o comprometido com a parte da Juliana e da i2,
o semáforo ficaria vermelho sem motivo e o Iremar pararia de confiar nele.

### De onde vem o TETO? — decisão de produto

A Fase 1 (Gap G6) marcou que **não existe teto hoje**. Há duas formas honestas de
defini-lo, e o modelo deve oferecer as duas, com um default seguro:

**Opção A — valor fixo configurável (recomendada como default).**
O Iremar define um número ("meu mês é R$ 8.000") uma vez, num campo de configuração. É o
mais alinhado ao prompt ("teto definido pelo Iremar") e à persona (semáforo, não planilha):
ele tem controle total, entende o número porque foi ele quem digitou, e não há mágica.
Default sugerido na primeira vez: a média das saídas PF dos últimos 3 meses, **apresentada
como sugestão editável** — nunca imposta.

**Opção B — derivado da renda PF prevista.**
Teto = renda PF do mês − uma meta de poupança (ex.: guardar 20% → teto = 80% da renda).
A renda PF prevista é calculável: pró-labore fixo (R$ 5.000, `recurring_commitments`
`responsible=iremar` da i2 que entra como renda PF) + retirada de lucros (R$ 3.000) +
transferências da Juliana previstas. É mais "inteligente", mas acopla o teto à renda e
exige que o Iremar confie na conta. Fica como **modo avançado opcional**, não default.

**Decisão:** começar com **Opção A** (teto fixo configurável, persistido por
`responsible` + `reference_month`, default = média 3 meses). A Opção B vira um toggle
"derivar da renda" para quem quiser. Razão: a persona pede simplicidade e o prompt diz
"definido pelo Iremar" — controle explícito ganha de automação opaca. Importante: o teto é
um campo **PF puro** (carimbado `entity_id = Família`); não há teto de empresa aqui.

---

## (2) Semáforo "posso usar o cartão?" — os 3 estados

A pergunta real do Iremar não é "quanto já gastei" — é **"se eu passar o cartão agora,
estouro?"**. O semáforo responde isso lendo o **percentual do teto que ainda está
disponível**:

```
folgaPct = DISPONÍVEL / TETO        (DISPONÍVEL = TETO − COMPROMETIDO)
```

| Estado | Faixa de folga | Significado | Mensagem |
|---|---|---|---|
| 🟢 **Verde** | folga **> 30%** do teto | confortável — pode usar à vontade | "Pode usar. Sobram R$ X do seu mês." |
| 🟡 **Amarelo** | folga entre **10% e 30%** | apertado — dá, mas pense | "Tá apertando. Restam só R$ X (Y% do mês)." |
| 🔴 **Vermelho** | folga **< 10%** ou **negativa** | estourou ou quase | "Cuidado. Você já comprometeu N% do mês." |

### Justificativa dos thresholds

- **30% como piso do verde.** Não é arbitrário: a margem de 30% absorve o que o Iremar
  *ainda vai gastar* no resto do mês mas que não está no comprometido (mercado, posto,
  imprevistos). Se a folga é >30%, mesmo gastando o ritmo normal ele não estoura — por
  isso é seguro dizer "pode". Abaixo disso, o ritmo normal já ameaça o teto.
- **10% como piso do amarelo.** Abaixo de 10% de folga, qualquer compra média de cartão
  (uma conta de restaurante, uma compra de farmácia) consome o que sobra. Não é
  tecnicamente "estourado", mas já não há margem pra erro — daí o vermelho começa aqui, e
  não só no negativo. A persona prefere avisar cedo a deixar estourar silenciosamente.
- **Por que percentual e não valor absoluto.** R$ 800 de folga é confortável pra quem tem
  teto de R$ 4.000 (20%) e apertado pra quem tem teto de R$ 12.000 (6,7%). O percentual
  normaliza e mantém o semáforo justo independente do tamanho do mês.

### Honestidade do semáforo (regra da persona)

O semáforo **só usa dinheiro real**, espelhando a regra de ouro da Fase 2: previsto não
vira saldo. Renda PF prevista mas ainda não recebida **não** aumenta o teto efetivo se o
modo for "teto fixo" — o teto já é o número que o Iremar confia. No modo "derivar da
renda" (Opção B), receita ainda não caída entra com a mesma cautela do planejador de
empresa: marcada como horizonte, nunca como folga gastável de hoje. O semáforo nunca
fica verde por causa de dinheiro que ainda não chegou.

---

## (3) Impacto da fatura no orçamento — "sua parte é R$ X = Y% do mês"

A fatura é, de longe, o maior componente do comprometido do Iremar. O `settlement.ts` já
entrega `iremarPart` pronto (`calculateInvoiceSettlement` → soma 100% dos gastos `iremar`
+ 50% do `casal`, sobre o ciclo real da fatura, não o mês calendário). O modelo só precisa
**relacionar esse número com o teto**:

```
faturaPctDoOrcamento = settlement.iremarPart / TETO
```

### Como mostrar (sem virar planilha)

No `AnchorHero` do escopo Pessoal — que hoje mostra o `faturaTotal` cru (a fatura inteira,
incluindo a parte da Juliana e da i2) — o número grande deve passar a ser **a parte do
Iremar**, não o total, porque é a única que consome o orçamento dele. O total da fatura
vira sublabel ("de R$ 4.200 totais, R$ 2.100 são seus"). Abaixo, uma linha de impacto:

> **Sua parte da fatura: R$ 2.100** · isso é **26% do seu mês** 🟢

A barrinha de progresso do orçamento (teto = 100%) mostra visualmente o quanto a fatura
sozinha já "comeu", e o resto do comprometido (boletos PF) empilha em cima. O Iremar vê de
relance: "a fatura já levou 1/4 do meu mês, ainda tenho os boletos por cima, sobra tanto".

### Por que separar iremarPart do faturaTotal é crítico

Hoje o `AnchorHero` (l.40-47) exibe `faturaTotal` — que pelo `settlement` inclui
`julianaPart + i2Part`. Se isso virasse base de orçamento, o Iremar veria a fatura inteira
descontando o mês dele, **incluindo gastos que não são dele**. Seria o mesmo erro da Fase 2
(misturar caixa) só que ao contrário: inflar o comprometido PF com gasto de terceiros. A
correção é usar **`iremarPart`** no cálculo de orçamento e deixar `faturaTotal` só como
informação contextual de quanto ele vai *pagar no cartão* (e depois reembolsar).

---

## (4) Visão "essa semana" PF — próximos 7 dias

A Fase 1 (Gap G4) apontou que dashboard e compromissos raciocinam por **mês**, nunca por
**janela móvel de 7 dias**. O Iremar quer abrir o app de manhã e ver só o que importa
*agora*. A visão "essa semana" PF é uma faixa enxuta no topo do escopo Pessoal:

**A pagar (próximos 7 dias):**
filtra `monthly_obligations` PF (`responsible` ∈ {iremar, casal}) com `due_date` entre
hoje e hoje+7, `status = pending`. Mostra dia, descrição, valor. Soma no topo: "Essa
semana você paga R$ X em N contas." Inclui o **fechamento da fatura** se o `closingDate`
do ciclo cair na janela — é o evento PF de maior valor e o Iremar precisa saber que está
chegando.

**A receber (próximos 7 dias):**
filtra `income_records` PF (`entity_id = Família`, kinds `pro_labore`, `juliana_transfer`,
`other`) com data prevista na janela. Resolve o Gap G5: usa a data (`occurred_on` /
`expected_on`) pra dizer **quando**, não só quanto, e corrige o atalho que hoje aponta pro
escopo errado (`/empresa`) — receita PF nunca leva o Iremar pra tela de empresa.

A faixa é **só leitura e só PF** — diferente do "Caixa da semana" da empresa (Fase 2),
que calcula resgate de cofre. Aqui não há cofre PF nem resgate; é puramente "o que mexe na
minha conta nos próximos 7 dias", pra ele não ser pego de surpresa por um boleto nem
esquecer que a transferência da Juliana ainda não caiu.

---

## (5) Relação com a divisão do casal — meu gasto vs. o que volta pra mim

Esta é a parte mais delicada do modelo PF, porque o Iremar **paga a fatura inteira do
cartão** mas só uma parte é gasto dele. As outras partes são repasse. Confundir os dois
quebra o orçamento — e arrisca a mesma contaminação que a Fase 2 combate entre PF e PJ.

### As três fatias da fatura, e o que cada uma faz no orçamento dele

| Fatia (`settlement`) | É gasto do Iremar? | Efeito no orçamento PF |
|---|---|---|
| `iremarPart` (100% iremar + 50% casal) | **Sim** | entra no COMPROMETIDO. É o que consome o teto. |
| `julianaPart` (100% juliana + 50% casal) | **Não** — é dela | **não** entra no comprometido. Vira **"a receber"** (reembolso). |
| `i2Part` | **Não** — é da empresa | **não** entra no comprometido. Vira "a receber da i2" (escopo Empresa, nunca PF). |

### Como separar "meu gasto" de "o que vou receber de volta"

O fluxo de caixa real do Iremar tem dois movimentos que **não podem somar**:

```
SAI (ele paga o cartão inteiro):    iremarPart + julianaPart + i2Part   ← isso sai da conta dele
VOLTA (reembolsos):                  julianaPart  +  i2Part              ← isso volta
GASTO LÍQUIDO DELE:                  iremarPart                          ← isso é o que custa de verdade
```

O `calculatePersonalCashflow` (settlement.ts l.161) hoje mistura isso: soma
`iremarPart + julianaPart + i2Part` no `totalOut` e joga `julianaPaid` + `i2Reimbursements`
no `totalIn`. Matematicamente o saldo final fecha (o que sai volta), **mas o orçamento não
deve enxergar assim** — pro semáforo, o que importa é o **gasto líquido = `iremarPart`**, e
os reembolsos da Juliana/i2 aparecem como linha separada de "a receber", não como redução
de gasto. Senão o Iremar acha que pode gastar mais porque "a Juliana vai me pagar" — e aí
está contando com dinheiro de fora pra justificar gasto próprio.

**Regra de separação visual (cores do squad):**
- A **parte do Iremar** (azul) é o que entra no semáforo e na barra de orçamento.
- A **parte da Juliana** (rosa) e do **Casal** (ciano) aparecem na tela de fatura/acerto
  como "divisão", e a fatia dela vira uma linha **"a receber da Juliana"** no card de
  receitas PF — com data, resolvendo o Gap G5.
- A **parte da i2** (âmbar) **some do escopo Pessoal por completo** e só aparece em
  Empresa como reembolso a receber. Esse é o mesmo carimbo `entity_id` que protege o
  Fator R nas Fases 1 e 2: o orçamento pessoal nunca vê, soma ou descansa sobre um número
  da empresa.

### Síntese para a próxima fase

O orçamento PF é leve por dentro: **teto (config) − comprometido (iremarPart + boletos PF)
= disponível → cor**. Toda a complexidade fica em *o que não entra* — e isso já está
resolvido pelo `settlement`, que separa as fatias; o trabalho da próxima fase é (a)
persistir o teto (campo PF por mês, default = média 3 meses), (b) plugar `iremarPart` no
`AnchorHero` Pessoal no lugar do `faturaTotal` cru, (c) construir a faixa "essa semana" de
7 dias com datas reais, e (d) transformar `julianaPart` numa linha datada de "a receber",
nunca num abatimento de gasto. Tudo PF puro, `entity_id = Família`, sem um único número da
i2 cruzando a fronteira.
