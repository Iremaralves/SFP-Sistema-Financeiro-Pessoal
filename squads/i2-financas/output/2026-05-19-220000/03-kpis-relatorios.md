# 03 — KPIs e Relatórios (Paula, CFO)

> Cada KPI responde: **"O que faço com isso amanhã de manhã?"**
> Cada relatório tem: estrutura textual + entrada de dados + cálculo + ação esperada.

---

## PARTE A — KPIs ESSENCIAIS PESSOA FÍSICA

### KPI-PF1 — Taxa de Poupança (Savings Rate)

- **Fórmula**: `(Receita do mês − Gastos do mês) / Receita do mês`
- **Entrada**: soma das receitas (pró-labore + lucros + salário Juliana) − soma de gastos categorizados (excluindo investimento)
- **Meta saudável**: ≥ 20%
- **Faixas**:
  - 🟢 ≥ 25% — está construindo patrimônio
  - 🟡 15–24% — ok, mas pouco buffer
  - 🔴 < 15% — orçamento apertado, revisar variáveis
- **Ação**: se 🔴 dois meses seguidos, reunião de orçamento; cortar primeiro lazer e restaurante (variáveis controláveis).

### KPI-PF2 — % de Custo Fixo sobre Receita

- **Fórmula**: `Σ (recurring_commitments com responsible ≠ i2 e variable=false) / Receita PF`
- **Meta**: ≤ 60% da receita líquida
- **Por que importa**: % alto = pouca flexibilidade pra absorver imprevistos
- **Ação**: se > 65%, decisão estrutural — não dá pra resolver cortando café. Renegociar contratos (internet, plano de saúde, escola).

### KPI-PF3 — Cobertura de Reserva (em meses)

- **Fórmula**: `Saldo investment-Caixinha / (Custo Fixo Essencial mensal)`
- **Meta**: 6 meses de custo fixo essencial
- **Hoje custo fixo essencial estimado**: ~R$ 4.000 (escolas + plano saúde + condomínio + IPTU + internet + transporte fixo)
- **Meta de saldo da reserva**: R$ 24.000
- **Ação**: se < 3 meses, aumentar aporte mensal; se > 9 meses, migrar excedente para investimento de prazo maior.

### KPI-PF4 — Burn Rate semanal (gasto variável)

- **Fórmula**: gasto variável dos últimos 7 dias ÷ 7
- **Meta**: ≤ R$ 200/dia (estimativa inicial, calibrar)
- **Ação**: usado em alerta de PWA — "você passou da média semanal em 30%, faltam 12 dias do mês". Acionável em tempo real, diferente dos KPIs mensais.

### KPI-PF5 — Acerto Casal (saldo pendente Iremar × Juliana)

- **Fórmula**: `(parte_juliana_no_casal − transferências_recebidas) − (parte_iremar_pagou_por_juliana)`
- **Meta**: zero no dia 13
- **Ação**: dashboard mostra "Juliana deve R$ X" ou "Iremar deve R$ Y" desde o dia 14 do mês atual. Se passar de R$ 2.000 antes do dia 13, alerta amarelo.

### KPI-PF6 — Concentração em "Compras Pessoais" sobre Receita Individual

- **Fórmula PF**: `Compras Pessoais Iremar / Pró-labore` e `Compras Pessoais Juliana / Salário Juliana`
- **Meta**: ≤ 15% individual
- **Por que importa**: respeitando o que é privado de cada um, garante que ninguém esteja consumindo desproporcionalmente o orçamento individual.

---

## PARTE B — KPIs ESSENCIAIS PESSOA JURÍDICA (i2 Soluções)

### KPI-PJ1 — Fator R (12 meses móveis)

- **Fórmula**: `Σ (Pró-labore + Salários + INSS) últimos 12 meses / Σ Receita Bruta últimos 12 meses`
- **Meta**: **≥ 28%** (limiar do Anexo III)
- **Faixas**:
  - 🟢 ≥ 30% — folga, segurança no Anexo III
  - 🟡 28–30% — atenção, qualquer queda de receita ou aumento de NF aprovada pode jogar pra V
  - 🔴 < 28% — Anexo V acionado, DAS dispara
- **Ação**: se 🟡 ou 🔴, aumentar pró-labore. Cada R$ 100 de pró-labore extra pode salvar muito mais em DAS.

### KPI-PJ2 — Margem Líquida PJ

- **Fórmula**: `(Receita − Folha − Impostos − Custo Op fixo − Custo Op variável − Distribuição) / Receita`
- **Meta**: ≥ 30%
- **Ação**: se margem cair < 25%, revisar mix de clientes ou SaaS (Claude.Ai R$ 2.500/mês concentrado é risco).

### KPI-PJ3 — Custo Fixo Mensal PJ

- **Fórmula**: `Σ recurring_commitments[entity=i2, variable=false]` (DAS + INSS + pró-labore + SaaS recorrentes)
- **Hoje**: pró-labore R$ 5.000 + DAS R$ 2.600 + INSS R$ 550 ≈ R$ 8.150 fixo
- **Ação**: faturamento mínimo de equilíbrio = R$ 8.150 ÷ (1 − % impostos) ≈ **R$ 11.500/mês** (faturar menos = está queimando reserva PJ).

