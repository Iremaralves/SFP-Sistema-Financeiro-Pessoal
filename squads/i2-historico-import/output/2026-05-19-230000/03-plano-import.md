# 03 — Plano de importação (Bruno, Senior Data Analyst)

> Plano executado **só** para o recorte aprovado pela Rita:
> - **PF Iremar**: 🟡 parcial, `Data efetiva >= 2025-01-01` AND `Status IN (Confirmado, Conciliado)`
> - **PJ i2**:     🟢 tudo, sem recorte (614 linhas)

Os 2 fluxos rodam em pipelines independentes — **nunca leem o mesmo arquivo** e **nunca gravam no mesmo `entity_id`**.

---

## 0. Antes de qualquer linha entrar

| Pré-requisito | Status | Owner |
|---|---|---|
| `categories` populada (squad i2-financas) | ⏳ pendente | i2-financas |
| Mapa categoria_meu_dinheiro → categoria_canonica revisado pelo Iremar | ⏳ pendente | este squad |
| Snapshot `pg_dump` antes do import | obrigatório | dev |
| Branch Supabase dedicada (`import-historico`) | recomendado | dev |
| Revisão dos 4 "Pagamento recebido" R$ 33.479 conhecidos (memória do squad) | **bloqueia** | financas |

**Se categories ainda está vazia, NÃO RODAR este import.** O risco contábil já conhecido na memória do squad PRECISA ser resolvido antes.

---

## 1. Tabela alvo e chave de deduplicação

Destino: `transactions` (PF e PJ) + 1 update em `accounts` (PJ saldo inicial).

**Chave de deduplicação:** adicionar coluna `external_id TEXT` em `transactions` (nullable) com **UNIQUE INDEX** filtrado:

```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_external_id_uidx
  ON transactions (external_id) WHERE external_id IS NOT NULL;
```

`external_id` recebe `'MD:' || ID Único` (ex.: `MD:192052418`). Roda-se o import com `ON CONFLICT (external_id) DO NOTHING` — **idempotente**.

---

## 2. Mapeamento de campos (Meu Dinheiro → schema atual)

| Meu Dinheiro | transactions | Regra |
|---|---|---|
| `ID Único` | `external_id` | prefixar com `MD:` |
| `Data efetiva` | `occurred_at` | fallback `Data prevista` se vazia |
| `Data competência` | `competence_at` (criar se não existir) | usar pra DRE |
| `Valor efetivo` | `amount` | parse `1.234,56` → `1234.56`; **manter sinal original** (negativo = saída) |
| `Descrição` | `description` | trim |
| `Categoria` + `Subcategoria` | `category_id` | via tabela de mapeamento (seção 3) |
| `Conta` | `account_id` | via tabela de mapeamento (seção 4) |
| `Tipo` | `kind` | `Despesa→expense`, `Receita→income`, `Transferência→transfer`, `Pagamento→card_payment`, `Saldo inicial→opening` (PJ only) |
| `Status` | `status` | `Confirmado/Conciliado→posted`, `Pendente→pending`, `Agendado→scheduled` |
| `Conta transferência` | `transfer_account_id` | só para Tipo=Transferência |
| `Centro` | `notes` ou `cost_center` | preservar como string em `notes` (formato: `"centro: X"`); avaliar coluna dedicada para PJ |
| `Projeto` | `notes` | só PJ; formato `"projeto: SEBRAETEC - PE"` quando ≠ "Sem projeto" |
| `Contato`, `CPF/CNPJ`, `Razão social` | `notes` | concatenar em notes |
| `Tags`, `Cartão`, `Forma`, `Repetição`, `Meta de Economia`, `N. Documento`, `Data de criação`, `Venc. Fatura` | descartar / `notes` opcional | baixo valor analítico |
| `Observações` | `notes` (anexar) | preservar |
| Sempre | `entity_id` | PF → `entities.id WHERE type='personal'`; PJ → `entities.id WHERE type='business'` |
| Sempre | `paid_by` | PF: `iremar` se Centro IN ('IREMAR','i2 SOLUÇÕES DIGITAIS'); `juliana` se Centro='JULIANA'; `casal` se Centro IN ('FAMÍLIA','CASAL','FILHAS'); fallback `iremar`. PJ: sempre `i2` |

---

## 3. Mapa de categorias (categoria_meu_dinheiro → categoria_canonica)

### PF (após recorte 2025+; ~30 categorias residuais)

