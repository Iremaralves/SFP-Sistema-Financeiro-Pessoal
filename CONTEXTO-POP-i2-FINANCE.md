# 📥 Handoff para o POP i2 — Projeto "i2 Finance"

> **Instruções para o sistema POP i2 (leia primeiro):**
> Este documento descreve um projeto de software real, em produção, e o backlog do que falta.
> A partir dele, **crie 1 projeto** chamado **"i2 Finance"** e **crie as tarefas** listadas na
> seção *5. Backlog de Tarefas*. **Todas as tarefas têm dono = Iremar** (a delegação será
> decidida depois, dentro do próprio sistema). Use os campos de cada tarefa (prioridade,
> estimativa, dependências, critério de aceite) para montar o board. A seção *4. O que já está
> pronto* é **contexto/estado atual — NÃO vire tarefas** (já está feito e em produção).
> A seção *6. Decisões pendentes* deve virar tarefas do tipo "decisão/spike", também para Iremar.

---

## 1. Identidade do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | i2 Finance |
| **Tipo** | App de gestão financeira pessoal (PF) + empresarial (PJ) |
| **Dono / responsável** | Iremar |
| **Operadora** | Juliana (categoriza lançamentos; só mobile) |
| **Stack** | Next.js 15 (App Router, Server Actions) · Tailwind v4 · Supabase (Postgres + RLS + Storage) · pnpm monorepo (Turborepo) |
| **Deploy** | Vercel — produção: https://i2-finance.vercel.app |
| **Repo** | github.com/Iremaralves/SFP-Sistema-Financeiro-Pessoal (branch `main`) |
| **Supabase project** | `jvfdzcouychlfxxnzams` |
| **household_id** | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| **Integração** | Google Apps Script (webhook) lê email do Nubank → salva CSV no Drive → app importa |

---

## 2. Objetivo do Produto (o "porquê")

Transformar o i2 Finance de **registro do passado** em **ferramenta de decisão do presente**.
Duas frentes que não se misturam (regra contábil — Fator R):

- **PF (Família):** controlar a fatura do cartão Nubank, dividir gastos no casal
  (Iremar / Juliana / Casal / i2), e responder "posso usar o cartão?" (orçamento).
- **PJ (i2 Soluções):** planejar os pagamentos do mês (folha + impostos), saber **quanto tirar
  do cofre/reserva** pra honrar tudo, e (futuro) controlar **contas a receber de projetos**.

---

## 3. Glossário e dados-chave (grounding pro sistema)

**Entidades** (`entities`):
- Família — `type=personal` — id `83c5f012-9445-4c96-ba75-de29158beb2e`
- i2 Soluções Digitais — `type=business` — id `04e9ab59-1acb-4897-bfc7-e2b91d439655`

**Contas** (`accounts`, todas do household acima):
| Conta | kind | Entidade | Papel |
|-------|------|----------|-------|
| Cartão Nubank | credit_card | Família | fatura PF |
| Nubank PF | checking | Família | conta corrente |
| Nubank Juliana | checking | Família | conta corrente |
| Caixinha Nubank | investment | Família | **cofre PF** |
| NuInvest | investment | Família | **cofre PF** |
| Inter PJ | company | i2 | conta operacional PJ |
| Inter Investimentos | investment | i2 | **cofre/reserva PJ** (R$ 4.503,00) |

**Regra sagrada:** cofre/contas **PF e PJ nunca se misturam** (Fator R). Filtros por
`entity_id`, não por `kind`.

**Folha mensal da i2** (compromissos): Pró-labore Iremar R$ 5.000 (dia 5) · Retirada de lucros
R$ 3.000 (dia 5) · DAS R$ 2.600,21 (dia 20) · INSS R$ 550 (dia 20). **Faltam cadastrar:**
Pedro, Alana, Mayana, Contadora (fixas mensais) e Eduarda (estagiária, proporcional no 1º mês).

**Divisão da fatura (settlement):** `julianaPart = gastos_dela + casal/2`; idem Iremar.
`totalFatura = julianaPart + iremarPart + i2Part` (pagamentos com amount≥0 não contam).

---

## 4. O que JÁ está pronto e em produção (CONTEXTO — não criar tarefas)

> Tudo abaixo já foi implementado, testado e está no ar. Serve para o sistema entender o estado
> atual e **não recriar**.

**Importação de fatura (Nubank → app):**
- Webhook Apps Script: botão "Verificar agora" + cron horário lê email do Nubank e salva CSV no Drive.
- Importação corrigida: bug de `onConflict` composto, dedup por fingerprint + por conteúdo
  (date|desc|amount) com tolerância de ±2 dias (Nubank reusa nome e reajusta data), parser
  aceita formato BR (vírgula decimal).
