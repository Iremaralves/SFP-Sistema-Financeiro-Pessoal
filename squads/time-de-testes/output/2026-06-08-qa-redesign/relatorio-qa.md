# Relatório QA — Redesign i2 Finance (deploy de 08/06/2026)

**Lead de QA · validação adversarial em produção** (Supabase `jvfdzcouychlfxxnzams`, household `a1b2c3d4…`)
Escopo: telas implementadas hoje — Dashboard da Juliana, Semáforo do cartão (Iremar Pessoal), Planejador de pagamentos da i2, separação PF/PJ por entidade.
Achados brutos: 13 · confirmados reais após verificação: 8 · **bugs de severidade alta/média: 0**.

---

## 1) Veredito geral

### ✅ SIM, COM RESSALVAS — pronto pra uso.

Nenhuma **regra sagrada** foi violada e nenhum número errado é exibido em produção hoje. As 8 issues confirmadas são todas de **severidade baixa**: 1 vazamento cosmético de rótulo (PJ no contador "A pagar" do perfil pessoal), 2 questões de UX/copy, 2 fragilidades latentes (fuso horário e config futura), 1 silent-failure de validação e 1 item de dado (não-código). Pode seguir pro próximo épico; nenhuma é bloqueante.

**As duas regras sagradas que mais importavam foram validadas via SQL com dados reais:**

- **Reconciliação da divisão (fatura do mês):** `julianaOwn + casalTotal + iremarOwn + i2 = totalFatura`. SQL: iremar_raw 1.320,54 · juliana_raw 2.268,56 · casal 2.583,85 · i2 1.586,21 → soma 7.759,16 ≈ totalFatura 7.759,17 (diferença de 1 centavo, arredondamento — aceitável). `julianaOwn = julianaPart − casalHalf = 2.268,56 ≥ 0` ✓. **Fecha.**
- **PF/PJ nunca se misturam (Fator R):** cofre i2 (Inter Investimentos R$ 4.503, `kind=investment`, entity business) está isolado do cofre da Família. O Planejador (`empresa/pagamentos/page.tsx:87`) filtra `entity_id === i2Entity` antes de tudo, e os cofres consumidos no resgate são só `investment` da i2. `/contas` e o saldo do dashboard filtram por `entity_id` (não por kind), então a Reserva i2 não vaza pro Pessoal. **Fecha.**

---

## 2) Bugs confirmados, por severidade

### 🔴 ALTA — nenhum.
### 🟠 MÉDIA — nenhum.
(O candidato `edge-3`, originalmente "média", foi rebaixado pra baixa na verificação adversarial: o caminho feliz está garantido hoje, não mostra número errado e não fere regra sagrada.)

### 🟡 BAIXA — 8 confirmados

**math-2 · "A pagar" do dashboard pessoal/tudo mistura contas PJ no total**
`apps/web/src/app/dashboard/page.tsx:90-124`
O array `bills` puxa TODOS os `recurring_commitments` ativos não-cartão sem filtro de entidade; `aPagarTotal`/`aPagarCount` somam tudo e alimentam o tile "A pagar" do QuickActions no perfil pessoal do Iremar. Inclui as 4 obrigações da i2 (Pró-labore 5.000 + Retirada 3.000 + DAS 2.600,21 + INSS 550 = **11.150,21**) dentro do número de R$ 17.987,96 (17 itens). É só a etiqueta do tile — não toca cofre nem settlement. Inconsistente com `boletosPFIremar` (:168-170), que já exclui `responsible==='i2'`.
**Fix:** filtrar `bills` por escopo de entidade (pessoal = `entity != business`) antes de calcular `aPagarTotal`/`aPagarCount`, ou ao menos excluir `responsible==='i2'`.

**ux-3 · AnchorHero rotula cofre PJ como "disponível pra operação"**
`apps/web/src/components/AnchorHero.tsx:49-57` (origem em `dashboard/page.tsx:144-153`)
No escopo Empresa, o número-âncora "Saldo i2 Soluções · disponível pra operação" soma TODAS as contas PJ exceto cartão — incluindo `investment` (Inter Investimentos R$ 4.503). Resultado: âncora exibe R$ 4.503 como "disponível pra operação", quando R$ 0 está líquido na conta operacional (Inter PJ) e os R$ 4.503 estão no cofre. Contradiz a própria lógica do CofrePlanner, que trata cofre como NÃO líquido. Não é Fator R (ambas são da i2), é semântica de rótulo.
**Fix:** no âncora empresa, usar só `kind=company` (Inter PJ) como liquidez operacional e mostrar o cofre como linha secundária; ou trocar sublabel para "Conta empresa + cofre".

