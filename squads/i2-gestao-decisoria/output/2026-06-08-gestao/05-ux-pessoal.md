# 05 — Dashboard Pessoal Decisório (Iremar PF)

**Squad:** i2-gestao-decisoria · **Persona:** Lia — Product Designer de dashboards decisórios
**Data:** 2026-06-08 · **Fase 5 de N** · Escopo: **Pessoal** (PF puro, `entity_id = Família`)

> Lente desta fase: **a tela responde uma pergunta, não exibe um dado.** O Iremar abre o
> app no escopo Pessoal de manhã e precisa fechar quatro perguntas em um scroll, sem fazer
> conta de cabeça: *o que ainda pago? o que vence essa semana? o que recebo? posso passar o
> cartão?* Cada bloco abaixo nasce de uma dessas perguntas (Fase 1, P1–P5) e usa o modelo de
> orçamento da Fase 3 (teto − comprometido = disponível → cor) e os dados endurecidos da
> Fase 4b. O pilar inegociável continua: **nenhum número da i2 cruza pra cá.** A parte da i2
> na fatura (`i2Part`) some por completo do escopo Pessoal; ela só existe em Empresa.

---

## (0) Princípios de design da tela

1. **Hierarquia radical.** Uma resposta dominante no topo (`AnchorHero`), o resto desce em
   ordem de urgência: semáforo → semana → fatura → a receber. O olho do Iremar bate no
   número grande primeiro, e a cor do semáforo logo abaixo decide a compra.
2. **Cor é decisão, não enfeite.** Verde/amarelo/vermelho do semáforo carregam significado
   acionável (vai / pensa / não). Azul = Iremar, rosa = Juliana, ciano = Casal, âmbar = i2
   (proibido neste escopo). Nunca usar verde decorativo perto do semáforo, pra não diluir.
3. **Previsto nunca vira saldo.** Receita ainda não caída entra como "a receber" datado,
   jamais como folga gastável. O semáforo só respira dinheiro real (regra da Fase 3, §2).
4. **Mobile-first 375px.** Tudo é coluna única empilhada; desktop só ganha respiro e duas
   colunas onde sobra espaço. Toque mínimo 44px, números `tabular-nums`, dark glass.
5. **Reaproveitar antes de criar.** `AnchorHero`, `BillsCard`, `IncomeCard` já existem e
   servem 3 dos 4 blocos com pequenos ajustes de prop. Só dois componentes nascem novos:
   **BudgetGauge** (semáforo) e **WeekAhead** (janela de 7 dias).

---

## (1) Bloco A — AnchorHero PF reescrito: "sua parte da fatura"

**Pergunta que responde:** *qual é o número que importa do meu mês?* (P5)

### Layout (estrutura)
Reaproveita o `AnchorHero` existente, mas **muda o que o número grande significa no escopo
pessoal**. Hoje (l.40-47) ele mostra `faturaTotal` cru — que inclui `julianaPart + i2Part`.
A Fase 3 (§3) é taxativa: isso infla o orçamento do Iremar com gasto de terceiros. O número
grande passa a ser **`settlement.iremarPart`** (100% dos gastos `iremar` + 50% do `casal`).

- **Eyebrow:** `SUA PARTE DA FATURA` (uppercase, 10px, white/40).
- **Número grande:** `iremarPart` (5xl mobile, 6xl desktop, branco, tabular).
- **Sublabel:** `de R$ 4.200 totais · você paga, Juliana e i2 reembolsam` + ciclo
  (`fecha 28/06`). O total cru vira contexto, não protagonista.
- **Linha de impacto (nova prop):** abaixo do sublabel, uma frase-semáforo:
  `isso é 26% do seu mês 🟢`. É a ponte entre este bloco e o BudgetGauge logo abaixo.

### Dado de origem
`packages/core/src/settlement.ts` → `calculateInvoiceSettlement` (já entrega
`iremarPart / julianaPart / i2Part / total`) sobre o ciclo real da fatura. `faturaTotal`
continua disponível como sublabel. `faturaPctDoOrcamento = iremarPart / teto`
(`monthly_budgets`, Fase 4b 0011).

### Estado vazio
Sem fatura aberta (ciclo zerado): número grande = `R$ 0`, sublabel
`Nenhum gasto no ciclo atual` e a linha de impacto some (não há o que comprometer). O
BudgetGauge abaixo assume 100% de folga (verde pleno).

