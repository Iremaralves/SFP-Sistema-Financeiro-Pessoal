# QA — Edge cases dos componentes novos (2026-06-08)

Persona: QA Sênior (ex-Nubank). Validado com SQL (produção) + leitura de código.

## Escopo analisado
- `DashboardOperator.tsx` (divisão + categorizar + "seu fechamento")
- `BudgetGauge.tsx` (semáforo do cartão)
- `CofrePlanner.tsx` + `empresa/pagamentos/page.tsx` (planejador + cofre PJ)
- `settlement.ts` (`calculateInvoiceSettlement`)

## Veredito
Dimensão SÓLIDA nos pontos críticos. Todas as divisões perigosas estão guardadas:
- `totalFatura > 0 ? (v/totalFatura)*100 : 0` (operator) e `: 0` (contas/budget seg)
- `teto > 0 ? ... : 100` (BudgetGauge pctUsado)
- proração: `diasMes` de `new Date(y,m,0).getDate()` é sempre ≥28, nunca 0; guarda `Number.isNaN(fullValue)`
- `getBudgetTeto` SEMPRE retorna >0 (default 8000) → o gauge nunca recebe teto=0/NaN do server

Reconciliação da divisão por responsável CONFERE com dados reais do ciclo (13/05→12/06):
iremar 1320,54 · juliana 2268,56 · casal 2583,85 · i2 1586,21 →
julianaOwn(2268,565) + casalTotal(2583,85) + iremarOwn(1320,545) + i2(1586,21) = 7759,17 = totalFatura ✓

Cofre PJ: Inter PJ=R$0 · a-pagar i2 (INSS 550 + DAS 2600,21)=R$3150,21 ·
Inter Investimentos (cofre i2)=R$4503 → cobre, restante=0, cofreInsuficiente=false ✓
Nenhuma conta PF entra no cascade (filtro entity_id===i2 + kind===investment confirmado).

Achados são de baixa/média severidade (apresentação de centavo, UX de erro silencioso).
Nenhum quebra produção, mistura PF/PJ, nem mostra NaN/Infinity.

Detalhe nos findings estruturados.