| Categoria PF | Subcategoria PF | Canônica |
|---|---|---|
| Moradia | Condomínio / IPTU / Celpe / etc. | `moradia` |
| Telefonia | * | `moradia` (sub `telefonia_internet`) |
| Saúde | Tratamento / Treino / etc. | `saude` |
| Educação | Isabela / Helena | `educacao` |
| Alimentação / Jantar / Lanche | Feira / restaurantes | `alimentacao` |
| Transporte / Automóvel /Carro / Automóvel / Moto | IPVA / combustível | `transporte` |
| Lazer / Férias / Presentes / Doação | * | `lazer_pessoal` |
| Filhos / Mãe / Familiares Diversas / Cotinha / Juliana | * | `familia` (com `paid_by` correto) |
| Vestuário (com espaço) | * | `lazer_pessoal` |
| Pagamento de cartão | * | `card_payment` (kind especial — não vira despesa) |
| Pró-labore / i2 / i2 Soluções / Vendas / Outras receitas | * | `receita_pf` (já paga IRPF separado) |
| Investimentos | Poupando / Rendimentos | `investimento_pf` |
| Transferência | * | `transfer` (não vira despesa nem receita) |
| Ajuste / Empréstimos / IRPF / Impostos e Tarifas / Outras despesas / Master Marketing | * | `outros_pf` |

### PJ (614 linhas; 19 categorias)

| Categoria PJ | Subcategoria | Canônica |
|---|---|---|
| SEBRAETEC | Planejamento para presença digital / Inserção digital — Website / DESENVOLVIMENTO DE MÍDIAS… | `receita_servico` + `notes: projeto = Centro` |
| Vendas | Serviços Prestados | `receita_servico` |
| Comercialização | * | `receita_servico` |
| Administrativas | Pró-labore / Contabilidade / etc. | `administrativo` (Pró-labore vai pra subcategoria especial `pro_labore` — entra no Fator R) |
| Administrativas | Retirada de lucro (Dividendos da i2) | `dividendos` (**não entra no Fator R como folha**) |
| Impostos | DAS / GPS - INSS / CIM / MGF | `impostos` (DAS e INSS contam pro Fator R) |
| Financeiras | Empréstimo / juros | `financeiro` |
| Freelancer | Tráfego Meta ADS / Serviços Prestados | `freelancer` (entra no Fator R como serviço de terceiros) |
| ESTAGIÁRIOS | Bolsa Estágio | `folha_estagio` (entra no Fator R como folha) |
| Cursos, treinamento e programas | * | `desenvolvimento` |
| Fornecedores / Ferramenta / SGF / unu | * | `operacional_pj` (revisar `unu` e `Pessoal` manualmente — 10 linhas) |
| Pagamento de cartão | * | `card_payment` |
| Transferência | * | `transfer` |
| Investimentos | * | `investimento_pj` |
| Outras Despesas / Outras Receitas / (sem categoria, 1 linha) | * | `outros_pj` (review manual) |
| **Saldo inicial** (1 linha, 01/02/2024) | * | **NÃO importar como transaction** — vira `accounts.opening_balance` |

---

## 4. Mapa de contas

### PF
| Conta CSV | account_id no banco |
|---|---|
| `Nu Pagamentos` | Conta Iremar (CC) |
| `NuInvest` | NuInvest (Investimento) |
| `NuInvest-JU` | NuInvest Juliana (criar se não existir, ou usar NuInvest) |
| `Caixinha` | Caixinha (Investimento) |
| `Inter` | Inter (criar se não existir — PF) |
| `CC - Itaú` | Itaú (criar se não existir — PF; só 6 linhas, talvez consolidar como `outros`) |
| `Carteira` | Carteira (criar como tipo `cash` — 17 linhas) |

### PJ
| Conta CSV | account_id no banco |
|---|---|
| `CC Inter` | i2 Soluções (CC) — **já existe** |
| `Reserva Empresarial` | criar nova conta tipo `investimento` para entity=business |

---

## 5. Pipeline de execução

### Etapa A — Preparação
```bash
# 1. Backup
pg_dump $SUPABASE_DB_URL --table=transactions --table=accounts > /tmp/backup_pre_import_$(date +%F).sql

# 2. Migration: add external_id
psql $SUPABASE_DB_URL -f migrations/add_external_id.sql

# 3. Criar tabela temporária de staging
psql -c "CREATE TABLE staging_md_pf (LIKE transactions INCLUDING ALL); ALTER TABLE staging_md_pf ADD COLUMN raw JSONB;"
psql -c "CREATE TABLE staging_md_pj (LIKE transactions INCLUDING ALL); ALTER TABLE staging_md_pj ADD COLUMN raw JSONB;"
```

### Etapa B — Parse + filtro (Node script)
Pseudocódigo do `scripts/import-md.ts` (este squad **não escreve o código**, só descreve):

