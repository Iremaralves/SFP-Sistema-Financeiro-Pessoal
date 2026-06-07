# 04 — Roadmap de Implementação (Paula)

> Priorização por **ROI** = (impacto na decisão diária × frequência de uso) ÷ esforço estimado.
> Cada item tem owner sugerido (qual squad executa) e dependência.

---

## Quadrante de prioridades

```
                    ALTO ROI
                       ▲
                       │
   FAZER AGORA    ●────┼────● JANELA DE OPORTUNIDADE
                       │
   ────────────────────┼──────────────────► Esforço
                       │
   NEM FAZER      ●────┼────● BACKLOG ALONGADO
                       │
                       ▼
                    BAIXO ROI
```

---

## FASE 0 — FUNDAÇÃO (1 sprint, bloqueante)

> Sem isso nada de analítico funciona.

### F0.1 — Seed do catálogo de categorias
- **O quê**: criar ~50 categorias canônicas em `public.categories` (lista no doc 02)
- **Owner**: squad **i2-melhorias** (DDL/seed) ou **i2-data-consistency**
- **Esforço**: 4h (script + revisão)
- **Bloqueante para**: tudo abaixo

### F0.2 — Religar regras existentes + adicionar novas
- **O quê**: ajustar 28 `categorization_rules` para apontar `category_id` correto + criar ~30 novas regras
- **Owner**: i2-melhorias
- **Esforço**: 6h
- **Depende de**: F0.1

### F0.3 — Motor de reaplicação de regras em batch
- **O quê**: endpoint/script que pega `transactions WHERE category_id IS NULL` e tenta classificar com regras vigentes
- **Owner**: i2-melhorias
- **Esforço**: 8h
- **Depende de**: F0.2

### F0.4 — UI mínima de categorização rápida
- **O quê**: na página de transações, dropdown com categorias agrupadas + botão "criar regra a partir desta transação"
- **Owner**: i2-paridade-ux + i2-design
- **Esforço**: 12h
- **Depende de**: F0.1

**ENTREGA FASE 0**: 100% das transações com categoria atribuída (mesmo que ~30% manualmente).

---

## FASE 1 — KPIs DE ALTO IMPACTO (1 sprint)

> Decisão diária + semanal.

### F1.1 — Dashboard PF incremental (R1)
- **O quê**: adicionar Taxa de Poupança, % Custo Fixo, Reserva-em-meses ao dashboard atual
- **Owner**: i2-melhorias + i2-design (mockup R1)
- **Esforço**: 16h
- **Por que primeiro**: É o que abre todo dia. Cada KPI = decisão imediata.

### F1.2 — Calendário de Compromissos 30 dias (R4)
- **O quê**: nova rota `/proximos`, listagem + projeção de folga
- **Owner**: i2-melhorias
- **Esforço**: 10h
- **Por que**: substitui a planilha mental "o que falta pagar este mês".

### F1.3 — Top Estabelecimentos com alertas MoM (R3)
- **O quê**: widget no dashboard + drill-down em lista
- **Owner**: i2-melhorias + i2-design
- **Esforço**: 12h
- **Por que**: detecta vazamentos invisíveis (ex: Drogasil +47% sem ninguém perceber).

### F1.4 — Bug fix: reconciliar 225 transações `pending`
- **O quê**: revisão de processo. Defaultar `status='paid'` se vier de CSV de cartão de crédito de mês passado, ou criar fluxo de reconciliação em lote.
- **Owner**: i2-data-consistency
- **Esforço**: 6h
- **Por que**: status pending bagunça todo KPI de "gasto realizado".

---

## FASE 2 — RELATÓRIOS PJ (1 sprint)

> Iremar precisa disso pra falar com o contador.

### F2.1 — DRE PJ Mensal (R2)
- **O quê**: nova rota `/empresa/dre` (já existe a aba empresa — incrementar)
- **Owner**: i2-melhorias + i2-design (mockup R2)
- **Esforço**: 14h
- **Depende de**: F0.1 (categorias PJ)
- **ROI**: salva 1h/mês de planilha + reduz risco de erro fiscal

### F2.2 — KPI Fator R com gauge (KPI-PJ1) e Saúde Fiscal (R8)
- **O quê**: card destacado no `/empresa` mostrando Fator R atual + projeção + alerta
- **Owner**: i2-melhorias + i2-design
- **Esforço**: 12h
- **ROI altíssimo**: 1 ponto percentual abaixo de 28% pode custar R$ 1.500–2.000/mês em DAS extra. Esse KPI sozinho paga o sistema.

