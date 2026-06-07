# Validação Cadastro — 2026-05-19

**QA Lead:** Ana | **DBA:** Diego
**Project Supabase:** `jvfdzcouychlfxxnzams`
**Escopo:** Validar alterações de cadastro (recurring_commitments, monthly_obligations, transactions) feitas em 19/05/2026.

---

## ✅ Aprovado

### 1. Cadastros novos em `recurring_commitments` (17 ativos no total)

Todos os 7 cadastros NOVOS foram criados com sucesso e respeitam a constraint `chk_credit_card_allows_account` (todos com `account_id IS NULL` porque payment_method != credit_card):

| Descrição | Valor | Resp. | Método | Dia | variable |
|---|---:|---|---|---:|---|
| Pró-labore Iremar | 5.000,00 | i2 | pix | 5 | false |
| Retirada de lucros | 3.000,00 | i2 | pix | 5 | **true** |
| Plano de saúde | 355,00 | iremar | boleto | 9 | false |
| Apartamento | 175,00 | iremar | pix | 21 | false |
| Feira de casa | 1.200,00 | iremar | pix | 21 | false |
| Tesouro Direto | 1.000,00 | iremar | pix | 1 | false |
| Reserva de segurança | 700,00 | iremar | pix | 1 | false |

### 2. Correções aplicadas

| Item | Esperado | Estado atual | OK? |
|---|---|---|:-:|
| Escola Helena | 1.393,43 | 1.393,43 | ✅ |
| Terapia | pix, account_id NULL | pix, NULL | ✅ |
| Internet | boleto, account_id NULL | boleto, NULL | ✅ |
| Seguro carro | boleto, 246,96, account_id NULL | boleto, 246,96, NULL | ✅ |
| "Pagamentos PJ + Pró-labore" | DELETADO | inexistente (0 linhas) | ✅ |

### 3. Baixas em `monthly_obligations` (referência 2026-05-01)

| Item | Valor | due_date | status | paid_on | paid_amount |
|---|---:|---|---|---|---:|
| DAS Simples Nacional | 2.600,21 | 2026-05-20 | **paid** | 2026-05-19 | 2.600,21 |
| INSS | 550,00 | 2026-05-20 | **paid** | 2026-05-19 | 550,00 |

### 4. Fatura cartão em `transactions`

```
id:          ecc85522-9b83-4414-bbdd-93b56eff6482
description: Pagamento Fatura Nubank (venc. 20/05/2026)
amount:      -9.913,67
occurred_on: 2026-05-19
account_id:  c3d4e5f6-... (Conta Iremar) ✅
status:      paid
source:      manual_pwa ✅
responsible: iremar
```

Atende ao requisito (source=manual_pwa, status=paid, account=Conta Iremar).

### 5. Constraints

- `chk_credit_card_allows_account`: 100% das linhas conformes. Nenhum cadastro com `payment_method != credit_card` tem `account_id` preenchido.
- `recurring_commitments_responsible_check`: todas as linhas usam valores válidos (`iremar`, `i2`).
- `monthly_obligations_status_check`: DAS/INSS com `paid` válido.

---

## ⚠️ Pontos de atenção

### A. Materialização de maio incompleta (CRÍTICO — quase um bug)

Apenas **5 de 17** compromissos ativos têm `monthly_obligations` para `reference_month = 2026-05-01`:

✅ Materializados: DAS, INSS, Escola Helena, IPTU, IPVA
❌ **NÃO materializados (12)**: Pró-labore Iremar, Retirada de lucros, Tesouro Direto, Reserva de segurança, Plano de saúde, Condomínio, Terapia, Escola Isabela, Internet, Apartamento, Feira de casa, Seguro carro.

**Impacto:**
- `/compromissos` provavelmente não lista esses 12 itens para maio → usuário vê visão incompleta.
- DRE de `/empresa` para maio possivelmente não inclui Pró-labore (5k) nem Retirada (3k) → DRE distorcido.
- `/relatorios contas a pagar` mostrará só 5 itens.

**Causa provável:** os cadastros foram inseridos hoje (19/05) e não há job/trigger que materialize automaticamente as obrigações do mês corrente. Os 5 que existem provavelmente foram materializados antes da edição.

### B. "Retirada de lucros" com `variable=true`

Esse é o ÚNICO cadastro com `variable=true` em toda a tabela. A UI precisa tratar esse flag para permitir editar o valor a cada baixa (mês). Se a UI atual ignora `variable`, o usuário pode lançar 3.000 fixo todo mês e perder a flexibilidade pretendida.

**Recomendação QA:** validar manualmente em `/compromissos` se aparece um campo editável ou indicador "valor variável" ao dar baixa.

### C. `category_id` e `entity_id` NULL

Não foi consultado/validado explicitamente, mas nas inserções os campos não foram mencionados. Se `entity_id` é usado para roteamento PF/PJ na UI nova de seletor de conta (commit 38c4216), os novos cadastros podem aparecer sem entidade atribuída.

---

## ❌ Bugs/Inconsistências

### BUG-01 — Gap de materialização (severidade: alta)

12 compromissos ativos sem `monthly_obligation` em 2026-05-01. Esperado: ao criar um `recurring_commitment` ativo no mês corrente, gerar a obrigação correspondente (ou existir um job).

**Reprodução:**
```sql
SELECT rc.description FROM recurring_commitments rc
WHERE rc.active=true
  AND NOT EXISTS (
    SELECT 1 FROM monthly_obligations mo
    WHERE mo.recurring_id = rc.id AND mo.reference_month='2026-05-01'
  );
-- retorna 12 linhas
```

