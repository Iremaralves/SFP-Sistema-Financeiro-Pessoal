# 02 — Mapa Proativo de Melhorias

**Agente:** Diana, Family CFO
**Data:** 2026-05-20
**Critério:** dores que o Iremar ainda NÃO pediu, mas vai pedir em 3-6 meses.

Esforço: P (≤2 dias) · M (3-7 dias) · G (>1 semana)
Prioridade: 1 (próximas 2 sem) · 2 (mês 1-2) · 3 (mês 3+)

---

### M1 — "Investimento é patrimônio, não despesa"
- **Dor (voz Iremar):** *"Toda vez que aplico R$ 1.000 no Tesouro, meu KPI de despesa sobe e parece que eu gastei. Não gastei — só mudei de bolso."*
- **Valor:** KPI de poupança/patrimônio passa a refletir realidade. Decisão de "posso aplicar mais?" fica honesta.
- **Esforço:** P · **Prioridade:** 1 · **Squad:** i2-financas
- **Risco de não fazer:** Iremar passa a desconfiar de todos os números de despesa. Perde confiança no app.

### M2 — Push 3/2/1 dias antes do vencimento (worker + cron)
- **Dor:** *"Esqueci a Drogasil parcelada e o cartão veio com juros."*
- **Valor:** R$ 200-500/ano em juros e multas evitados. Paz mental.
- **Esforço:** M · **Prioridade:** 1 · **Squad:** i2-cartao-control
- **Risco:** continua acontecendo. Erosão de confiança no sistema.

### M3 — Previsão de fatura do cartão (projeção até fechamento)
- **Dor:** *"Estou no dia 5 do ciclo. Fecho dia 13 da próxima. Posso passar a viagem da Helena no cartão ou estouro?"*
- **Valor:** Decisão consciente. Evita 1-2 estouros/ano de R$ 500-1.500.
- **Esforço:** M · **Prioridade:** 1 · **Squad:** i2-cartao-control
- **Risco:** surpresa na fatura, que ele já citou explicitamente como dor.

### M4 — Cofres de metas (viagem, casa, carro, reserva)
- **Dor:** *"Eu quero levar as meninas pra praia em janeiro. Tenho que poupar R$ 600/mês. Estou conseguindo?"*
- **Valor:** Liga toda transação ao objetivo de vida. Vira régua emocional.
- **Esforço:** G · **Prioridade:** 2 · **Squad:** i2-financas + i2-design
- **Risco:** "Pizza come a viagem" continua acontecendo no escuro.

### M5 — Orçamento por categoria com semáforo
- **Dor:** *"Quanto gastei em mercado esse mês? Já estourei? Estou no ritmo?"*
- **Valor:** Câmara antecipada — corrige curso no dia 15, não no dia 30.
- **Esforço:** M · **Prioridade:** 2 · **Squad:** i2-design + i2-financas
- **Risco:** Sem teto, sem aviso. Sem aviso, sem correção.

### M6 — Insight semanal automático (Sunday Brief)
- **Dor:** *"Domingo de manhã eu quero saber: como foi a semana? O que vem essa semana?"*
- **Valor:** 1 push/semana com a verdade: top 3 gastos, próximas contas, ritmo de meta. 90s de leitura.
- **Esforço:** M · **Prioridade:** 2 · **Squad:** i2-cartao-control (engine de alerta)
- **Risco:** Iremar precisa abrir o app para saber. Não é proativo.

### M7 — Conversa Juliana ↔ Iremar dentro do app
- **Dor (Juliana):** *"Vi um gasto estranho do Atacadão. Mando whats ou anoto no app? Vai perder."*
- **Valor:** Comentário em transação + "marcar para revisar". Reduz fricção do canal mudo.
- **Esforço:** M · **Prioridade:** 2 · **Squad:** i2-paridade-ux + i2-design
- **Risco:** Inteligência da Juliana continua escapando do sistema.

