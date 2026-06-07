# Squad Memory — i2-historico-import

## Estilo de Escrita
- Decisões baseadas em dados, não em "vontade do usuário"
- Tabelas com números reais sempre que possível
- Rita questiona; Bruno executa só se justificado

## Estrutura de Conteúdo
- Discovery: amostras + estatísticas + lista de inconsistências
- Veredicto: 🟢/🟡/🔴 + 3-5 razões concretas
- Plano: passo a passo se importar; alternativas se não

## Proibições Explícitas
- **NUNCA misturar contas PF (iremar pessoal) com PJ (i2 Soluções)** — quebra Fator R
- NUNCA reclassificar despesa empresarial como pessoal "porque parece"
- NUNCA importar dados sem validar totais antes/depois
- Rita NÃO concorda com importar tudo só porque foi exportado

## Técnico (específico do squad)
- Schema atual do i2 Finance:
  - `entities`: personal (Família) | business (i2 Soluções)
  - `accounts`: Conta Iremar/Juliana/i2 (CC), Cartão Nubank, NuInvest, Caixinha
  - `transactions`: amount NEGATIVO para despesas, POSITIVO para receitas
  - `recurring_commitments`: 17 ativos (já cadastrados — não duplicar!)
  - `income_records`: receitas (faturamento, juliana_transfer, pro_labore)
  - `categories`: VAZIA atualmente (seed pendente do i2-financas)

## Schema Meu Dinheiro (CSVs exportados)
Colunas: Tipo, Status, Data prevista, Data efetiva, Venc. Fatura, Valor previsto,
Valor efetivo, Descrição, Categoria, Subcategoria, Conta, Conta transferência,
Centro, Contato, CPF/CNPJ, Razão social, Forma, Projeto, N. Documento,
Observações, Data competência, ID Único, Tags, Cartão, Repetição, Meta de Economia,
Data de criação

## Risco contábil já conhecido
- 4 transactions "Pagamento recebido" no banco somando R$ 33.479,29 podem ser
  transferências PF→PJ classificadas errado (já parcialmente resolvido: R$ 9.913 viraram transfer)
- Importar mais histórico SEM revisar isso só piora

## Mudança de escopo v2 (2026-05-20)
**Decisão do Iremar:** NÃO migrar transações. O squad agora foca em:
1. ENTENDER como Iremar usava o sistema antigo
2. Extrair LEARNINGS sobre estrutura: categorias, centro de custos, contas
3. Recomendar o que faz sentido implementar no i2-finance
4. Centro de custos NÃO existe no i2-finance ainda — avaliar se vale criar

**Cuidado máximo:** Preservar o que já está funcionando. "o que passou passou".

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