### Mobile (375px) / Desktop
Mobile: card full-width, padding 20/24, glow âmbar trocado por **índigo** (azul = Iremar).
Desktop: mesmo card, padding 32, número 6xl. Sem mudança estrutural — só respiro.

### Nova prop no AnchorHero (aditiva, não-quebra)
```ts
// scope === 'pessoal'
faturaIremarPart?: number;   // novo: vira o número grande
budgetPct?: number;          // novo: alimenta a linha de impacto + cor
budgetState?: 'verde'|'amarelo'|'vermelho';
```
Empresa/Tudo continuam usando `saldoContas`. Mudança retrocompatível: se `faturaIremarPart`
vier `undefined`, cai no comportamento atual (`faturaTotal`).

---

## (2) Bloco B — BudgetGauge: o semáforo "posso usar o cartão?" (COMPONENTE NOVO)

**Pergunta que responde:** *se eu passar o cartão agora, estouro?* (P4) — a dor #3 da Fase 1.

Este é o componente assinatura da tela. Traduz o modelo da Fase 3 (§1–§2) numa única peça
visual que diz **cor + número + frase** sem o Iremar precisar interpretar nada.

### Layout (estrutura)
Card glass logo abaixo do AnchorHero. Três camadas verticais:

1. **Cabeçalho-cor:** bolinha grande (16px) na cor do estado + label do estado em caixa
   alta (`PODE USAR` / `TÁ APERTANDO` / `CUIDADO`). A cor pinta a borda do card inteiro
   (1px) e um glow sutil no topo — é o primeiro sinal que o olho capta.
2. **Número dominante:** `DISPONÍVEL` em eyebrow + valor grande (`R$ 2.100`) na cor do
   estado, tabular. Esse é "quanto ainda posso gastar este mês".
3. **Barra de orçamento empilhada (stacked):** uma barra horizontal (teto = 100%) com dois
   segmentos preenchidos: **fatura do Iremar (índigo)** + **boletos PF pendentes
   (azul-claro)**, e o vão restante = disponível (cinza translúcido). Abaixo da barra, três
   micro-legendas: `Fatura R$ X · Boletos R$ Y · Sobra R$ Z`. O Iremar vê de relance que a
   fatura sozinha já comeu 1/4, os boletos empilham, e sobra tanto.
4. **Frase de fechamento** (na cor do estado):
   - 🟢 `Pode usar. Sobram R$ 2.100 do seu mês (32%).`
   - 🟡 `Tá apertando. Restam só R$ 900 (14%). Pense antes.`
   - 🔴 `Cuidado. Você já comprometeu 94% do mês.`

### Lógica de cor (Fase 3, §2 — copiar fielmente)
```
disponivel = teto − comprometido
comprometido = iremarPart + Σ(monthly_obligations PF pendentes do mês)
folgaPct = disponivel / teto
folgaPct > 0.30          → 🟢 verde
0.10 ≤ folgaPct ≤ 0.30   → 🟡 amarelo
folgaPct < 0.10 ou < 0   → 🔴 vermelho
```
**Crítico (Fase 3, §5):** `julianaPart` e `i2Part` **não** entram no comprometido. Reembolso
não reduz gasto — vira "a receber" no Bloco D. Se entrassem, o semáforo ficaria verde por
dinheiro de fora e o Iremar gastaria contando com repasse alheio.

### Dado de origem
- `teto`: `monthly_budgets` (0011) por `responsible='iremar'` + `reference_month`. Se não
  existir registro do mês → estado de configuração (abaixo).
- `comprometido`: `iremarPart` (settlement) + soma de `monthly_obligations` PF pendentes
  (`responsible ∈ {iremar, casal}`, `status='pending'`).
- Tudo calculado em runtime no `settlement.ts` (a Fase 4b proíbe persistir
  comprometido/disponível — só o teto é dado).

### Estado vazio / não-configurado (primeira vez)
Sem teto definido, o semáforo **não inventa cor**. Mostra um card neutro (cinza):
`Defina seu teto mensal pra ativar o semáforo` + botão `Definir teto`. O default sugerido
no formulário = média das saídas PF dos últimos 3 meses (Fase 3, §1, Opção A), apresentado
como **sugestão editável**, nunca imposto. Enquanto não configurado, a linha de impacto do
AnchorHero some.

