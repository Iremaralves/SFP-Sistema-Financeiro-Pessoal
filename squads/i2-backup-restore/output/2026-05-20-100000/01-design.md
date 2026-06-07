# 01 — Design da estratégia de backup

**Autor:** Alex (DevOps) · **Data:** 2026-05-20

## Decisões

### Formato
- **JSON** (1 arquivo por table) dentro de uma pasta `{timestamp}[-label]/`.
- Por que não 1 arquivo só? Restore parcial fica fácil (`restore.ts --only transactions`).
- Cada table → `{table}.json` com formato:
  ```json
  { "table": "transactions", "rows": [ {...}, {...} ], "count": 1234 }
  ```
- Manifesto raiz: `manifest.json`
  ```json
  {
    "version": "1.0",
    "created_at": "2026-05-20T10:00:00Z",
    "label": "pre-migration-0008",
    "kind": "manual",            // manual | auto | pre-migration
    "supabase_project": "jvfdzcouychlfxxnzams",
    "tables": [
      { "name": "profiles", "count": 3, "bytes": 1234, "sha256": "..." },
      ...
    ],
    "total_rows": 9876,
    "total_bytes": 543210
  }
  ```

### Naming convention
- Pasta: `YYYYMMDD-HHmmss[-{slug-do-label}]`
- Exemplos:
  - `20260520-100000` (auto, sem label)
  - `20260520-100000-pre-migration-0008` (manual antes de migration)
  - `20260520-100000-snapshot-historico` (snapshot manual)

### Tipos de backup
| Tipo | Quando | Retenção |
|---|---|---|
| `auto` | Cron diário (futuro) | 90 dias |
| `manual` | Disparado por dev/admin | Ilimitado |
| `pre-migration` | Antes de migration | Ilimitado |

A diferença é só o campo `kind` no `manifest.json`. O `list-backups` mostra como categoria visual.

### Storage
- **Primário (prod):** bucket `backups` no Supabase Storage (path `{household_id}/{folder}/`)
- **Secundário (dev local):** `/Users/iremaralvesii/Financeiro/backups/` (gitignored)
- Página `/backups` lê de Storage; CLI lê/escreve em ambos quando disponível.

### Integridade
- SHA-256 de cada `{table}.json` no `manifest.json`.
- Contagem de rows comparada ao `count` durante restore — abortar se divergir.
- Restore valida `version` do manifest (futura compatibilidade).

### Restore — estratégia
- **NÃO** usar `DROP TABLE` (perde RLS, FKs, sequences).
- Sequência por table (respeitando ordem de FKs):
  1. `DELETE FROM table WHERE household_id = X` (ou `TRUNCATE` se for restore completo de tudo)
  2. `INSERT` em batch (100 rows / batch)
- Ordem topológica das 14 tables:
  1. `profiles`
  2. `households`
  3. `entities`
  4. `accounts`
  5. `categories`
  6. `categorization_rules`
  7. `recurring_commitments`
  8. `monthly_obligations`
  9. `transactions`
  10. `income_records`
  11. `fiscal_notes`
  12. `transfers`
  13. `csv_imports`
  14. `monthly_settlements`
- Ordem inversa para DELETE (FK-safe).

### Catástrofe (plano B)
Se nem o JSON restore funcionar:
1. Supabase Dashboard → Database → Backups → restore PITR (últimas 24h).
2. `supabase db dump --linked > emergency.sql` para snapshot SQL puro.
3. Documentado em `output/04-testes.md`.