### F2.3 — Vincular income_records ↔ fiscal_notes
- **O quê**: ao registrar pagamento recebido com NF, criar par income_records + fiscal_notes
- **Owner**: i2-melhorias
- **Esforço**: 10h
- **Depende de**: nada

### F2.4 — Identificar "Pagamento recebido" R$ 33k
- **O quê**: investigação. Esses 4 registros são receita ou pagamento de fatura?
- **Owner**: i2-data-consistency
- **Esforço**: 2h
- **Por que**: contamina o KPI de receita PF se for fatura paga.

---

## FASE 3 — DECISÕES TÁTICAS (1 sprint)

### F3.1 — Fluxo de Caixa Projetado 90d (R5)
- **Owner**: i2-melhorias + i2-design (gráfico)
- **Esforço**: 16h
- **ROI**: antecipa buraco de caixa em 30–60 dias.

### F3.2 — Acerto Casal Visual (R7) — visível por AMBOS
- **O quê**: rota `/casal` ou similar, com fechamento dia 13 + RLS para Juliana ver
- **Owner**: i2-paridade-ux + i2-design
- **Esforço**: 14h
- **Lição registrada na memory**: Juliana precisa de acesso.

### F3.3 — Comparativo Mensal (R6)
- **Owner**: i2-melhorias
- **Esforço**: 10h

---

## FASE 4 — POLIMENTO / BACKLOG

- F4.1 Burn rate semanal com push (precisa de PWA + service worker — alto custo)
- F4.2 Concentração SaaS PJ (KPI-PJ4) — nice-to-have
- F4.3 Cobertura de Reserva como gauge — depende de saldo automático
- F4.4 Normalização de descrições ("Dl*Uberrides" vs "Dl *Uberrides") — qualidade de dado
- F4.5 Histórico de Fator R 12m com seta de tendência

---

## DEPENDÊNCIAS COM OUTROS SQUADS

| Squad | O que precisamos | Quando |
|---|---|---|
| **i2-design** | Mockups R1, R2, R5, R6, R7 + sistema de cor para 🟢🟡🔴 | Fase 1 e 2 |
| **i2-data-consistency** | Limpeza dos 225 pending + investigação "Pagamento recebido" | Fase 0/1 |
| **i2-melhorias** | Backend dos novos relatórios | Fase 0 em diante |
| **i2-paridade-ux** | Garantir Juliana enxerga /casal e /mes | Fase 3 |
| **time-de-testes** | QA dos cálculos de Fator R, DRE, Acerto | Antes de cada release |
| **gestao-multi-entidade** | Garante isolamento PF × PJ nos novos relatórios | Fase 2 |

---

## MÉTRICAS DE SUCESSO DO PRÓPRIO ROADMAP

Avaliar em 60 dias:

1. **Adoção**: > 80% das transações novas categorizadas automaticamente (sem clique manual)
2. **Confiança**: usuário consegue responder em < 10s "quanto sobrou esse mês?" sem abrir planilha
3. **Decisão fiscal**: Fator R monitorado mensalmente, com pelo menos 1 ajuste preventivo de pró-labore
4. **Acerto sem fricção**: dia 13 fecha com 1 PIX, sem cálculo manual
5. **Tempo do contador**: relatório DRE substitui parcialmente o que o contador faz hoje em planilha

---

## O QUE NÃO ENTRA NO ROADMAP (e por quê)

- ❌ Integração Open Finance — proibido no memory + dev solo
- ❌ Conciliação bancária automática — depende de Open Finance
- ❌ Multi-tenancy (outros clientes usando o sistema) — escopo pessoal
- ❌ Módulo de NF-e (emissão) — Iremar usa sistema do contador
- ❌ Previsão por IA — princípio: cálculos simples e auditáveis, sem caixa-preta
- ❌ Controle de patrimônio (imóvel/carro/aplicações longas) — sistema é fluxo, não estoque

---

## ORDEM RECOMENDADA NUMA FRASE

> **Categorize tudo → mostre fator R → mostre fluxo de caixa.** Nessa ordem o ROI é máximo: a categorização libera todos os outros relatórios, o Fator R é o KPI de maior valor monetário direto, e o fluxo de caixa é o que evita susto.
