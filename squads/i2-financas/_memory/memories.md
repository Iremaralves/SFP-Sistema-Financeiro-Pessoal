# Squad Memory — i2-financas

## Estilo de Escrita
- Linguagem de gestor (não economista). Cada KPI deve responder "o que faço com isso?"
- Regras explícitas e testáveis (palavras-chave, condições)

## Estrutura de Conteúdo
- Cada relatório: estrutura textual + dados de entrada + cálculo + ação esperada
- KPIs: definição + fórmula + meta sugerida + intervalo saudável

## Proibições Explícitas
- Não recomendar abordagem de "controle obsessivo de gastos"
- Não sugerir features que dependem de Open Finance/integração bancária (impossível para dev solo agora)
- Não sugerir contabilidade completa — o sistema é gestão financeira, não ERP

## Lições de campo — 2026-05-19
- Discrepância entre **Total fatura** (dashboard, ciclo 13/05→12/06) e **Patrimônio + saldos** (contas, mês calendário) confunde o usuário
- Decisão proposta: dashboard mostra "Fatura" (visão prospectiva por ciclo) e /contas mostra "Saldos" (visão patrimonial atual) — explicar essa diferença na UI
- Acerto Casal (Iremar × Juliana) deve estar acessível por AMBOS os usuários — ela paga o que ele arca e vice-versa
- Fechamento mensal (página /mes) também precisa ser visível para Juliana

## Técnico (específico do squad)
- i2 Soluções: Simples Nacional, anexo III ou V (Fator R), DAS varia mensalmente
- Fator R: folha de pgto ÷ receita bruta últimos 12m. Se ≥28%, anexo III (mais barato)
- Categorias mínimas sugeridas: Moradia, Educação, Saúde, Transporte, Alimentação, Investimento, Lazer, Vestuário, Compras Pessoais, Cartão Casal, Cartão Iremar, Cartão Juliana
- Estrutura `entity_id` separa PF (Família) de PJ (i2 Soluções) — usar consistentemente

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