- Edição de lançamento do cartão preserva sinal negativo e trava valor/data/conta (definidos
  pelo Nubank) — admin pode destravar.
- Campo de nota opcional na tela de categorizar.

**Perfis e navegação:**
- Toggle de perfil **Pessoal / Empresa / Tudo** (cookie), no header. Juliana travada em Pessoal.
- Filtros por entidade em /contas, dashboard e planejador (separação PF/PJ blindada).

**Telas de decisão (redesenhadas e aprovadas via mockup):**
- **Dashboard Juliana:** CTA categorizar com progresso + **Divisão da fatura por responsável**
  (Juliana/Casal/Iremar/i2) + "Seu fechamento". Sem semáforo (foco = contabilidade).
- **Dashboard Pessoal (Iremar):** **Semáforo "posso usar o cartão?"** (teto editável via cookie,
  default R$ 8.000) + fatura com sua parte + a pagar/a receber.
- **Planejador de Pagamentos da i2** (`/empresa/pagamentos`): total a desembolsar + **card do
  cofre** (saldo Inter PJ → déficit → quanto tirar da Reserva i2, com botão Transferir) +
  lista de pagamentos com dar-baixa. Proração da Eduarda no form (1º mês).
- AnchorHero (número-âncora por escopo), QuickActions (atalhos).

**Qualidade:** squad de QA validou (0 bugs alta/média; reconciliação da divisão e separação
PF/PJ confirmadas via SQL). 4 ajustes finos aplicados.

---

## 5. Backlog de Tarefas (CRIAR como tarefas · dono = Iremar)

> Status sugerido inicial: todas `A fazer`, exceto onde indicado. Prioridade: P0 (urgente) a P3 (quando der).

### ÉPICO A — Colocar a gestão da i2 em uso real

**POPI2-1 · Cadastrar a folha mensal da i2 (pessoas que faltam)**
- Prioridade: **P0** · Estimativa: 30 min · Status: A fazer
- Descrição: Cadastrar em `/compromissos/novo` (responsável = i2): Pedro, Alana, Mayana,
  Contadora (valor fixo mensal) e Eduarda (estagiária — usar o toggle "proporcional 1º mês" +
  data de início). Valores reais a confirmar com Iremar.
- Critério de aceite: as pessoas aparecem no Planejador `/empresa/pagamentos`; o total bate
  com a folha real; a Eduarda mostra valor proporcional no 1º mês e cheio nos seguintes.
- Dependências: nenhuma (a tela já existe).

**POPI2-2 · Rodar a folha de um mês real no Planejador (validação de campo)**
- Prioridade: **P0** · Estimativa: 1 ciclo (uso ao longo de ~2-3 semanas) · Status: A fazer
- Descrição: Usar o planejador de verdade no fechamento da folha: ver o total, usar o card do
  cofre pra calcular o resgate, transferir, dar baixa em cada pagamento. Anotar fricções.
- Critério de aceite: Iremar consegue fechar a folha do mês **sem planilha**; reporta o que
  faltou ou atrapalhou.
- Dependências: POPI2-1.

**POPI2-3 · "A receber de projetos" da i2 (contas a receber) — ÉPICO/feature nova**
- Prioridade: **P1** · Estimativa: 3-5 h · Status: A fazer (precisa decisão POPI2-D1 antes? não — só snapshot)
- Descrição: Criar tabela de contas a receber (migration reversível + RLS + snapshot antes),
  formulário "cadastrar projeto/recebível" (cliente, valor, data prevista, parcelas, status
  previsto/faturado/recebido), e timeline de recebíveis no dashboard Empresa. **Não misturar
  com receita PF.** Modelagem já desenhada em `squads/i2-gestao-decisoria/output/`.
- Critério de aceite: Iremar cadastra um projeto que vai receber em 30 dias e vê na timeline
  da Empresa; valor previsto não entra como saldo até virar "recebido".
- Dependências: criar snapshot do banco antes da migration; validar não-regressão.

### ÉPICO B — Hardening e robustez (do relatório de QA)

**POPI2-4 · Fuso horário em `currentInvoiceCycle`**
- Prioridade: P2 · Estimativa: 20 min · Status: A fazer
- Descrição: `packages/core/src/settlement.ts` usa `toISOString()` que pode deslocar 1 dia em
  fuso UTC+N. Trocar por `getFullYear/Month/Date` + padStart. (Latente — servidor roda em UTC.)
- Critério de aceite: ciclo da fatura correto independente do fuso do servidor.

**POPI2-5 · Planejador sem conta company configurada**
- Prioridade: P3 · Estimativa: 20 min · Status: A fazer
- Descrição: `/empresa/pagamentos` esconde o card de cofre se a i2 não tiver conta `kind=company`.
  Mostrar aviso explícito em vez de ocultar.
