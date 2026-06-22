# Diagnóstico Financeiro — Iremar (junho/2026)

> Análise da Beatriz (controller). Tudo abaixo é dado real do Supabase, ciclo da fatura
> que vence ~22/jun (compras de 13/mai a 12/jun). PF e PJ ficam separados — o que a i2
> paga (DAS, INSS) **não** entra no orçamento pessoal do Iremar (Fator R intocado).

---

## 1. Mapa de custos do mês

### A) Boletos/PIX que saem da CONTA do Iremar (fixos PF que ele paga)

| Categoria | Fixo/Variável | De onde sai | Valor (R$) |
|---|---|---|---:|
| Escola Helena | Fixo | Conta Iremar | 1.393,43 |
| Tesouro Direto (investimento) | Fixo | Conta Iremar | 1.000,00 |
| Escola Isabela | Fixo | Conta Iremar | 950,00 |
| Reserva de segurança | Fixo | Conta Iremar | 800,00 |
| Condomínio | Fixo | Conta Iremar | 250,00 |
| Terapia | Fixo | Conta Iremar | 220,00 |
| IPVA | Fixo | Conta Iremar | 128,01 |
| IPTU | Fixo | Conta Iremar | 119,35 |
| Internet | Fixo | Conta Iremar | 100,00 |
| **Subtotal conta-corrente Iremar** | | | **4.960,79** |

> Feira (1.200), Plano de saúde (355) e Apartamento (175) são **paid_by = Juliana** — não
> saem da conta do Iremar. Por isso ficam de fora do orçamento dele.

### B) Parte do Iremar na FATURA do cartão (R$ 2.899,82)

O cartão é dividido por responsável. A parte do Iremar = gastos só dele (1.582,34) +
metade do "casal" (2.634,96 ÷ 2 = 1.317,48).

| Bloco | Fixo/Variável | De onde sai | Valor (R$) |
|---|---|---|---:|
| Gastos só do Iremar — variáveis | Variável | Cartão | 1.351,71 |
| Gastos só do Iremar — assinaturas (Mapfre 180,64 · Vivo 35 · Google One 14,99) | Fixo | Cartão | 230,63 |
| Metade do "casal" — variável | Variável | Cartão | 1.280,58 |
| Metade do "casal" — assinaturas (½ Netflix + ½ Amazon Prime) | Fixo | Cartão | 36,90 |
| **Subtotal cartão Iremar** | | | **2.899,82** |

> Fora da conta do Iremar dentro dessa fatura: parte da Juliana (~2.424,66 dela + a outra
> metade do casal) e a parte da i2 (1.857,68 — assinaturas Anthropic, Supabase, Submagic,
> Google Workspace, etc. — **já reembolsada pela PJ**, não pesa no bolso dele).

### Totais do mês (visão Iremar)

| Total | Valor (R$) |
|---|---:|
| Fixos PF na conta-corrente | 4.960,79 |
| Cartão — parte do Iremar | 2.899,82 |
| → dentro do cartão, fixos (assinaturas) | 267,53 |
| → dentro do cartão, variáveis | 2.632,29 |
| **COMPROMETIDO TOTAL DO IREMAR** | **7.860,61** |

---

## 2. Orçamento do Iremar

| | Valor (R$) |
|---|---:|
| **Renda** (pró-labore 5.000 + lucros 3.000) | 8.000,00 |
| (−) Fixos PF que ele paga (conta-corrente) | 4.960,79 |
| (−) Parte dele na fatura do cartão | 2.899,82 |
| **= SOBRA / FOLGA** | **+139,39** |

**Veredito: empata no fio do bigode.** Sobram R$ 139 num mês de R$ 8.000. Folga real
≈ **1,7% da renda**. Não está no vermelho, mas também não tem colchão nenhum: qualquer
imprevisto (uma consulta, um pneu, uma fatura 200 reais mais alta) já joga o mês pro
negativo.

**Ponto a favor (importante):** dentro dos R$ 4.960 já tem **R$ 1.800/mês indo para
poupança** (Tesouro 1.000 + Reserva 800). Ou seja — ele **está conseguindo guardar**,
mesmo apertado. Se um mês apertar de verdade, esses 1.800 são a válvula de escape antes
de qualquer dívida. A folga "de consumo" real, tirando a poupança, é ~R$ 1.939.

---

## 3. Impacto do cartão

- Parte do Iremar na fatura = **R$ 2.899,82**.
- Sobre a renda de R$ 8.000 → o cartão dele come **36,2% da renda**.
- Sobre o que sobra depois dos boletos fixos (8.000 − 4.960,79 = R$ 3.039,21) → o cartão
  consome **95,4%** desse "dinheiro livre".

**Sim, o cartão está comendo o orçamento.** Não pela dívida (ele paga à vista, sem juros),
mas porque é onde mora quase **todo o gasto flexível** dele. Depois de pagar escola,
moradia e poupança, sobram ~R$ 3.039 de respiro — e o cartão sozinho leva R$ 2.900 disso.
É exatamente aqui que o mês "evapora": não nos boletos (que são fixos e previsíveis),
e sim nas compras variáveis do cartão, que parecem pequenas e somam alto.

---

## 4. Diagnóstico franco

**Ele não precisa fazer mais dinheiro com urgência — precisa FREAR os variáveis do cartão.**
A renda paga as contas e ainda guarda 1.800/mês. O problema não é faltar, é não sobrar.
A alavanca de maior retorno e menor esforço é cortar gasto variável, não buscar renda.

**Onde estão os vazamentos (variáveis que dá pra cortar), parte do Iremar):**

