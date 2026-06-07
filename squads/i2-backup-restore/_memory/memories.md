# Squad Memory — i2-backup-restore

## Estilo de Escrita
- Scripts curtos, em TypeScript, sem dependências extras
- Comandos com output claro (✓ X rows / ✗ erro)
- Documentação inline (quando rodar este backup?)

## Estrutura de Conteúdo
- Cada backup tem: timestamp, label, contagem por table, tamanho, checksum
- Comandos de fácil memorização: backup:create, backup:list, backup:restore

## Proibições Explícitas
- Nunca usar pg_dump em produção sem service_role
- Nunca rodar restore automaticamente (sempre confirmação manual 2x)
- Não comprimir o JSON antes (versionável em git se for o caso)
- Nunca commitar /backups/ no git (gitignore)

## Técnico (específico do squad)
- Supabase: jvfdzcouychlfxxnzams (sa-east-1)
- 14 tables core a backupar (lista no squad.yaml)
- Approach: JSON via Supabase JS client (não pg_dump direto)
- Vercel é serverless — armazenar em Supabase Storage para produção
- CLI local é redundância (mais rápido para dev local)

## Tipos de backup
- **Auto:** rodado por GitHub Actions ou cron toda noite (futuro)
- **Manual:** antes de migrations ou mudanças sensíveis (agora)
- **Snapshot pre-migration:** especial, rotulado com nome da migration

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)
