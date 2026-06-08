# 06 — UX Empresa: Dashboard + Planejador de Pagamentos

**Squad:** i2-gestao-decisoria · **Persona:** Lia (UX/Product Designer, fintech mobile)
**Data:** 2026-06-08 · **Fase 6 de N** · Continuação

> Lente desta fase: **uma tela = uma decisão de dinheiro**. Eu não desenho relatórios,
> desenho o gesto que o Iremar faz na sexta. O teste de aderência é o de sempre — a
> folha-âncora (Pedro, Alana, Eduarda prorada, Mayana, Iremar, contadora). Se a tela
> não fecha essa folha em menos de um minuto, sem planilha paralela, ela não passou.
> Tudo aqui assenta sobre o que já existe: glass dark com glow âmbar (empresa),
> `accounts.kind='investment'` como cofre, `transfers`/`/transferencias` já operante,
> e o modelo de dados endurecido da Fase 4b (`payroll_runs`/`payroll_items`,
> `income_records` com `status`/`expected_on`). Reaproveito tokens, não invento.

---

## (0) Sistema visual herdado (não renegociar)

Antes dos wireframes, fixo o vocabulário que já está no código para que tudo o que
desenho aqui seja **construível 1:1** com o que existe:

- **Card glass:** `rgba(255,255,255,0.04–0.06)` + `border rgba(255,255,255,0.07)` +
  `backdrop-blur(20–24px)`, `rounded-3xl`. (AnchorHero, ContasPage `glass`.)
- **Glow radial âmbar = empresa:** `radial-gradient(... rgba(245,158,11,0.14) ...)`
  no header e canto superior dos cards. É a assinatura de escopo PJ.
- **Cores semânticas:** verde `#34d399` (recebido / saldo positivo / pago),
  vermelho `#f87171` (déficit / a pagar / atrasado), âmbar `#fbbf24`/`#fcd34d`
  (pendente / i2), ciano `#06b6d4` (transferência / cofre), azul `#a5b4fc` (info).
- **Números:** `font-variant-numeric: tabular-nums` sempre. O número-âncora é
  `text-5xl md:text-6xl font-bold` (mesmo peso do AnchorHero).
- **Botões de ação primária:** gradiente 135deg + `active:scale-95`, `rounded-2xl`.
  Transferência herda o gradiente verde-ciano de `/contas`
  (`linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,182,212,0.18))`).
- **Status materializado:** segue `monthly_obligations.status` (pending/paid) e
  `payroll_items.pago` — nunca inferir, sempre ler o estado salvo.
- **Layout shell:** `min-h-screen pb-28 md:pl-60` + `<BottomNav>` (mobile) /
  `<Sidebar>` (desktop), `page-container` com `px-4 md:px-8`. Telas novas entram
  nesse shell sem exceção.

A tela estrela vive em **`/empresa/semana`** (rota nova), acessível a partir do
dashboard empresa e do `/empresa` (DRE). O `/empresa` atual continua sendo o DRE de
competência; a Fase 6 acrescenta o eixo de **caixa** ao lado dele, sem fundir os dois.

---

## (1) PLANEJADOR DA SEMANA — `/empresa/semana` (a tela estrela)

