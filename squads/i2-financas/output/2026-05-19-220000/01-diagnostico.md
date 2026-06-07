# 01 — Diagnóstico Contábil (Marcos)

> Snapshot Supabase em 2026-05-19. Janela de dados: 2026-03-13 → 2026-05-19 (≈2 meses).

## 1. Estado atual em números

| Métrica | Valor | Leitura rápida |
|---|---|---|
| Transações totais | **255** | base relevante para análise |
| Sem `category_id` | **255 (100%)** | **GAP CRÍTICO** — nenhuma transação tem categoria contábil |
| Sem `entity_id` | 0 | ótimo — separação PF/PJ está sempre preenchida |
| `responsible='unassigned'` | 0 | nada órfão por dono |
| `responsible='casal'` | 174 (R$ 5.036,28) | maior volume — vai pro acerto do dia 13 |
| `responsible='iremar'` | 23 (-R$ 1.145,02) | privado dele |
| `responsible='juliana'` | 34 (-R$ 4.458,00) | privado dela |
| `responsible='i2'` | 24 (-R$ 3.153,18) | PJ |
| `status='pending'` | 225 | a maioria ainda não foi reconciliada como paga |
| `status='paid'` | 30 | apenas 12% reconciliada |
| Categorias cadastradas | **0** | tabela `categories` está vazia |
| Regras de categorização | 28 | mas todas apontam para `category_id=NULL` |

## 2. Achados críticos

### 2.1 (Bloqueador) Catálogo de categorias inexistente
A tabela `public.categories` tem **0 linhas**. Sem ela:
- Nenhum relatório consegue agrupar por "Alimentação", "Educação", "Saúde"
- DRE da PJ não consegue separar receita × custo fixo × custo variável
- KPI "% de gasto fixo" é matematicamente impossível hoje
- Regras de categorização existem só pra `responsible`, não pra `categoria`

### 2.2 (Alto) Regras de classificação parcialmente cegas
28 regras cobrem palavras-chave (atacadao, drogasil, escola, claude.ai…), mas:
- 13 das 28 regras têm `hits=0` (nunca foram aplicadas) — palavras que não casam com a descrição real do CSV
- Exemplo: regra "atacadao" tem 0 hits, mas existem 25 transações "Atacadao 047 As" (-R$ 4.832,54). **A regra não está sendo aplicada na importação.**
- Exemplo: regra "drogasil|farmacia|droga" tem 0 hits, mas há 11 transações "Drogasil" (-R$ 1.218,89)
- **Diagnóstico: o motor de aplicação de regras provavelmente roda apenas no momento da importação CSV, não em transações antigas.** Há um backlog que precisa ser re-classificado.

### 2.3 (Médio) Inconsistência semântica em `responsible`
- "Atacadao 047 As" aparece como **casal, iremar E juliana** ao longo do tempo (3 responsibles para a mesma loja)
- "Claude.Ai Subscription" aparece como **casal e i2** — esse é um problema fiscal: se for ferramenta de trabalho, deve ser PJ; se for casal, é PF
- "Premmia*Br" (combustível) aparece como casal e juliana
- **Risco**: relatório de "quanto gastamos em mercado" vai dar números diferentes dependendo de qual lente o usuário usa

### 2.4 (Médio) Pagamentos recebidos sem origem qualificada
- 4 registros "Pagamento recebido" totalizando +R$ 33.479,29 com `responsible` em casal e iremar
- Não há `income_records` (tabela vazia) que detalhe se é pró-labore, lucros ou reembolso
- **Risco fiscal**: sem o vínculo `income_records → fiscal_notes`, é impossível calcular Fator R

### 2.5 (Médio) Reconciliação travada
- 225 de 255 transações ainda como `pending`. Sem `paid`, não dá pra confiar em saldo real
- `monthly_obligations` só tem 6 linhas para 17 compromissos recorrentes — não está gerando obrigações mensais automaticamente

### 2.6 (Baixo) Ruído de descrição
- "Dl*Uberrides" e "Dl *Uberrides" (com espaço) são tratadas como descrições diferentes — quebra agrupamento
- "Uber* Trip" e "Uber Uber *Trip Help.U" — mesma natureza, descrições diferentes

## 3. Pontos positivos (não mexer)

- **`entity_id` está 100% preenchido** — PF/PJ separadas corretamente
- **`paid_by` já existe em `recurring_commitments`** — base para o acerto Iremar × Juliana
- **17 compromissos recorrentes mapeados** somando R$ 18.987,96/mês — base do orçamento fixo
- **`fiscal_notes` e `income_records` existem como tabelas** (apenas vazias)
- **`installment_current/total` em transactions** — pronto pra suportar parcelamento

## 4. Oportunidades de KPI imediato (já com os dados que existem)

Mesmo sem categorias, é possível extrair hoje:
- **Total fatura ciclo** (já implementado)
- **Distribuição por responsável** (já implementado)
- **Top 10 estabelecimentos do mês** (não implementado — viraria insight valioso)
- **Custo fixo mensal recorrente vs gasto variável real** — dá pra cruzar `recurring_commitments.amount` contra `transactions` do ciclo
- **Compromissos vencendo nos próximos 7 dias** — usa `due_day` direto de `recurring_commitments`

## 5. Hipóteses a confirmar com o time

1. As transações antigas devem ser reclassificadas em lote ao criar o catálogo de categorias?
2. "Pagamento recebido" de R$ 33k é pró-labore + lucros que entraram, ou é pagamento de fatura do cartão (transferência)? Se for fatura paga, deveria estar em `transfers`, não `transactions`.
3. O usuário quer ver "Claude.Ai" sempre como PJ (decisão padrão) ou caso a caso?

---

## Conclusão do diagnóstico

O sistema tem **infraestrutura sólida** (entities, accounts, recurring_commitments, paid_by) mas a **camada analítica está zerada**: sem categorias e sem reconciliação, todo relatório que tenta responder "onde vai meu dinheiro?" mostra apenas "para quem foi" (responsável), nunca "no quê foi gasto". É o equivalente a um extrato bancário sem plano de contas. Próximo passo: criar categorias canônicas e religar as 28 regras existentes a elas.
