# v2-03 — Plano de Implementação Seletivo

**Autor:** Bruno (Data Analyst)
**Data:** 2026-05-20
**Baseado em:** v2-02-recomendacoes.md (apenas itens com veredicto 🟢 ou 🟡)
**Premissa absoluta:** Cada mudança é AUTÔNOMA — pode subir individualmente, validar, e só então a próxima.

---

## Pré-requisitos globais (uma vez)

- [ ] Backup completo do Supabase via `pg_dump` antes de QUALQUER mudança.
- [ ] Restore point/snapshot do projeto Supabase (dashboard → Database → Backups).
- [ ] Branch separado `feat/historico-learnings` em git.
- [ ] Conversar com squad **i2-financas** antes de mexer em `categories` (evitar conflito de seed).
- [ ] Confirmar com Iremar conta-por-conta da seção "Contas a investigar" (Itaú, Inter PF) antes de cadastrar.

---

## Mudança #1 — Cost Centers (só PJ)

### Schema DDL
```sql
-- 1.1 nova tabela
CREATE TABLE cost_centers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  entity_id   UUID NOT NULL REFERENCES entities(id),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, name)
);

-- 1.2 RLS (replicar padrão de accounts/categories)
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cost_centers_select" ON cost_centers FOR SELECT USING (true);
CREATE POLICY "cost_centers_admin"  ON cost_centers FOR ALL    USING (auth.role() = 'authenticated');

-- 1.3 coluna em transactions (NULLABLE — null safe)
ALTER TABLE transactions
  ADD COLUMN cost_center_id UUID NULL REFERENCES cost_centers(id);

CREATE INDEX idx_transactions_cost_center ON transactions(cost_center_id) WHERE cost_center_id IS NOT NULL;

-- 1.4 seed inicial (centros que Iremar usava com >5 mov)
-- entity_id = (SELECT id FROM entities WHERE type='business' LIMIT 1)
INSERT INTO cost_centers (entity_id, name) VALUES
  ((SELECT id FROM entities WHERE type='business'), 'i2 - Agência'),
  ((SELECT id FROM entities WHERE type='business'), 'i2 - Treinamentos'),
  ((SELECT id FROM entities WHERE type='business'), 'SEBRAETEC - PE'),
  ((SELECT id FROM entities WHERE type='business'), 'SEBRAETEC - DF'),
  ((SELECT id FROM entities WHERE type='business'), 'SEBRAETEC - RJ'),
  ((SELECT id FROM entities WHERE type='business'), 'SEBRAETEC - RN'),
  ((SELECT id FROM entities WHERE type='business'), 'SEBRAETEC - SC'),
  ((SELECT id FROM entities WHERE type='business'), 'Impostos'),
  ((SELECT id FROM entities WHERE type='business'), 'Freelancer'),
  ((SELECT id FROM entities WHERE type='business'), 'Estagiários'),
  ((SELECT id FROM entities WHERE type='business'), 'Fornecedores'),
  ((SELECT id FROM entities WHERE type='business'), 'Iremar (sócio)');
```

### UI
- Nova tela `/empresa/centros-de-custo` (CRUD).
- Dropdown `cost_center_id` no form de Lançamento — **só aparece quando entity selecionada é business**.
- Filtro por centro de custo em `/relatorios` PJ.
- DRE da `/empresa` pode ganhar quebra por centro (fase 2).

### Migração de dados existentes
- Coluna nullable. Transações antigas ficam `cost_center_id = NULL`. Iremar pode preencher gradualmente via edição.
- Não migrar dados do Meu Dinheiro (escopo v2: não importar transações).

### Validação pelo time-de-testes
- [ ] Criar transação PJ sem cost_center → grava NULL, sem erro.
- [ ] Criar transação PJ com cost_center → grava, aparece no relatório filtrado.
- [ ] Criar transação PF → dropdown NÃO aparece.
- [ ] Editar cost_center existente → reflete em todas transações.
- [ ] Arquivar (active=false) → some do dropdown, não some das transações antigas.
- [ ] Excluir cost_center com transações vinculadas → bloqueado ou setar NULL (definir).

### Reversão
```sql
-- Restore point necessário? SIM, mas reverte por DDL inverso:
ALTER TABLE transactions DROP COLUMN cost_center_id;
DROP TABLE cost_centers;
```
Snapshot Supabase é segurança extra (dados de cost_center se perdem com DROP).

---

## Mudança #2 — Projects (só PJ, separado de cost_center)