### BUG-02 (potencial) — Fatura na conta errada do ponto de vista contábil

A transação de pagamento da fatura está em **Conta Iremar** (`c3d4e5f6-...`) com `amount = -9.913,67`. Isso reflete a **saída de caixa** corretamente (dinheiro sai da Conta Iremar).

Porém, o cartão Nubank (`b2c3d4e5-...`) tem saldo separado e, contabilmente, o pagamento da fatura deveria ter DUAS pernas:
1. `-9.913,67` na Conta Iremar (caixa sai) ✅ existe
2. `+9.913,67` no Cartão Nubank (passivo do cartão zera/reduz) ❌ NÃO existe

**Como está hoje:** o saldo do "Cartão Nubank" (account.id b2c3d4e5) continua mostrando o débito acumulado das compras, sem o crédito de pagamento. A "fatura" não está sendo quitada no extrato do cartão — só o caixa foi debitado.

**Veredicto:** registrada na Conta Iremar **está correto financeiramente para o caixa**, mas **falta a contrapartida no Cartão Nubank**. Se o sistema não tem lançamento em partida dobrada, o saldo do cartão fica permanentemente "estourado".

**Recomendação:** adicionar transação espelho positiva na conta Cartão Nubank, ou implementar tipo "transferência entre contas" se o app suportar.

### BUG-03 (potencial) — `/empresa` DRE pode estar subestimado

Como Pró-labore (5k) e Retirada (3k) ainda não viraram `monthly_obligations` para maio, o DRE de maio em `/empresa` provavelmente mostra:
- Saídas i2 maio = DAS (2.600,21) + INSS (550,00) = **3.150,21**

Quando o correto é:
- Saídas i2 maio = 3.150,21 + 5.000 + 3.000 = **11.150,21**

Diferença de **R$ 8.000** no resultado mensal da PJ. Validar imediatamente o DRE.

---

## 💰 Resumo financeiro mensal (totais calculados)

### Por responsável × método (recurring ativos)

| Responsável | Método | Qtd | Total |
|---|---|---:|---:|
| i2 | boleto | 2 | 3.150,21 |
| i2 | pix | 2 | 8.000,00 |
| iremar | boleto | 7 | 3.292,75 |
| iremar | pix | 6 | 3.545,00 |
| **TOTAL** | | **17** | **17.987,96** |

### i2 — Obrigações mensais PJ

| Item | Valor |
|---|---:|
| Pró-labore Iremar | 5.000,00 |
| Retirada de lucros (variável) | 3.000,00 |
| DAS Simples Nacional | 2.600,21 |
| INSS | 550,00 |
| **Total saídas i2/mês** | **11.150,21** |

### Iremar PF — Despesas fixas mensais

**Boleto (7 itens — 3.292,75):**
- Escola Helena 1.393,43 · Escola Isabela 950,00 · Plano de saúde 355,00 · Seguro carro 246,96 · IPVA 128,01 · IPTU 119,35 · Internet 100,00

**PIX (6 itens — 3.545,00):**
- Feira de casa 1.200,00 · Tesouro Direto 1.000,00 · Reserva de segurança 700,00 · Condomínio 250,00 · Terapia 220,00 · Apartamento 175,00

**Total Iremar PF/mês: 6.837,75**

### Sanidade — Iremar líquido

Renda Pró-labore + Retirada = 8.000,00
Despesas fixas Iremar PF = 6.837,75
**Folga mensal antes de gastos variáveis = 1.162,25**

→ Margem **apertada** considerando que ainda há cartão de crédito (fatura de maio: 9.913,67) e gastos variáveis. Sinaliza necessidade de revisar orçamento ou aumentar pró-labore.

---

## 📋 Plano de ação

| # | Prioridade | Ação | Responsável |
|---|---|---|---|
| 1 | 🔴 P0 | Materializar `monthly_obligations` para os 12 cadastros pendentes em ref 2026-05-01 (Pró-labore, Retirada, Tesouro, Reserva, Plano saúde, Condomínio, Terapia, Escola Isabela, Internet, Apartamento, Feira, Seguro carro) | DBA |
| 2 | 🔴 P0 | Criar trigger/job que materialize automaticamente ao inserir recurring no mês corrente | Dev |
| 3 | 🟠 P1 | Adicionar lançamento espelho `+9.913,67` em "Cartão Nubank" para fechar a fatura no extrato do cartão (ou implementar transferência entre contas) | Dev/Iremar |
| 4 | 🟠 P1 | Validar em `/empresa` que DRE de maio agora soma 11.150,21 em saídas (após ação #1) | QA |
| 5 | 🟡 P2 | Validar em `/compromissos` que "Retirada de lucros" exibe indicação de valor variável e permite editar valor na baixa | QA + UX |
| 6 | 🟡 P2 | Auditar se `category_id` e `entity_id` dos novos cadastros estão preenchidos (impacto em filtros PF/PJ) | DBA |
| 7 | 🟢 P3 | Revisar `/relatorios` "Contas a Pagar" — deve listar 17 itens em maio (após ação #1), com DAS e INSS marcados como pagos | QA |

---

## Veredicto QA

**Cadastros propriamente ditos (CRUD em recurring_commitments + baixas):** ✅ APROVADO
**Materialização e consistência cross-tabela:** ❌ REPROVADO — bloqueador P0 (BUG-01)
**Partida dobrada cartão/conta:** ⚠️ ATENÇÃO (BUG-02)

Não liberar para produção sem resolver BUG-01.
