# Análise Estática de Código
**Ana (QA Lead) | 2026-05-17**

---

## 🐛 Bugs Encontrados

### BUG-01 — MÉDIO | Filtro de conta por nome (frágil)
**Arquivo:** `apps/web/src/app/lancamentos/novo/page.tsx` linha 77  
**Arquivo:** `apps/web/src/app/lancamentos/[id]/page.tsx` (mesma lógica)

```ts
// ATUAL — frágil:
visibleAccounts = allAccounts.filter(a => !a.name.toLowerCase().includes('juliana'));

// PROBLEMA: se renomearem "Conta Juliana" → "Conta J." o filtro quebra
// e Iremar vê a conta pessoal da Juliana
```
**Correção:** filtrar por `kind` — admin vê `credit_card` + `company`, operator vê só `credit_card`. Contas `checking` não são usadas para lançamentos manuais neste fluxo.

---

### BUG-02 — MÉDIO | actionDesfazerBaixa não verifica erro do DB
**Arquivo:** `apps/web/src/app/compromissos/actions.ts` linhas 92–95

```ts
// ATUAL — ignora erro:
await supabase
  .from('monthly_obligations')
  .update({ status: 'pending', paid_on: null, paid_amount: null })
  ...
return { ok: true as const }; // sempre retorna ok!

// PROBLEMA: se o UPDATE falhar (RLS, rede), o botão volta para "Pendente"
// na UI mas o banco continua marcado como "Pago"
```
**Correção:** capturar `{ error }` e retornar `{ ok: false, error: error.message }` se falhar.

---

### BUG-03 — BAIXO | monthly_obligations INSERT sem WITH CHECK
**Origem:** validação do banco (Diego)

A policy `admin manage obligations insert` não tem cláusula `WITH CHECK`.  
Um usuário admin autenticado poderia tecnicamente inserir uma obrigação com `household_id` de outro household.  
**Risco:** baixo em produção (1 household por app), mas é uma falha de defesa.  
**Correção:** adicionar `WITH CHECK (household_id = get_my_household_id())`.

---

## ✅ Aprovados na Análise Estática

| Item | Status | Nota |
|------|--------|------|
| actionDarBaixa — verifica erro do DB | ✅ | `dbError` capturado e retornado |
| actionDarBaixa — referenceMonth com `-01` | ✅ | Corrigido, usa `referenceMonthDate` |
| DarBaixaButton — trata erro visualmente | ✅ | Mostra "Erro — tente novamente" |
| DarBaixaButton — desfazer só em `res.ok` | ✅ | `if (res.ok) setPaid(false)` |
| Filtro entidade via URL params | ✅ | `entidadeFiltro` lido de `searchParams` |
| entity_id salvo em novo lançamento | ✅ | Usa `selectedAcc.entity_id` |
| entity_id salvo ao editar lançamento | ✅ | Update inclui `entity_id` |
| FaturamentoForm — upsert correto | ✅ | Usa `maybeSingle` + update ou insert |
| RLS entities — SELECT e ALL por role | ✅ | Policies corretas |
| RLS recurring_commitments | ✅ | Admin: ALL, members: SELECT |
| Seletor de conta — operador sem seletor | ✅ | `isAdmin && accounts.length > 1` |
| Auto-switch conta ao selecionar i2 | ✅ | `handleResponsibleChange` |
