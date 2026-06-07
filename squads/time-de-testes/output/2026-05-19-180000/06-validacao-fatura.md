# Validação Fatura — 2026-05-19

**Squad:** time-de-testes
**Responsáveis:** Ana (QA Lead) + Diego (DBA)
**Escopo:** correções de `calculateInvoiceSettlement`, ciclo da fatura, transfers de pagamento, link do alerta, layout do `EquacaoCard`.
**Projeto Supabase:** `jvfdzcouychlfxxnzams`
**Household:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
**Cartão validado:** Cartão Nubank (`b2c3d4e5-f6a7-8901-bcde-f12345678901`, kind=`credit_card`)

---

## ✅ Aprovado

### 1. Total da fatura junho (ciclo 13/05 → 12/06) bate com Nubank
Query no banco somando `ABS(amount)` das transactions do cartão no ciclo, com `is_transfer=false` e `amount<0`:

| qtd | total_despesas | total_so_negativos |
|-----|----------------|--------------------|
| 28  | **R$ 3.238,94** | **R$ 3.238,94**     |

→ **Idêntico ao valor real da fatura Nubank (R$ 3.238,94).** Diferença = R$ 0,00.

### 2. Transactions de pagamento da fatura marcadas como transfer
As 2 linhas de R$ 9.913,67 estão corretamente pareadas:

| account | occurred_on | description | amount | is_transfer | transfer_id |
|---------|-------------|-------------|--------|-------------|-------------|
| Conta Iremar (`c3d4...`) | 2026-05-19 | Pagamento Fatura Nubank (venc. 20/05/2026) | -9913.67 | **true** | `17c08ca4-...` |
| Cartão Nubank (`b2c3...`) | 2026-05-19 | Pagamento recebido | +9913.67 | **true** | `17c08ca4-...` |

→ Ambos `is_transfer=true`, mesmo `transfer_id`. Pareamento OK. Não entram mais no total da fatura.

### 3. `calculateInvoiceSettlement` ignora amount ≥ 0
Confirmado em `packages/core/src/settlement.ts:78`: `if (t.amount >= 0) continue;`
→ Mesmo que um pagamento da fatura não fosse marcado como transfer, ele seria ignorado por ser positivo no cartão. Defesa em profundidade OK.

### 4. `currentInvoiceCycle(today=19/05, closingDay=13)` retorna ciclo correto
Hoje (19) > closingDay (13) → próximo fechamento 13/06; start = 13/05; end = 12/06; referenceMonth = 2026-06. Lógica em `settlement.ts:117-155` validada.

### 5. Layout `EquacaoCard` responsivo
Em `DashboardAdmin.tsx`:
- Linha 202: container do header tem `min-w-0`
- Linha 204: total tem `truncate`
- Linhas 210, 218, 226: cada coluna da equação tem `flex-1 min-w-0` + valor com `truncate`
- Separadores `+` e `=` têm `flex-shrink-0`

→ Card "Iremar" não estoura mais em telas estreitas. Aprovado.

### 6. Link do alerta "sem responsável" usa `<Link>` do Next
Em `DashboardAdmin.tsx:3` importa `import Link from 'next/link';`
Em `DashboardAdmin.tsx:82` o alerta usa `<Link href="/importar" ...>` (não mais `<a>`).
→ Navegação client-side, sem reload. Aprovado.

---

## ⚠️ Pontos de atenção

### A. `totalFatura` no dashboard hoje está em ~R$ 0,00 (não R$ 3.238,94)
Causa: das 28 transactions do ciclo, **todas as 28 estão com `responsible='unassigned'`**:

| responsible | qtd | total |
|-------------|-----|-------|
| unassigned  | 28  | R$ 3.238,94 |

Como o `calculateInvoiceSettlement` só soma `iremar`, `juliana`, `casal`, `i2` (switch sem default — `unassigned` é ignorado), o `totalFatura` exibido no card "Total da fatura" será **R$ 0,00** até que o Iremar categorize.

**Comportamento esperado pela lógica atual** (o alerta amarelo de "28 sem responsável" cobre isso), mas é uma **discrepância visual perigosa**: o usuário vê "Total da fatura R$ 0,00" e ao mesmo tempo o alerta de 28 itens. Pode parecer bug.

→ Recomendação: ver Plano de ação item 1.

### B. Link `/empresa` do card i2 ainda usa `<a>` (não `<Link>`)
`DashboardAdmin.tsx:137`: `<a href="/empresa" className="rounded-2xl p-4 block ...">`

Não está no escopo desta correção, mas mesma classe de problema do alerta consertado. Pequena inconsistência — vale unificar em um próximo PR.

### C. `currentInvoiceCycle` usa `Date` local + `toISOString`
`settlement.ts:141-146` cria `new Date(y, m, d)` (timezone local) e formata via `toISOString().slice(0,10)` (UTC). Em fusos negativos (Brasil = UTC-3) **a data muda 1 dia para trás** no `iso()`. Risco de off-by-one em ambientes server-side rodando em UTC vs. cliente em America/Sao_Paulo.

→ Recomendação: substituir `toISOString().slice(0,10)` por formatação manual `${y}-${MM}-${DD}` usando getters locais (mesmo padrão já usado em `yyyymm`).

---

## ❌ Bugs/Inconsistências

Nenhum bug bloqueante encontrado nesta rodada. Os 3 itens em "Pontos de atenção" são melhorias/UX, não falhas funcionais.

---

## 💰 Números calculados

| Métrica | Valor SQL | Esperado | Status |
|---|---|---|---|
| Despesas cartão Nubank ciclo 13/05–12/06 (excluindo transfers) | **R$ 3.238,94** | R$ 3.238,94 | ✅ |
| Qtd transactions no ciclo | 28 | 28 | ✅ |
| Soma das 28 unassigned | R$ 3.238,94 | R$ 3.238,94 | ✅ (100% ainda sem categoria) |
| Pagamento Fatura Nubank (transfer) | -R$ 9.913,67 / +R$ 9.913,67 | pareado | ✅ |
| `totalFatura` renderizado HOJE no dashboard | ~R$ 0,00 | R$ 0,00 (porque tudo é unassigned) | ✅ comportamento esperado |
| `totalFatura` APÓS categorização | R$ 3.238,94 | R$ 3.238,94 | ✅ projeção |

---

## 📋 Plano de ação

1. **Iremar:** categorizar as 28 transactions em `/importar` (todas atualmente `unassigned`). Após isso, validar visualmente no dashboard que o card "Total da fatura" exibe **R$ 3.238,94** e que a soma de `iremarPart + julianaPart + i2Part` confere.
2. **Dev (P2 – UX):** considerar exibir `totalFatura` calculado também com as `unassigned` agregadas em um sub-rótulo do tipo "pendente de categorização: R$ X" no card "Total da fatura", para evitar a sensação de "fatura vazia" quando há alerta amarelo ativo.
3. **Dev (P3 – consistência):** trocar `<a href="/empresa">` por `<Link href="/empresa">` em `DashboardAdmin.tsx:137`.
4. **Dev (P3 – bug latente):** substituir `toISOString().slice(0,10)` por formatação local em `currentInvoiceCycle` para eliminar risco de off-by-one em fuso.
5. **QA (regressão):** após a categorização, repetir as 3 queries SQL deste relatório como smoke test antes do próximo deploy.

---

**Conclusão:** correções da fatura (ciclo, transfer, filtro por `credit_card`, layout, link do alerta) estão **aprovadas para produção**. O dashboard exibirá o total correto assim que as 28 transactions forem categorizadas. Nenhum bug bloqueante; 3 melhorias recomendadas para o próximo ciclo.
