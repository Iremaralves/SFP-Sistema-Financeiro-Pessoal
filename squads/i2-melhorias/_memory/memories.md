# Squad Memory — i2-melhorias

## Estilo de Escrita
- Foco em ações concretas — cada melhoria deve ter esforço estimado e impacto claro
- Linguagem direta para dev solo (Iremar)

## Design Visual

## Estrutura de Conteúdo
- Plano final sempre usa matriz Impacto × Esforço
- Roadmap em 30/60/90 dias

## Proibições Explícitas
- Não sugerir refatorações sem benefício claro para o usuário final
- Não recomendar libs externas sem justificar
- **NÃO sugerir remover "Importar CSV" da nav da Juliana** — ela É a responsável por importar e categorizar os lançamentos do cartão. É uma função core do fluxo dela.

## Squads especializados (delegar quando aplicável)
- **i2-design** — refatoração visual desktop + mobile, gráficos, troca de tema, perfumarias
- **i2-financas** — regras contábeis PF/PJ, KPIs, relatórios (Fator R, DRE detalhado)
- **i2-cartao-control** — provisão do cartão, push notifications, controle em tempo real
- **time-de-testes** — QA e validação de cadastro/funcionalidades antes do deploy

## Técnico (específico do squad)
- Stack: Next.js 15 App Router · Supabase · Tailwind v4 · pnpm monorepo
- **Iremar** (admin): gerencia empresa i2 Soluções, faturamento, NFs, relatórios, fechamento mensal e contas pessoais — usa desktop e mobile
- **Juliana** (operator): importa CSVs do cartão, categoriza lançamentos, visualiza sua parte dos gastos — usa só mobile, não-técnica
- Design: OLED dark mode · glassmorphism · gradientes azul-índigo (admin) / rosa-pink (operator)

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

