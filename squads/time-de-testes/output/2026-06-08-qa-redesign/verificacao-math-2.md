# Verificação adversarial — math-2

**Achado:** "'A pagar' (QuickActions) mistura contas PJ no total exibido pro Iremar"
**Severidade reportada:** baixa
**Veredito:** REAL — confirmado. Severidade mantida em **baixa**.

## Reprodução concreta

### 1. Código (apps/web/src/app/dashboard/page.tsx)
- Linhas 90-92: `bills` filtra `commitments` apenas por `payment_method != 'credit_card'`
  e `!paidSet.has(c.id)`. **Não há filtro por entidade nem por responsible.**
- Linhas 123-124: `aPagarTotal = bills.reduce(...)` e `aPagarCount = bills.length`
  somam TODOS os bills, sem distinção PF/PJ.
- Linhas 158-164: vão para `dashboardMetrics`.
- Linhas 124-133 (DashboardAdmin): `dashboardMetrics` é passado para `QuickActions`.
- Linhas 168-170: `boletosPFIremar` filtra CORRETAMENTE
  `paid_by === 'iremar' && responsible !== 'i2'` — provando que o padrão de
  separação por entidade existe e está sendo ignorado em `aPagarTotal`.

### 2. QuickActions (apps/web/src/components/QuickActions.tsx)
- Linhas 90-98: o tile "A pagar" (href `/compromissos`) renderiza no branch `else`,
  ou seja, nos escopos **pessoal** e **tudo**.
- Badge: `aPagarCount > 0 ? \`${aPagarCount} · ${fmt(aPagarTotal)}\` : 'OK'`
  → exibe "17 · R$ 17.988" para o Iremar mesmo no perfil Pessoal.
- O tile NÃO aparece no escopo `empresa` (lá o tile equivalente é "Pagar / Cofre"
  → /empresa/pagamentos).

### 3. Escopo Pessoal é alcançável pelo admin
- DashboardAdmin (linhas 96-97) renderiza `ProfileScopeToggle` **destravado**
  (sem `locked`), então o Iremar pode alternar para "Pessoal" livremente
  (ProfileScopeToggle.tsx linhas 16-19 listam pessoal/empresa/tudo).

### 4. Dados (Supabase jvfdzcouychlfxxnzams)
- `recurring_commitments` ativos não-cartão: **17 itens, R$ 17.987,96** (bate com o achado).
- Itens PJ (responsible='i2' / paid_by='i2'):
  - Pró-labore Iremar 5.000,00
  - Retirada de lucros 3.000,00
  - DAS Simples Nacional 2.600,21
  - INSS 550,00
  - **Total PJ = R$ 11.150,21** (bate exatamente com o achado).
- `monthly_obligations` pagas em `reference_month = '2026-06-01'`: **0 (vazio)**.
  → `paidSet` vazio → todos os 17 entram em `bills` → o vazamento ocorre HOJE em produção.

## Impacto e por que NÃO é mais grave

- Afeta SOMENTE a etiqueta do tile "A pagar" no dashboard do Iremar (admin),
  nos escopos Pessoal e Tudo. É cosmético/informativo.
- NÃO contamina o cofre nem o settlement (regras SAGRADAS): `aPagarTotal` só
  alimenta o badge do QuickActions; não entra em nenhum cálculo de fatura,
  acerto ou cofre.
- NÃO afeta a Juliana: `DashboardOperator` desestrutura apenas
  `{ profile, transactions, month, scope }` (linha 53) — ignora `metrics`/`aPagarTotal`.
- NÃO afeta /empresa/pagamentos (planejador), que tem seu próprio filtro por entidade.
- O número correto para o perfil Pessoal do Iremar (boletos PF que ele paga)
  já existe e é usado em outro lugar: `boletosPFIremar`.

## Conclusão
Bug real, reproduzível com dados de produção. É inconsistência de exibição
(mistura PF+PJ no contador "A pagar" do dashboard pessoal/tudo do Iremar),
contrariando a separação por entidade adotada em `saldoContas` e `boletosPFIremar`.
Severidade **baixa** está correta (não toca cofre/settlement/divisão).

**Fix sugerido (válido):** ao calcular `aPagarTotal`/`aPagarCount`, filtrar por
entidade conforme o scope — ou no mínimo excluir `responsible === 'i2'` no
contador do dashboard pessoal, alinhando com o já feito em `boletosPFIremar`.
