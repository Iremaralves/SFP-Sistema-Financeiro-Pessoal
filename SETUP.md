# i2 Finance — Guia de Setup

## Pré-requisitos

- [Bun](https://bun.sh) ≥ 1.1.0
- [pnpm](https://pnpm.io) ≥ 9.0
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (gratuita)

---

## Passo 1 — Instalar dependências

```bash
cd /Users/iremaralvesii/Financeiro
pnpm install
```

---

## Passo 2 — Criar projeto Supabase

1. Acesse https://app.supabase.com e crie um novo projeto
2. Nome: `i2-finance`
3. Região: `South America (São Paulo)`
4. Aguarde o projeto iniciar (~2 min)

---

## Passo 3 — Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com as chaves do seu projeto Supabase:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_URL`
- **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

(Encontre em: Settings → API no painel do Supabase)

---

## Passo 4 — Aplicar migrations (schema + RLS + seed)

```bash
# Login no Supabase CLI
supabase login

# Linkar ao projeto (copie o project-id do painel)
supabase link --project-ref SEU_PROJECT_ID

# Aplicar migrations
supabase db push
```

Isso cria todas as tabelas, RLS, funções e os dados iniciais (household, contas, regras).

---

## Passo 5 — Criar usuários no Supabase Auth

1. No painel Supabase, vá em **Authentication → Users**
2. Clique **Invite user**
3. Crie dois usuários:
   - `iremar@i2solucoes.com.br` (admin)
   - `juliana@seudominio.com` (operator)

4. No **SQL Editor**, rode:

```sql
-- Substitua os emails e o household_id correto
INSERT INTO profiles (id, household_id, name, role)
VALUES
  ((SELECT id FROM auth.users WHERE email = 'iremar@i2solucoes.com.br'),
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Iremar', 'admin'),
  ((SELECT id FROM auth.users WHERE email = 'juliana@seudominio.com'),
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Juliana', 'operator');
```

---

## Passo 6 — Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Seguir as instruções:
# - Framework: Next.js
# - Root directory: apps/web
# - Confirmar build settings

# Após primeiro deploy, configurar env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redeploy com as vars
vercel --prod
```

URL gerada: `i2-finance-xxx.vercel.app`

---

## Passo 7 — Configurar CLI (Iremar)

```bash
# Tornar executável
chmod +x apps/cli/src/index.ts

# Alias global (adicione ao ~/.zshrc ou ~/.bashrc)
alias i2fin="bun /Users/iremaralvesii/Financeiro/apps/cli/src/index.ts"

# Recarregar shell
source ~/.zshrc

# Login
i2fin login --email iremar@i2solucoes.com.br
# → Clique no magic link no e-mail
```

---

## Uso diário

### Iremar (CLI)

```bash
# Importar fatura
i2fin importar ~/Downloads/Nubank_2026-06.csv

# Ver lançamentos do mês
i2fin listar 2026-06

# Categorizar pendentes
i2fin categorizar

# Registrar pró-labore
i2fin receita pro-labore 5000 "Pró-labore junho"

# Registrar transferência da Juliana
i2fin receita juliana 4892.98 "Transferência Juliana jun/26"

# Fechar mês
i2fin fechar 2026-06
```

### Juliana (PWA mobile)

1. Abra `i2-finance-xxx.vercel.app` no celular
2. **Adicione à tela inicial** (botão compartilhar → "Adicionar à tela de início")
3. Login com magic link
4. Use o **"+" flutuante** para adicionar lançamentos

---

## Desenvolvimento local

```bash
# Rodar PWA em dev
pnpm dev --filter=@i2fin/web

# Rodar testes do core
pnpm test --filter=@i2fin/core

# Verificar tipos
pnpm typecheck
```
