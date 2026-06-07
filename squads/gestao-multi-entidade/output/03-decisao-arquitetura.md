# Decisão de Arquitetura
**Checkpoint aprovado | 2026-05-17**

## Decisão
**Opção B — Multi-Entidade Completa, implementada em fases progressivas.**

Requisitos do Iremar:
- Solução completa e definitiva (sem gambiarras)
- O que já funciona não pode quebrar
- Urgência: contas fixas PJ separadas primeiro

## Plano de Fases

### FASE 1 — Entidade no Schema + Contas Fixas PJ (URGENTE)
**Escopo:**
1. Criar tabela `entities` (PF: Família, PJ: i2 Soluções Digitais)
2. Adicionar `entity_id` em `recurring_commitments`
3. Adicionar `entity_id` em `accounts`
4. Filtro "Pessoal | i2" na tela `/compromissos`
5. Badge de entidade nos cards de contas fixas

**O que NÃO muda:** transactions, dashboard, importar, lancamentos — tudo continua funcionando.

### FASE 2 — Dashboard Empresa + DRE (próxima sprint)
1. `entity_id` em `transactions` + `income_records`
2. Página `/empresa` com DRE simplificado
3. Fluxo de caixa PJ

### FASE 3 — Reembolso PJ→PF (depois do Beta)
1. Tabela `entity_reimbursements`
2. Tela de controle de reembolsos

## Regra de Migração de Dados
- `responsible = 'i2'` → `entity_id = i2_entity_id`
- `responsible = 'iremar' | 'juliana' | 'casal'` → `entity_id = familia_entity_id`
- Entidades seed: Família (personal) + i2 Soluções Digitais (business)

## Implementação: FASE 1 (Lucas vai executar)