- Critério de aceite: cenário sem Inter PJ mostra "Nenhuma conta empresa configurada", não some.

**POPI2-6 · Âncora "R$ 0,00" em mês 100% pago**
- Prioridade: P3 · Estimativa: 20 min · Status: A fazer
- Descrição: Quando tudo do mês está pago, o número-âncora do planejador mostra R$ 0,00 gigante.
  Trocar pra "Tudo pago · R$ X desembolsado".
- Critério de aceite: mês quitado mostra resumo positivo, não "zero".

### ÉPICO C — Operação e infraestrutura

**POPI2-7 · Reconectar webhook GitHub → Vercel**
- Prioridade: P1 · Estimativa: 30 min · Status: A fazer
- Descrição: O auto-deploy do GitHub pra Vercel ficou instável (deploys feitos via CLI nesta
  sessão). Verificar/reconectar a integração Git em Vercel → Settings.
- Critério de aceite: push no `main` dispara deploy automático novamente.

**POPI2-8 · Adicionar SUPABASE_SERVICE_ROLE_KEY no Vercel (habilitar backups)**
- Prioridade: P1 · Estimativa: 15 min · Status: A fazer
- Descrição: A feature de backup/restore (scripts + bucket) precisa da service role key como env
  var no Vercel pra funcionar em produção.
- Critério de aceite: rotina de backup roda; snapshot pode ser criado antes de mudanças.

**POPI2-9 · Rotacionar o WEBHOOK_TOKEN do Apps Script**
- Prioridade: P2 · Estimativa: 10 min · Status: A fazer
- Descrição: O token do webhook foi exposto em conversa. Gerar novo (`openssl rand -hex 32`),
  atualizar no Apps Script (Script Properties) e no Vercel (env), descartar o antigo.
- Critério de aceite: webhook funciona com token novo; antigo invalidado.

### ÉPICO D — Orçamento e contabilidade (refino)

**POPI2-10 · Persistir teto do orçamento PF (hoje em cookie)**
- Prioridade: P2 · Estimativa: 1-2 h · Status: A fazer
- Descrição: O teto do semáforo está em cookie (por navegador). Migrar pra um armazenamento
  do household (tabela de settings/orçamento) pra ser consistente entre dispositivos.
- Critério de aceite: teto definido por Iremar persiste em qualquer dispositivo.
- Dependências: decisão POPI2-D3.

---

## 6. Decisões pendentes (CRIAR como tarefas tipo "decisão" · dono = Iremar)

**POPI2-D1 · A contadora conta no Fator R?**
- Depende de fato do mundo real: a contadora emite NF como PJ (não conta) ou é RPA/autônoma
  (conta no Fator R). Iremar precisa confirmar com ela. Default conservador hoje: não-folha.

**POPI2-D2 · `opening_balance` das contas PF**
- O saldo da Nubank PF aparece negativo (−R$ 9.913,67) porque só tem o pagamento da fatura
  lançado, sem receita. Decidir se as contas PF devem ter saldo inicial configurado e/ou se as
  receitas (salário, pró-labore recebido) devem virar transactions. Resolver junto do épico de
  recebíveis (POPI2-3).

**POPI2-D3 · Valor real do teto do orçamento PF**
- Hoje default R$ 8.000 (editável). Iremar define o número real que reflete o orçamento mensal
  da família.

**POPI2-D4 · Ordem de uso vs. recebíveis**
- O squad de gestão recomendou **usar o planejador/folha 2-3 semanas antes** de construir o
  "a receber de projetos" (POPI2-3), pra o uso real reordenar o roadmap. Iremar decide:
  validar primeiro (recomendado) ou construir recebíveis já.

---

## 7. Referências (artefatos já gerados nesta base)

- `squads/i2-gestao-decisoria/output/2026-06-08-gestao/` — modelagem completa (AR/AP, folha,
  proração, planejador de cofre, migrations propostas, validação).
- `squads/i2-design-visual/mockups/` — mockups HTML aprovados (planejador, dashboards, Juliana).
- `squads/time-de-testes/output/2026-06-08-qa-redesign/relatorio-qa.md` — relatório de QA.
- `squads/i2-redesign-completo/output/` — auditoria + princípios de design.

## 8. Regras permanentes do projeto (para qualquer execução futura)

1. **Nunca misturar PF (Família) com PJ (i2)** — quebra o Fator R.
2. **Validar com testes/QA antes** de mudanças de DB/produção; **criar snapshot** antes de
   schema ou massa de dados.
3. **Nunca quebrar o que já funciona** — preservação > novas features.
4. **Mobile-first** (375px) e **dark mode** são identidade; cores por responsável fixas
   (azul=Iremar, rosa=Juliana, âmbar=i2, ciano=Casal).
5. Migrations **sempre reversíveis** (UP+DOWN) com RLS.