Esta tela resolve o cenário-âncora inteiro: total a desembolsar, gap do cofre, ação de
resgate, e baixa pagamento-a-pagamento. É a tela de maior frequência e maior risco
(Fase 1, dor #1; Fase 2, §4). Ela tem **uma resposta dominante** no topo e o resto é
suporte para a ação.

### Anatomia (de cima para baixo)

**A. Header de escopo + seletor de rodada.** Header âmbar idêntico ao `/empresa`, mas o
H1 vira o nome da rodada e há navegação entre rodadas (‹ ›) como o seletor de mês.

**B. Número-âncora: TOTAL A DESEMBOLSAR.** O `payroll_runs.total_a_desembolsar`
(materializado, recalculado por trigger — Fase 4b §2/0010). É o `text-6xl`. Abaixo, em
âmbar translúcido, o contexto: data de pagamento + nº de pessoas.

**C. Bloco do cofre (o cálculo do resgate).** Saldo Inter PJ → déficit → "tirar R$ X do
cofre", com botão de ação. É o coração do algoritmo da Fase 2 §4.

**D. Lista de pagamentos.** Um item por pessoa, com swipe-to-pay (gesto já existente em
`/compromissos`, Onda 2). Eduarda mostra o "porquê" da proração inline.

**E. Rodapé de progresso.** "X de Y pagos · R$ Z restante" — fecha o loop.

### Wireframe textual — mobile 375px

```
┌─────────────────────────────────────────────┐
│  ◜ glow âmbar radial no topo ◝               │
│  EMPRESA · i2 SOLUÇÕES                        │  ← uppercase tracking-widest, white/40
│  ‹   Folha · 1ª sem. junho   ›        [⋯]     │  ← H1 bold + nav de rodada
│  Pagamento sexta 13/06 · 6 pessoas            │  ← white/40 text-xs
├─────────────────────────────────────────────┤
│                                               │
│  TOTAL A DESEMBOLSAR                           │  ← label white/40 text-[10px] uppercase
│                                               │
│   R$ 6.338,71                                  │  ← text-6xl bold tabular-nums, BRANCO
│                                               │
│  Folha desta semana · paga pela Inter PJ      │  ← âmbar/70 text-xs
│                                               │
├─────────────────────────────────────────────┤
│ ╭───────────────────────────────────────────╮ │  ← CARD COFRE (border ciano)
│ │ 🏦 Inter PJ tem        R$ 2.000,00          │ │  ← saldo real, branco tabular
│ │ ───────────────────────────────────────    │ │
│ │ ⚠ Faltam               R$ 4.338,71          │ │  ← vermelho #f87171 bold
│ │                                             │ │
│ │ Tirar do cofre:                             │ │  ← white/50 text-xs
│ │  • Caixinha Nubank        R$ 4.000,00       │ │  ← ciano, com saldo origem
│ │  • NuInvest               R$   338,71       │ │
│ │                                             │ │
│ │  ╭─────────────────────────────────────╮   │ │
│ │  │  ⇄  Transferir R$ 4.338,71 do cofre  │   │ │  ← BOTÃO gradiente verde-ciano
│ │  ╰─────────────────────────────────────╯   │ │     active:scale-95
│ │  Depois a Inter PJ cobre a folha exata ✅   │ │  ← verde/60 text-[10px]
│ ╰───────────────────────────────────────────╯ │
├─────────────────────────────────────────────┤
│  PAGAMENTOS DA SEMANA          0 de 6 pagos   │  ← header de seção + progresso
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Pedro              R$ 1.200,00    ○    │ │  ← swipe → marca pago; ○ = pendente
│  │    Salário · folha                        │ │  ← tipo + marcador Fator R (sutil)
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Alana                R$ 550,00    ○    │ │
│  │    Salário · folha                        │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Eduarda              R$ 338,71    ○    │ │  ← VALOR PRORADO já calculado
│  │    Bolsa · 21 de 31 dias (desde 11/05) ⓘ  │ │  ← o "porquê" visível, nunca órfão
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Mayana               R$ 750,00    ○    │ │
│  │    Salário · folha                        │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Iremar             R$ 3.000,00    ○    │ │  ← pró-labore (conta no Fator R)
│  │    Pró-labore · folha                     │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Contadora            R$ 500,00    ○    │ │  ← serviço (NÃO conta no Fator R)
│  │    Serviço · fora da folha                │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  + Adicionar pessoa à folha                   │  ← link discreto, abre form §5
│                                               │
│  ╭─────────────────────────────────────────╮ │
│  │  Marcar todos como pagos                  │ │  ← ação em lote, secundária
│  ╰─────────────────────────────────────────╯ │
│                                               │
├─────────────────────────────────────────────┤
│ [ Home ] [ Empresa ] [ Contas ] [ ⋯ ]        │  ← BottomNav
└─────────────────────────────────────────────┘
```

### Decisões de interação — as que importam

**Swipe vs checkbox — uso os DOIS, com hierarquia.** A Onda 2 do projeto já entregou
swipe-to-pay em `/compromissos`; reaproveito o mesmo componente e gesto para coerência
muscular. **Swipe da direita para a esquerda** sobre um item → confirma pago, item ganha
fundo verde translúcido, dot vira ✅, e o rodapé de progresso atualiza. Para quem não
descobre o gesto (e no desktop), o **dot circular `○` à direita é tocável** e abre o
mesmo "marcar pago" — checkbox disfarçado. Regra de ouro herdada da Fase 2: marcar pago
grava `payroll_items.pago=true` + `paid_on`, e cria a `transaction` de saída na Inter PJ
(alimenta o DRE, fecha o Gap G7). **Nunca** marco pago automaticamente pela
transferência — pagar a pessoa e abastecer a conta são dois fatos distintos.

**O botão de transferência é o gesto-chave e ele não move dinheiro sozinho.** Ao tocar
"Transferir R$ 4.338,71 do cofre", abro a tela `/transferencias` **pré-preenchida**
(origem: Caixinha → Inter PJ R$ 4.000; uma segunda linha NuInvest → Inter PJ R$ 338,71,
ou um único resgate se o Iremar preferir). A infra de `transfers` já existe (Fase 2 §4,
Gap G3 é UI, não dados). O Iremar revê e confirma — respeitando a regra do ambiente de
**nunca executar transferência no automático**. Após confirmar, o card do cofre recolhe
para um estado verde: "Inter PJ abastecida · R$ 6.338,71 disponível ✅".

**Ordem de drenagem é sugerida, não imposta.** Caixinha antes de NuInvest (maior
liquidez / menor custo de oportunidade, Fase 2 §4). Um toque longo / "editar resgate"
permite ao Iremar inverter a ordem ou puxar tudo de um cofre só.

### Estados de borda (desenhados, não esquecidos)

- **Inter PJ já cobre a folha (déficit = 0):** card do cofre vira verde —
  "Inter PJ cobre a folha. Nada a resgatar." Botão some. (Fase 2 §4 passo 4.)
- **Cofres NÃO cobrem (déficit residual):** card vermelho de alerta —
  "Cofres somam R$ 9.000. Ainda faltam R$ 1.000." Abaixo, em cinza-âmbar, a ponte para
  a aba A Receber: "Entra R$ 4.000 de [cliente] na quinta — esperar ou negociar prazo?".
  Recebível **faturado** vira informação de horizonte, jamais saldo (Fase 2 §1, regra de
  ouro). O botão de transferência fica desabilitado até o gap fechar.
- **Rodada vazia / nenhuma rodada da semana:** empty state com CTA único
  "Montar folha desta semana" → cria `payroll_run` (data = próxima sexta) e abre o form.
- **Rodada já paga (status='paga'):** tudo verde, número-âncora vira histórico
  ("Pago em 13/06"), lista read-only. Vira comprovante auditável.

---

## (2) A RECEBER (timeline) — aba/seção `/empresa/semana?tab=receber`

Responde E1 ("que dinheiro de cliente entra e quando"). Lê `income_records` com
`entity_id = i2` e `status in ('previsto','faturado','recebido')`, ordenado por
`expected_on` (ou `occurred_on` quando recebido). A **data é o eixo** (Fase 2 §1).

### Princípio de leitura: confiança decrescente

Três faixas de confiança, visualmente distintas, **nunca somadas no mesmo número de
caixa** — porque a regra de ouro proíbe tratar previsto como saldo:

- **Recebido** (verde sólido, ✅) — já caiu, vira saldo. Conta no planejador.
- **Faturado** (âmbar, 🧾) — NF emitida, compromisso firme. Horizonte forte.
- **Previsto** (cinza tracejado, ◌) — hipótese. Horizonte fraco, com ressalva.

### Wireframe textual — mobile

```
┌─────────────────────────────────────────────┐
│  EMPRESA · i2 SOLUÇÕES                         │
│  [ A pagar ]  [ A receber ]                    │  ← tabs; "A receber" ativa
├─────────────────────────────────────────────┤
│  PREVISTO PARA JUNHO                           │
│   R$ 12.500,00                                 │  ← text-5xl, VERDE — soma do mês
│  Recebido R$ 3.000 · Faturado R$ 5.500 · …     │  ← quebra por confiança, text-xs
├─────────────────────────────────────────────┤
│  ─── Esta semana ───────────────────────────  │  ← agrupador por janela (resolve G4)
│  ┌─────────────────────────────────────────┐ │
│  │ 🧾  Cliente Acme — Projeto site           │ │
│  │     Qui 12/06 · parcela 1/2   R$ 2.500,00 │ │  ← faturado, âmbar
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ ◌  Cliente Beta — Consultoria             │ │
│  │     Sex 13/06 · previsto      R$ 1.800,00 │ │  ← previsto, cinza tracejado
│  └─────────────────────────────────────────┘ │
│  ─── Próximas semanas ──────────────────────  │
│  ┌─────────────────────────────────────────┐ │
│  │ ✅  Cliente Acme — entrada (recebido)      │ │
│  │     03/06 · caiu na Inter PJ  R$ 3.000,00 │ │  ← recebido, verde, já é saldo
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ 🧾  Mensalidade Gamma                      │ │
│  │     20/06 · recorrente        R$ 5.000,00 │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ╭─────────────────────────────────────────╮ │
│  │  + Nova entrada de projeto                │ │  ← CTA primária (form §4)
│  ╰─────────────────────────────────────────╯ │
└─────────────────────────────────────────────┘
```

Tocar num recebível **faturado/previsto** abre ação contextual: "Marcar como recebido"
→ promove o estado para `recebido`, grava `occurred_on` = hoje (ou data escolhida) e,
opcionalmente, cria a `transaction` de entrada na Inter PJ. É o único ponto em que
dinheiro previsto vira saldo, e exige toque explícito do Iremar.

---

## (3) A PAGAR (timeline) — aba/seção `/empresa/semana?tab=pagar` (default)

Responde E2 ("o que a i2 deve pagar e quando"). Unifica **duas naturezas** que a Fase 2
§2 separou no modelo de dados mas que o Iremar quer ver juntas numa linha do tempo:

- **Fixas** (`recurring_commitments` PJ → `monthly_obligations`): DAS dia 20, INSS dia
  20, pró-labore dia 5, retirada de lucros dia 5.
- **Folha variável** (`payroll_items` da rodada): as 6 pessoas da âncora.

Ordeno por **data real de vencimento/pagamento**, não por dia-do-mês, para cruzar a
fronteira do mês (resolve G4). A retirada de lucros aparece marcada como **`nao_folha`**
(não conta no Fator R) — o marcador é sutil, mas presente, porque é decisão fiscal
(Fase 2 §5).

### Wireframe textual — mobile

```
┌─────────────────────────────────────────────┐
│  [ A pagar ]  [ A receber ]                    │  ← "A pagar" ativa (default)
├─────────────────────────────────────────────┤
│  A PAGAR EM JUNHO                              │
│   R$ 17.988,71                                 │  ← text-5xl VERMELHO — fixas + folha
│  Fixas R$ 11.150 · Folha R$ 6.338,71           │  ← quebra por natureza
├─────────────────────────────────────────────┤
│  ─── Esta semana (próx. 7 dias) ────────────  │  ← janela móvel, resolve G4
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Folha 1ª sem. (6 pessoas)  R$ 6.338,71 │ │  ← AGRUPADA → toca abre Planejador §1
│  │    Sexta 13/06 · 0 de 6 pagos        ›    │ │
│  └─────────────────────────────────────────┘ │
│  ─── Dia 20 ────────────────────────────────  │
│  ┌─────────────────────────────────────────┐ │
│  │ 🏦 DAS                       R$ 2.600,21  │ │  ← fixa boleto, lê monthly_obligations
│  │    20/06 · boleto · pendente         ○    │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ 🏦 INSS                        R$ 550,00  │ │
│  │    20/06 · boleto · pendente         ○    │ │
│  └─────────────────────────────────────────┘ │
│  ─── Já passou (dia 5) ──────────────────────  │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Pró-labore Iremar       R$ 5.000,00 ✅ │ │  ← pago, verde
│  │    05/06 · pix · folha (Fator R)          │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚡ Retirada de lucros      R$ 3.000,00 ✅ │ │
│  │    05/06 · pix · fora do Fator R          │ │  ← marcador nao_folha explícito
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

A folha aparece **colapsada como um item agregado** que leva ao Planejador (§1) — não
repito as 6 pessoas aqui, senão a timeline vira ruído. Fixas mantêm o swipe/dot de
baixa idêntico a `/compromissos` (gravam em `monthly_obligations`). O número-âncora desta
aba é o **total a pagar do mês** (fixas + folha), que alimenta o DRE de caixa.

---

## (4) CADASTRO DE RECEITA DE PROJETO NOVO — form mínimo

Responde E4. A regra é **salvar com o mínimo** (feedback do Iremar, Fase 4b): só
`cliente`, `valor` e `data prevista` são obrigatórios; parcelas são opcionais. Grava em
`income_records` com `entity_id = i2`, `kind = 'projeto'`, `status = 'previsto'` (default),
`occurred_on = NULL`, `expected_on` = a data escolhida. O trigger `fator_r_guard` (Fase
4b) garante que receita PJ exige entidade business — blindagem invisível ao usuário.

### Onde fica o botão (três pontos de entrada, mesma destinação)

1. **CTA primária no rodapé da aba A Receber** (§2) — o lugar natural, no contexto.
2. **No empty state** da aba A Receber, quando não há nenhum projeto.
3. **No `/empresa` (DRE)**, um link discreto ao lado do `FaturamentoForm`, para quem
   pensa em receita pelo lado da competência. O `FaturamentoForm` atual (número agregado
   do mês) coexiste, mas a partir de agora é o caso degenerado — o caminho recomendado é
   por projeto/cliente (Fase 2 §1).

### Wireframe textual — bottom sheet mobile (não tela cheia)

```
┌─────────────────────────────────────────────┐
│  ▁▁▁  (handle de arraste do bottom-sheet)     │
│  Nova entrada de projeto                       │  ← H2 bold
│                                               │
│  Cliente *                                     │
│  ┌─────────────────────────────────────────┐ │
│  │ Ex.: Acme Ltda                            │ │  ← input glass, obrigatório
│  └─────────────────────────────────────────┘ │
│                                               │
│  Projeto (opcional)                            │
│  ┌─────────────────────────────────────────┐ │
│  │ Ex.: Site institucional                   │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Valor *                  Data prevista *      │
│  ┌──────────────────┐    ┌──────────────────┐ │
│  │ R$ 0,00          │    │ 12/06/2026     📅 │ │  ← dois campos lado a lado
│  └──────────────────┘    └──────────────────┘ │
│                                               │
│  Parcelas?  [ À vista ▾ ]                      │  ← default "À vista" (1×)
│   ↳ se 3×:  3 parcelas de R$ 2.500             │  ← preview ao vivo das parcelas
│             venc. 12/06, 12/07, 12/08          │     gera 3 income_records ligados
│                                               │
│  Já emiti a NF?  [○ Não  ●——]                  │  ← toggle: Não=previsto, Sim=faturado
│                                               │
│  ╭─────────────────────────────────────────╮ │
│  │           Salvar entrada                   │ │  ← gradiente âmbar, active:scale-95
│  ╰─────────────────────────────────────────╯ │
└─────────────────────────────────────────────┘
```

**Parcelamento gera N recebíveis ligados.** Se o Iremar escolhe 3×, o form cria 3
linhas em `income_records` (`parcela_n`/`parcela_de` = 1/3, 2/3, 3/3), com
`expected_on` espaçado mensalmente a partir da data prevista. O preview ao vivo mostra
exatamente o que será gravado — o Iremar nunca salva às cegas. O toggle "Já emiti a NF?"
define `status`: **Não → previsto** (hipótese), **Sim → faturado** (compromisso firme).
A label evita o jargão técnico (feedback Fase 4b: "status com nome técnico" → camada UI).

---

## (5) FOLHA VARIÁVEL COM PRORAÇÃO — form de cadastro de pessoa

Responde a parte mais delicada da dor #1: cadastrar a Eduarda **sem errar o valor**. O
form vive dentro da rodada (acionado por "+ Adicionar pessoa à folha", §1) e grava um
`payroll_items`. O cálculo da proração é **puro, em `packages/core`** (ao lado de
`settlement.ts`, Fase 2 §3) e roda em tempo real enquanto o Iremar digita — ele vê o
valor final formar-se, com o porquê explícito.

### A regra na tela: dias corridos, base = dias do mês civil

A fórmula da Fase 2 §3 — `valor_prorado = valor_base × (dias_trab / dias_base)` — não
aparece como fórmula; aparece como **frase em português** que o Iremar confere de cabeça.
Eduarda: começou 11/05 → 21 de 31 dias de maio → R$ 500 × 21/31 = **R$ 338,71**.

### Defaults que evitam decisão repetida (feedback Fase 4b)

"Não me faça escolher bolsa/RPA nem Fator R toda semana." → ao reusar uma pessoa de uma
rodada anterior, `tipo` e `fator_r` vêm **pré-preenchidos** (Eduarda nasce `bolsa`/`folha`,
Pedro `salario`/`folha`, contadora `servico`/`nao_folha`). Pessoa nova: default
`salario`/`folha`, editável num "avançado" recolhido.

### Wireframe textual — bottom sheet, com cálculo ao vivo

```
┌─────────────────────────────────────────────┐
│  ▁▁▁                                          │
│  Adicionar à folha · 1ª sem. junho             │
│                                               │
│  Pessoa *                                      │
│  ┌─────────────────────────────────────────┐ │
│  │ Eduarda                              ▾    │ │  ← autocomplete de quem já existe
│  └─────────────────────────────────────────┘ │
│                                               │
│  Valor cheio (mês inteiro) *                   │
│  ┌─────────────────────────────────────────┐ │
│  │ R$ 500,00                                 │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Prorar por dias?   [ ●—— Sim ]                │  ← toggle; OFF = paga o cheio
│   ↳ Início do vínculo:  [ 11/05/2026  📅 ]     │
│   ↳ Mês de referência:  Maio (31 dias)         │  ← base = dias civis, automático
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Vai receber                              │ │  ← MINI-HERO do cálculo, fundo âmbar
│  │   R$ 338,71                               │ │  ← text-3xl bold, atualiza ao vivo
│  │  500,00 × 21 de 31 dias (desde 11/05)     │ │  ← o "porquê", legível, sem fórmula
│  └─────────────────────────────────────────┘ │
│                                               │
│  ▸ Avançado (tipo, Fator R)                    │  ← recolhido; default bolsa/folha
│     Tipo: [ Bolsa ▾ ]   Conta Fator R: [✓]     │
│                                               │
│  ╭─────────────────────────────────────────╮ │
│  │        Adicionar à folha                   │ │  ← grava payroll_items
│  ╰─────────────────────────────────────────╯ │
└─────────────────────────────────────────────┘
```

**O mini-hero é o anti-erro.** Enquanto o toggle "Prorar" está ligado e o Iremar mexe na
data de início, o valor recalcula instantaneamente. Ele guarda `valor_base=500`,
`dias_trab=21`, `dias_base=31`, `valor_a_pagar=338,71` (Fase 4b 0010) — fato imutável +
auditabilidade. Em junho (mês cheio, vínculo 01–30), o toggle pode ficar OFF e ela recebe
R$ 500 — a proração só incide no mês de admissão/desligamento (Fase 2 §3). Ao adicionar,
o trigger `payroll_recalc_total` (0010) atualiza o número-âncora da rodada no mesmo
instante — o Iremar vê o total subir de R$ 6.000 para R$ 6.338,71 sem calculadora.

---

## (6) Desktop (md:pl-60) — densidade sem reflow

O shell já reserva `md:pl-60` para a `<Sidebar>`. No desktop o Planejador (§1) ganha um
**layout de duas colunas** dentro do `page-container`, sem mudar a hierarquia:

```
┌── Sidebar ──┬──────────────────────────────────────────────────────────┐
│             │  EMPRESA · i2          ‹ Folha · 1ª sem. junho ›    [⋯]    │
│  Home       │                                                            │
│  Empresa ◄  │  ┌─ COL ESQUERDA (decisão) ──┐  ┌─ COL DIREITA (cofre) ─┐  │
│  Contas     │  │  TOTAL A DESEMBOLSAR        │  │ Inter PJ  R$ 2.000     │  │
│  …          │  │   R$ 6.338,71              │  │ Faltam    R$ 4.338,71  │  │
│             │  │                            │  │ Caixinha → 4.000       │  │
│             │  │  [tabs A pagar/A receber]  │  │ NuInvest →   338,71    │  │
│             │  │  Pedro      1.200      ○   │  │ ╭────────────────────╮ │  │
│             │  │  Alana        550      ○   │  │ │ ⇄ Transferir 4.338 │ │  │
│             │  │  Eduarda      338,71   ○   │  │ ╰────────────────────╯ │  │
│             │  │  Mayana       750      ○   │  │  Inter PJ cobre ✅     │  │
│             │  │  Iremar     3.000      ○   │  └────────────────────────┘  │
│             │  │  Contadora    500      ○   │   (card cofre fica STICKY    │
│             │  └────────────────────────────┘    enquanto a lista rola)   │
└─────────────┴──────────────────────────────────────────────────────────┘
```

No desktop a lista de pagamentos não usa swipe (gesto touch); o `○` clicável é a baixa, e
hover revela "Marcar pago". O card do cofre fica **sticky** à direita — o Iremar sempre vê
o gap enquanto percorre a lista. As abas A Receber e os bottom-sheets (§4, §5) viram
**modais centrados** no desktop (mesmo conteúdo, sem o handle de arraste). A grid de
recebíveis pode ir a `md:grid-cols-2`. Mobile-first 375px continua sendo a verdade; o
desktop é o mesmo conteúdo respirando.

---

## (7) Mapa de aderência ao cenário-âncora (checklist da Lia)

| Necessidade do Iremar (briefing) | Onde resolve | Como |
|---|---|---|
| Ver o TOTAL a desembolsar | §1 número-âncora | `payroll_runs.total_a_desembolsar`, text-6xl |
| Saber QUANTO TIRAR do cofre | §1 card cofre | `Σ − saldo Inter PJ`, alocado Caixinha→NuInvest |
| Deixar o dinheiro na Inter PJ | §1 botão transferir | pré-preenche `/transferencias`, Iremar confirma |
| Eduarda PRORADA (não R$500 cheio) | §5 mini-hero + §1 item | 500×21/31 = R$ 338,71, com o "porquê" |
| Cadastrar RECEITAS de projetos novos | §4 form + §2 timeline | `income_records` previsto/faturado, entity i2 |
| Marcar cada pagamento como pago | §1 swipe + dot | grava `payroll_items.pago` + transaction |
| A receber: quando e quanto | §2 timeline | por `expected_on`, faixas de confiança |
| A pagar: quando e quanto | §3 timeline | fixas + folha por data real (G4 resolvido) |

**Veredicto da Lia:** a folha de sexta fecha em três gestos — abrir `/empresa/semana`,
tocar "Transferir do cofre" e confirmar, e arrastar cada pessoa para paga. O número
grande responde a primeira pergunta antes de qualquer rolagem; o cofre responde a
segunda; a lista com a Eduarda já prorada responde a terceira. Nenhum número órfão,
nenhuma planilha paralela, PF e PJ jamais no mesmo card (entity_id + escopo âmbar). As
telas assentam 1:1 sobre o que já existe — glass, glow, swipe da Onda 2, `transfers`, e o
modelo de dados endurecido da Fase 4b. Próxima fase: especificar o cálculo puro de
proração e o orquestrador de cofre em `packages/core`, e os Server Actions de baixa.
