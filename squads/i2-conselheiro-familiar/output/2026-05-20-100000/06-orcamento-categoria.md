# 06 — Orçamento por Categoria (Semáforo)

**Agente:** Mateus, Behavioral Economist + UX Strategist
**Data:** 2026-05-20

---

## Princípio

> *"Não dizemos quanto gastar. Mostramos quanto sobra."*

A diferença é tudo. "Você gastou R$ 850 em iFood" é acusação. "Sobra R$ 150 de iFood até dia 31" é informação. O sistema fala em **folga**, nunca em **excesso**.

Inspiração: YNAB ("every dollar has a job"), Mint (semáforo), Monzo (Targets). Adaptação: brasileira, microempresa+família, com categorias reais que já saem dos CSVs do Nubank/Bradesco.

## Categorias-base (sugeridas a partir dos dados reais)

Olhando 60 dias de transações do Iremar, as categorias com volume e variabilidade que justificam orçamento:

| Categoria | Gasto médio 90d | Sugestão de limite | Variável? |
|---|---|---|---|
| Mercado (Atacadão, supermercado) | ~R$ 1.700 | R$ 1.800 | Sim |
| Farmácia / Saúde | ~R$ 700 | R$ 600 | Sim |
| iFood / Delivery | ~R$ 400 (estimado) | R$ 300 | Sim |
| Combustível (Petrobras) | ~R$ 500 | R$ 500 | Sim |
| Lazer / Restaurantes | a definir | R$ 400 | Sim |
| Educação filhas | R$ 2.343 | fixo | Não |
| Plano saúde | R$ 355 | fixo | Não |
| Assinaturas (Claude, Netflix, etc) | ~R$ 1.500 | R$ 1.000 | Sim |

Categorias **fixas** não entram no semáforo (não há decisão). Categorias **variáveis** entram.

## Lógica do semáforo

Para cada categoria variável, no dia D do mês:

```
% mês decorrido  = D / dias_no_mês
% orçamento gasto = gasto_acumulado / limite
desvio = (% orçamento gasto) − (% mês decorrido)

if desvio ≤ -0.05  → 🟢 verde  ("folga: sobra R$X")
if -0.05 < desvio ≤ 0.10 → 🟡 amarelo  ("no ritmo, mas atento")
if desvio > 0.10  → 🔴 vermelho ("ritmo atual estoura em R$Y")
```

Quando **vermelho**, NÃO bloqueia. Mostra: *"No ritmo atual, fecha o mês em R$ 2.150 (limite R$ 1.800). Para fechar dentro, considere R$ 50/dia até dia 31."*

## UI conceitual

```
┌───────────────────────────────────────────────┐
│ Orçamento de maio · 60% do mês decorrido      │
├───────────────────────────────────────────────┤
│                                               │
│ 🛒 Mercado            R$ 1.090 / R$ 1.800     │
│ 🟡 ▓▓▓▓▓▓▓▓░░░░░░ 61% · sobra R$ 710          │
│    No ritmo. Última compra: 14/05 R$ 532      │
│                                               │
│ 💊 Farmácia           R$ 470 / R$ 600         │
│ 🔴 ▓▓▓▓▓▓▓▓▓▓▓░░ 78% · sobra R$ 130           │
│    Acima do ritmo. No mesmo ritmo, fecha 783. │
│    Considera R$ 6/dia até dia 31.             │
│                                               │
│ 🍕 iFood              R$ 80 / R$ 300          │
│ 🟢 ▓▓▓░░░░░░░░░░░ 26% · sobra R$ 220          │
│    Tranquilo.                                 │
│                                               │
│ ⛽ Combustível        R$ 263 / R$ 500         │
│ 🟢 ▓▓▓▓▓░░░░░░░░░ 52% · sobra R$ 237          │
│                                               │
│ 📺 Assinaturas        R$ 1.143 / R$ 1.000     │
│ 🔴 ▓▓▓▓▓▓▓▓▓▓▓▓ 114% · estourou R$ 143        │
│    Claude.Ai veio R$ 1.143 em 02/05.          │
│    Revisar limite? [Sim] [Manter]             │
│                                               │
└───────────────────────────────────────────────┘
```

## Regras de comportamento

1. **Limite vem do próprio histórico**, não de "moeda padrão". Sugerir limite = `média_3m × 1.1` no primeiro mês. Usuário ajusta.
2. **Rebalanceamento livre** — se "sobra R$ 200 de Mercado", Iremar pode arrastar para "iFood". Mental accounting saudável.
3. **Estouro não é falha** — sistema oferece: ajustar limite ou ajustar comportamento. Sem julgamento.
4. **Categoria fixa nunca entra** — DAS, INSS, escola, plano saúde. São obrigação, não escolha.
5. **Categoria nova auto-criada NÃO entra** com limite — fica em "sem orçamento" até o Iremar querer.

## Inteligência adicional (para Lara)

- **Forecast linear** + **ajuste sazonal** (fim de mês mercado sobe; início de mês farmácia sobe).
- **Detecção de "compra de mês"** — Atacadão R$ 1.119 num dia → marca como **anormal positivo** e diminui projeção dos próximos dias.
- **Sugestão de limite** baseada em mediana + desvio-padrão, não média. Robusto a outliers.

## O que NÃO fazer

- ❌ Ranking ("você gastou mais que 70% das pessoas") — irrelevante e moralizante.
- ❌ Conquistas/badges. Não é jogo, é vida.
- ❌ Bloqueio de gasto. O sistema avisa, o humano decide.
- ❌ Cor vermelho-fogo. Usar vermelho discreto (Tailwind `red-500`, não `red-700`).
- ❌ Notificação push para "atingiu 80%". Só notifica em 100% e 110% — antes é ruído.

## Integração com Metas (doc 05)

Quando uma categoria fecha em **verde** consistentemente (3 meses), o sistema sugere:

> *"Você gastou R$ 200 a menos em iFood nos últimos 3 meses. Quer redirecionar para a meta 'Viagem família'?"*

Esse loop conecta **comportamento** com **objetivo**. É o coração do produto.

## Para o squad i2-design implementar

- Componente `<BudgetRow>` (categoria + barra + sobra/estouro + cor).
- Página `/orcamento` (visão mensal completa).
- Card-resumo no dashboard (Zona 2, opcional, colapsável): "3 verdes · 2 amarelos · 1 vermelho · [ver detalhe]".
- Toggle "esconder categorias verdes" para reduzir ruído visual.
