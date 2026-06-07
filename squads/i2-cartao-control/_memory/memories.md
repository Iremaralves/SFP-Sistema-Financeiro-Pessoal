# Squad Memory — i2-cartao-control

## Estilo de Escrita
- Especificação técnica precisa (queries SQL, signatures de função, componentes nomeados)
- Sempre exemplificar com números reais (fatura atual R$ 3.124,89 etc.)

## Estrutura de Conteúdo
- Cada feature: dor → solução → query → componente UI → ação do usuário

## Proibições Explícitas
- NUNCA chamar APIs do banco diretamente — toda visibilidade vem do CSV importado
- Push notifications: usar Web Push API nativa (não Firebase)
- Não recomendar libs de cobrança/PIX

## Técnico (específico do squad)
- Cartão = account.kind='credit_card' (atualmente só 1: Cartão NuBank)
- Fechamento: dia 13 · Vencimento: dia 20
- Transactions do cartão: amount negativo (saída)
- Fixos no cartão: recurring_commitments com payment_method='credit_card' e account_id apontando para o cartão
- Parcelas: transactions.installment_current / installment_total
- Push: precisa VAPID keys + Service Worker (PWA)
- Limite do cartão NÃO está no sistema ainda — precisa cadastrar em accounts ou em settings

## Conexão com outros squads
- i2-design: especifica o visual do dashboard card e página /cartao
- i2-financas: define KPIs (% gasto fixo, ticket médio, variação mensal)

## Lições de campo — 2026-05-19
- Total da fatura do ciclo 13/05→12/06 = R$ 3.238,94 (confere com Nubank)
- Descrições truncadas dificultam identificar gastos (ex: "Andre Luiz D*Multichat R$ 297" — pesado, precisa expandir descrição)
- "Pagamento recebido" do CSV vem com sinal negativo → invertido para positivo na importação (entrada no cartão)
- Sinal de gastos no CSV vem positivo → invertido para negativo na importação (saída/dívida)
- 2 transactions de R$ 9913,67 (saída Conta Iremar + entrada Cartão) viraram transferência via `transfer_id`

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

