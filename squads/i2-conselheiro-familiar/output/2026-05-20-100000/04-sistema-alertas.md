# 04 — Sistema de Alertas Inteligente

**Agente:** Lara, Predictive Analyst
**Data:** 2026-05-20
**Princípio:** *"Calar 99% do tempo. Falar com precisão cirúrgica no 1% que importa."*

---

## Filosofia (anti cry-wolf)

Cada alerta tem que passar em 3 filtros antes de disparar:

1. **Acionável** — o usuário pode FAZER algo em ≤2 cliques.
2. **Relevante** — ignora se já foi avisado essa semana sobre o mesmo tema.
3. **Calibrado** — threshold baseado em série histórica do PRÓPRIO Iremar, não em padrão genérico.

Se um alerta foi ignorado 3× pelo usuário, **silenciar automaticamente por 30 dias** e perguntar se quer desativar.

---

## Inventário de alertas (10 tipos)

### A1 — Vencimento próximo
- **Gatilho:** D-3, D-2, D-1, D0 de cada `recurring_commitment` ativo.
- **Canal:** Web Push + in-app banner. **NÃO** e-mail (ruído).
- **Tom:** *"DAS Simples vence em 2 dias (R$ 2.600,21, boleto). [Marcar pago] [Adiar lembrete]"*
- **Anti-spam:** se já marcou como pago, não dispara mais.
- **Calibração:** D-3 só dispara para boletos (Iremar precisa gerar). PIX só D-1 e D0.

### A2 — Vencimento atrasado
- **Gatilho:** D+1 sem registro de pagamento.
- **Canal:** Push **alto** + e-mail.
- **Tom:** *"O DAS venceu ontem. Confirma se já pagou? [Sim, marquei] [Pagar agora]"*
- **Cuidado:** evitar tom acusatório. Pergunta, não afirma.

### A3 — Projeção de fatura excede teto
- **Gatilho:** projeção linear (gastos do ciclo ÷ dias decorridos × dias totais) > 110% do **alvo definido pelo Iremar**.
- **Canal:** in-app (não push — não é urgente).
- **Tom:** *"No ritmo atual, fatura fecha em R$ 4.350 (alvo R$ 4.000). Folga restante: R$ 820 em 8 dias."*
- **Calibração:** só dispara quando ≥40% do ciclo já passou (antes disso, ruído estatístico).

### A4 — Gasto fora do padrão (anomalia)
- **Gatilho:** transação >2× a média móvel da categoria em 90 dias, **E** >R$ 200.
- **Canal:** in-app, **destinatário: Juliana** (operator), com botão "Confirmar gasto" ou "Marcar para Iremar".
- **Tom:** *"Atacadão R$ 1.119 — média dos últimos 3 meses: R$ 530. Foi compra grande?"*
- **Calibração:** NUNCA disparar para Atacadão se já houver outra anomalia do Atacadão nos últimos 14 dias (ela já viu).

### A5 — Categoria estourando no meio do mês
- **Gatilho:** dia 15 do mês, categoria já em ≥80% do orçamento.
- **Canal:** in-app.
- **Tom:** *"Mercado: R$ 1.450 de R$ 1.800 (80%). Faltam 15 dias. Considera segurar até dia 30?"*
- **Anti-culpa:** nunca usar "estourou". Sempre "faltam X dias / sobra Y reais".

### A6 — Meta atrasando
- **Gatilho:** projeção de chegada na meta atrasa >30 dias em relação ao alvo.
- **Canal:** in-app + e-mail mensal (resumo).
- **Tom:** *"Viagem família atrasa 1 mês no ritmo atual. Causa principal: gasto em iFood (R$ 540 vs média R$ 280)."*
- **Calibração:** só dispara se a meta tem >60 dias de histórico (antes disso, dados ruins).

### A7 — Assinatura suspeita (duplicada/órfã)
- **Gatilho:** mesmo merchant aparecendo 2× no mesmo ciclo, ou cobrança após cancelamento declarado.
- **Canal:** in-app, baixa prioridade.
- **Tom:** *"Cobrança Claude.Ai R$ 1.143 (mai), R$ 800 (abr), R$ 570 (mar). Variação estranha — quer revisar?"*

### A8 — Conta com saldo baixo perto de débito grande
- **Gatilho:** saldo da conta < próximo compromisso programado dela, com janela de 3 dias.
- **Canal:** push.
- **Tom:** *"Conta Iremar: R$ 1.840. Feira de casa (R$ 1.200) vence dia 21. Faltam R$ 360 de folga. [Transferir]"*

### A9 — Sunday Brief (proativo positivo)
- **Gatilho:** domingo 08:00.
- **Canal:** push + tela inicial.
- **Tom:** *"Semana passada: gastou R$ 1.247 (média: R$ 1.180). Semana que vem: 3 vencimentos (R$ 2.022). Metas no ritmo: 2/3."*
- **Sem culpa, sem nota.** Só fato.

### A10 — Confirmação de Juliana → Iremar (canal humano)
- **Gatilho:** Juliana clica "⚠ Alertar Iremar" em qualquer transação ou anomalia.
- **Canal:** push imediato no Iremar.
- **Tom:** *"Juliana marcou: 'Drogasil R$ 372 — pareceu duplicado. Confere?' [Ver transação]"*
- **Crítico:** este é o único alerta de canal humano. Tem prioridade visual máxima.

---

## Configuração por usuário

Cada alerta tem 3 estados:
- **ON** (default)
- **ON, silencioso** (dispara, mas não vibra)
- **OFF**

Iremar deve poder ajustar em `/configuracoes/alertas` com slider de "intensidade global" (Calmo · Padrão · Vigilante).

## Stack técnica recomendada (para i2-cartao-control implementar)

- Tabela `alerts_log` (id, user_id, alert_type, fired_at, status, payload).
- Cron diário às 07:00 (timezone São Paulo) para A1, A2, A3, A5, A6, A8.
- Cron domingo 08:00 para A9.
- Trigger em insert de `transactions` para A4 (anomalia) e A7 (assinatura).
- Web Push API + Service Worker (Iremar já pediu).
- Notificação interna (banner no topo do dashboard) como fallback.
- Tabela `alert_preferences` por usuário (alert_type, enabled, silent, snoozed_until).

## Métricas de qualidade do sistema de alertas

- **Taxa de ação** — % de alertas que resultaram em clique de ação. Alvo: >50%.
- **Taxa de dismiss** — % ignorados. Se >70% para um tipo, recalibrar threshold.
- **Tempo médio de resposta** — push → ação. Alvo: <4h para A1, <30min para A2/A8.
- **NPS de alerta** — pergunta trimestral: "Os alertas estão ajudando?". Resposta abaixo de 7 = revisão imediata.

## O alerta mais crítico (se só pudesse implementar UM)

**A1 — Vencimento próximo (D-3/D-2/D-1/D0)**. Resolve a dor explícita mais citada, é barato, e quebra o ciclo de "esqueci, paguei juros, perdi confiança no app". Tudo mais é consequência.
