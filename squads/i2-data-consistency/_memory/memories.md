# Squad Memory — i2-data-consistency

## Estilo de Escrita
- Cada termo do glossário tem: definição em 1 frase + fórmula + exemplo numérico real
- Decisões com prova matemática

## Estrutura de Conteúdo
- Tabela: termo | onde aparece | fórmula | exemplo R$
- Diff de cálculo: antes (errado) vs depois (correto)

## Proibições Explícitas
- NÃO mudar lógica de calculateInvoiceSettlement ou calculateSettlement sem versionar
- NÃO renomear funções, só rótulos visuais

## Técnico (específico do squad)
- 2 cálculos canônicos existentes:
  - calculateSettlement(txs, month) → filtra por mês calendário (mostra R$ X.XXX)
  - calculateInvoiceSettlement(txs, month) → sem filtro de data (assume txs já vêm filtradas pelo ciclo)
- Dashboard usa calculateInvoiceSettlement (ciclo do cartão)
- /contas atualmente usa calculateSettlement (mês calendário) — DIVERGÊNCIA
- /contas calcula `patrimonio` somando TODAS as transactions (incluindo transferências) — possível divergência

## Glossário canônico (proposta inicial)
- **Fatura aberta**: soma das compras do CARTÃO no ciclo atual (13/05 → 12/06). Não inclui pagamentos recebidos.
- **Saldo da conta**: opening_balance + sum(amount) de TODAS transactions (inclui transferências, é o saldo bancário real)
- **Patrimônio líquido**: soma dos saldos de todas as contas (corrente + investimento — cartão geralmente é negativo, abate)
- **A pagar este mês**: soma de monthly_obligations pendentes + recurring sem obligação no mês
- **A receber este mês**: faturamento_i2 projetado para o mês (entradas previstas)

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