### Mobile (375px) / Desktop
Mobile: card full-width, barra de 12px de altura, frase quebra em 2 linhas se preciso.
Toque no card → abre sheet de ajuste de teto. Desktop: pode ficar **lado a lado** com o
AnchorHero numa grid de 2 colunas (o número grande à esquerda, o semáforo à direita) —
ambos respondem o mesmo mês, então fazem par natural. Em mobile ficam empilhados.

### Acessibilidade do semáforo
Cor **nunca sozinha**: sempre acompanhada de emoji (🟢🟡🔴) + label textual + ícone de
forma (círculo cheio/meio/vazio), pra daltônicos. Contraste do texto sobre o card ≥ 4.5:1.

---

## (3) Bloco C — WeekAhead: o que mexe na conta nos próximos 7 dias (COMPONENTE NOVO)

**Pergunta que responde:** *preciso pagar ou vou receber algo essa semana?* (P2 + P3, Gap G4)

A Fase 1 (G4) provou que dashboard e compromissos raciocinam **por mês**; ninguém recorta a
**janela móvel de 7 dias** que cruza fronteira de mês. A Fase 3 (§4) desenhou essa faixa.

### Layout (estrutura)
Um card com header `ESSA SEMANA` + subtítulo dinâmico
`hoje 08/06 → 15/06`. Dentro, **duas mini-seções** separadas por uma linha fina:

**↓ A pagar (próximos 7 dias)** — header rosa-vermelho suave:
- Total no topo: `Você paga R$ 740 em 2 contas`.
- Linhas: chip de dia (`dia 12`) + descrição + valor, ordenadas por data.
- **Evento especial:** se o `closingDate` do ciclo da fatura cair na janela, aparece uma
  linha destacada: `🗓️ Fatura fecha dia 13 · ~R$ 2.100 (sua parte)` — é o maior evento PF
  da semana e o Iremar tem que saber que está chegando.

**↑ A receber (próximos 7 dias)** — header verde suave:
- Total no topo: `Você recebe R$ 5.000 em 1 entrada`.
- Linhas: chip de dia + descrição + valor, com **cor por origem**: pró-labore (azul),
  transferência/reembolso da Juliana (rosa).

### Dado de origem
- **A pagar:** `monthly_obligations` PF (`responsible ∈ {iremar, casal}`, `status='pending'`,
  `due_date BETWEEN hoje AND hoje+7`). Resolve G4 cruzando mês. + evento de fechamento de
  fatura derivado do `cycle.closingDate`.
- **A receber:** `income_records` PF (`entity_id = Família`, kinds `pro_labore`,
  `juliana_transfer`, `other`) com `expected_on` (previsto) ou `occurred_on` na janela.
  Após a Fase 4b, `expected_on` existe e `status` distingue previsto de recebido — só
  `previsto`/`faturado` são "a receber". Resolve G5 (usa data pra dizer **quando**).
- **`julianaPart` da fatura** entra aqui como linha "a receber da Juliana" datada
  (data do acerto), nunca como abatimento de gasto (Fase 3, §5).

### Estado vazio
Semana tranquila (nada nos 7 dias): card colapsa em uma linha única
`Nada vence nem entra nos próximos 7 dias 🎉` — não somem os dois blocos, vira um respiro
positivo. Se só um lado estiver vazio, mostra só a seção preenchida.

### Mobile (375px) / Desktop
Mobile: duas seções empilhadas, chips de dia 36px. Desktop: as duas seções podem ir
**lado a lado** (a pagar à esquerda, a receber à direita), aproveitando a largura — o saldo
da semana fica visualmente comparável num relance. Mobile empilha.

### Por que componente novo e não reuso de BillsCard/IncomeCard
`BillsCard` e `IncomeCard` raciocinam **por mês** (header "este mês") e o BillsCard agrupa
por overdue/today/upcoming, não por janela. WeekAhead é uma faixa **temporal de 7 dias**
que mistura saídas e entradas no mesmo card pra responder "o que mexe na conta essa semana".
São responsabilidades diferentes; forçar reuso confundiria as duas leituras.

---

## (4) Bloco D — BillsCard + IncomeCard do mês (REAPROVEITADOS)

