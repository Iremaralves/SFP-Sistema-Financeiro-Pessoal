# 02 — Scripts CLI

**Local:** `/Users/iremaralvesii/Financeiro/scripts/`

## Arquivos
- `_backup-lib.ts` — código compartilhado (cliente Supabase admin, parser de .env, lista de tables, helpers de timestamp/sha256/paginação)
- `backup.ts` — cria snapshot completo das 14 tables
- `restore.ts` — restaura snapshot (com 2-step confirm via TTY)
- `list-backups.ts` — lista backups locais + Supabase Storage

## Comandos disponíveis (package.json)
```bash
pnpm backup:create                            # manual, sem label
pnpm backup:create "pre-migration-0008"       # manual, com label
pnpm backup:create --kind=pre-migration --label="add-fiscal-notes"

pnpm backup:list                              # local + remoto
pnpm backup:list --remote                     # só remoto

pnpm backup:restore 20260520-100000           # interativo (2 prompts)
pnpm backup:restore 20260520-100000 --yes     # pula 1ª confirmação
pnpm backup:restore 20260520-100000 --yes --confirm   # NÃO INTERATIVO (use só em scripts)
pnpm backup:restore 20260520-100000 --only transactions,categories   # restore parcial
```

## Variáveis de ambiente exigidas (`.env.local`)
```
SUPABASE_URL=https://jvfdzcouychlfxxnzams.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...     # obrigatória — bypassa RLS
SUPABASE_BACKUP_UPLOAD=1                  # opcional — também sobe pro Storage
```

## Saída do backup
```
/Users/iremaralvesii/Financeiro/backups/20260520-100000[-label]/
  manifest.json
  profiles.json
  households.json
  entities.json
  accounts.json
  categories.json
  categorization_rules.json
  recurring_commitments.json
  monthly_obligations.json
  transactions.json
  income_records.json
  fiscal_notes.json
  transfers.json
  csv_imports.json
  monthly_settlements.json
```

## Detalhes técnicos
- Sem libs novas — usa `@supabase/supabase-js` já instalado em `packages/db/node_modules`
- TSX como runtime (adicionado em devDependencies)
- Paginação 1000-a-1000 para evitar timeout em tables grandes
- SHA-256 por arquivo, gravado no manifest
- Validação de checksums **antes** de tocar no banco no restore
- DELETE em ordem inversa de FK, INSERT em ordem topológica
- Batches de 100 rows no INSERT
- Comparação final de contagem por table — aborta se divergir
