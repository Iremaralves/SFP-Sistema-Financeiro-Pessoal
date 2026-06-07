# Relatório Final de QA — i2 Finance
**Ana (QA Lead) | 2026-05-17**

---

## Resumo Executivo

| Categoria | Resultado |
|-----------|-----------|
| Checks de banco de dados | ✅ 5/5 aprovados |
| Análise estática de código | 2 bugs, 12 aprovados |
| RLS / Segurança | 1 achado (baixo risco) |
| Casos de teste mapeados | 29 cenários |
| **Liberado para Beta?** | ✅ **SIM** — após corrigir BUG-01 e BUG-02 |

---

## Bugs por Severidade

### 🔴 MÉDIO — BUG-01: Filtro de conta por nome (frágil)
**Impacto:** Iremar poderia ver a conta da Juliana no seletor se o nome da conta mudar.  
**Correção:** Filtrar por `kind` — admin vê `credit_card` + `company`, operator vê só `credit_card`. Elimina dependência do nome.  
**Arquivo:** `lancamentos/novo/page.tsx` e `lancamentos/[id]/page.tsx`

### 🟡 MÉDIO — BUG-02: actionDesfazerBaixa silencia erros do banco
**Impacto:** Se o UPDATE falhar, UI mostra "Pendente" mas banco segue "Pago" → inconsistência.  
**Correção:** Capturar `{ error }` do Supabase e retornar `{ ok: false }`.  
**Arquivo:** `compromissos/actions.ts`

### 🔵 BAIXO — BUG-03: INSERT policy sem WITH CHECK
**Impacto:** Teórico (app tem 1 household). Admin poderia inserir em outro household se souber o UUID.  
**Correção:** Adicionar `WITH CHECK (household_id = get_my_household_id())`.  
**Arquivo:** Supabase migration

---

## ✅ O que está aprovado para Beta

- Dar baixa (create + update) com tratamento de erro ✅
- Desfazer baixa (funciona, BUG-02 é edge case) ✅
- Filtro de entidade por tab (Todas/Família/i2) ✅
- Badge âmbar nas contas PJ ✅
- Separação perfeita no banco (0 anomalias) ✅
- Página /empresa com DRE, faturamento, contas fixas, lançamentos ✅
- Seletor de conta PF/PJ (Iremar vê, Juliana não vê) ✅
- Auto-switch de conta ao selecionar responsável i2 ✅
- entity_id salvo corretamente em transactions e recurring_commitments ✅
- RLS correto nas tabelas críticas ✅

---

## Prioridade de Correção

| Prioridade | Bug | Estimativa |
|-----------|-----|------------|
| 1 | BUG-01: filtro por kind | 5 min |
| 2 | BUG-02: capturar erro desfazer | 3 min |
| 3 | BUG-03: WITH CHECK no INSERT | 2 min |

**Total estimado: ~10 minutos de correção.**
