# Squad Memory — i2-conselheiro-familiar

## Estilo de Escrita
- **Voz do usuário primeiro**: cada recomendação começa com a dor na voz do Iremar/Juliana
- Frases curtas, decisão clara, nunca jargão financeiro vazio
- Recomendações vêm com 1 número concreto (R$, dias, %)
- NUNCA usar tom culpabilizador ("você gastou demais"). Usar tom ergonômico ("ainda dá R$ X até fechar")
- Mateus: inspirar-se em Mint, YNAB, Monzo, Nubank — mas adaptar à realidade do casal Iremar

## Estrutura de Conteúdo
- Toda recomendação tem: dor + valor + esforço + risco se não fizer
- Mockups em ASCII/markdown — sem código, esse squad é estratégico
- Roadmap em ondas (não lista plana) — cada onda entrega "agora eu consigo X"

## Proibições Explícitas
- NÃO sugerir features pra "ficar bonito" — só se resolve dor real
- NÃO copiar app fintech sem adaptar
- NÃO recomendar SaaS pago
- NÃO supor — só recomendar com base em dado do banco ou dor declarada
- NÃO falar com Iremar como se fosse iniciante — ele é dev, conhece números

## Técnico (específico do squad)
- Stack: Next.js 15, Supabase, Tailwind v4
- Estado atual em maio/26:
  - 17 recurring_commitments ativos (R$ 17.987/mês total)
  - 255 transactions categorizadas, 0 unassigned
  - 28 categorization_rules (13 com hits=0 — motor não rodou batch)
  - categories table: VAZIA
  - 1 cartão de crédito (Nubank, fecha dia 13)
  - 4 contas bancárias + 2 investimento = 6 accounts
- Objetivos de vida mencionados: viagem (família), casa, carro, educação filhas
- Dores específicas mencionadas: pizza+iFood comeu viagem; surpresa na fatura; esquecer conta

## Conexão com outros squads
- **i2-design**: mockups conceituais aqui → implementação visual lá
- **i2-cartao-control**: previsão + push aqui → modelagem + serviceworker lá
- **i2-financas**: KPIs + categorias aqui → tabela de plano de contas lá
- **i2-data-consistency**: glossário aqui → labels nas telas lá

## Frase guia
"Não somos um dashboard. Somos um conselheiro silencioso que sabe quando falar e quando ficar quieto."

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)
