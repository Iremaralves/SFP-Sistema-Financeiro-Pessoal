# Arquitetura do Novo Dashboard Pessoal (Iremar)

> Marcus — Product UX. Regra única: **cada bloco responde uma pergunta, e o urgente grita.**
> Escopo deste doc = perfil **Pessoal** (admin, `scope === 'pessoal'`). Empresa e Tudo
> reaproveitam a mesma malha de blocos, mas a hierarquia abaixo é desenhada para a decisão
> diária do Iremar. PF e PJ nunca se misturam (Fator R intocado): tudo que é `responsible='i2'`
> ou `entity=business` fica fora das contas pessoais e só aparece rotulado como "já reembolsado".

---

## 1. Mapa pergunta → bloco → dado de origem

O brief lista 13 perguntas em 3 famílias. Cada uma ganha um dono na tela. Nenhuma pergunta
fica órfã, e nenhum bloco responde duas coisas (senão vira painel, não decisão).

### Família CONTAS A PAGAR

| # | Pergunta do Iremar | Bloco / widget | Dado de origem |
|---|---|---|---|
| 1 | Tem algo **atrasado**? | `AlertStack` → faixa vermelha "Atrasado" (topo) | `bills` com `status==='overdue'` (page.tsx já calcula via `due_day < todayDay`) |
| 2 | **Quais faltam pagar** este mês? | `BillsCard` (lista) | `recurring_commitments` ativos − `monthly_obligations` pagos, filtrado por escopo PF |
| 3 | **Próximos pagamentos** (o que vem) | `BillsCard` → mini-stats "A vencer" + lista ordenada por `due_day` | mesmo `bills`, `status==='upcoming'` |
| 4 | **Total do mês** a pagar | `BillsCard` → header `totalPendente` | soma de `bills` (já existe) |
| 5 | **Total da semana** | `WeekStrip` (bloco novo) → "vence nesta semana" | `bills` filtrado por `dueDateStr` dentro de [hoje, hoje+6d] |

### Família CARTÃO

| # | Pergunta | Bloco / widget | Dado de origem |
|---|---|---|---|
| 6 | **Fatura atual** | `AnchorHero` (número-âncora) | `metrics.faturaTotal` (soma `mappedTx` do ciclo) |
| 7 | **Divisão** Iremar/Juliana/casal/i2 | `SplitBar` (barra 100% empilhada, substitui o donut no mobile) | `calculateInvoiceSettlement(transactions)` → `iremarPart / julianaPart / i2Part / casalTotal` |
| 8 | **Impacto no orçamento do Iremar** | `BudgetGauge` "Posso usar o cartão?" | `settlement.iremarPart` + `boletosPF` vs `budgetTeto` |
| 9 | **Preciso frear ou fazer mais dinheiro?** | `HealthVerdict` (bloco novo) → veredito + 1 ação | renda 8.000 − fixos − fatura Iremar = folga; + termômetro de variáveis |

### Família GESTÃO

| # | Pergunta | Bloco / widget | Dado de origem |
|---|---|---|---|
| 10 | Custos saem da **conta E do cartão** | `CommittedRing` (anel comprometido×renda) | boletos PF (`recurring_commitments`) + `settlement.iremarPart` ÷ renda |
| 11 | **Fixo × Variável** | `FixVarBreakdown` (bloco novo) | transações do ciclo: `categoryId`/merchant → assinatura=fixo, resto=variável; + boletos = fixo |
| 12 | **Onde está o vazamento** (categorias) | `VariableThermometers` (bloco novo) | transações variáveis agrupadas por categoria (restaurante, combustível, mercado, farmácia) vs teto |
| 13 | Iremar quer **AJUDA pra gerir**, não só painel | `HealthVerdict` + `NudgeCard` (coaching) | regras do diagnóstico: teto restaurante 450, combustível 375, parcelas que terminam |

**Leitura do mapa:** 6 blocos sobrevivem/evoluem (AnchorHero, BudgetGauge, BillsCard,
SplitBar←DonutSplit, CommittedRing←gauge mental, AlertStack←alerta unassigned) e **5 nascem**:
WeekStrip, HealthVerdict, FixVarBreakdown, VariableThermometers, NudgeCard. Tudo a partir de
dados que **já existem** no Supabase — nenhuma migração nova é necessária para a v1.

---

## 2. Hierarquia da tela (mobile-first, 375px, cima → baixo)

O princípio é **pirâmide invertida de urgência**: o que pode estragar o dia primeiro; o que
informa, depois; o que ensina, por último. O olho do Iramar deve responder "tá tudo bem?" nos
primeiros 2 segundos sem rolar.