**math-4 · `currentInvoiceCycle` pode deslocar 1 dia em fuso UTC+N (latente)**
`packages/core/src/settlement.ts:141-146`
`new Date(y,m,d)` em horário local + `toISOString().slice(0,10)`. Em UTC e fusos a oeste (Brasil, Vercel) bate; em UTC+N o meia-noite local cai no dia anterior em UTC e desloca start/end/closingDate. **Zero impacto hoje** (servidor roda em UTC; único call site é Server Component). Fragilidade latente.
**Fix:** formatar a partir de `getFullYear/getMonth/getDate` com `padStart` em vez de `toISOString()`.

**edge-2 · BudgetGauge: teto inválido/vazio falha em silêncio**
`apps/web/src/components/BudgetGauge.tsx:33-39`
`salvarTeto()` chama `setBudgetTeto(v)`; com input vazio/letras `v=NaN`, a action retorna `{ok:false, error:'Valor inválido'}` (`budget.ts:18-21`), mas o componente só trata `if (res.ok)`. No ramo `false` o campo fica aberto sem mensagem nem toast — `res.error` é descartado. Não corrompe dado (gauge segue com o teto válido antigo), só UX confusa.
**Fix:** adicionar estado de erro e exibir `res.error` quando `!res.ok` (espelhar o `setError` que o CofrePlanner já tem), ou validar `v` antes de chamar a action.

**edge-3 · Planejador esconde o CofrePlanner se a i2 perder a conta `kind=company`**
`apps/web/src/app/empresa/pagamentos/page.tsx:88,92,191`
`interPJ = i2Accounts.find(kind==='company')`; o card só renderiza com `{interPJ && …}`. Se a conta empresa for renomeada/desativada/recriada com outro kind, `interPJ=undefined`, `saldoInterPJ=0` e o card de cofre some — escondendo o cofre de R$ 4.503 sem aviso. Hoje há exatamente 1 conta company (Inter PJ), então o caminho feliz funciona. Resiliência a config futura.
**Fix:** quando não houver conta company, exibir aviso explícito ("Nenhuma conta empresa configurada — saldo PJ R$ 0") em vez de ocultar o card.

**ux-2 · Saudação fixa "Boa noite" no dashboard da Juliana**
`apps/web/src/components/DashboardOperator.tsx:106-108`
String hardcoded `Boa noite, {firstName} 👋`, sem derivar de `getHours()`. Juliana abrindo de manhã verá "Boa noite". Afeta SÓ o Operator — o DashboardAdmin (:103) já usa "Olá" neutro (correção ao título do achado, que dizia "Operador e Pessoal").
**Fix:** derivar do horário (`<12` Bom dia, `<18` Boa tarde, senão Boa noite).

**edge-5 · Planejador: âncora "R$ 0,00" gigante em mês 100% pago**
`apps/web/src/app/empresa/pagamentos/page.tsx:117-119,179-181`
O número-âncora é só dos pendentes. Num mês onde tudo foi pago, exibiria "R$ 0,00" em 5xl/6xl enquanto o "já pago" fica em texto pequeno — visualmente parece "sem nada". Não reproduz hoje (junho ainda não tem baixas → âncora mostra o valor cheio R$ 11.150,21). Cosmético; matematicamente correto.
**Fix:** quando `totalAPagar===0 && totalMes>0`, trocar o âncora pra `totalPago` com label "Tudo pago · R$ X desembolsado".

**regress-1 · Saldo PF aparece −R$ 9.913,67 (dado incompleto, NÃO regressão)**
`apps/web/src/app/dashboard/page.tsx:130-153` e `/contas`
Não é bug de código — o filtro por entidade está CORRETO. SQL confirma: Nubank PF tem `opening_balance=0` e a única transaction é o pagamento da fatura (−9.913,67), sem nenhuma receita lançada na conta PF; `income_records` está vazia. O saldo negativo reflete fielmente o que foi lançado.
**Ação (não-código):** alinhar com o Iremar se as contas PF devem ter `opening_balance` configurado e/ou se há receitas que deveriam virar transactions na conta.

