# Diagnóstico de inconsistências — i2-data-consistency

**Data:** 2026-05-19
**Engineer:** Marcos (Data Consistency)
**Projeto Supabase:** `jvfdzcouychlfxxnzams`

---

## Resumo executivo

A tela `/contas` e a tela `/dashboard` exibem ambas um valor rotulado **"Total da fatura"**, mas calculam **conceitos diferentes**, com janelas temporais diferentes e escopo de transações diferente. Isso confunde o usuário porque o mesmo rótulo apresenta valores muito distintos (R$ 26.428,58 vs R$ 3.238,95 hoje).

---

## D1 — "Total da fatura" diverge entre /contas e /dashboard

### /contas (estado atual)

- Função usada: `calculateSettlement(transactions, '2026-05')`
- Filtro de transações no SQL: `occurred_on >= 2026-05-01 AND occurred_on < 2026-06-01`
- **Não filtra** por `account_id` → pega cartão + corrente + empresa + investimento
- **Não filtra** `is_transfer` → inclui transferências entre contas
- **Não filtra** sinal de `amount` → soma `ABS(amount)` de tudo (`calculateSettlement` faz `Math.abs`)

### /dashboard (estado atual)

- Função usada: `calculateInvoiceSettlement(transactions, referenceMonth)`
- Filtro: `account_id = <cartão> AND occurred_on BETWEEN '2026-05-13' AND '2026-06-12' AND is_transfer = false`
- A função internamente ignora `amount >= 0` (pagamentos/quitações)

### Números reais (SQL validado em 19/05)

| Responsible | /contas (mês calendário, todas tx, ABS) | /dashboard (ciclo cartão, só despesas) |
|---|---:|---:|
| casal   | 2.318,09 | 1.179,59 |
| i2      | 2.358,92 |   501,62 |
| iremar  | 20.315,67 |   413,36 |
| juliana | 1.435,91 | 1.144,37 |

Aplicando a fórmula `iremarPart = iremarTotal + casalHalf`, etc.:

| Métrica | /contas | /dashboard |
|---|---:|---:|
| iremarPart | 21.474,71 | 1.003,16 |
| julianaPart | 2.594,95 | 1.734,17 |
| i2Part | 2.358,92 | 501,62 |
| **totalFatura** | **R$ 26.428,58** | **R$ 3.238,95** |

**Diferença: R$ 23.189,63**

### Por que divergem (causas combinadas)

1. **Janela temporal diferente**
   - /contas: 01/05 → 31/05 (mês civil)
   - /dashboard: 13/05 → 12/06 (ciclo do Nubank, fechamento dia 13)
2. **Escopo de contas diferente**
   - /contas inclui tx da conta corrente, empresa, investimento (ex.: pró-labore, faturamento i2, despesas pagas em débito)
   - /dashboard inclui só tx do cartão
3. **Tratamento de pagamentos/quitações**
   - /dashboard descarta `amount >= 0` (pagamento da fatura recebido na conta cartão não conta)
   - /contas soma tudo em `ABS(amount)` → infla
4. **Transferências entre contas**
   - /dashboard usa `is_transfer = false`
   - /contas inclui transferências

### Conclusão D1

Os dois números **estão certos para o que cada função se propõe a fazer**, mas o rótulo "Total da fatura" só faz sentido para a visão do dashboard. A `/contas` na verdade mostra um agregado de "todo o dinheiro que se mexeu este mês por responsável", o que é mais próximo de "movimentação mensal por responsável" ou "visão patrimonial do mês".

---

## D2 — Glossário visual confuso

Termos atualmente em uso no app (com sentido ambíguo):

- "Total da fatura" → usado em /contas (mês calendário, tudo) e em /dashboard (cartão, ciclo). Mesmo rótulo, conceitos diferentes.
- "Divisão da fatura" → título da página /contas, mas o que está dividido lá não é só a fatura do cartão.
- "Patrimônio total" → soma de `opening_balance + sum(amount)` por conta. Cartão entra com saldo (provavelmente negativo). É coerente, mas o usuário pode estranhar.

Proposta de glossário canônico em `02-glossario.md`.

---

## D3 — Saldo do cartão na /contas

Cálculo atual:
```
balance = opening_balance + SUM(amount de TODAS as tx da conta)
```

Isso inclui transferências (pagamento da fatura vindo da conta corrente vira `+amount` no cartão), o que está **financeiramente correto** — o pagamento da fatura abate o saldo devedor do cartão.

Validação: nenhuma divergência matemática encontrada. O saldo é o saldo bancário real da conta. Se causa estranheza ao usuário, é problema de rotulagem, não de cálculo.

**Conclusão D3:** manter cálculo. Adicionar tooltip/legenda explicando que o saldo de um cartão é "fatura em aberto + lançamentos já pagos". Não há bug.

---

## Plano de correção (resumo)

1. **/contas**: renomear "Divisão da fatura" e "Total da fatura" para uma terminologia patrimonial. Adicionar link claro para o /dashboard que é a fonte oficial da "fatura do cartão no ciclo".
2. **/dashboard**: manter como está (já é a fonte canônica de "Fatura do cartão").
3. **Glossário**: documentar e refletir nos rótulos.
4. **NÃO alterar** `calculateSettlement` nem `calculateInvoiceSettlement`. Só rótulos e quem usa o quê.
