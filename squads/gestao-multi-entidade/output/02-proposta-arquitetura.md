# Proposta de Arquitetura — Gestão Multi-Entidade
**Rafael (Arquiteto) | 2026-05-17**

---

## Contexto da Decisão

O sistema já separa responsáveis via `responsible` (iremar/juliana/casal/i2).
O que falta é **a camada de visão PJ** — dashboards, fluxo de caixa, DRE e controle de reembolso.

---

# OPÇÃO A — "Entity Layer" *(Rápida — Beta em ~1 semana)*

## Ideia Central
Não mudar o schema core. Usar o que já existe (`responsible=i2` = empresa) e construir **UI + views** em cima.

## Mudanças de Schema (mínimas)

```sql
-- 1. Marcar qual conta pertence a qual entidade
ALTER TABLE accounts ADD COLUMN entity text DEFAULT 'personal' 
  CHECK (entity IN ('personal', 'business'));

-- Atualizar existentes:
UPDATE accounts SET entity = 'business' WHERE kind = 'company';
-- Nubank: personal (por padrão) — transações i2 no Nubank rastreadas por responsible

-- 2. Controle de reembolso: quando i2 paga pelo cartão PF
ALTER TABLE transactions ADD COLUMN needs_reimbursement boolean DEFAULT false;
-- Quando responsible=i2 e account_id=Nubank → needs_reimbursement=true (automático)

-- 3. Receitas da empresa (pró-labore etc)
ALTER TABLE income_records ADD COLUMN entity text DEFAULT 'personal'
  CHECK (entity IN ('personal', 'business'));
-- pró-labore → entity='business' (receita da i2 que vai para Iremar)
```

## Novas Telas

### `/empresa` — Dashboard i2 Soluções
```
┌─────────────────────────────┐
│  i2 SOLUÇÕES DIGITAIS       │
│  Maio de 2026               │
├─────────────────────────────┤
│  RECEITA           R$ X.XXX │ ← pró-labore + outros
│  DESPESAS          R$ X.XXX │ ← responsible=i2
│  RESULTADO         R$ X.XXX │ ← lucro/prejuízo
├─────────────────────────────┤
│  📋 CONTAS FIXAS PJ         │
│  DAS Simples    R$ 2.600    │
│  [botão → /compromissos?e=i2]│
├─────────────────────────────┤
│  💳 REEMBOLSO PENDENTE      │
│  Gasto no Nubank PF        │
│  que a i2 deve: R$ X.XXX   │
└─────────────────────────────┘
```

### Filtro em `/compromissos`
- Adicionar toggle: **Todos | Pessoal | i2**
- `?entidade=i2` mostra só DAS, contador, etc.

### Badge de reembolso em `/lancamentos`
- Transações com `needs_reimbursement=true` mostram badge âmbar "💰 Reimb."

## Esforço Estimado
| Item | Tempo |
|------|-------|
| Migration (3 ALTERs) | 30min |
| Página `/empresa` | 2 dias |
| Filtro `/compromissos` | 2h |
| Badge reembolso | 1h |
| **Total** | **~3 dias** |

## Prós e Contras
✅ Rápido — 3 dias de implementação  
✅ Zero risco — não mexe na lógica core existente  
✅ Nubank compartilhado resolvido com `needs_reimbursement`  
✅ Compatível com tudo que já foi feito  
❌ DRE limitado (receitas não têm entity ainda)  
❌ Se quiser adicionar terceira empresa no futuro, precisa refatorar  

---

# OPÇÃO B — "Multi-Entidade Completa" *(Robusta — v1.0 em ~3 semanas)*

## Ideia Central
Criar um conceito formal de **Entidade** no banco. Cada transação, conta e compromisso pertence a uma entidade.

## Mudanças de Schema

```sql
-- Nova tabela central
CREATE TABLE entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id),
  name text NOT NULL,              -- "Iremar Pessoal", "i2 Soluções Digitais"
  type text CHECK (type IN ('personal', 'business', 'shared')),
  color text,                      -- para UI: #3b82f6, #f59e0b
  cnpj text,                       -- opcional, para i2
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Vincular tudo a uma entidade
ALTER TABLE accounts ADD COLUMN entity_id uuid REFERENCES entities(id);
ALTER TABLE transactions ADD COLUMN entity_id uuid REFERENCES entities(id);
ALTER TABLE recurring_commitments ADD COLUMN entity_id uuid REFERENCES entities(id);
ALTER TABLE income_records ADD COLUMN entity_id uuid REFERENCES entities(id);

-- Migração de dados: mapear responsible → entity_id
-- responsible=i2 → entity "i2 Soluções"
-- responsible=iremar/juliana/casal → entity "Família"

-- Reembolso inter-entidade
CREATE TABLE entity_reimbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid,
  from_entity_id uuid REFERENCES entities(id), -- quem deve (i2)
  to_entity_id uuid REFERENCES entities(id),   -- quem emprestou (Iremar)
  transaction_id uuid REFERENCES transactions(id),
  amount numeric NOT NULL,
  status text DEFAULT 'pending', -- pending, paid
  paid_on date,
  created_at timestamptz DEFAULT now()
);
```

## Novas Telas
- `/empresa` — Dashboard PJ completo
- `/empresa/fluxo` — Fluxo de caixa mensal da i2
- `/empresa/reembolsos` — Controle do que a i2 deve ao Iremar
- `/empresa/compromissos` — Contas fixas só da i2
- Switch de contexto no header: **[Família ↕ i2 Soluções]**

## Esforço Estimado
| Item | Tempo |
|------|-------|
| Schema + migrations | 1 dia |
| Migração de dados existentes | 1 dia |
| Atualizar todos os server actions | 2 dias |
| Páginas `/empresa/*` | 4 dias |
| Switch de contexto no app | 1 dia |
| Testes + ajustes | 2 dias |
| **Total** | **~11 dias** |

## Prós e Contras
✅ Arquitetura correta e escalável  
✅ Suporta N entidades no futuro  
✅ DRE completo por entidade  
✅ Reembolsos formais com histórico  
❌ Risco de regressão (mexe em toda a app)  
❌ Mais de 2 semanas para ir ao ar  
❌ Precisa migrar dados históricos corretamente  

---

# RECOMENDAÇÃO DO ARQUITETO

**Use a Opção A agora para o Beta. Desenhe o schema da Opção B para migrar em 2-3 meses.**

### Motivo
- O `responsible=i2` já resolve 80% da separação PJ
- O que o Iremar precisa urgente é **ver os dados da i2 organizados** (não uma refatoração completa)
- A Opção A entrega uma página `/empresa` funcional em 3 dias
- Quando o sistema estiver estável em Beta, migra para Opção B sem pressa

### Caminho híbrido sugerido
1. **Agora:** Opção A (3 dias) → `/empresa` no ar
2. **Beta estável:** Adicionar `needs_reimbursement` + badge
3. **v1.0:** Migrar para Opção B com entidades formais

---

# CHECKLIST DE DECISÃO PARA IREMAR

Antes de confirmar, responda:

- [ ] Precisa de `/empresa` no ar **essa semana** → Opção A
- [ ] Pode esperar 2-3 semanas por algo mais completo → Opção B
- [ ] Quer DRE com receitas PJ separadas agora → Opção B (Opção A tem DRE básico)
- [ ] Tem mais empresas para adicionar em breve → Opção B
- [ ] Quer ir ao Beta logo → Opção A