### Schema DDL
```sql
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id     UUID NOT NULL REFERENCES entities(id),
  code          TEXT,                 -- "TECRJ0420250088" | "CRD241241" | etc
  client_name   TEXT NOT NULL,        -- "MR Engenharia"
  uf            CHAR(2),              -- "RJ"
  cost_center_id UUID NULL REFERENCES cost_centers(id),  -- ligação opcional
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (true);
CREATE POLICY "projects_admin"  ON projects FOR ALL    USING (auth.role() = 'authenticated');

ALTER TABLE transactions
  ADD COLUMN project_id UUID NULL REFERENCES projects(id);

CREATE INDEX idx_transactions_project ON transactions(project_id) WHERE project_id IS NOT NULL;
```

**Sem seed** — Iremar cadastra conforme contrata. Não importar os 46 valores legados.

### UI
- Tela `/empresa/projetos` (CRUD) — campos: código, cliente, UF, centro vinculado, status.
- Criação inline ("+ novo projeto") no dropdown do form de Lançamento PJ.
- Relatório `/relatorios/projetos` com receita/despesa/margem por projeto.

### Validação
- [ ] Criar projeto via inline-create → fica disponível imediatamente.
- [ ] Arquivar projeto → some do dropdown ativo, transações antigas preservadas.
- [ ] Relatório de margem mostra valores corretos.

### Reversão
```sql
ALTER TABLE transactions DROP COLUMN project_id;
DROP TABLE projects;
```

---

## Mudança #3 — `accrual_date` (competência)

### Schema DDL
```sql
ALTER TABLE transactions
  ADD COLUMN accrual_date DATE NULL;

-- não precisa índice (uso analítico, baixo volume de filtros)
```

### UI
- Form de Lançamento ganha campo opcional "Data de competência" (collapsed por padrão).
- Texto explicativo: "Use quando a despesa pertence a um mês diferente do pagamento."
- Relatórios passam a permitir agrupar por `accrual_date` quando preenchido, senão usa `date`.

### Migração
- Backfill simples (opcional): `UPDATE transactions SET accrual_date = NULL` (já é o default).
- Não preencher automaticamente — semântica precisa do humano.

### Validação
- [ ] Lançar despesa com data 2026-01-05 e competência 2025-12-31 → aparece em relatório DEZ/25 (modo competência) e JAN/26 (modo caixa).
- [ ] Lançamentos antigos sem accrual_date → continuam funcionando em ambos os modos (fallback para `date`).

### Reversão
```sql
ALTER TABLE transactions DROP COLUMN accrual_date;
```
Trivial, sem necessidade de restore point dedicado (mas snapshot do plano global cobre).

---

## Mudança #4 — Status + Reconciled

### Schema DDL
```sql
-- 4.1 status com 2 estados
ALTER TABLE transactions
  ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed'
  CHECK (status IN ('pending','confirmed'));

-- 4.2 flag de conciliação
ALTER TABLE transactions
  ADD COLUMN reconciled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_transactions_status_pending ON transactions(status) WHERE status = 'pending';
```

### UI
- Toggle "Lançamento futuro / a confirmar" no form (default off = `confirmed`).
- Badge visual em listagens: cinza para `pending`, normal para `confirmed`.
- Filtro "Mostrar pendentes" nos relatórios (default oculto para não bagunçar caixa).
- Coluna `reconciled` (checkbox) na tela de extrato — uso futuro com OFX.

### Migração
- Default `'confirmed'` cobre todas as transações existentes — preservação total.
- `reconciled=false` em tudo (correto: nada foi conciliado ainda).

### Validação
- [ ] Lançamento sem toggle → status='confirmed', aparece em saldo.
- [ ] Lançamento com toggle pendente → status='pending', NÃO entra em saldo realizado, entra em "previsto".
- [ ] Marcar como reconciliado → flag muda, sem efeito em valor.
- [ ] Relatórios padrão (DRE, fluxo) IGNORAM `pending` por default.
- [ ] Time-de-testes: nenhum total muda comparado ao estado anterior (todos viraram 'confirmed').

### Reversão
```sql
ALTER TABLE transactions DROP COLUMN status;
ALTER TABLE transactions DROP COLUMN reconciled;
```
Risco específico: se já houver UI dependendo desses campos, precisa rollback de código junto. **Sempre testar reversão em branch primeiro.**

---

## Mudança #5 — Seed de Categorias (coordenar com i2-financas)

**Não é um deploy independente — é um INPUT para o squad i2-financas.**

### Documento a entregar para i2-financas

