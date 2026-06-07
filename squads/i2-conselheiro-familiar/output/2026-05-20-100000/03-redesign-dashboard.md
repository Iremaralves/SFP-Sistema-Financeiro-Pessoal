# 03 — Redesign Conceitual do Dashboard Inicial

**Agente:** Mateus, Behavioral Economist + UX Strategist
**Data:** 2026-05-20
**Para:** squad i2-design implementar

---

## Princípio único

> **O dashboard não responde "como estou?". Responde "o que decido hoje?"**

O Iremar abre o app de manhã, no celular, com café na mão, 90 segundos. Cada pixel disputa atenção. Se ele rolar para baixo procurando informação, **o dashboard falhou**.

Inspirações: Monzo (semáforo de "safe to spend"), Mint (alertas no topo), YNAB (cada R$ tem dono), Nubank (números grandes, ação clara).

## Estrutura em 3 zonas

```
╔══════════════════════════════════════════════╗
║                                              ║
║   ZONA 1 — O QUE FAZER HOJE (acionável)     ║
║                                              ║
║   ┌────────────────────────────────────┐    ║
║   │ HOJE · Quarta, 20 mai              │    ║
║   │                                    │    ║
║   │ 🔴  DAS Simples vence HOJE         │    ║
║   │     R$ 2.600,21 · boleto · da i2   │    ║
║   │     [Marcar como pago]             │    ║
║   │                                    │    ║
║   │ 🟡  INSS vence HOJE                │    ║
║   │     R$ 550,00 · boleto · da i2     │    ║
║   │     [Marcar como pago]             │    ║
║   │                                    │    ║
║   │ ────────────────────────────       │    ║
║   │                                    │    ║
║   │ Próximos 7 dias:                   │    ║
║   │ • Feira de casa (21/05) R$ 1.200   │    ║
║   │ • Apartamento (21/05) R$ 175       │    ║
║   │ • Seguro carro (28/05) R$ 247      │    ║
║   │                                    │    ║
║   │ Total da semana: R$ 1.622          │    ║
║   └────────────────────────────────────┘    ║
║                                              ║
║──────────────────────────────────────────────║
║                                              ║
║   ZONA 2 — COMO VOCÊ ESTÁ (status)          ║
║                                              ║
║   ┌──────────────┬──────────────────────┐   ║
║   │  💳 CARTÃO   │  Ciclo 14/04→13/05   │   ║
║   │              │                      │   ║
║   │  R$ 3.247    │  ▓▓▓▓▓▓░░░░ 65%      │   ║
║   │  comprometido│                      │   ║
║   │              │  Folga: R$ 1.753     │   ║
║   │              │  Previsão fim: 3.900 │   ║
║   │              │                      │   ║
║   │              │  💡 No ritmo atual,  │   ║
║   │              │     fecha em R$ 3.900│   ║
║   │              │     (alvo R$ 4.000)  │   ║
║   └──────────────┴──────────────────────┘   ║
║                                              ║
║   ┌──────────────────────────────────────┐  ║
║   │ Contas (saldo total: R$ 23.412)      │  ║
║   │ ────────────────────────────         │  ║
║   │ Conta Iremar (NU)     R$ 12.840      │  ║
║   │ Conta Juliana         R$  3.572      │  ║
║   │ Conta i2 (PJ)         R$  7.000      │  ║
║   │ ────────────────────────────         │  ║
║   │ Patrimônio investido  R$ 48.300 ↗   │  ║
║   └──────────────────────────────────────┘  ║
║                                              ║
║──────────────────────────────────────────────║
║                                              ║
║   ZONA 3 — ONDE QUER CHEGAR (objetivos)     ║
║                                              ║
║   ┌──────────────────────────────────────┐  ║
║   │ 🏖️  Viagem família · jan/27          │  ║
║   │     R$ 1.840 / R$ 6.000  (30%)       │  ║
║   │     ▓▓▓░░░░░░░░░░░  No ritmo ✓       │  ║
║   │                                      │  ║
║   │ 🚗 Carro novo · jul/27               │  ║
║   │     R$ 8.200 / R$ 35.000  (23%)      │  ║
║   │     ▓▓░░░░░░░░░░░░  Atrasa 2 meses   │  ║
║   │     se mantiver ritmo                │  ║
║   │                                      │  ║
║   │ 🛟 Reserva emergência · 6 meses      │  ║
║   │     R$ 32.400 / R$ 50.000  (65%)     │  ║
║   │     ▓▓▓▓▓▓▓░░░░░  No ritmo ✓         │  ║
║   └──────────────────────────────────────┘  ║
║                                              ║
║   [Ver todas as metas →]                    ║
║                                              ║
╚══════════════════════════════════════════════╝
```