```
para cada arquivo (iremar_pf, i2_pj):
  abre csv com parser tolerante a vírgulas em aspas
  para cada linha:
    se PF e Data efetiva < 2025-01-01: skip
    se PF e Status NOT IN ('Confirmado','Conciliado'): skip
    se Tipo corrompido (não está em Tipos válidos): skip + log
    se Tipo == 'Saldo inicial' (PJ):
      → UPDATE accounts SET opening_balance = abs(Valor efetivo) WHERE id = mapaContas['CC Inter']
      continue
    monta row de staging com mapeamentos das seções 2/3/4
    insere em staging_md_{pf|pj}
```

### Etapa C — Validação no staging
```sql
-- Totais por ano devem bater com o discovery
SELECT date_trunc('year', occurred_at) ano,
       SUM(CASE WHEN kind='income' THEN amount ELSE 0 END) receita,
       SUM(CASE WHEN kind='expense' THEN amount ELSE 0 END) despesa
FROM staging_md_pj GROUP BY 1 ORDER BY 1;
-- Esperado 2024: receita ~131.448, despesa ~-119.002
-- Esperado 2025: receita ~171.013, despesa ~-149.053

-- Mesmo check PF (só 2025+)
SELECT … FROM staging_md_pf;
-- Esperado 2025: receita ~169.512, despesa ~-78.250

-- Categorias órfãs (não mapeadas)
SELECT raw->>'Categoria', count(*) FROM staging_md_pf WHERE category_id IS NULL GROUP BY 1;

-- Linhas em conflito com banco atual (mesmo external_id ou suspeitas de duplicata)
SELECT s.external_id, t.id FROM staging_md_pj s
JOIN transactions t ON t.external_id = s.external_id;
-- Esperado: 0 (banco ainda não tem nenhum external_id)

-- Risco PF×PJ: PF tem 91 linhas com Centro=i2. Verificar se já existem no PJ como saída.
SELECT pf.occurred_at, pf.amount, pf.description
FROM staging_md_pf pf
WHERE pf.raw->>'Centro' = 'i2 SOLUÇÕES DIGITAIS';
-- Cruzar manualmente com staging_md_pj para confirmar: cada entrada PF corresponde a 1 saída PJ.
-- NÃO importar nenhuma das 91 sem checagem do Iremar.
```

### Etapa D — Insert definitivo
```sql
-- PJ primeiro (mais limpo, menor risco)
INSERT INTO transactions (…)
SELECT … FROM staging_md_pj
ON CONFLICT (external_id) DO NOTHING;

-- PF depois (com recorte)
INSERT INTO transactions (…)
SELECT … FROM staging_md_pf
ON CONFLICT (external_id) DO NOTHING;
```

### Etapa E — Validação pós-import
1. **Totais por ano batem** com o que está no discovery? (consulta SQL acima)
2. **Fator R em 2025-12 faz sentido?** Calcular manualmente: folha (pró-labore + INSS + bolsa estágio + freelancer) / receita bruta. Tem que dar entre 0,28 e 0,40 — se der fora disso, o mapeamento de categoria está errado.
3. **Saldo da `CC Inter` em 19/03/2026** = `opening_balance + SUM(amount em transactions PJ)`. Comparar com o saldo real do Inter Empresarial.
4. **Pagamentos PF→PJ não duplicaram receita.** Reusar a checagem do risco contábil conhecido na memória do squad.

### Etapa F — Cleanup
- Dropar tabelas `staging_md_*` depois de OK.
- Documentar em `_memory/memories.md` qual recorte foi importado, em que data, com qual mapeamento.

---

## 6. Rollback

Se qualquer validação da Etapa E falhar:
```sql
DELETE FROM transactions WHERE external_id LIKE 'MD:%';
UPDATE accounts SET opening_balance = 0 WHERE id = '<cc inter id>';  -- só se a Etapa B alterou
```
Ou restaurar o `pg_dump` da Etapa A.

---

## 7. Estimativa

| Atividade | Tempo |
|---|---|
| Migration external_id + staging tables | 30 min |
| Script de parse + mapeamento PF/PJ | 4 h |
| Revisão do mapa de categorias com o Iremar | 1 h |
| Resolução das 91 linhas cruzadas PF×PJ | 2 h (sessão com Iremar) |
| Validações + rollback drill | 1 h |
| **Total** | **~8.5 h de trabalho focado** |

**Vale a pena?** Sim, mas **só depois** das categorias canônicas estarem populadas (squad i2-financas) e dos 4 "Pagamento recebido" suspeitos estarem reclassificados.
