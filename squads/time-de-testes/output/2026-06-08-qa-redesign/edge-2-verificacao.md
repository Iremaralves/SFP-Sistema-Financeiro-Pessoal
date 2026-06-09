# Verificação adversarial — edge-2

**Achado:** BudgetGauge: teto inválido/vazio ao editar falha em silêncio (sem feedback)
**Veredito:** REAL (confirmado) · Severidade: baixa (mantida) · Confiança: alta

## Arquivos analisados
- `apps/web/src/components/BudgetGauge.tsx`
- `apps/web/src/app/_actions/budget.ts`

## Evidência concreta

### BudgetGauge.tsx:33-39 — `salvarTeto()`
```ts
function salvarTeto() {
  const v = parseFloat(draft.replace(/\./g, '').replace(',', '.'));
  startTransition(async () => {
    const res = await setBudgetTeto(v);
    if (res.ok) { setEditing(false); router.refresh(); }
  });
}
```
- Input vazio `""` → `parseFloat("") === NaN`.
- Input só letras `"abc"` → `parseFloat("abc") === NaN`.
- Input `"0"` ou `"-5"` → valor `<= 0`.
- O `if (res.ok)` NÃO tem ramo `else`. Quando `res.ok === false`, nada acontece.

### budget.ts:18-21 — `setBudgetTeto(value)`
```ts
export async function setBudgetTeto(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false as const, error: 'Valor inválido' };
  }
  ...
  return { ok: true as const };
}
```
- `NaN` reprovado por `!Number.isFinite(value)`; `<= 0` reprovado pelo segundo termo.
- Retorna `{ ok: false, error: 'Valor inválido' }`.

### Estado do componente (linhas 18-21)
- `isPending`, `editing`, `draft`. NÃO existe estado de erro.
- `res.error` ('Valor inválido') é descartado — nunca renderizado.

## Reprodução
1. Iremar (perfil Pessoal) clica no ✎ ao lado de "Teto do mês".
2. Apaga o conteúdo do input (ou digita letras / 0 / negativo).
3. Clica "OK". `draft=""` → `v=NaN` → server `{ok:false}` → `if(res.ok)` falso.
4. Resultado: o campo continua aberto, sem mensagem de erro, sem toast. O botão
   pisca "..." (isPending) e volta a "OK". Zero feedback.

## Impacto / não-impacto
- NÃO corrompe dado: o cookie permanece com o teto válido anterior; o gauge segue
  renderizando o teto antigo válido vindo do prop do server (sem `router.refresh`).
- NÃO mostra número errado.
- NÃO viola regra sagrada (separação PF/PJ, reconciliação de fatura, etc.).
- NÃO quebra fatura / acerto / compromissos / contas.
- É apenas UX confusa num caminho incomum (usuário precisa ativamente esvaziar/
  invalidar o campo). Campo de conveniência do orçamento pessoal com default R$8.000.

## Severidade
Mantida em **baixa**. O reviewer acertou. Não há quebra, não há valor errado, não
há violação de regra. É silent-failure de UX em ramo de erro raro.

## Sugestão de correção (não aplicada — só análise)
Adicionar estado de erro e exibir `res.error` quando `!res.ok`, OU validar `v`
inline antes de chamar a action (ex.: "digite um valor maior que zero"), seguindo
o padrão do CofrePlanner que já usa `setError`.