### M8 — Detector de assinaturas duplicadas/órfãs
- **Dor:** *"Será que tô pagando Netflix duas vezes? Tinha um Globoplay que cancelei?"*
- **Valor:** R$ 50-200/mês recuperados em assinaturas zumbi. Pagamento em 1 mês.
- **Esforço:** M · **Prioridade:** 3 · **Squad:** i2-financas
- **Risco:** Sangria silenciosa. Já há pistas (Claude.Ai R$ 1.143 + R$ 800 + R$ 570 em 3 meses — variação estranha).

### M9 — Anomalia de gasto ("essa transação está fora do padrão")
- **Dor:** *"Esse R$ 1.119 do Atacadão era normal ou foi compra de mês?"*
- **Valor:** Detecta erro de digitação, fraude, ou estoque (compra de 60 dias num mês). Reduz pânico.
- **Esforço:** G · **Prioridade:** 3 · **Squad:** i2-financas + Lara
- **Risco:** Fraude passa batida. Ou pior, alarme falso vira "cry wolf".

### M10 — Simulador de decisão ("e se eu...?")
- **Dor:** *"E se eu trocar o carro? E se as filhas mudarem de escola? E se eu aumentar pró-labore?"*
- **Valor:** Decisão de R$ 30k+ feita com dado, não com Excel improvisado.
- **Esforço:** G · **Prioridade:** 3 · **Squad:** i2-financas
- **Risco:** Decisão grande fica sem teste. Arrependimento caro.

### M11 — Diferenciação PF × PJ no dashboard (Fator R)
- **Dor:** *"Pró-labore R$ 5k + lucros R$ 3k. Estou no Fator R? Quanto sai da i2 esse mês?"*
- **Valor:** Compliance + planejamento tributário. Visualização em UMA tela.
- **Esforço:** P · **Prioridade:** 2 · **Squad:** i2-financas + i2-design
- **Risco:** Quebra de Fator R = imposto maior. Já é regra permanente das memórias.

### M12 — Calendário financeiro mensal (vista de mês inteiro)
- **Dor:** *"Quero ver o mês inteiro de uma vez — todos os vencimentos, todos os recebimentos."*
- **Valor:** Planejamento de fluxo de caixa. Antecipa apertos de 3ª semana.
- **Esforço:** M · **Prioridade:** 2 · **Squad:** i2-design

### M13 — Histórico comparativo (este mês vs média 3m vs mesmo mês ano passado)
- **Dor:** *"Esse mês a conta de luz veio mais cara. Foi sazonal ou tendência?"*
- **Valor:** Contexto. Tira drama de variação normal, levanta bandeira em tendência real.
- **Esforço:** M · **Prioridade:** 3 · **Squad:** i2-financas

### M14 — Modo "férias" (perfil de gasto temporário)
- **Dor:** *"Estamos viajando 10 dias. Os alertas não deviam disparar 'estourou mercado' porque a gente comeu fora todo dia."*
- **Valor:** Sistema não vira inimigo nos momentos especiais.
- **Esforço:** P · **Prioridade:** 3 · **Squad:** i2-cartao-control

### M15 — Aposentadoria (visão de 20 anos)
- **Dor implícita:** *"Tenho 40+. Reserva R$ 700/mês + Tesouro R$ 1k/mês me leva onde aos 60?"*
- **Valor:** Decisão maior da vida financeira do casal, hoje invisível.
- **Esforço:** G · **Prioridade:** 3 · **Squad:** i2-financas

---

## Conclusão estratégica

As 15 melhorias se agrupam em 4 famílias:
1. **Antecipação** (M2, M3, M6, M9, M12) — sistema fala antes do problema.
2. **Verdade dos números** (M1, M8, M11) — KPI honesto.
3. **Objetivo de vida** (M4, M5, M10, M13, M15) — número vira sentido.
4. **Casal** (M7, M14) — Iremar e Juliana conversam pelo app.

A Onda 1 (próximas 2 semanas) deve atacar M1 + M2 + M3 — porque os 3 corrigem **honestidade do KPI** e **antecipação básica**, e desbloqueiam confiança para tudo que vem depois.
