# Validação do Banco — Diego DBA
**Projeto:** jvfdzcouychlfxxnzams  
**Data:** 2026-05-18  
**Executor:** Diego (DBA — time de testes i2 Finance)  
**Método:** Queries diretas via Supabase MCP (PostgreSQL)

---

## ✅ Checks Aprovados

### 1. Tabela `fiscal_notes` — estrutura
A tabela existe com todas as 16 colunas esperadas pela migration `0006_fiscal_notes.sql` e pelo `database.types.ts`:

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| household_id | uuid | NO | — |
| income_record_id | uuid | NO | — |
| nf_number | text | NO | — |
| nf_amount | numeric | NO | — |
| nf_issued_at | date | NO | — |
| competencia | text | YES | — |
| tomador | text | YES | — |
| aliquota_iss | numeric | YES | — |
| iss_amount | numeric | YES | — |
| net_amount | numeric | YES | — |
| file_url | text | YES | — |
| file_path | text | YES | — |
| notes | text | YES | — |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**Resultado:** PASSA — schema 100% compatível com a migration e com os types TypeScript.

---

### 2. Foreign Keys em `fiscal_notes`
Ambas as FKs estão criadas com `ON DELETE CASCADE`:

- `fiscal_notes_household_id_fkey` → `households(id)` CASCADE
- `fiscal_notes_income_record_id_fkey` → `income_records(id)` CASCADE

**Resultado:** PASSA — integridade referencial garantida. Cascade correto.

---

### 3. Indexes em `fiscal_notes`
Três indexes presentes:

- `fiscal_notes_pkey` — UNIQUE btree em `id`
- `fiscal_notes_household_idx` — btree em `household_id`
- `fiscal_notes_income_record_idx` — btree em `income_record_id`

**Resultado:** PASSA — indexes de performance para as queries de listagem por household e por income_record estão presentes.

---

### 4. RLS ativado em `fiscal_notes`
```
rls_enabled = true | rls_forced = false
```
**Resultado:** PASSA — RLS ativo.

---

### 5. Policies RLS em `fiscal_notes`
Quatro policies presentes cobrindo todos os verbos:

| Policy | Verbo | Filtro |
|---|---|---|
| Users see own household fiscal notes | SELECT | `household_id = get_my_household_id()` |
| Admin can insert fiscal notes | INSERT | `household_id = get_my_household_id() AND role = 'admin'` |
| Admin can update fiscal notes | UPDATE | `household_id = get_my_household_id() AND role = 'admin'` |
| Admin can delete fiscal notes | DELETE | `household_id = get_my_household_id() AND role = 'admin'` |

**Resultado:** PASSA — isolamento por `household_id` garantido em todos os verbos. Somente admin escreve.

---

### 6. Storage bucket `fiscal-notes` — existência
Bucket encontrado:
```
id: fiscal-notes | public: false | created_at: 2026-05-18 15:39:08 UTC
```
**Resultado:** PASSA — bucket privado (acesso por signed URLs), conforme especificado na migration.

---

### 7. `income_records.reference_month` — formato
Zero registros com `EXTRACT(DAY FROM reference_month) != 1`.

**Resultado:** PASSA — todos os `reference_month` estão no formato correto `YYYY-MM-01`.

> Nota: O campo é do tipo `date` no banco, não `text`. A query inicial com `!~` falhou por type mismatch. Corrigida com `EXTRACT(DAY FROM ...)`.

---

### 8. `income_records` kind=`faturamento_i2` sem `entity_id`
Zero registros encontrados.

**Resultado:** PASSA — não há registros de faturamento sem vínculo com entidade.

> Contexto: O banco não possui `income_records` ainda (total = 0). Os 225 transactions com entity_id e 11 recurring_commitments com entity_id foram validados nas queries seguintes.

---

### 9. `fiscal_notes` orphans
Zero registros de `fiscal_notes` referenciando `income_record_id` inexistente.

**Resultado:** PASSA — sem orphans. (Tabela ainda vazia em produção.)

---

### 10. `income_records` com múltiplas `fiscal_notes`
Zero `income_record_id` com mais de uma NF vinculada.

**Resultado:** PASSA — sem duplicatas.

---

### 11. `transactions` com `entity_id` inválido
Zero transações com `entity_id` apontando para entidade inexistente.

**Resultado:** PASSA — 225 transações com `entity_id` todas referenciam entidades válidas.

---

### 12. `recurring_commitments` com `entity_id` inválido
Zero compromissos recorrentes com `entity_id` inválido.

**Resultado:** PASSA — 11 recurring_commitments com `entity_id` todos válidos.

---