```
┌─ ZONA 0 · ABRE EM 2 SEGUNDOS ──────────────────────────┐
│ Header curto: "Olá, Iremar" + toggle escopo + ciclo    │
│ ⚠️ AlertStack  → SÓ aparece se houver atraso/pendência │ ← grita ou some
└────────────────────────────────────────────────────────┘
┌─ ZONA 1 · A DECISÃO DO DIA ────────────────────────────┐
│ 🟢 BudgetGauge "Posso usar o cartão?"                   │ ← âncora real do Pessoal
│    (semáforo + disponível + barra fatura/boletos)       │
└────────────────────────────────────────────────────────┘
┌─ ZONA 2 · CONTAS DO MÊS/SEMANA ────────────────────────┐
│ WeekStrip  → "Esta semana: R$ X · N contas"            │
│ BillsCard  → total do mês + atrasado/hoje/a-vencer     │
└────────────────────────────────────────────────────────┘
┌─ ZONA 3 · CARTÃO EM DETALHE ───────────────────────────┐
│ AnchorHero (fatura total) + SplitBar (divisão 4 cores) │
│ EquacaoCard Iremar (pessoal + casal÷2 = parte dele)    │
└────────────────────────────────────────────────────────┘
┌─ ZONA 4 · SAÚDE & COACHING ────────────────────────────┐
│ HealthVerdict "Frear ou fazer mais?" + CommittedRing   │
│ FixVarBreakdown (fixo × variável)                       │
│ VariableThermometers (restaurante/combustível/…)        │
│ NudgeCard (1 ação recomendada do mês)                   │
└────────────────────────────────────────────────────────┘
┌─ ZONA 5 · DETALHE/AUDITORIA (rolagem longa) ───────────┐
│ Últimos lançamentos · QuickActions de navegação         │
└────────────────────────────────────────────────────────┘
```

**Por que essa ordem:**

- **Zona 0 — alerta condicional.** A regra "o urgente grita" só funciona se o não-urgente
  silencia. `AlertStack` só renderiza quando há atrasado, fatura pendente de categorização ou
  transação `unassigned`. Em mês limpo, a tela já abre na decisão. Hoje o alerta de unassigned
  fica solto no meio do `DashboardAdmin` (linha 145) — sobe para o topo e ganha irmãos.

- **Zona 1 — BudgetGauge antes de tudo.** No diagnóstico (item 6.1) o número que o Iremar
  consulta para decidir é "posso passar o cartão agora?". É o gesto de maior frequência. Hoje o
  `AnchorHero` mostra "Fatura do cartão" como herói — mas fatura total é **informação**, não
  **decisão**. Invertemos: no Pessoal, o herói vira o semáforo de folga; a fatura total desce
  para a Zona 3 como contexto.