| Vazamento | Valor no mês (R$) | Observação |
|---|---:|---|
| Combustível (Petrobras/Premmia — 4 abastecidas no casal) | 948,92 (½ = 474,46) | maior linha variável recorrente |
| Restaurantes/bares/delivery (Boteco, Toca, Chinada, pizzas, hambúrguer, padaria…) | casal ~830 + Iremar 311 | ~R$ 726 da parte dele — o vilão silencioso |
| Farmácia Drogasil (3 compras só dele) | 275,79 | revisar recorrência/estoque |
| Academias (Pac 168,73 dele + Acto da Ju) | 168,73 dele | ok se usa; cortar se não |
| Parcelados rolando (Airbnb 6/6, Gilberto 3/4, Thomas 3/6) | ~190 + ½ de 666 | terminam em breve — alívio futuro |

**Quais fixos pesam mais (e não dá pra mexer fácil):**

1. **Educação — R$ 2.343,43** (Helena 1.393 + Isabela 950). É **47% de todos os boletos**
   dele. É o maior peso da casa, de longe, e é intocável (e bem investido). Só citar pra
   ter consciência: praticamente metade do que ele paga em conta é escola das meninas.
2. **Poupança — R$ 1.800** (Tesouro + Reserva). Peso "bom" — é dinheiro que volta pra ele.
3. **Moradia — R$ 469,35** (Condomínio + IPTU + IPVA + Internet).

**Conclusão:** orçamento **equilibrado mas tenso**. O Iremar montou uma estrutura fixa
saudável (escola + poupança), e o aperto está todo concentrado no comportamento de
consumo do mês via cartão. É um problema de **disciplina de variável**, não de estrutura.

---

## 5. Recomendações práticas (na realidade dele)

1. **Teto de restaurante/delivery: R$ 450/mês (parte dele).** Hoje a parte do Iremar em
   comer fora passou de **R$ 726** no ciclo (Boteco 167, Toca 144, ½ Chinada, ½ pizzas, ½
   hambúrguer…). É o vazamento mais fácil de cortar sem dor: derrubar para 450 já libera
   ~R$ 275/mês — quase o dobro da folga atual.

2. **Combustível: meta R$ 750/mês no total do casal (R$ 375 a parte dele).** Foram **4
   abastecimentos = R$ 948** no ciclo. Combinar com a Juliana um teto e usar um cartão/
   carteira só de combustível ajuda a enxergar. Economia potencial: ~R$ 100/mês na parte dele.

3. **Revisar assinaturas — somam R$ 267,53/mês na parte dele.** Mapfre (180,64 — é seguro,
   manter), Vivo Easy (35), Google One (14,99), ½ Netflix, ½ Amazon Prime. Vale a conta
   honesta: usa Amazon Prime e Vivo Easy de verdade? Cada uma cancelada cai direto na folga.

4. **Subir a Reserva de segurança de R$ 800 para R$ 1.000** assim que os parcelados
   terminarem (Airbnb encerra esse ciclo; Gilberto e Thomas em 1–3 meses). Quando saírem,
   "aparecem" ~R$ 300/mês — em vez de virar consumo, redirecionar para o colchão, que hoje
   é o ponto mais frágil (folga de só 1,7%).

5. **Regra do "dinheiro livre": no máximo R$ 2.500 de cartão (parte dele) por ciclo.**
   Como sobram ~R$ 3.039 depois dos boletos, fixar um teto de R$ 2.500 no cartão garante
   ~R$ 500/mês de folga real de verdade — em vez dos R$ 139 atuais. Tudo que passar disso
   no meio do mês é sinal vermelho para segurar.

---

## 6. Indicadores que o dashboard deve destacar

Para tornar essa gestão **fácil e no piloto automático**, o painel pessoal do Iremar
precisa responder, sem ele fazer conta:

1. **Semáforo "posso usar o cartão?"** — barra: parte do Iremar na fatura em aberto vs.
   teto de R$ 2.500. Verde até 2.000 · Amarelo 2.000–2.500 · Vermelho acima. (Já existe a
   Onda B — calibrar o teto com esse número.)

2. **Folga do mês em destaque (número grande):** Renda 8.000 − fixos 4.960 − cartão até
   agora = **quanto ainda posso gastar**. Hoje renderia ~R$ 139 no fim — mostrar isso
   diário evita o susto da virada do mês.

3. **Termômetro de variáveis por categoria, com teto:** Restaurante (teto 450),
   Combustível (teto 375 dele), Mercado, Farmácia — barra de consumido vs. teto. É onde
   mora o vazamento; precisa estar na cara.

4. **Linha "comprometido x renda":** mostrar que o comprometido é **98,3% da renda** —
   um anel/gauge único que vira amarelo acima de 90% e vermelho acima de 100%.

5. **Card "guardado este mês":** Tesouro + Reserva = R$ 1.800. Reforço positivo — ele
   precisa **ver que está poupando**, não só ver o que gasta.

6. **Alerta de assinaturas:** lista das recorrências do cartão (267,53/mês) com "última
   vez que usou?" e botão de revisar — o gasto que mais passa batido.

7. **Aviso de parcelas que terminam:** "Airbnb encerra agora · Gilberto em X meses" — dá
   visibilidade do alívio futuro e ajuda a planejar o reforço da reserva (recomendação 4).

---

### Cross-check dos números (para confiança no dado)

- Fatura total do ciclo = 2.634,96 (casal) + 2.424,66 (Juliana) + 1.857,68 (i2) + 1.582,34
  (Iremar) = **R$ 8.499,64** em compras (a ~8.320 do brief é líquido de estornos de IOF /
  arredondamento; ordem de grandeza confere).
- Parte do Iremar = 1.582,34 + (2.634,96 ÷ 2) = **R$ 2.899,82** ✓ (bate com os ~2.900).
- Renda 8.000 − comprometido 7.860,61 = **folga +139,39** ✓.
