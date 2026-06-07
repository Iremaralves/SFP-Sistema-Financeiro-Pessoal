# 05 — Módulo de Metas Financeiras (Cofres)

**Agente:** Diana, Family CFO
**Data:** 2026-05-20

---

## Por que existir

O Iremar disse, com todas as letras: *"Queria viajar mas não conseguiu — porque comeu muita pizza."*. Essa frase é uma ferida de produto. O sistema atual não sabe o que é "viagem", então **não tem como** dizer que iFood está afastando a Helena da praia. Metas são o **dicionário emocional** que traduz números frios em decisões com sentido.

Inspiração: Monzo Pots, Nubank Caixinhas, YNAB Goals. Adaptação: o Iremar não move dinheiro para um "cofre" — ele rastreia o progresso a partir de **transferências reais** para contas de investimento já existentes (Tesouro, Reserva).

## Tipos de meta

1. **Acumular** (viagem, carro, casa, eletrônico) — alvo R$ + data alvo
2. **Reserva permanente** (6 meses de despesa) — alvo R$ recalculado dinamicamente
3. **Aposentadoria** (horizonte longo) — alvo de patrimônio + idade alvo
4. **Custeio recorrente futuro** (escola, plano de saúde de pais) — alvo mensal a partir de data X

## Schema sugerido (sem código — para i2-financas modelar)

**Tabela `goals`:**
- `id`, `household_id`, `entity_id` (PF ou PJ, default PF)
- `title` (Viagem família 2027)
- `category` (acumular / reserva / aposentadoria / custeio)
- `target_amount` (R$)
- `target_date` (date)
- `priority` (1-3)
- `linked_account_id` (FK para `accounts` — onde o saldo "mora" — ex.: NuInvest)
- `monthly_contribution_target` (calculado: (target − atual) ÷ meses restantes)
- `auto_track` (bool — se TRUE, deduz progresso de saldo da conta vinculada)
- `notes`, `created_at`, `archived_at`

**Tabela `goal_contributions` (opcional, para metas manuais):**
- `id`, `goal_id`, `transaction_id` (FK opcional), `amount`, `occurred_on`, `kind` (deposit/withdraw)

**Tabela `goal_milestones` (gamificação suave, sem nota):**
- `id`, `goal_id`, `pct` (25, 50, 75, 100), `reached_at`

## Lógica do "se gastar X, atrasa Y meses"

Pseudo-fórmula (Lara modela):

```
margem_mensal_real = receita_média_3m − despesa_média_3m
contrib_pra_meta = margem_mensal_real × (priority_share da meta)
meses_para_meta = (target − atual) ÷ contrib_pra_meta
atraso_se_gasto_extra = (gasto_extra ÷ contrib_pra_meta) [arredondado]
```

Exemplo concreto (com dados reais do Iremar):
- Margem mensal aprox: R$ 8.000 receita líquida − R$ 17.987 compromissos = problema; mas considerando que pró-labore + lucros = R$ 8.000 saem da PJ para PF, e despesa PF real ~R$ 5.500/mês → margem ~R$ 2.500/mês.
- Meta viagem R$ 6.000 com R$ 700 contribuição/mês = 8,5 meses.
- Se gastar R$ 400 extra em iFood = atrasa **0,57 mês ≈ 17 dias**.

Esse cálculo deve aparecer no card de Zona 3 do dashboard (ver doc 03), e como linha em cada transação relevante: *"Esse gasto atrasa a viagem em 5 dias."* — opcional, ativável no perfil.

## UI conceitual

```
┌──────────────────────────────────────────────┐
│ Metas                              [+ Nova]  │
├──────────────────────────────────────────────┤
│                                              │
│ 🏖️  Viagem família                           │
│ R$ 1.840 de R$ 6.000 · até jan/27           │
│ ▓▓▓░░░░░░░░░░░ 30%                          │
│ Contribuição: R$ 700/mês · No ritmo ✓        │
│ Conta vinculada: NuInvest                    │
│ [Detalhe] [Editar] [Arquivar]                │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ 🛟 Reserva 6 meses                           │
│ R$ 32.400 de R$ 48.000 · sem data            │
│ ▓▓▓▓▓▓▓░░░░░ 67%                            │
│ Contribuição: R$ 700/mês · 22 meses          │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ 🚗 Carro novo                                │
│ R$ 0 de R$ 35.000 · até jul/27               │
│ ░░░░░░░░░░░░░ 0%                            │
│ Precisa contribuir R$ 2.500/mês para chegar │
│ ⚠ Margem atual disponível: R$ 1.800/mês      │
│   Considere ajustar alvo ou prazo            │
│                                              │
└──────────────────────────────────────────────┘
```

## Integração com saldos existentes

- A Tesouro Direto (R$ 1.000/mês) e Reserva (R$ 700/mês), hoje em `recurring_commitments` com `payment_method=pix`, devem virar **transferências** (já planejado no schema com `is_transfer + transfer_id`).
- Cada transferência alimenta o saldo da conta de investimento vinculada → conta vinculada à meta → progresso atualiza em tempo real.

## Detalhe de UX importante

- **Toda meta tem foto/emoji.** Sem isso, vira número. Com isso, vira sonho.
- **Marcos celebráveis** (25%, 50%, 75%, 100%) — push positivo, raro. Não micro-gamificar.
- **Permitir meta "em pausa"** — ex.: férias dezembro pausa contribuição de carro novo. Sistema reconhece sem culpar.
- **Compartilhamento Juliana** — Juliana vê as metas, pode comentar em cada uma. Cria conversa do casal pelo app.

## Riscos a evitar

- **Metas demais → ninguém alimenta.** Limitar a 5 ativas no início; arquivar conclui.
- **Progresso falso** se conta vinculada também recebe outros depósitos. Solução: `auto_track=false` por default; usuário escolhe.
- **Tom motivacional artificial** ("Você consegue!!"). Evitar. Fato + projeção honesta é mais respeitoso.