**Perguntas que respondem:** *o que ainda pago no mês?* (P1) e *quanto recebo no mês?* (P3)

Depois da foto da semana (WeekAhead), o Iremar desce pra visão **do mês inteiro**. Aqui os
dois componentes existentes servem quase sem mudança.

### BillsCard (P1) — "Contas a pagar este mês"
- **Layout:** já pronto (header com total, mini-stats overdue/today/upcoming, top-5 lista).
- **Dado:** `monthly_obligations` PF do mês corrente (`responsible ∈ {iremar, casal}`,
  `status='pending'`). **Filtro de escopo crítico:** nada de `responsible` ligado à i2.
- **Estado vazio:** já tratado (`✅ Tudo em dia!`).
- **Ajuste:** `accent` = azul Iremar (`#3b82f6`, já é o default).
- **Mobile/Desktop:** componente já responsivo; nenhuma mudança.

### IncomeCard (P3) — "Contas a receber este mês"
- **Layout:** já pronto (header verde + linhas por kind com emoji/cor).
- **Dado:** `income_records` PF do `reference_month` (pró-labore, juliana_transfer, other).
  **Fix do Gap G5:** `hrefMore` hoje aponta pra `/empresa` (escopo errado!). No escopo
  pessoal deve apontar pra **`/lancamentos` ou `/compromissos`** PF — receita PF nunca leva
  o Iremar pra tela de empresa. Trocar a prop `hrefMore="/empresa"` por destino PF.
- **Linha nova:** a `julianaPart` da fatura aparece como linha
  `👩 Reembolso Juliana · + R$ 900` (kind `juliana_transfer`), reforçando que é repasse
  esperado, não gasto reduzido.
- **Estado vazio:** já tratado (`Nenhuma receita registrada`).
- **Mobile/Desktop:** já responsivo.

> **Relação com o BudgetGauge:** os boletos PF que aparecem no BillsCard são exatamente os
> que entram no `comprometido` do semáforo. Bloco B é a leitura-decisão ("posso gastar?");
> Bloco D é a leitura-detalhe ("quais são essas contas?"). Mesma fonte, duas profundidades.

---

## (5) Wireframe textual — tela Pessoal completa

```
┌─────────────────────────────────────────────┐  ← MOBILE 375px (coluna única)
│  [Pessoal ▾]  Iremar          08/06  🔔  ⚙   │  header + toggle de escopo (já existe)
├─────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════╗   │
│  ║ SUA PARTE DA FATURA                    ║   │  ◀ Bloco A — AnchorHero PF
│  ║                                        ║   │    número = iremarPart (não faturaTotal)
│  ║   R$ 2.100                             ║   │
│  ║   de R$ 4.200 totais · fecha 28/06     ║   │
│  ║   isso é 26% do seu mês 🟢             ║   │    ← linha de impacto (ponte p/ Gauge)
│  ╚═══════════════════════════════════════╝   │
│  ╔═══════════════════════════════════════╗   │
│  ║ 🟢  PODE USAR                          ║   │  ◀ Bloco B — BudgetGauge (NOVO)
│  ║ DISPONÍVEL                             ║   │
│  ║   R$ 2.100                             ║   │    número na cor do estado
│  ║ ▓▓▓▓▓░░░░░░░░░░░░░░░ teto R$ 8.000     ║   │    barra empilhada (fatura+boletos)
│  ║ Fatura R$2.100·Boletos R$740·Sobra 5.1k║   │
│  ║ Pode usar. Sobram R$ 5.160 (64%).      ║   │
│  ╚═══════════════════════════════════════╝   │
│  ╔═══════════════════════════════════════╗   │
│  ║ ESSA SEMANA      hoje 08/06 → 15/06    ║   │  ◀ Bloco C — WeekAhead (NOVO)
│  ║ ─ ↓ A pagar ──────────── R$ 740 / 2 ── ║   │
│  ║  [dia 12] Internet            R$ 120   ║   │
│  ║  [dia 13] 🗓️ Fatura fecha   ~R$ 2.100  ║   │    ← evento de fechamento na janela
│  ║  [dia 14] Academia            R$ 620   ║   │
│  ║ ─ ↑ A receber ───────── R$ 5.000 / 1 ─ ║   │
│  ║  [dia 10] 💼 Pró-labore     + R$ 5.000 ║   │
│  ╚═══════════════════════════════════════╝   │
│  ╔═══════════════════════════════════════╗   │
│  ║ CONTAS A PAGAR ESTE MÊS   R$ 1.480     ║   │  ◀ Bloco D1 — BillsCard (reuso)
│  ║ [🔴 Atras.1] [🟡 Hoje 0] [🟢 Vencer 3] ║   │
│  ║  [12] Internet · A vencer      R$ 120  ║   │
│  ║  [14] Academia · A vencer      R$ 620  ║   │
│  ║  ...                          Ver todas›║   │
│  ╚═══════════════════════════════════════╝   │
│  ╔═══════════════════════════════════════╗   │
│  ║ CONTAS A RECEBER ESTE MÊS  R$ 5.900    ║   │  ◀ Bloco D2 — IncomeCard (reuso)
│  ║  💼 Pró-labore            + R$ 5.000   ║   │    hrefMore: /empresa → destino PF
│  ║  👩 Reembolso Juliana     + R$   900   ║   │    ← julianaPart como linha datada
│  ╚═══════════════════════════════════════╝   │
│  ┌────────┬────────┬────────┬────────┐       │  ◀ QuickActions (já existe, no rodapé)
│  │💳Cartão│📅Apagar│📥Areceb│🏦Contas│       │    fix: "A receber" → destino PF
│  └────────┴────────┴────────┴────────┘       │
└─────────────────────────────────────────────┘

DESKTOP (≥768px) — mesma ordem, mas com pares lado a lado:
┌───────────────────────────┬───────────────────────────┐
│  AnchorHero (Bloco A)      │  BudgetGauge (Bloco B)     │  par "mês do Iremar"
├───────────────────────────┴───────────────────────────┤
│  WeekAhead (Bloco C)  — A pagar | A receber lado a lado │
├───────────────────────────┬───────────────────────────┤
│  BillsCard (D1)            │  IncomeCard (D2)           │  par "mês detalhado"
├───────────────────────────┴───────────────────────────┤
│  QuickActions (4 colunas)                               │
└─────────────────────────────────────────────────────────┘
```

