# Squad Memory — gestao-multi-entidade

## Contexto do Projeto
- App: i2 Finance (Next.js 15 + Supabase)
- Repo: /Users/iremaralvesii/Financeiro
- Supabase: jvfdzcouychlfxxnzams (sa-east-1)
- Deploy: Vercel (pnpm --filter web build && npx vercel deploy --prod)

## Decisões Registradas
- **2026-05-17:** Opção B (multi-entidade completa) implementada em fases
- **Fase 1 concluída:** tabela entities + entity_id em recurring_commitments + filtro UI

## Estado das Entidades no Banco
- Família (personal, #3b82f6): 8 compromissos pessoais
- i2 Soluções Digitais (business, #f59e0b): 3 compromissos (DAS etc)

## Próximas Fases
- ✅ **Fase 2 concluída:** entity_id em transactions/income_records + página /empresa (DRE)
- **Fase 3:** tabela entity_reimbursements + tela de controle de reembolsos (pós-Beta)

## Aprendizados
- reference_month no banco é DATE, não text — sempre enviar "YYYY-MM-01"
- entity_id derivado automaticamente de responsible='i2' → business, outros → personal
