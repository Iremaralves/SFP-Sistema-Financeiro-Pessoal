# Glossário canônico — i2 Finanças

**Versão:** 1.0 · 2026-05-19

Cada termo abaixo é o **único** rótulo a usar para o conceito descrito. Onde o app hoje usa termos diferentes para o mesmo conceito, ou o mesmo termo para conceitos diferentes, a coluna "Onde aparece" indica o ajuste.

---

## 1. Fatura do cartão (ciclo aberto)

- **Definição:** soma das despesas lançadas no cartão Nubank dentro do ciclo de fechamento ATUAL (dia 13 → dia 12 do mês seguinte). Não inclui pagamentos recebidos, não inclui transferências.
- **Fórmula:** `Σ |amount|` para tx com `account_id = cartão`, `is_transfer = false`, `amount < 0`, `occurred_on ∈ [ciclo.start, ciclo.end]`.
- **Função canônica:** `calculateInvoiceSettlement(tx, refMonth)` com tx pré-filtrada pelo ciclo.
- **Onde aparece:** /dashboard (canônico). /contas referencia este número como "Fatura aberta — ver no dashboard".
- **Exemplo (19/05/2026, ciclo 13/05 → 12/06):** R$ 3.238,95.

## 2. Saldo da conta

- **Definição:** saldo bancário real da conta neste instante. Para o cartão: representa a fatura paga + lançamentos do ciclo aberto (geralmente negativo).
- **Fórmula:** `opening_balance + Σ amount` para tx com `account_id = X` (sem filtros).
- **Onde aparece:** /contas (canônico).
- **Exemplo:** Cartão Nubank com `opening_balance = 0` e tx do mês resulta em `-3.238,95` (devedor).

## 3. Patrimônio líquido

- **Definição:** soma dos saldos de TODAS as contas ativas (corrente, empresa, investimento, cartão). Cartão entra negativo e abate.
- **Fórmula:** `Σ (opening_balance + Σ amount)` por conta ativa.
- **Onde aparece:** /contas, topo da página.
- **Exemplo:** Corrente 10.000 + Empresa 5.000 + Invest 20.000 + Cartão -3.238,95 = R$ 31.761,05.

## 4. Movimentação do mês por responsável

- **Definição:** quanto cada responsável (Iremar / Juliana / Casal / i2) movimentou em despesas dentro do MÊS CIVIL atual, agregando TODAS as contas. Usado para a visão patrimonial-mensal em /contas.
- **Fórmula:** `calculateSettlement(tx, '2026-05')` (mês civil, ABS).
- **Onde aparece:** /contas, antes era "Divisão da fatura" / "Total da fatura". Renomear para **"Movimentação do mês"** e **"Total movimentado"**.
- **Exemplo (19/05/2026):** R$ 26.428,58.

## 5. A pagar este mês

- **Definição:** compromissos fixos (`monthly_obligations` + recurring sem obligation no mês) ainda pendentes.
- **Onde aparece:** /compromissos.

## 6. A receber este mês

- **Definição:** faturamento i2 projetado + outras entradas previstas no mês.
- **Onde aparece:** /mes, /dashboard (admin).

---

## Regra de ouro

> Se duas telas mostram um valor com o **mesmo rótulo**, elas DEVEM usar a **mesma fórmula** e a **mesma janela temporal**.

A fatura do cartão é responsabilidade do **/dashboard**. A visão patrimonial mensal é responsabilidade do **/contas**. As duas são complementares, não conflitantes.