---

## 3) O que está SÓLIDO — crédito onde é devido

- **Correção matemática / reconciliação da divisão — SÓLIDO.** Validado por SQL com dados reais: `julianaOwn + casal + iremarOwn + i2 = totalFatura` fecha (7.759,16 ≈ 7.759,17). `julianaOwn`/`iremarOwn` usam `Math.max(0, …)` evitando negativos. `calculateInvoiceSettlement` corretamente ignora pagamentos (`amount >= 0`) e só soma despesas. O "Seu fechamento" da Juliana (`julianaPart = julianaOwn + casalHalf`) está coerente. (O único arranhão é o math-2, que é etiqueta, não cálculo.)

- **Separação PF/PJ por entidade — SÓLIDO.** Todas as três superfícies (cofre/Planejador, `/contas`, saldo do dashboard) filtram por `entity_id` e não por `kind` — a decisão arquitetural certa, porque a Reserva i2 é `investment` mas é PJ. SQL confirma zero vazamento: o único transfer no banco é Nubank PF → Cartão Nubank (ambas personal). O Planejador só resgata de `investment` da i2. Fator R intacto.

- **Semáforo do cartão (BudgetGauge) — SÓLIDO no cálculo.** `comprometido = faturaParte + boletosPF`, `disponivel = teto − comprometido`, faixas verde/amarelo/vermelho em 80%/95% com clamp `Math.min(100, …)`. `boletosPF` (`boletosPFIremar`) corretamente exclui `responsible==='i2'`. O único arranhão é o edge-2 (silent-failure na edição), não o número.

- **CofrePlanner — SÓLIDO.** Cascata de resgate (`Math.min(restante, balance)`), estado `cofreInsuficiente` quando os cofres não cobrem, tratamento de erro com `setError`, e os 3 estados (cobre tudo / precisa resgatar / não cobre) bem cobertos. Transferência usa a action existente sem mexer em fatura/acerto.

- **Não-regressão das telas que já funcionavam.** Fatura, `/acerto`, `/compromissos`, `/contas` continuam intactas. `/contas` usa `calculateSettlement` (mês civil) — distinto do dashboard (ciclo do cartão) — e isso está documentado na própria UI. Nenhuma quebra observada.

---

## 4) Recomendação antes de seguir pro "a receber de projetos"

**Pode seguir.** Nenhum item é bloqueante. Mas vale fazer 2 ajustes rápidos de baixo custo e alto retorno de coerência ANTES — porque o próximo épico (recebíveis) vai mexer exatamente em rótulos de dinheiro PF/PJ e contadores agregados, e dois desses bugs encostam nessa fronteira:

1. **math-2 (15 min):** filtrar `bills` por entidade no `aPagarTotal`/`aPagarCount`. É o único achado que toca a separação PF/PJ na superfície visível ao Iremar, e o épico de recebíveis vai amplificar contadores agregados — corrigir agora evita que a inconsistência se propague pra novas métricas.
2. **ux-3 (20 min):** separar liquidez operacional do cofre no AnchorHero da empresa, ou ajustar o sublabel. O conceito "operacional vs. cofre" será central no fluxo de recebíveis; alinhar a semântica agora evita retrabalho.

**Deixar pra depois (sem pressa):** edge-2 (validação do teto), ux-2 (saudação), edge-5 (âncora zero) — UX/copy puros. math-4 e edge-3 são hardening latente, sem impacto atual. **regress-1 não é código** — só precisa de uma conversa com o Iremar sobre `opening_balance` das contas PF (recomendo resolver isso JUNTO com o épico de recebíveis, já que receitas lançadas vão zerar o saldo negativo da Nubank PF naturalmente).

**Em resumo:** as telas de hoje estão funcionalmente corretas e as regras sagradas estão respeitadas. Corrija math-2 e ux-3 como aquecimento do próximo épico; o resto é backlog tranquilo.
