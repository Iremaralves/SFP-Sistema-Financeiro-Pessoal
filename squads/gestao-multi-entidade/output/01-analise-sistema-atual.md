# Análise do Sistema Atual — i2 Finance
**Marina (Analista) | 2026-05-17**

---

## 1. Estrutura de Banco Atual

### Tabelas relevantes
| Tabela | Colunas-chave | Observação |
|--------|--------------|------------|
| `accounts` | id, name, kind (checking/credit_card/company), household_id | Já tem `kind=company` para i2 |
| `transactions` | responsible (text), account_id, amount | Campo `responsible` é o único separador de entidade |
| `recurring_commitments` | responsible, payment_method, amount | Mesma lógica de `responsible` |
| `monthly_settlements` | iremar_part, juliana_part, i2_part, casal_total | Hardcoded para 4 responsáveis |
| `income_records` | kind (pro_labore/juliana_transfer/other) | Receitas sem entidade explícita |

### Contas Cadastradas
| Nome | Kind | Uso Real |
|------|------|---------|
| Cartão Nubank | credit_card | PF + PJ misturado |
| Conta Iremar | checking | Pessoal |
| Conta Juliana | checking | Pessoal Juliana |
| i2 Soluções | company | PJ — Inter Empresa |

### Distribuição de Transações
| responsible | Qtde | Total |
|------------|------|-------|
| casal | 167 | R$ 6.215,87 |
| juliana | 25 | R$ 3.313,63 |
| i2 | 18 | R$ 2.651,56 |
| iremar | 15 | R$ 731,66 |

---

## 2. Como o Sistema Separa Entidades Hoje

**Único mecanismo:** campo `responsible: text` com 4 valores possíveis.
- `iremar` → despesa pessoal do Iremar
- `juliana` → despesa pessoal da Juliana
- `casal` → despesa compartilhada
- `i2` → despesa da empresa

**Problema:** é um campo de texto livre, sem enforcement, sem visão consolidada para PJ.

---

## 3. O Que Já Existe (Positivo)

- ✅ `accounts` já tem `kind: 'company'` — base para separar a conta PJ
- ✅ `responsible = 'i2'` já identifica despesas empresariais
- ✅ Dashboard já mostra card "i2 Soluções" com total do mês
- ✅ `recurring_commitments` já tem `responsible` — DAS aparece como `i2`
- ✅ `monthly_settlements` já calcula `i2_part`

---

## 4. Gaps — O Que Falta

### Gap 1 — Sem Dashboard PJ
Não existe tela dedicada para a i2 Soluções. O Iremar vê os dados da empresa misturados no dashboard pessoal.

### Gap 2 — Sem Fluxo de Caixa PJ
Impossível ver entradas e saídas da empresa separadas. Pró-labore é lançado como `income_records.kind = 'pro_labore'` mas não é separado por entidade.

### Gap 3 — Nubank Compartilhado não é Rastreado
Quando a i2 paga algo pelo Nubank de Iremar, isso aparece como `responsible=i2` na transação — mas não existe controle de **quanto a i2 deve reembolsar ao Iremar** por isso.

### Gap 4 — Sem DRE Empresarial
Não existe cálculo de Receita − Despesa da empresa. Não dá saber se a i2 deu lucro no mês.

### Gap 5 — Contas Fixas PJ sem Visão Separada
DAS, contador, etc. estão em `/compromissos` misturados com Escola Helena, IPTU etc. Não há uma visão "só i2".

### Gap 6 — Contas (accounts) sem Proprietário
A tabela `accounts` não tem campo `entity` ou `owner`. Não dá saber formalmente que "Nubank = Iremar PF" vs "Inter = i2 PJ".

---

## 5. Problema Central: Nubank PF + PJ Misturado

O Nubank de Iremar tem:
- Despesas pessoais (`responsible=iremar`)
- Despesas da família (`responsible=casal`)
- Despesas da empresa (`responsible=i2`) — **pagas pelo cartão PF**

A separação já existe via `responsible`, mas:
- Não há controle formal de reembolso (i2 deve ao Iremar)
- Não há conta separada "Nubank - i2" — é o mesmo account_id
- Relatórios da empresa incluem tudo que passa pelo Nubank com `responsible=i2`
