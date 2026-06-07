# 07 — Roadmap Prioritário 90 dias

**Agente:** Diana, Family CFO
**Data:** 2026-05-20

---

## Fio condutor

Cada onda entrega UMA frase que o Iremar vai poder dizer no fim. Não é checklist de feature — é evolução de capacidade.

---

## ONDA 1 — Fundação (semanas 1-2 · até 03/jun)

**Frase do Iremar ao fim:** *"O app me avisa antes do problema e nunca mais me deixa esquecer uma conta."*

| # | Entrega | Squad | Esforço |
|---|---|---|---|
| 1 | **Push 3/2/1 dia antes do vencimento + dia do vencimento** (A1+A2) | i2-cartao-control | M |
| 2 | **Redesign Dashboard — Zona 1 "O que fazer hoje"** (Action Cards no topo) | i2-design | M |
| 3 | **Migrar Tesouro Direto + Reserva de despesa para transferência** (M1) | i2-financas | P |
| 4 | **Banner Zona 2 "Folga do cartão"** (cálculo simples: limite − comprometido) | i2-design + i2-cartao-control | P |

**Validação:** time-de-testes confirma push em D-3/D-2/D-1/D0 disparando. KPI de despesa do mês NÃO inclui mais Tesouro/Reserva (sobe ~R$ 1.700 a margem). Dashboard abre com 90% de informação acionável no fold.

---

## ONDA 2 — Visibilidade (semanas 3-6 · até 30/jun)

**Frase do Iremar ao fim:** *"Eu sei agora, todo dia, quanto posso gastar no cartão sem estourar."*

| # | Entrega | Squad | Esforço |
|---|---|---|---|
| 5 | **Previsão de fatura** (projeção linear + alvo) — A3 | i2-cartao-control + Lara | M |
| 6 | **Alerta de anomalia** (A4 — vai para Juliana) | i2-cartao-control + Lara | M |
| 7 | **Sunday Brief** (A9) | i2-cartao-control | M |
| 8 | **Conversa Juliana ↔ Iremar** (comentário em transação + "Alertar Iremar") — M7 | i2-paridade-ux + i2-design | M |
| 9 | **Calendário financeiro mensal** — M12 | i2-design | M |

**Validação:** Juliana consegue marcar uma anomalia, Iremar recebe push em <30s, abre e vê. Previsão de fatura erra <10% nos primeiros 30 dias (medido em ciclo de junho).

---

## ONDA 3 — Planejamento (semanas 7-10 · até 28/jul)

**Frase do Iremar ao fim:** *"Eu vejo minhas metas se aproximando — e sei o que está atrapalhando."*

| # | Entrega | Squad | Esforço |
|---|---|---|---|
| 10 | **Módulo Metas v1** (acumular + reserva, sem aposentadoria) — M4 | i2-financas | G |
| 11 | **Dashboard Zona 3** com cards de meta | i2-design | M |
| 12 | **Orçamento por categoria com semáforo** v1 — M5 | i2-design + i2-financas | M |
| 13 | **Cálculo "esse gasto atrasa a meta em X dias"** — Lara | i2-financas + Lara | M |
| 14 | **Diferenciação PF × PJ no dashboard** — M11 | i2-design + i2-financas | P |

**Validação:** Iremar cria 3 metas (viagem, reserva, carro). Vê em 1 tela o impacto de R$ 500 extra de iFood nas datas das metas. Time-de-testes valida cálculo de atraso.

---

## ONDA 4 — Refinamento (semanas 11-13 · até 18/ago)

**Frase do Iremar ao fim:** *"O app pegou três coisas que eu não tinha visto — e me devolveu dinheiro."*

| # | Entrega | Squad | Esforço |
|---|---|---|---|
| 15 | **Detector de assinaturas duplicadas/órfãs** — M8 | i2-financas | M |
| 16 | **Histórico comparativo** (este mês vs média vs ano passado) — M13 | i2-financas | M |
| 17 | **Modo férias** (silencia alertas de orçamento) — M14 | i2-cartao-control | P |
| 18 | **Simulador "e se eu...?"** v1 — M10 | i2-financas | G |
| 19 | **Aposentadoria — visão de 20 anos** — M15 | i2-financas | G |

**Validação:** Iremar recebe lista de assinaturas suspeitas, cancela ≥1, registra economia. Simulador roda cenário "trocar carro" e mostra impacto em 5 metas + margem.

---

## Capacidade evolutiva (a cada onda)

| Antes Onda 1 | Depois Onda 4 |
|---|---|
| App reativo | App preditivo |
| Números no escuro | Cada R$ ligado a meta |
| KPI mente (investe = despesa) | KPI honesto (investe = patrimônio) |
| Canal mudo entre o casal | Conversa pelo app |
| Decisão por intuição | Decisão por simulação |

## Conexões com squads existentes

- **i2-design** — recebe specs visuais de M2, M4, M5, M7, M9, M11, M12. Trabalho concentrado em Ondas 1-3.
- **i2-cartao-control** — dono dos alertas (A1-A10) + Service Worker + cron. Trabalho contínuo em Ondas 1-4.
- **i2-financas** — modelagem de metas, orçamento, assinaturas, simulação. Trabalho pesado nas Ondas 3-4.
- **i2-paridade-ux** — garante que cada feature aparece nos dashboards Admin (Iremar) E Operator (Juliana).
- **i2-data-consistency** — glossário consistente em todas as labels novas (folga, comprometido, semáforo).
- **i2-historico-import v2** — quando trouxer 5 anos de histórico, alimenta cálculo de média/mediana para A4, A5, M13.
- **i2-backup-restore** — snapshot ANTES de cada onda (regra permanente).

## Squads que talvez precisem ser criados (recomendação)

1. **i2-metas** — se módulo de metas crescer, vira squad próprio (Onda 3 em diante).
2. **i2-insights** — agregar Lara + analytics + Sunday Brief + anomalias (Onda 2-4).
3. **i2-comunicacao-casal** — se a conversa pelo app virar feature rica (comentários, decisões compartilhadas, aprovação dupla em gasto >R$ X).

Não criar antes da Onda 2 — risco de squad sem trabalho real.

## Princípio que não muda nas 4 ondas

> **Toda mudança visual replica nos 2 dashboards.**
> **Snapshot antes de mudança em massa.**
> **Time-de-testes valida antes de produção.**
> **PF não mistura com PJ.**

Essas 4 regras das memórias estão acima de qualquer onda.