### KPI-PJ4 — Concentração de SaaS

- **Fórmula**: maior SaaS / total SaaS PJ
- **Meta**: ≤ 35%
- **Ação**: hoje "Claude.Ai" tem 3 transações somando R$ 2.514. Se > 40% do total de SaaS, plano de mitigação (cap mensal, plano anual, alternativa).

### KPI-PJ5 — Dias para vencer DAS

- **Fórmula**: `due_date(DAS do mês) − hoje`
- **Faixas**: ≤ 5 dias = vermelho, NF do mês precisa estar emitida e somada.
- **Ação**: alerta direto no dashboard PJ.

### KPI-PJ6 — Pró-labore vs Distribuição

- **Fórmula**: `pró-labore / (pró-labore + lucros) últimos 12m`
- **Por que importa**: muito lucro e pouco pró-labore = Fator R baixo = risco fiscal. Excesso de pró-labore = INSS desnecessário.
- **Faixa ótima**: 50%–70%, ajustar conforme Fator R.

---

## PARTE C — RELATÓRIOS RELEVANTES (NOVOS + ESPECIFICAÇÃO)

### R1 — Dashboard Executivo PF (já existe parcial — incrementar)

**Entrada**: ciclo atual + mês calendário atual
**Estrutura textual**:
```
┌──────────────────────────────────────────────┐
│ MAIO/2026                                    │
├──────────────────────────────────────────────┤
│ Receita                R$ 8.000  (100%)      │
│ Gastos                 R$ 6.400  (80%)       │
│ Sobrou                 R$ 1.600  (20%) 🟡    │
├──────────────────────────────────────────────┤
│ Custo Fixo:  R$ 4.100  (51% receita) 🟢      │
│ Variável:    R$ 1.800  (23%)                 │
│ Pessoal:     R$ 500    (6%)                  │
├──────────────────────────────────────────────┤
│ Reserva:     R$ 12.500 (3,1 meses) 🟡        │
│ Acerto Casal: Juliana deve R$ 420            │
└──────────────────────────────────────────────┘
```
**Ação esperada**: o usuário olha 1x por dia (manhã) e decide se aprova um gasto extra hoje.

### R2 — DRE PJ Mensal (novo)

**Entrada**: transações da i2 do mês + income_records + fiscal_notes
**Estrutura**:
```
DRE — i2 Soluções — Maio/2026

(+) Receita Bruta NF                R$ 18.500
(-) DAS                              (R$ 2.700)
(-) ISS retido                       (R$    -)
    = Receita Líquida                R$ 15.800

(-) Pró-labore Iremar               (R$ 5.000)
(-) INSS                            (R$   550)
    = Resultado após Folha           R$ 10.250

(-) SaaS Dev                          (R$ 850)
(-) SaaS Produtividade                (R$ 280)
(-) SaaS Design                       (R$ 190)
(-) Terceirizados                     (R$ 300)
(-) Contador                          (R$ 400)
    = Resultado Operacional           R$ 8.230

(-) Retirada de Lucros              (R$ 3.000)
    = Caixa do mês                    R$ 5.230

KPIs:
- Margem líquida operacional: 52%
- Fator R 12m: 31,2% 🟢
- Custo fixo: R$ 9.270 (50% receita)
```
**Ação**: enviar para o contador todo mês como anexo do que ele recebe (vira fonte única).

### R3 — Top Estabelecimentos do Mês (novo)

**Entrada**: agrupar `transactions` por descrição normalizada
**Estrutura**:
```
Top 10 lugares onde seu dinheiro foi — Maio/2026
1. Atacadao             R$ 1.842  (15 visitas)  📈 +12% vs abril
2. Premmia (combustível) R$ 768   (4 abast.)   📉  -5%
3. Drogasil              R$ 412   (5 visitas)  📈 +30% ← alerta
4. Claude.Ai (PJ)        R$ 850   (1 cob.)    →
5. Escola Helena         R$ 1.393 (1 cob.)    →
...
```
**Ação**: alertas de variação > 25% MoM em estabelecimentos recorrentes.

### R4 — Calendário de Compromissos 30 dias (novo)

**Entrada**: `recurring_commitments` + `monthly_obligations` cruzados com saldo projetado
**Estrutura**:
```
PRÓXIMOS 30 DIAS

📅 24/05  R$ 1.200   Feira de casa          [pix · iremar]
📅 28/05  R$   246   Seguro carro           [boleto · iremar]
📅 05/06  R$ 5.000   Pró-labore             [pix · i2 → iremar]
📅 05/06  R$ 1.393   Escola Helena          [boleto · iremar]
📅 09/06  R$   355   Plano de saúde         [boleto · iremar]
📅 10/06  R$   250   Condomínio             [pix · iremar]
📅 10/06  R$   220   Terapia                [pix · iremar]
...
                    ──────────────
Total previsto      R$ 12.560
Saldo conjunto hoje R$ 14.300
Folga             + R$  1.740 🟡
```
**Ação**: ver folga antes de aprovar gasto não previsto.