### Ordem de leitura justificada
A → B → C → D não é arbitrária. **A** dá o número que importa (sua parte da fatura). **B**
transforma esse número numa decisão imediata via cor (posso gastar?). **C** olha pra frente
curta (7 dias: o que me pega de surpresa?). **D** desce pro detalhe do mês inteiro. É o funil
do urgente-decisório (topo) ao contextual-detalhe (base) — o Iremar resolve a pergunta da
compra antes de rolar, e quem quiser auditar o mês rola até embaixo.

---

## (6) Resumo de componentes

| Componente | Status | Bloco | Mudança |
|---|---|---|---|
| `AnchorHero` | **Ajustar** (aditivo) | A | Props `faturaIremarPart`, `budgetPct`, `budgetState`; número PF = `iremarPart` |
| `BudgetGauge` | **NOVO** | B | Semáforo: cor + disponível + barra empilhada + frase. Estado não-configurado. |
| `WeekAhead` | **NOVO** | C | Janela móvel 7 dias, a pagar + a receber, evento de fechamento de fatura |
| `BillsCard` | **Reuso** | D1 | Só filtro de escopo PF + accent azul (já default) |
| `IncomeCard` | **Reuso** | D2 | Fix `hrefMore` (→ destino PF, não /empresa) + linha `julianaPart` |
| `QuickActions` | **Fix** | rodapé | Atalho "A receber" → destino PF (Gap G5) |

### Síntese para a próxima fase
A tela Pessoal fica leve por fora e honesta por dentro: dois componentes novos
(`BudgetGauge`, `WeekAhead`), três reaproveitados com ajustes mínimos, todos PF puro com
`entity_id = Família`. O caminho de implementação: (a) persistir/ler teto via
`monthly_budgets` (0011) com default = média 3 meses; (b) expor `iremarPart`/`julianaPart`
do `settlement.ts` pro AnchorHero e BudgetGauge sem somar reembolso no comprometido; (c)
construir a query de janela de 7 dias (`monthly_obligations` + `income_records` com
`expected_on`) pro WeekAhead; (d) corrigir os dois links de escopo trocado (IncomeCard e
QuickActions). Nenhum número da i2 entra — o Fator R fica blindado na navegação, no cálculo
e na cor.
```
