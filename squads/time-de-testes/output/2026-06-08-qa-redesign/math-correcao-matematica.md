# QA — Correção Matemática (divisão, fechamento, semáforo)

**Data:** 2026-06-08 · **Persona:** QA Sênior (ex-Nubank) · **Método:** SQL real + leitura de código

Ciclo de fatura validado: **2026-05-13 → 2026-06-12** (closingDay=13, hoje=08/06, d≤13 → fecha 13/06).
Household `a1b2c3d4-e5f6-7890-abcd-ef1234567890`, cartão `b2c3d4e5...678901`.

## Dados reais do ciclo (transactions do cartão, is_transfer=false, amount<0)

| responsável | nº lanç. | despesas (abs) |
|---|---|---|
| iremar | 18 | 1.320,54 |
| juliana | 19 | 2.268,56 |
| casal | 20 | 2.583,85 |
| i2 | 13 | 1.586,21 |

- Sem lançamentos `unassigned` no ciclo (tudo categorizado).
- `Pagamento recebido` (+9.913,67) é `is_transfer=true` → corretamente excluído pela query do dashboard.
- 2 estornos IOF da i2 (+6,53 e +19,91 = +26,44) são `is_transfer=false` e `amount≥0` → corretamente ignorados por `calculateInvoiceSettlement` (que pula `amount>=0`). **Mas** entram na contagem de `faturaTotal` da AnchorHero — ver math-3.

## Settlement calculado (settlement.ts)

```
casalHalf   = 2583,85 / 2 = 1.291,925
iremarPart  = round(1320,54 + 1291,925) = 2.612,47
julianaPart = round(2268,56 + 1291,925) = 3.560,49
i2Part      = 1.586,21
totalFatura = round(2612,47 + 3560,49 + 1586,21) = 7.759,17
```

## ✅ O que está CORRETO (validado com SQL)

1. **Reconciliação da divisão por responsável (Juliana):** `julianaOwn + casalTotal + iremarOwn + i2Part = 2.268,565 + 2.583,85 + 1.320,545 + 1.586,21 = 7.759,17 = totalFatura`. Fecha exato.
2. **julianaOwn = julianaPart − casalHalf** = 3.560,49 − 1.291,925 = 2.268,565, **≥ 0** sempre (e o `Math.max(0, ...)` blinda contra negativo). Bate com o julianaTotal real (2.268,56).
3. **"Seu fechamento" = settlement.julianaPart** = 3.560,49. A linha de apoio (`julianaOwn + casalHalf`) também resolve para 3.560,49. Consistente.
4. **Semáforo (BudgetGauge):** `comprometido = iremarPart(2.612,47) + boletosPF(5.107,75) = 7.720,22`; `disponível = 8.000 − 7.720,22 = 279,78`; `pctUsado = 96,5%` → estado **🔴 vermelho "Estourou"** (≥95). Fórmula e estado corretos. `boletosPF` filtra `paid_by='iremar' AND responsible≠'i2'` → não vaza PJ.
5. **Planejador/Cofre (i2, junho):** total a pagar = 5.000 + 3.000 + 2.600,21 + 550 = **11.150,21**; `saldoInterPJ=0`; `deficit=11.150,21`; cascata resgata `min(11.150,21, 4.503)=4.503` do Inter Investimentos; `restante=6.647,21` → **🔴 "Cofre não cobre tudo"**. Math correto.
6. **Fator R / PF×PJ:** o planner só varre `i2Accounts.filter(kind==='investment')` → Caixinha Nubank e NuInvest (Família) **nunca** são tocados. `saldoContas` (dashboard) e patrimônio (/contas) filtram por `entity_id` vs business entity. Nenhuma mistura PF/PJ detectada nas três telas.

## Achados

Ver findings estruturados. Resumo:
- **math-1 (baixa):** discrepância de R$ 0,01 entre AnchorHero/QuickActions "Cartão" (7.759,16, soma bruta) e card "Total da fatura"/donut (7.759,17, settlement com dupla arredondação). Mesma tela, dois números pra mesma fatura.
- **math-2 (baixa):** `aPagarTotal`/`aPagarCount` (Quick Actions, A pagar) somam TODOS os commitments ativos sem filtro de entidade → incluem 11.150,21 de contas PJ (Pró-labore, Retirada, DAS, INSS) misturados com PF no badge "A pagar". Não quebra o cofre nem o settlement, mas o número exibido pro Iremar mistura PF+PJ (17.987,96).
- **math-3 (baixa):** estornos IOF positivos da i2 (+26,44) inflam levemente a contagem mas não o valor de `faturaTotal` (que filtra amount<0); apenas registro — sem impacto numérico.
- **math-4 (baixa, latente):** `currentInvoiceCycle` usa `new Date(y,m,d).toISOString()` — correto em UTC e UTC−N (Brasil/Vercel), mas desloca 1 dia em fusos UTC+N (leste). Sem impacto no deploy atual.