### 13. `actionSalvarNF` — filtro `household_id` no UPDATE
Verificação de código em `apps/web/src/app/empresa/actions.ts` (linha 88–91):
```typescript
const { error } = await supabase
  .from('fiscal_notes')
  .update({ ...fields, updated_at: new Date().toISOString() })
  .eq('id', id)
  .eq('household_id', profile.household_id);  // filtro presente
```
E a policy UPDATE no banco valida `household_id = get_my_household_id()`.

**Resultado:** PASSA — dupla proteção: filtro no server action + policy RLS no banco.

---

## ⚠️ Problemas Encontrados

### PROBLEMA 1 — Storage policies não filtram por `household_id` (SEVERIDADE: ALTA)

As 4 policies do bucket `fiscal-notes` no Supabase Storage usam apenas:
```sql
auth.role() = 'authenticated'
```

Isso significa que **qualquer usuário autenticado** pode ler, fazer upload, atualizar ou deletar **qualquer arquivo** no bucket, independentemente do `household_id`.

**Policies atuais:**
| Policy | Verbo | Filtro real |
|---|---|---|
| Authenticated can read own fiscal notes | SELECT | `auth.role() = 'authenticated'` apenas |
| Admin can upload fiscal notes | INSERT | `auth.role() = 'authenticated'` apenas |
| Admin can update fiscal notes storage | UPDATE | `auth.role() = 'authenticated'` apenas |
| Admin can delete fiscal notes storage | DELETE | `auth.role() = 'authenticated'` apenas |

**Impacto:** Cross-tenant storage leak. Um usuário admin do household A pode acessar, sobrescrever ou deletar PDFs de NFs do household B se souber o path. O isolamento de dados é crítico neste sistema financeiro.

---

### PROBLEMA 2 — Policy UPDATE em `fiscal_notes` sem `WITH CHECK` (SEVERIDADE: MÉDIA)

A policy de UPDATE só tem `USING` (controla quem pode iniciar o update), mas não tem `WITH CHECK` (controla para onde os dados podem ir depois do update):

```sql
-- atual:
USING (household_id = get_my_household_id() AND get_my_role() = 'admin')
WITH CHECK: null
```

Isso significa que um admin poderia, em tese, mover uma `fiscal_note` para outro `household_id` via UPDATE, pois o banco verifica apenas o estado ANTES do update, não DEPOIS.

**Impacto:** Risco de contaminação cross-tenant por update malicioso ou bug no client.

---

### PROBLEMA 3 — `income_records` ainda sem dados em produção (SEVERIDADE: INFO)

O banco retornou `total_income_records = 0`. A funcionalidade de registrar faturamento (`actionRegistrarFaturamento`) existe no código mas ainda não foi usada em produção.

**Impacto:** Os checks de integridade de `income_records` e `fiscal_notes` passaram por ausência de dados, não por dados corretos. Revalidar após primeiro lançamento de dados reais.

---

## 🔧 Correções Necessárias

### Correção 1 — Storage policies com isolamento por `household_id`

As policies do bucket `fiscal-notes` precisam filtrar pelo path que contém o `household_id`. A convenção de path definida na migration é:
```
{household_id}/{income_record_id}/{nf_number}_{timestamp}.pdf
```

**SQL a aplicar via Supabase Dashboard → Storage → Policies (ou migration):**

```sql
-- DROP policies fracas
DROP POLICY IF EXISTS "Authenticated can read own fiscal notes" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload fiscal notes" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update fiscal notes storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete fiscal notes storage" ON storage.objects;

-- SELECT: usuário só vê arquivos do próprio household (primeiro segmento do path)
CREATE POLICY "Users read own household fiscal notes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );

-- INSERT: admin só faz upload na própria pasta de household
CREATE POLICY "Admin upload own household fiscal notes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND get_my_role() = 'admin'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );

-- UPDATE: admin só altera arquivos do próprio household
CREATE POLICY "Admin update own household fiscal notes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND get_my_role() = 'admin'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );

-- DELETE: admin só deleta arquivos do próprio household
CREATE POLICY "Admin delete own household fiscal notes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND get_my_role() = 'admin'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );
```

**Pré-requisito:** Confirmar que `get_my_household_id()` retorna o UUID como texto e que o path de upload no client sempre começa com o `household_id` correto.

---

### Correção 2 — Adicionar `WITH CHECK` na policy UPDATE de `fiscal_notes`

```sql
-- Recriar policy UPDATE com WITH CHECK
DROP POLICY IF EXISTS "Admin can update fiscal notes" ON fiscal_notes;

CREATE POLICY "Admin can update fiscal notes"
  ON fiscal_notes FOR UPDATE
  USING (
    household_id = get_my_household_id()
    AND get_my_role() = 'admin'
  )
  WITH CHECK (
    household_id = get_my_household_id()
    AND get_my_role() = 'admin'
  );
```

Isso garante que o `household_id` não pode ser alterado para outro valor via UPDATE.

---

### Correção 3 — Adicionar revalidação após primeiro uso real