```yaml
# PF — Categories seed sugerido (baseado em uso real)
- name: Moradia
  type: expense
  entity: personal
  subcategories: [Condomínio, Feira, Celpe, IPTU]
- name: Saúde
  type: expense
  entity: personal
  subcategories: [Treino, Tratamento]
- name: Telefonia
  type: expense
  entity: personal
  subcategories: [Fixo + Internet + TV, Celular]
- name: Filhos
  type: expense
  entity: personal
  subcategories: [Isabela, Helena]  # ou usar responsible
- name: Investimentos
  type: expense
  entity: personal
  subcategories: [Aporte, Rendimentos]

# PJ — Categories seed sugerido com flag para Fator R
- name: Impostos
  type: expense
  entity: business
  subcategories:
    - { name: DAS, is_payroll_for_factor_r: false }
    - { name: GPS, is_payroll_for_factor_r: true }
    - { name: CIM, is_payroll_for_factor_r: false }
- name: Pessoal
  type: expense
  entity: business
  subcategories:
    - { name: Pró-labore, is_payroll_for_factor_r: true }
    - { name: Bolsa Estágio, is_payroll_for_factor_r: true }
    - { name: Freelancer, is_payroll_for_factor_r: false }
- name: Administrativas
  type: expense
  entity: business
  subcategories: [Contabilidade, Aluguel, Material, Internet, Transporte, Dividendos]
- name: SEBRAETEC
  type: income
  entity: business
  subcategories:
    - Planejamento para presença digital
    - Desenvolvimento de Mídias Digitais
    - Inserção digital - Website
    - Diagnóstico
- name: Vendas
  type: income
  entity: business
  subcategories: [Serviços Prestados, Tráfego Meta ADS, Website, MGF, Consultoria]
```

### Schema-change necessária no `categories` (i2-financas decide)
```sql
ALTER TABLE categories
  ADD COLUMN is_payroll_for_factor_r BOOLEAN NOT NULL DEFAULT false;
```

### Validação
- [ ] Relatório Fator R calcula numerador (folha) somando `categories.is_payroll_for_factor_r = true`.
- [ ] Iremar consegue editar/desativar categoria sem perder transações vinculadas.

### Reversão
- Reverter inserts via `DELETE FROM categories WHERE created_at >= '<timestamp>'` ANTES de qualquer transação ser vinculada. Após uso, manter (não há volta sem perda).

---

## Mudança #6 (opcional) — Contas faltantes

Apenas APÓS confirmação do Iremar:

```sql
-- Reserva Empresarial (filha do CC Inter, se houver hierarquia; senão standalone)
INSERT INTO accounts (entity_id, name, type, ...) VALUES
  ((SELECT id FROM entities WHERE type='business'), 'Reserva Empresarial', 'reserve', ...);

-- Carteira PF (se Iremar quiser registrar cash)
INSERT INTO accounts (entity_id, name, type, ...) VALUES
  ((SELECT id FROM entities WHERE type='personal'), 'Carteira', 'cash', ...);

-- CC Itaú e Inter PF: SÓ se confirmadas como ativas
```

Não é schema-change, é cadastro. Reversão trivial via DELETE/UPDATE active=false.

---

## Ordem de deploy recomendada

1. **Mudança #4** (status + reconciled) — base de tudo, baixo risco, valor imediato em "lançar pendência".
2. **Mudança #3** (accrual_date) — independente, baixo risco.
3. **Mudança #5** (categories seed) — coordenar com i2-financas. Sem schema do nosso lado, só ALTER `is_payroll_for_factor_r`.
4. **Mudança #1** (cost_centers) — primeira mudança PJ, valor alto.
5. **Mudança #2** (projects) — depois de cost_centers, pode referenciar.
6. **Mudança #6** (contas) — opcional, último.

**Entre cada deploy:**
- Snapshot Supabase ANTES.
- Validação time-de-testes ANTES de PROD.
- Verificar dashboards Admin + Operator (regra company.md).
- Commit semântico isolado.

---

## Riscos identificados

| Risco | Mitigação |
|---|---|
| Conflito com seed de categorias do i2-financas | Sincronizar antes — entregar este doc ao squad |
| `status='confirmed'` default oculta movimentos pendentes legados | OK, não existem pendentes legados (transações antigas todas confirmadas de fato) |
| Iremar não preencher `cost_center_id` e relatório PJ ficar pobre | UI exibir aviso "transação PJ sem centro de custo" no card de saúde de dados |
| `projects` virar caos de cadastro | Iniciar sem seed, criação inline, status='archived' para limpar |
| DROP COLUMN em rollback perder dados já preenchidos | Snapshot Supabase antes; nunca rollback sem snapshot recente |

---

## Não fazer (lembrete)

- NÃO importar transações antigas. Escopo v2.
- NÃO criar Centro de Custo em PF.
- NÃO criar tabela `tags`, `payment_methods`, `cards`.
- NÃO mexer em código fora desta especificação — outros squads tocam código.
- NÃO promover mudança para PROD sem validação do time-de-testes.