## Regras de hierarquia

### Zona 1 — "O que fazer hoje"
- **Sempre no topo**, abre 100% visível sem scroll.
- Itens com **botão de ação** (marcar pago, ver detalhe). NUNCA só texto.
- Cores: 🔴 vence hoje · 🟡 vence em 1-2 dias · 🟢 vence em 3+ dias.
- Se não há nada urgente, mostrar **vazio celebratório**: *"Hoje tá leve. Próximo vencimento: 28/05 (Seguro carro)."*
- Sub-bloco "Próximos 7 dias" só aparece se >0 itens.

### Zona 2 — "Como você está"
- Cartão é o **HÉROI** desta zona (dor explícita do Iremar).
- Mostrar 3 coisas do cartão: **comprometido · folga · previsão**. Em palavras humanas.
- Saldos das contas em lista compacta, número grande à direita.
- Patrimônio investido em **linha separada com seta de tendência** (não vira despesa nunca).

### Zona 3 — "Onde quer chegar"
- Cada meta = 1 linha visual de progresso + 1 verdade emocional.
- Estado: **"No ritmo ✓"** ou **"Atrasa N meses"** (com causa quando possível: *"gasto em iFood este mês"*).
- Tom: nunca culpa, sempre fato + decisão possível.

## Princípios comportamentais aplicados

1. **Loss aversion** — atraso na meta dói mais que ganho. Por isso "atrasa 2 meses" tem mais peso visual que "no ritmo".
2. **Choice architecture** — Zona 1 oferece o botão de ação ao lado do problema. Reduz fricção decisão→ato a 0 clique extra.
3. **Default to silence** — quando está tudo bem, o dashboard fica **leve**, não enche de gráfico. Inspiração: Monzo.
4. **Mental accounting** — Zonas 1/2/3 reproduzem os 3 "bolsos mentais" do casal (obrigação · realidade · sonho).
5. **Anchoring honesto** — número grande é o que importa AGORA (folga do cartão, total da semana). Outros menores.

## Variantes para Juliana (Operator)

A Juliana entra no mesmo dashboard, mas:
- Zona 1 mostra também **"Categorizar 12 transações pendentes"** se houver fila.
- Zona 2 do cartão tem botão **"⚠ Alertar Iremar"** que abre uma conversa rápida.
- Zona 3 idêntica (visibilidade da meta = motiva categorização correta).

## Estados especiais

- **Domingo de manhã** — substituir Zona 1 por "Sunday Brief" (semana que passou + semana que vem).
- **Dia de pagamento (dia 5)** — destacar entrada de pró-labore como banner verde sutil.
- **Pós-fechamento do cartão** — Zona 2 mostra fatura fechada + 30 dias até próximo fechamento.

## O que NÃO mostrar no dashboard inicial

- Gráficos grandes de pizza/barra (vão para `/relatorios`).
- Listas longas de transações (vão para `/lancamentos`).
- Configurações, categorias, regras.
- Métricas vaidade (total movimentado, número de transações).

## Handoff para i2-design

- Mobile-first, single-column.
- Tipografia: número grande (R$) em peso 600, descrição em 400.
- Cores: usar tokens já existentes do Tailwind v4 (no novo design).
- Componente novo: `<ActionCard>` (Zona 1) + `<MetricTile>` (Zona 2) + `<GoalRow>` (Zona 3).
- Persistir colapso/expansão de cada zona (preferência por usuário).
- Animação: quando "Marcar como pago" da Zona 1, o item desliza para fora e a Zona 2 atualiza saldo em tempo real (otimista).
