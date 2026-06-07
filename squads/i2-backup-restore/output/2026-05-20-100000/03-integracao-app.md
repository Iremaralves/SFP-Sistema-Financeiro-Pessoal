# 03 — Integração com o app (`/backups`)

## Arquivos criados
- `apps/web/src/app/backups/page.tsx` — UI (admin only, redireciona pra /dashboard se operator)
- `apps/web/src/app/backups/actions.ts` — server actions
- `supabase/migrations/0008_backups_bucket.sql` — bucket privado + RLS
- `apps/web/src/components/BottomNav.tsx` — entrada "🛡️ Backups" no menu "Mais"

## Server actions
- `actionCreateBackup(formData)` — cria snapshot no Supabase Storage (path: `{household_id}/{folder_name}/`)
- `actionListBackups()` — lista backups do household + lê cada `manifest.json`
- `actionRestoreBackup(formData)` — restaura com **2-step confirm**:
  1. Campo `confirm1` deve ser exatamente `"restaurar"`
  2. Campo `confirm2` deve ser exatamente o nome do folder
  - Restaura SOMENTE rows do `household_id` do admin logado — multi-tenant safe
  - Valida checksums SHA-256 antes de tocar no banco
  - DELETE em ordem inversa, UPSERT em ordem topológica

## Por que Supabase Storage (não filesystem)?
Vercel roda em containers efêmeros — `fs.writeFile` não persiste entre invocações. Storage é a opção single-source-of-truth para o app em produção. O CLI local (`pnpm backup:create`) é redundância para o dev local.

## Bucket "backups"
- **Privado** (não público)
- Size limit: 500MB por arquivo
- Mime: `application/json`
- RLS policies: admin do household pode SELECT/INSERT/UPDATE/DELETE objetos sob o prefixo do seu household

## Aplicar a migration
```bash
pnpm db:migrate
# ou direto:
supabase db push
```

## Fluxo do usuário admin
1. Acessa `/backups` (via menu "Mais")
2. Preenche label opcional → clica "🛡️ Criar ponto de restore"
3. Aguarda spinner do form-action — quando volta, o backup está na lista
4. Para restaurar: clica "↩️ Restaurar" → URL vira `?confirm=<folder>` → formulário com 2 inputs aparece → preenche os dois → submit

## Segurança
- Toda action chama `requireAdmin()` (redireciona se não-admin)
- Service role key NÃO sai do servidor (action é `'use server'`)
- Restore só apaga/insere do próprio `household_id` — admins de outros households não se misturam
- Profile do próprio admin é PROTEGIDO contra DELETE (senão ele perde acesso)