Após inserção dos primeiros `income_records` em produção, re-executar:
- Check 7 (reference_month format)
- Check 8 (faturamento_i2 sem entity_id)
- Checks 9 e 10 (fiscal_notes orphans e duplicatas)

---

## Queries Executadas (log)

```sql
-- Q01: Colunas de fiscal_notes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'fiscal_notes'
ORDER BY ordinal_position;
-- Resultado: 16 colunas, 100% compatíveis

-- Q02: FK constraints de fiscal_notes
SELECT tc.constraint_name, kcu.column_name, ccu.table_name, ccu.column_name, rc.delete_rule
FROM information_schema.table_constraints tc ...
WHERE tc.table_name = 'fiscal_notes' AND tc.constraint_type = 'FOREIGN KEY';
-- Resultado: 2 FKs com CASCADE

-- Q03: Indexes em fiscal_notes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'fiscal_notes';
-- Resultado: 3 indexes (pkey, household_idx, income_record_idx)

-- Q04: RLS em fiscal_notes
SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'fiscal_notes';
-- Resultado: rls_enabled=true

-- Q05: Policies RLS em fiscal_notes
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'fiscal_notes';
-- Resultado: 4 policies (SELECT/INSERT/UPDATE/DELETE) com household_id filter
-- AVISO: UPDATE sem WITH CHECK

-- Q06: Storage bucket fiscal-notes
SELECT id, name, public, created_at FROM storage.buckets WHERE name = 'fiscal-notes';
-- Resultado: bucket existe, public=false

-- Q07: reference_month com dia != 01 (type=date, cast necessário)
SELECT id, kind, reference_month::text FROM income_records
WHERE reference_month IS NOT NULL AND EXTRACT(DAY FROM reference_month) != 1;
-- Resultado: 0 registros

-- Q08: faturamento_i2 sem entity_id
SELECT id, reference_month FROM income_records WHERE kind = 'faturamento_i2' AND entity_id IS NULL;
-- Resultado: 0 registros (total income_records = 0)

-- Q09: fiscal_notes orphans
SELECT fn.id, fn.income_record_id FROM fiscal_notes fn
LEFT JOIN income_records ir ON ir.id = fn.income_record_id WHERE ir.id IS NULL;
-- Resultado: 0 registros

-- Q10: income_records com múltiplas fiscal_notes
SELECT income_record_id, COUNT(*) FROM fiscal_notes GROUP BY income_record_id HAVING COUNT(*) > 1;
-- Resultado: 0 registros

-- Q11: transactions com entity_id inválido
SELECT t.id FROM transactions t LEFT JOIN entities e ON e.id = t.entity_id
WHERE t.entity_id IS NOT NULL AND e.id IS NULL;
-- Resultado: 0 registros (225 transações com entity_id todas válidas)

-- Q12: recurring_commitments com entity_id inválido
SELECT rc.id FROM recurring_commitments rc LEFT JOIN entities e ON e.id = rc.entity_id
WHERE rc.entity_id IS NOT NULL AND e.id IS NULL;
-- Resultado: 0 registros (11 commitments com entity_id todos válidos)

-- Q13: Storage policies
SELECT policyname, cmd, qual FROM pg_policies WHERE schemaname='storage' AND tablename='objects';
-- PROBLEMA: policies sem filtro de household_id
```

---

## Resumo Executivo

| # | Check | Status | Prioridade |
|---|---|---|---|
| 1 | fiscal_notes — estrutura de colunas | ✅ PASSA | — |
| 2 | fiscal_notes — Foreign Keys com CASCADE | ✅ PASSA | — |
| 3 | fiscal_notes — Indexes de performance | ✅ PASSA | — |
| 4 | fiscal_notes — RLS ativado | ✅ PASSA | — |
| 5 | fiscal_notes — Policies SELECT/INSERT/DELETE | ✅ PASSA | — |
| 6 | Storage bucket fiscal-notes — existe e privado | ✅ PASSA | — |
| 7 | income_records — reference_month formato correto | ✅ PASSA | — |
| 8 | income_records — faturamento_i2 com entity_id | ✅ PASSA | — |
| 9 | fiscal_notes — sem orphans | ✅ PASSA | — |
| 10 | fiscal_notes — sem duplicatas por income_record | ✅ PASSA | — |
| 11 | transactions — entity_id sem entidade inválida | ✅ PASSA | — |
| 12 | recurring_commitments — entity_id válido | ✅ PASSA | — |
| 13 | actionSalvarNF — filtro household_id no UPDATE | ✅ PASSA | — |
| 14 | Storage policies — isolamento cross-tenant | ❌ FALHA | ALTA |
| 15 | fiscal_notes UPDATE policy — WITH CHECK | ⚠️ RISCO | MÉDIA |

**13 de 15 checks aprovados. 2 problemas a corrigir antes de ir a produção com dados reais.**
