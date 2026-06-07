# Implementação — i2-data-consistency

**Data:** 2026-05-19

## Arquivos alterados

### `apps/web/src/app/contas/page.tsx`
- Título da página: `"Divisão da fatura"` → **"Visão patrimonial"**
- Divisor central: `"Divisão da fatura"` → **"Movimentação do mês"**
- Hero label: `"Total da fatura"` → **"Total movimentado no mês"**
- Subtexto novo no hero explicando que a fatura do cartão (ciclo Nubank) está no /dashboard, com link.
- Tooltip do "Patrimônio total" agora explicita: "Patrimônio líquido · soma dos saldos de todas as contas (cartão entra negativo)".

### `apps/web/src/app/dashboard/page.tsx`
- Sem alterações. É a fonte canônica de "Fatura do cartão (ciclo aberto)".

### `packages/core/src/settlement.ts`
- Sem alterações. `calculateSettlement` e `calculateInvoiceSettlement` mantidos intactos conforme regra do squad.

## Arquivos NÃO alterados (coordenação com squad i2-paridade-ux)

Os arquivos abaixo estão sob escopo do squad `i2-paridade-ux` e foram deixados intactos por este squad:
- `DashboardAdmin.tsx`, `DashboardOperator.tsx`
- `Sidebar.tsx`, `BottomNav.tsx`
- `compromissos/page.tsx`, `categorizar/CategorizarItem.tsx`
- `acerto/page.tsx`, `mes/page.tsx`

Observação para o outro squad: se os labels "Total da fatura" / "Fatura aberta" aparecerem em `DashboardAdmin.tsx` ou `DashboardOperator.tsx`, considerar adotar o termo **"Fatura do cartão (ciclo aberto)"** ou simplesmente **"Fatura aberta"** para alinhar com o glossário canônico (`02-glossario.md`). Como o dashboard JÁ é a fonte canônica, mudar o label só reforça a leitura, não corrige cálculo.

## Validação SQL (real, 19/05/2026)

| Visão | totalFatura calculado |
|---|---:|
| /contas (mês civil, todas tx, ABS) — agora rotulado "Total movimentado no mês" | R$ 26.428,58 |
| /dashboard (ciclo cartão 13/05–12/06, só despesas) — "Fatura aberta" | R$ 3.238,95 |

Os dois números continuam diferentes — é assim que deve ser. A diferença agora está **explicada e rotulada** corretamente em cada tela.

## Próximos passos sugeridos

1. Squad `i2-paridade-ux` revisar labels em `DashboardAdmin/Operator`.
2. Time de testes validar percepção do usuário com os novos rótulos.
3. Eventualmente, criar um componente `<GlossaryTooltip term="fatura-aberta" />` reutilizável para abrir um drawer com a definição.
