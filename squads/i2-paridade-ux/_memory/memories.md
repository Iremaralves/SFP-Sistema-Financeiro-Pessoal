# Squad Memory — i2-paridade-ux

## Estilo de Escrita
- Listas comparativas (admin vs operator) sempre que possível
- Decisões com justificativa de UX (por que essa feature faz/não faz sentido para o operator)

## Estrutura de Conteúdo
- Tabela de paridade: feature | admin | operator | decisão
- Diff visual mínimo: o que tirar/adicionar em cada arquivo

## Proibições Explícitas
- NÃO criar componentes novos só pra operator — REUSAR DashboardAdmin onde possível com variações
- NÃO mudar lógica de negócio sem clareza
- NÃO instalar libs novas

## Lições de campo — 2026-05-20 (post mortem)
**O squad atestou que /importar estava OK pra Juliana, mas no uso real:**
- `actionImportarDrive` tinha guard `role !== 'admin'` → bloqueava OPERATOR DE FATO IMPORTAR
- `Sidebar` retornava `null` pra operator → desktop dela ficava com gap de 60 unidades à esquerda sem sidebar
- `/acerto` e `/mes` removeram o redirect (OK), mas o link na nav só foi adicionado parcialmente

**Regras novas para próximas runs:**
1. **Conferir CADA server action** (não só páginas) — `role !== 'admin'` bloqueia tudo
2. **Componente Sidebar deve sempre renderizar quando `md:pl-60` está em uso** — ou ambos ou nenhum
3. **Logar como cada role** mentalmente e simular fluxo end-to-end de cada feature

## Técnico (específico do squad)
- Stack: Next.js 15 · Tailwind v4 · Supabase
- Roles: admin (Iremar) | operator (Juliana)
- Componentes-chave: DashboardAdmin, DashboardOperator, Sidebar, BottomNav, CategorizarItem
- Páginas com guard de admin: /relatorios, /transferencias, /acerto, /mes, /empresa, /empresa/notas, /importar (verificar quais devem permitir operator)

## Decisões de paridade (referência)
- /acerto: ambos veem (Juliana paga muita coisa do Iremar — ela precisa do acerto)
- /mes (fechamento): ambos veem (relevante para os dois)
- /empresa, /empresa/notas: APENAS admin (gestão da i2)
- /transferencias: APENAS admin (Iremar é quem move dinheiro entre contas)
- /relatorios: ambos veem (operator pode ver versão simplificada da própria parte)
- /importar: ambos veem (Juliana importa, Iremar precisa acessar como admin)
- /categorizar: ambos veem (qualquer um pode categorizar)
- /compromissos: ambos veem (operator vê os próprios; admin vê todos)

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