- **Zona 2 — semana antes do mês.** O Iremar age na janela de 7 dias ("o que pago essa
  semana?"). `WeekStrip` é uma faixa fina e escaneável; `BillsCard` logo abaixo dá o panorama
  do mês e a lista priorizada. Atrasados já vêm primeiro na ordenação atual.

- **Zona 3 — cartão detalhado.** Aqui mora a resposta "como minha fatura se divide" e a
  conferência da parte do Iremar. É consulta, não pânico — por isso depois da decisão.

- **Zona 4 — gestão e coaching.** Responde "frear ou fazer mais?" e "onde vaza?". É a parte
  que transforma painel em **assistente**. Fica abaixo da dobra porque é reflexão semanal, não
  decisão de segundos — mas é o coração do pedido "quero ajuda pra gerir".

- **Zona 5 — auditoria.** Lançamentos e navegação ficam no fim: quem rola até aqui quer
  detalhe, não resumo.

No desktop (≥ md) as zonas 2, 3 e 4 viram colunas 2-up (grid já usado no código), mas a
**ordem vertical de prioridade no mobile é a fonte da verdade**.

---

## 3. Blocos novos necessários

### 3.1 `AlertStack` (novo container, reaproveita estilo do alerta atual)
Pilha de faixas condicionais, ordenadas por gravidade. Cada faixa só existe se o gatilho for
verdadeiro; zero faixas = não renderiza nada.
- 🔴 **Atrasado:** "N contas atrasadas · R$ X" → `/compromissos`. Gatilho: `bills.overdue.length`.
- 🟡 **Estourou o teto:** "Cartão passou de R$ 2.500" → âncora no BudgetGauge. Gatilho: `pctUsado ≥ 95`.
- 🟡 **Sem responsável:** "N lançamentos sem responsável" → `/categorizar` (move o atual aqui).
Dado: `bills`, `settlement`, `unassigned` — tudo já em `page.tsx`.

### 3.2 `WeekStrip` — "Esta semana"
Faixa horizontal: número grande (total que vence em [hoje, +6d]) + chips por dia. Responde a
pergunta 5 (total da semana), que hoje **não tem dono nenhum**.
Dado: `bills.filter(dueDateStr ∈ semana)`. Sem migração — só uma janela de data sobre `bills`.

### 3.3 `HealthVerdict` — "Frear ou fazer mais dinheiro?"
O bloco-conselheiro. Mostra: (a) folga do mês como número grande com sinal/cor; (b) veredito
em uma frase ("Frear os variáveis — a renda paga as contas"); (c) o `CommittedRing` ao lado
(comprometido × renda, amarelo > 90%, vermelho > 100%). Traduz a seção 4 do diagnóstico em UI.
Dado: renda (`income_records` pró-labore + lucros = 8.000), `boletosPF`, `settlement.iremarPart`.

### 3.4 `FixVarBreakdown` — Fixo × Variável
Barra dividida em dois: **Fixos** (boletos PF + assinaturas do cartão = ~R$ 5.228) × **Variáveis**
(mercado, restaurante, posto, farmácia, uber = ~R$ 2.632). Responde "fixo vs variável" e mostra
visualmente que o controlável é a fatia menor mas é onde mora o aperto.
Dado: classificar transações do ciclo — `categoryId`/merchant em lista de assinaturas conhecidas
(Netflix, Apple, iCloud, Mapfre, Vivo, Google One) = fixo; o resto = variável; + boletos PF = fixo.
Precisa de um helper `splitFixedVariable(transactions)` em `@i2fin/core`.

### 3.5 `VariableThermometers` — onde vaza
Lista de 4 termômetros (consumido × teto), um por categoria de vazamento do diagnóstico:
Restaurante (teto 450), Combustível (teto 375 da parte dele), Mercado, Farmácia. Barra que vira
amarela/vermelha ao passar o teto. Este é o bloco que "mostra na cara" o vazamento (item 6.3).
Dado: transações variáveis da parte do Iremar agrupadas por `categoryId`/merchant + tetos
(reusa o padrão de `budget.ts` server action, agora por categoria em vez de teto único).

### 3.6 `NudgeCard` — a 1 ação do mês (coaching)
Cartão único com a recomendação mais relevante agora, derivada de regra:
- se restaurante > 450 → "Comer fora já passou de R$ X. Segura nos próximos dias."
- se há parcela terminando → "Airbnb encerra esse ciclo: +R$ X livres mês que vem — manda pra reserva."
- se folga < 200 → "Mês apertado: evita gasto não-essencial no cartão até dia 12."
Mostra **uma** por vez (a de maior impacto). É o que materializa "quero ajuda, não só painel".
Dado: `bills`, `settlement`, transações com `installmentCurrent/installmentTotal` (já no schema).

---

## 4. O que reaproveitar (e o que muda)

| Componente atual | Decisão | O que muda |
|---|---|---|
| **AnchorHero** | Reaproveitar, **rebaixar no Pessoal** | No Pessoal deixa de ser o herói (a fatura total vira contexto na Zona 3). O número-decisão do topo passa a ser o BudgetGauge. Em Empresa/Tudo permanece como está. |
| **BudgetGauge** | Reaproveitar, **promover a herói** | Sobe para Zona 1, vira o primeiro elemento abaixo do header. Calibrar `teto` default para R$ 2.500 (regra 6.1/recomendação 5) em vez de 8.000. Lógica e visual mantidos. |
| **BillsCard** | Reaproveitar quase intacto | Continua na Zona 2. Ganha um irmão (`WeekStrip`) acima. Mantém mini-stats e lista top-5. |
| **DonutSplit** | Reaproveitar no desktop, **trocar no mobile** | Donut some no mobile (já é `hidden xl:flex`). No lugar entra `SplitBar` (barra 100% empilhada, 4 cores) — mais legível em 375px e responde a divisão sem ocupar altura. Donut fica como enriquecimento desktop. |
| **EquacaoCard** | Reaproveitar (só Iremar no Pessoal) | No Pessoal mostra apenas a equação do Iremar (pessoal + casal÷2 = parte dele). A da Juliana sai do Pessoal — é ruído para a decisão dele. |
| **Alerta unassigned** | **Migrar** para `AlertStack` | Deixa de ser bloco solto (linha 145); vira uma das faixas condicionais da Zona 0. |
| **QuickActions** | Reaproveitar, **descer** | Vai para Zona 5 (navegação, não decisão). Hoje fica no topo logo após o herói — ocupa espaço nobre com atalhos que não respondem nenhuma das 13 perguntas. |
| **Sparkline** | **Remover do mobile** | Hoje é placeholder com série fake (`totalFatura*0.6…`). Dado falso quebra confiança. Manter escondido até existir série real de fechamentos. |
| **Cards Juliana/Casal/i2 isolados** | **Consolidar** | Viram parte do `SplitBar` (4 segmentos com legenda). Os cards avulsos de "Juliana deve transferir" e "Entradas" descem para Zona 3/auxiliar — não competem com a decisão. |

**Núcleo de dados a criar (1 lugar só, testável):** dois helpers em `@i2fin/core` —
`splitFixedVariable(transactions, subscriptionList)` e `categoryTotals(transactions, categories)` —
e dois server actions análogos a `budget.ts` para tetos por categoria. `page.tsx` já carrega
`transactions` do ciclo, `bills`, `incomeRecords` e `settlement`; os blocos novos consomem o
que já está em memória, sem round-trip extra ao Supabase na v1.

---

## 5. Wireframe textual da tela inteira (Pessoal, 375px)

```
┌──────────────────────────────────────────────┐
│ Fatura junho 2026          [Pessoal▾] [admin] │  ← header enxuto
│ Olá, Iremar 👋                                 │
│ Ciclo 13/05 → 12/06 · fecha 13/06              │
├──────────────────────────────────────────────┤
│ ⚠️ AlertStack (condicional, ordenado)          │
│  ┌────────────────────────────────────────┐  │
│  │🔴 1 conta atrasada · R$ 119,35      ›   │  │  ← só se houver
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐  │
│ │ POSSO USAR O CARTÃO?                     │  │  ← ZONA 1 · herói
│ │  R$ 139,18              🟢 Tranquilo     │  │
│ │  disponível pra gastar         5%        │  │
│ │  ████████████████░░░░░░░  (fatura+boleto)│  │
│ │  Fatura sua parte 2.899 · Teto 2.500 ✎   │  │
│ └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ ┌─ ESTA SEMANA ──────────────────────────┐  │  ← ZONA 2
│ │ R$ 470,00 · 2 contas                     │  │
│ │ [seg 250] [qua 220]                      │  │
│ └────────────────────────────────────────┘  │
│ ┌─ CONTAS A PAGAR ESTE MÊS ──────────────┐  │
│ │ R$ 4.960,79               Ver todas ›    │  │
│ │ [🔴 1] [🟡 0] [🟢 8]                      │  │
│ │ dia13 Helena ............. R$ 1.393,43   │  │
│ │ dia20 Isabela ............ R$   950,00   │  │
│ │ + 6 outras contas                        │  │
│ └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ ┌─ FATURA DO CARTÃO ─────────────────────┐  │  ← ZONA 3
│ │ R$ 8.320,00 · 42 lançamentos             │  │
│ │ ▓▓▓▓ Iremar ▒▒▒ Juliana ░░ casal ▚ i2    │  │  ← SplitBar
│ │  2.900     2.425    2.635    1.857       │  │
│ └────────────────────────────────────────┘  │
│ ┌─ IREMAR ───────────────────────────────┐  │
│ │ Pessoal 1.582 + Casal÷2 1.317 = 2.899    │  │
│ └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ ┌─ FREAR OU FAZER MAIS DINHEIRO? ─────────┐ │  ← ZONA 4
│ │  Folga do mês: +R$ 139    [anel 98%🟡]   │  │
│ │  "Frear os variáveis. A renda paga as    │  │
│ │   contas e ainda guarda 1.800/mês."      │  │
│ └────────────────────────────────────────┘  │
│ ┌─ FIXO × VARIÁVEL ──────────────────────┐  │
│ │ ████████████████ Fixo 5.228             │  │
│ │ ██████ Variável 2.632 (controlável)     │  │
│ └────────────────────────────────────────┘  │
│ ┌─ ONDE ESTÁ VAZANDO ────────────────────┐  │
│ │ Restaurante  ███████░ 726 / 450 🔴       │  │
│ │ Combustível  █████░░░ 474 / 375 🟡       │  │
│ │ Mercado      ████░░░░ … / …              │  │
│ │ Farmácia     ██░░░░░░ 276 / —            │  │
│ └────────────────────────────────────────┘  │
│ ┌─ 💡 AÇÃO DO MÊS ───────────────────────┐  │
│ │ "Comer fora passou R$ 726. Segura até    │  │
│ │  dia 12 e a folga dobra." [Entendi]      │  │
│ └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│ Últimos lançamentos · QuickActions (navegar)  │  ← ZONA 5
└──────────────────────────────────────────────┘
   [BottomNav: Início · Cartão · Contas · +]
```

**Resumo da decisão de arquitetura:** o dashboard antigo era um *espelho* (mostrava números na
ordem em que foram calculados). O novo é uma *escada de decisão*: alerta → posso gastar? →
o que pago essa semana? → como tá a fatura → tô saudável e o que faço. Cada degrau responde
exatamente uma das 13 perguntas, os fixos e variáveis ficam separados sem o Iremar fazer conta,
e a fronteira PF×PJ é respeitada em cada bloco (i2 só aparece como segmento rotulado "reembolsado").
Reusamos 6 componentes, criamos 5, e nada exige dado novo no banco — só dois helpers em
`@i2fin/core` e tetos por categoria espelhando o `budget.ts` que já existe.
