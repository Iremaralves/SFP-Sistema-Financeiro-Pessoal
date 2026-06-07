# Validação do Banco de Dados
**Diego (DBA) | 2026-05-17**

---

## Checks de Integridade

| Check | Resultado | Status |
|-------|-----------|--------|
| Transactions sem entity_id | 0 | ✅ |
| Recurring commitments ativos sem entity_id | 0 | ✅ |
| Monthly obligations com formato de data inválido | 0 | ✅ |
| Transações i2 sem entidade business | 0 | ✅ |
| Monthly obligations órfãs | 0 | ✅ |

## Políticas RLS

| Tabela | Política | Status |
|--------|----------|--------|
| entities | SELECT: household members | ✅ |
| entities | ALL: admin only | ✅ |
| recurring_commitments | SELECT: household | ✅ |
| recurring_commitments | ALL: admin | ✅ |
| monthly_obligations | SELECT: household | ✅ |
| monthly_obligations | UPDATE: household | ✅ |
| monthly_obligations | DELETE: admin only | ✅ |
| monthly_obligations | INSERT | ⚠️ sem WITH CHECK |

## Distribuição de Dados

| Entidade | Tipo | Transações | Compromissos |
|----------|------|-----------|--------------|
| Família | personal | 207 | 8 |
| i2 Soluções Digitais | business | 18 | 3 |

## Achado: INSERT sem WITH CHECK
A policy de INSERT em `monthly_obligations` não tem cláusula `WITH CHECK`.
Isso significa que um admin autenticado poderia teoricamente inserir uma linha
com `household_id` de outro household. Em ambiente de 1 household por deploy
o risco é mínimo, mas é tecnicamente incorreto.

**Correção recomendada:**
```sql
DROP POLICY "admin manage obligations insert" ON monthly_obligations;
CREATE POLICY "admin manage obligations insert"
  ON monthly_obligations FOR INSERT
  WITH CHECK (household_id = get_my_household_id());
```
