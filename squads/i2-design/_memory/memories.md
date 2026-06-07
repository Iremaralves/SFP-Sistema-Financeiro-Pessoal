# Squad Memory — i2-design

## Estilo de Escrita
- Direto, sem jargão de design quando puder evitar
- Sugestões criativas devem vir com "por que vale a pena" (impacto vs esforço)

## Design Visual
- Base: OLED black + glassmorphism
- Cores temáticas por contexto: azul (admin Iremar), rosa (Juliana), âmbar (i2), ciano (casal), esmeralda (investimento)
- Tabular nums para valores monetários
- Sem libs pesadas: tailwind v4 + SVG nativo preferenciais

## Estrutura de Conteúdo
- Cada entrega tem: o que mudou, por que, screenshot/diff, esforço

## Proibições Explícitas
- Não usar Material UI / Chakra / shadcn pesado
- Não introduzir light mode sem opção de manter dark
- Manter mobile-first como base

## Técnico (específico do squad)
- Next.js 15 App Router · Tailwind v4 · Supabase
- Breakpoints atuais: md (768), lg (1024). Provavelmente adicionar xl (1280) e 2xl (1536)
- Sidebar desktop fixa 240px + content com md:pl-60 (atual)
- Glassmorphism: rgba(255,255,255,0.06) + backdrop-filter: blur(20px)
- Cores em CSS variables → futura troca pelo usuário

## Regras de antecipação (feedback Iremar 2026-05-20)
**Squad SEMPRE deve antecipar — não esperar Iremar pedir:**
- Listagens com >10 itens → filtro + ordenação obrigatórios
- Contas/cartões → ícone do banco real (nubank/inter/etc), não emoji genérico
- Status (a pagar/pago/atrasado) → sempre filtrável por status
- Tabelas de dados → sempre searchable e sortable

## Lições de campo — feedback Iremar 2026-05-19 (run #1)
- **REGRA OURO:** Toda mudança visual no DashboardAdmin DEVE ser replicada no DashboardOperator (e vice-versa)
- Descrições de transactions ficam truncadas — usuário precisa ver o texto completo para identificar lançamento. Usar `<details>`, tooltip, modal ao tocar, ou expand inline
- Iremar perde acesso a /importar mesmo quando ele acessa o /lancamentos manualmente — o link sumiu da nav dele em algum momento
- Página /contas mostra valores DIFERENTES do /dashboard — usuário fica confuso. Devem usar a MESMA fonte de dados ou explicar claramente a diferença (mês calendário vs ciclo de fatura)
- Layout: pontos a corrigir múltiplos ainda — manter rigor de min-w-0, truncate, responsive
- Compromissos: acesso rápido para Iremar (ele paga a maioria) — talvez card no dashboard ou atalho na sidebar
- "Dar baixa" deve abrir editor inline (valor, data, observação) antes de marcar como pago — porque valores reais variam dos cadastrados

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

