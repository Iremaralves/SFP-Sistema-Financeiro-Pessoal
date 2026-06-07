# 04 — Testes do fluxo backup-restore

## Pré-requisitos
1. `SUPABASE_SERVICE_ROLE_KEY` configurada em `.env.local`
2. Migration `0008_backups_bucket.sql` aplicada (`pnpm db:migrate`)
3. `pnpm install` (para instalar `tsx`)

## Casos de teste

### TC1 — Backup → restore → contagens batem
```bash
# 1. Capturar contagem inicial
psql ... -c "SELECT count(*) FROM transactions;"   # ex.: 1234

# 2. Criar backup
pnpm backup:create "tc1-baseline"

# 3. (Opcional) Alterar 1 row
psql ... -c "UPDATE transactions SET description = 'TC1-MODIFIED' WHERE id = '...';"

# 4. Restaurar
pnpm backup:restore 20260520-XXXXXX-tc1-baseline --yes --confirm

# 5. Verificar
psql ... -c "SELECT count(*) FROM transactions;"   # deve continuar 1234
psql ... -c "SELECT description FROM transactions WHERE id = '...';"   # deve voltar ao original
```
**Esperado:** ✓ contagens batem · ✓ descrição restaurada

### TC2 — Alteração intencional revertida
1. Criar 5 transações novas via app
2. `pnpm backup:create "tc2"`
3. Apagar as 5 transações
4. `pnpm backup:restore <folder> --yes --confirm`
5. **Esperado:** ✓ as 5 transações voltam

### TC3 — Backup com label encontrado por list
```bash
pnpm backup:create "release-v1.2"
pnpm backup:list | grep "release-v1-2"
```
**Esperado:** ✓ aparece na listagem

### TC4 — Restore de backup inexistente
```bash
pnpm backup:restore 99999999-999999
```
**Esperado:** ✗ `Backup não encontrado: ...` e exit code 1

### TC5 — Erro tratado (sem service role)
```bash
SUPABASE_SERVICE_ROLE_KEY="" pnpm backup:create
```
**Esperado:** ✗ mensagem clara `SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes`, exit code 1

### TC6 — Página /backups: 2-step confirm bloqueia
1. Acessar `/backups` como **operator** → redireciona `/dashboard` ✓
2. Acessar como **admin** → vê página
3. Clicar "↩️ Restaurar" → formulário aparece
4. Submit com `confirm1 = "x"` (errado) → action retorna `error: 'Confirmação 1 inválida'`
5. Submit com `confirm1 = "restaurar"` mas `confirm2` errado → retorna `needsSecondConfirm: true`
6. Submit com ambos corretos → restore executa

### TC7 — Checksum corrompido
1. Criar backup
2. Editar manualmente um `transactions.json` (mudar 1 caractere)
3. `pnpm backup:restore <folder>`
4. **Esperado:** ✗ `checksum NÃO bate`, restore abortado **antes** de tocar no banco

### TC8 — Multi-tenant safety (action de restore)
- Admin do household A roda restore do backup do household A
- Backup contém rows com `household_id = A` (filtro extra na action garante isso mesmo se manifest estiver "sujo")
- **Esperado:** rows do household B NÃO são afetadas

## Plano B — Catástrofe

Se tudo der errado e até o restore via script falhar:

### Opção 1 — Supabase PITR (Point-In-Time Recovery)
1. Acessar https://app.supabase.com/project/jvfdzcouychlfxxnzams/database/backups
2. Selecionar um ponto até 24h atrás
3. Clicar "Restore" — Supabase recria o banco inteiro

### Opção 2 — Dump SQL emergencial
```bash
# Antes do desastre (defesa em profundidade):
supabase db dump --linked > emergency-$(date +%Y%m%d).sql

# Recuperação:
psql $DATABASE_URL < emergency-YYYYMMDD.sql
```

### Opção 3 — Recuperação manual via Storage
1. Acesso ao Supabase Dashboard → Storage → bucket `backups`
2. Download manual da pasta do backup desejado
3. Restaurar via `pnpm backup:restore <folder>` (após colocar no `/backups/` local)

### Contato
- **Iremar** (admin): `iremar@i2solucoes.com`
- **Squad responsável:** `i2-backup-restore` (Alex DevOps)

## Validação executada nesta entrega
- ✓ `pnpm install` adicionou tsx
- ✓ Estrutura de arquivos criada em todos os paths esperados
- ✓ `/backups` integrado ao BottomNav (admin only)
- ⚠️ Backup de TESTE end-to-end requer `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` — atualmente AUSENTE. Próximo passo manual: adicionar a key e rodar `pnpm backup:create "smoke-test"` para validar o fluxo completo.