### R5 — Fluxo de Caixa Projetado 90 dias (novo)

**Entrada**: receitas previstas (recorrentes) + obrigações + saldo atual
**Estrutura**: gráfico de linha (saldo dia a dia) + tabela semanal
```
Semana       Entradas    Saídas     Saldo final
25/05–31/05   +5.000    -2.800    R$ 16.500 🟢
01/06–07/06   +8.000    -7.200    R$ 17.300 🟢
08/06–14/06       0     -4.200    R$ 13.100 🟡  ← acerto dia 13
15/06–21/06       0     -2.800    R$ 10.300 🟡
22/06–28/06       0       -800    R$  9.500 🟡
...
```
**Regra de cor**: 🟢 saldo > 1 mês custo fixo · 🟡 saldo > 2 semanas · 🔴 saldo < 2 semanas
**Ação**: identificar buraco antecipado e adiantar fatura/lucros.

### R6 — Comparativo Mensal (novo)

**Entrada**: somatórios mensais por categoria
**Estrutura**:
```
GASTO POR CATEGORIA — Tendência

                  Mar   Abr   Mai   Δ Mar→Mai
Mercado        1.510 1.620 1.842    +22% 📈
Combustível      820   680   768     -6% →
Restaurante      420   510   680    +62% 📈 ⚠️
Saúde Farm.      280   320   412    +47% 📈 ⚠️
SaaS PJ          720   830   850    +18% 📈
```
**Ação**: revisar categorias que estouram +25% em 3 meses.

### R7 — Mapa Iremar × Juliana (novo) — fechamento do dia 13

**Entrada**: transactions casal + recurring_commitments com paid_by
**Estrutura**:
```
ACERTO MENSAL — Ciclo 13/04 → 12/05

CASAL — Fatura do cartão                R$ 4.200
  Parte de cada um (50%)                 R$ 2.100
  Já pago por Iremar via fatura         (R$ 4.200)
  Crédito para Iremar                    R$ 2.100

COMPROMISSOS PAGOS POR IREMAR (arca)
  Escola Helena, Escola Isabela, Plano Saúde,
  Condomínio, Apartamento (Juliana), Feira    R$ 4.563
  Parte Juliana (definir): R$ 2.281

COMPROMISSOS PAGOS POR JULIANA           R$ 0

TOTAL Juliana deve a Iremar              R$ 4.381
```
**Ação**: Juliana faz 1 PIX dia 13 fechando tudo.

### R8 — Saúde Fiscal (novo) — só para Iremar

**Entrada**: receitas (income_records) + NFs (fiscal_notes) + folha
**Estrutura**:
```
SAÚDE FISCAL — i2 Soluções (acumulado 12m)

Faturamento 12m              R$ 198.400
Folha 12m (Pró-lab+INSS)      R$ 66.600
Fator R                       33,6%   🟢 Anexo III
Distância do limite           5,6 p.p. (folga R$ 11.000 em faturamento)

ALERTAS:
🟢 DAS atual: R$ 2.600 (vs simulado Anexo V: R$ 4.180) — economia anual R$ 18.960
🟡 NF não emitida do mês: R$ 4.500 esperado, R$ 2.800 emitido até dia 19
🟢 Lucros distribuídos no ano: dentro da PJ está saudável
```
**Ação**: este é o **relatório para mandar ao contador** todo mês. Salva e-mail.

### R9 — Fila de "A Classificar" (operacional)

**Entrada**: `transactions WHERE category_id = ID(A Classificar)`
**Estrutura**: lista simples ordenada por valor desc + botão de categorização em 1 clique
**Ação**: meta = zerar até sexta-feira da semana.

---

## PARTE D — Mockups que vão para o squad i2-design

Os relatórios R1, R2, R5, R6, R7 precisam de visual cuidadoso. Especificação resumida que vai para o design:

- **R1 (Dashboard PF)**: 3 zonas — número grande de "sobrou", barras horizontais de fixo/variável/pessoal, cards de KPI
- **R2 (DRE PJ)**: tabela em camadas (receita → líquida → resultado → caixa), cada camada com sua cor de fundo cada vez mais clara
- **R5 (Fluxo 90d)**: gráfico de área com linha de "custo fixo essencial" como referência horizontal; pontos vermelhos onde cruza
- **R6 (Comparativo)**: heatmap leve — cada célula colorida pela intensidade do gasto naquela categoria/mês
- **R7 (Acerto)**: layout split-screen, lado esquerdo Iremar, direito Juliana, no rodapé o "saldo a transferir" gigante em verde/vermelho

---

## O que cada KPI **não** mede

- Felicidade. Se o casal estiver no vermelho 3 meses, primeiro pergunta se algo aconteceu — não enche de alerta de cartão.
- Performance individual. O sistema separa por responsable para acerto, não para julgar quem gastou mais.
- Status patrimonial completo (carro, imóvel, investimentos longos) — fora de escopo.
