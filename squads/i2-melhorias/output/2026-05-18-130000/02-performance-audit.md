# Auditoria de Performance — Pedro

**Data:** 18/05/2026
**Auditor:** Pedro — Performance Engineer
**Método:** Análise estática de código-fonte (pages + components). Sem profiling real — estimativas baseadas em padrões de query, renderização e bundle.

---

## Score por Tela (estimado)

| Tela | Score | Gargalo principal |
|---|---|---|
| `/dashboard` | **8/10** | Bom. Promise.all correto. Único problema: `select('*')` nos dois fetches. |
| `/lancamentos` | **5/10** | `select('*')` em tabela que cresce ilimitadamente. Filtro min/max/q em memória pós-fetch. Sem LIMIT. |
| `/contas` | **6/10** | `select('*')` em transactions + income_records. `Intl.NumberFormat` instanciado 5x no render sem memoização. |
| `/empresa` | **6/10** | 5 queries sequenciais (waterfall). A query de `fiscal_notes` é condicional — só executa depois de `income_records`. Sem Promise.all. |
| `/compromissos` | **5/10** | Fuzzy match de status do cartão via `txDescriptions.some(d => d.includes(...))` em JS depois de fetch completo. Dupla iteração sobre `rows` (getStatus + isPaid calculados duas vezes). |
| `/relatorios` | **7/10** | Promise.all bem usado. Mas `income_records` buscado sem filtro de data (todos os meses) e o filtro aplicado em JS. |
| `FiscalNoteForm` | **4/10** | Client Component que faz 2 queries Supabase no browser (auth + profile) durante upload. Signed URL com TTL de 10 anos — não é problema de perf, mas é risco. |
| `BottomNav` | **7/10** | `useRouter` + `usePathname` corretos. Drawer com animação CSS ausente — sheet aparece sem transição (CLS potencial). |

---

## Problemas Críticos de Performance

### CRÍTICO 1 — `select('*')` em tabela de transações que cresce sem fim

**Arquivos:** `dashboard/page.tsx:29`, `lancamentos/page.tsx:58`, `contas/page.tsx:34`

Três telas buscam `transactions.select('*')`. A tabela `transactions` é a que mais cresce no sistema — cada mês adiciona dezenas/centenas de linhas. `select('*')` traz todas as colunas, inclusive as não usadas.

**Colunas usadas vs. colunas buscadas:**

- **Dashboard:** usa `id, description, amount, occurred_on, responsible, entity_id, source, household_id`. O `select('*')` provavelmente traz também `created_at, updated_at, notes, raw_data, import_id` — bytes extras trafegados a cada load.
- **Lançamentos:** usa as mesmas colunas acima via `toTransactions()`. Com filtro `mes=todos`, traz **todos os meses** sem LIMIT.
- **Contas:** usa apenas `amount, responsible, entity_id` para `calculateSettlement`. Traz o resto desnecessariamente.

**Impacto estimado:** 30–50% de redução no payload de rede substituindo por `select('id, description, amount, occurred_on, responsible, entity_id, source')`.

---

### CRÍTICO 2 — Sem LIMIT em `/lancamentos` quando `mes=todos`

**Arquivo:** `lancamentos/page.tsx:56-80`

Quando `params.mes === 'todos'`, a query remove o filtro de data e busca **todos os registros de transactions do household**. Sem `.limit()`. Quanto mais o sistema cresce, mais lento fica esse load.

```ts
// lancamentos/page.tsx:61-67 — sem limit quando mes=todos
if (mes === 'todos') {
  // sem filtro de data — fetcha tudo
} else { ... }
```

Além disso, os filtros de `q` (busca textual), `min` e `max` são aplicados **em memória no servidor** depois do fetch completo:

```ts
// lancamentos/page.tsx:84-89
if (q) transactions = transactions.filter(...)
if (min !== null) transactions = transactions.filter(...)
if (max !== null) transactions = transactions.filter(...)
```

`q` poderia virar `.ilike('description', '%${q}%')` direto no Supabase. `min`/`max` poderiam ser `.gte('amount', min).lte('amount', max)`. Isso eliminaria o fetch + filter em memória.

**Impacto estimado:** Para um household com 18 meses de dados (1.000–2.000 transações), o carregamento de `mes=todos` pode trazer 500KB+ de JSON desnecessário.

---

### CRÍTICO 3 — Waterfall de queries em `/empresa`

**Arquivo:** `empresa/page.tsx:52-107`

As queries são executadas sequencialmente, não em paralelo:

```
auth.getUser()           → aguarda
profiles.select(*)       → aguarda (depende de user.id — OK)
entities.select(...)     → aguarda (depende de profile — OK)
transactions.select(...) → aguarda i2Entity
recurring_commitments    → aguarda i2Entity
monthly_obligations      → aguarda compromissoIds (depende de commitments)
income_records           → aguarda i2Entity
fiscal_notes             → aguarda faturamento (depende de income_records)
```

Das 5 queries de dados, as queries de `transactions`, `recurring_commitments` e `income_records` poderiam ser disparadas em paralelo com `Promise.all` — todas dependem apenas de `i2Entity.id`, que já está disponível.

Apenas `monthly_obligations` depende de `compromissoIds` (resultado de `recurring_commitments`) e `fiscal_notes` depende de `faturamento` (resultado de `income_records`). Portanto a estrutura ótima seria:

```
Round 1: Promise.all([transactions, recurring_commitments, income_records])
Round 2: Promise.all([monthly_obligations, fiscal_notes])  ← ambos dependem de round 1
```

**Impacto estimado:** Redução de ~3 RTTs para 2 RTTs. Em Supabase com p50 de 80ms por query, isso é ~160ms de economia no TTFB desta tela.

---

### CRÍTICO 4 — Client Component `FiscalNoteForm` fazendo queries Supabase no browser

**Arquivo:** `empresa/FiscalNoteForm.tsx:63-71`

Durante o upload de PDF, o componente faz:
1. `db.auth.getUser()` — request autenticado ao Supabase Auth
2. `db.from('profiles').select('household_id').eq('id', user.id).single()` — query ao banco

Isso acontece **no browser, a cada upload**, para montar o path do arquivo. O `household_id` já está disponível no componente pai (`empresa/page.tsx:39`), mas não é passado como prop para o `FiscalNoteForm`.

**Solução:** Passar `householdId` como prop para `FiscalNoteForm` e eliminar as 2 queries client-side.

```tsx
// empresa/page.tsx
<FiscalNoteForm
  incomeRecordId={faturamento.id}
  existingNote={fiscalNote ?? null}
  referenceMonth={mes}
  householdId={profile.household_id} // ← adicionar
/>
```

**Impacto estimado:** Elimina 2 requests de rede no browser em cada upload. Reduz latência de upload em ~150–300ms.

---

### CRÍTICO 5 — `income_records` em `/relatorios` sem filtro de data

**Arquivo:** `relatorios/page.tsx:65-70`

```ts
supabase
  .from('income_records')
  .select('reference_month, kind, amount')
  .eq('household_id', profile.household_id)
  // ← sem filtro de data! busca TODOS os income_records do household
```

A tab "Fluxo" só usa os últimos 12 meses. A tab "Receber" usa apenas os 3 próximos meses + 6 de histórico. Mas o fetch traz tudo — incluindo anos anteriores se existirem.

**Solução:** Adicionar `.gte('reference_month', mesInicio)` para limitar ao período relevante.

---

## Oportunidades de Otimização (com ganho estimado)

### OPT 1 — Substituir `select('*')` por colunas específicas
**Ganho estimado: 30–50% de redução no payload de rede**

| Arquivo | Tabela | Colunas realmente usadas |
|---|---|---|
| `dashboard/page.tsx:29` | `transactions` | `id, description, amount, occurred_on, responsible, entity_id, source` |
| `dashboard/page.tsx:36` | `income_records` | `id, kind, amount, reference_month` |
| `contas/page.tsx:34` | `transactions` | `id, amount, responsible, entity_id` |
| `contas/page.tsx:39` | `income_records` | `id, kind, amount` |
| `compromissos/page.tsx:90` | `recurring_commitments` | `id, description, amount, due_day, payment_method, recurrence_type, entity_id` |
| `empresa/page.tsx:39` | `profiles` | `id, role, household_id, name` (não precisa de todos os campos) |

---

### OPT 2 — Memoizar `Intl.NumberFormat` em vez de instanciar por chamada
**Ganho estimado: imperceptível em escala atual, mas é ruído desnecessário**

`fmt()` é declarada como função inline em TODOS os arquivos de página, criando uma nova instância de `Intl.NumberFormat` a cada chamada:

```ts
// Declarado em: dashboard, relatorios, empresa, lancamentos, contas, compromissos, FiscalNoteForm
function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}
```

**Solução:** Exportar um formatter singleton de `@/lib/fmt.ts`:

```ts
// lib/fmt.ts
const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmt = (n: number) => formatter.format(n);
```

Elimina 7 definições duplicadas + instanciação repetida. Impacto real: reduz bundle ligeiramente e evita alocações no render.

---

### OPT 3 — Dupla iteração sobre `rows` em `/compromissos`
**Ganho estimado: negligível em escala atual, mas é code smell**

**Arquivo:** `compromissos/page.tsx:144-158`

O `status` e o `isPaid` são calculados duas vezes para os commitments de cartão de crédito:

```ts
// Linha 148 — getStatus chama txDescriptions.some(...)
status: getStatus(c, isCredit),
// Linha 149–157 — isPaid recalcula txDescriptions.some(...) de novo
isPaid: isCredit
  ? txDescriptions.some(d => ...)
  : obligationByRecurringId.get(c.id)?.status === 'paid',
```

`getStatus` já retorna `'paid'` — `isPaid` poderia ser derivado de `status === 'paid'` em vez de recalcular o `.some()`.

---

### OPT 4 — Filtro de `q`/`min`/`max` em JS pós-fetch em `/lancamentos`
**Ganho estimado: elimina até 100% do trabalho em memória para usuários que filtram**

Já detalhado no CRÍTICO 2. Os três filtros podem migrar para o Supabase:

```ts
if (q) query = query.ilike('description', `%${q}%`);
if (min !== null) query = query.gte('amount', -max!).lte('amount', -min); // negativo para despesas
if (max !== null) { /* ajustar conforme sinal */ }
```

**Cuidado:** O sinal de `amount` precisa ser avaliado — o código usa `Math.abs(t.amount)` para comparar, então as despesas provavelmente são negativas no banco. Validar antes de migrar.

---

### OPT 5 — `gerarMeses()` recriado em cada render em múltiplas páginas
**Ganho estimado: imperceptível, mas é padrão ruim**

`gerarMeses()` é declarada em `/empresa`, `/compromissos`, `/lancamentos`, `/relatorios` — quatro vezes, com lógicas ligeiramente diferentes (12 meses, 18 meses). Por ser Server Component, é chamada a cada request. Deveria ser extraída para `@/lib/meses.ts` com parâmetro opcional de quantidade.

---

### OPT 6 — Promise.all em `/empresa`
**Ganho estimado: ~160ms de TTFB**
Já detalhado no CRÍTICO 3.

---

## Quick Wins de Performance

Ordenados por esforço (menor primeiro):

| # | Ação | Arquivo(s) | Esforço | Ganho |
|---|---|---|---|---|
| QW1 | Criar `lib/fmt.ts` com singleton `Intl.NumberFormat` e importar em todos os arquivos | 7 arquivos | 30min | Qualidade de código + bundle |
| QW2 | Criar `lib/meses.ts` e consolidar `gerarMeses()` | 4 arquivos | 30min | Elimina 4 duplicações |
| QW3 | Adicionar `.select('colunas específicas')` nas queries de `transactions` em dashboard e contas | `dashboard/page.tsx`, `contas/page.tsx` | 15min | 30–50% menos payload |
| QW4 | Adicionar filtro de data em `income_records` de `/relatorios` | `relatorios/page.tsx:66` | 5min | Evita overfetch histórico |
| QW5 | Passar `householdId` como prop para `FiscalNoteForm` e remover as 2 queries client-side | `empresa/page.tsx`, `FiscalNoteForm.tsx` | 20min | -2 requests no browser por upload |
| QW6 | Adicionar `.limit(50)` na query de transactions do dashboard (já mostra só 15) | `dashboard/page.tsx:26` | 5min | Limita overfetch |
| QW7 | Simplificar `isPaid` em `/compromissos` para derivar de `status === 'paid'` | `compromissos/page.tsx:149` | 10min | Remove dupla iteração |
| QW8 | Refatorar queries de `/empresa` para 2 rodadas de `Promise.all` | `empresa/page.tsx:52-107` | 45min | -160ms TTFB estimado |

---

## Core Web Vitals — Análise Estática

### LCP (Largest Contentful Paint)
O LCP candidato em cada tela é o primeiro elemento de texto grande acima do fold:

| Tela | Candidato LCP | Observação |
|---|---|---|
| `/dashboard` (admin) | `text-4xl` com total da fatura em `DashboardAdmin` | Renderizado no servidor — bom. Não há imagens pesadas. |
| `/dashboard` (operator) | `text-3xl` com "Sua parte a pagar" em `DashboardOperator` | Idem. |
| `/contas` | `text-4xl` com `totalFatura` | Server Component — LCP deve ser rápido. |
| `/lancamentos` | Header `text-xl` — conteúdo principal é a lista | Lista renderizada no servidor, sem lazy load — bom. |
| `/empresa` | `text-2xl` com valor do faturamento | 5 queries sequenciais = TTFB alto = LCP tardio. |
| `/compromissos` | Header `text-xl` com `mesLabel` | 3 queries (2 paralelas, 1 sequencial de txRows) — razoável. |
| `/relatorios` | Header `text-xl` — conteúdo abaixo do fold | Promise.all correto — TTFB bom. |

**Risco de LCP:** `/empresa` tem o pior TTFB por causa do waterfall de queries. Isso atrasa diretamente o LCP.

---

### CLS (Cumulative Layout Shift)

**Problemas identificados:**

1. **BottomNav sem animação de entrada do drawer "Mais":**
   O sheet `fixed bottom-0` aparece instantaneamente sem transição CSS. Dependendo do browser, isso pode causar reflow se o conteúdo abaixo do fold for recalculado.

2. **`<Suspense fallback={null}>`** em múltiplos lugares:
   - `empresa/page.tsx:194` — `FaturamentoForm` com `fallback={null}`
   - `empresa/page.tsx:204` — `FiscalNoteForm` com `fallback={null}`
   - `lancamentos/page.tsx:125` — `<Filtros>` com `fallback={null}`
   - `compromissos/page.tsx:196` — `<FiltroMes>` com `fallback={null}`

   `fallback={null}` significa que o espaço do componente não existe durante o loading — quando o componente hidrata e renderiza, ele **insere** altura na página. Isso causa CLS. O correto seria usar um skeleton com as dimensões reais do componente.

   **Estimativa de CLS:** 0.05–0.15 por `fallback={null}` em componente com altura significativa (filtros, forms). Acima do threshold de 0.1 recomendado pelo Google.

3. **`PersonCard` com mini progress bar:**
   O bar é renderizado no servidor com `Math.min(pct * 2.5, 100)%` de largura. Sem skeleton. Sem shift — OK.

---

### INP (Interaction to Next Paint)

**Interações com risco de INP alto:**

1. **`handleSave` em `FiscalNoteForm`:** Server Action que faz write no banco. Sem optimistic update. O botão "Salvar NF" fica `disabled` durante o save, mas não há feedback visual de progresso. Se o servidor demorar >200ms, o INP será medido como alto.

2. **`handleUpload` em `FiscalNoteForm`:** Upload direto para Supabase Storage no thread principal. Operação potencialmente lenta (rede + storage). O estado `uploading` existe, mas o upload bloqueia a UI de outras interações durante o processo? Não — é assíncrono. OK.

3. **Navegação por setas em `/empresa`:** São `<Link>` para nova URL. Cada clique causa full page reload (Server Component). Sem prefetch implícito porque os hrefs são condicionais (`prevMes ? mesHref(prevMes) : '#'`). Next.js não pré-busca links com `#`. O clique na seta dispara um novo request completo — perceptível como lentidão no mobile.

   **Solução parcial:** Usar `Link` com `prefetch={true}` explícito para os hrefs válidos.

4. **Filtros de `/lancamentos` via URL:** Cada mudança de filtro causa nova navegação (Server Component). Isso é correto para Server Components, mas o usuário percebe latência a cada filtro. Sem loading state visível entre filtros (a página atual permanece até o novo render).

---

## O que já está bom

1. **`Promise.all` no Dashboard:** As duas queries (transactions + income_records) estão corretas em paralelo. Economiza ~80ms por request.

2. **`Promise.all` em `/relatorios`:** As 4 queries são disparadas em paralelo. Padrão correto, bem executado.

3. **Server Components por padrão:** A maioria das páginas é Server Component. Zero JS de página enviado ao cliente além dos componentes marcados com `'use client'`. Bundle do cliente é mínimo.

4. **`BottomNav` como único Client Component global:** `usePathname` e `useRouter` isolados corretamente. Não contamina as páginas com `'use client'`.

5. **Sem imagens pesadas:** O app é text-only com gradientes CSS. LCP não é afetado por imagens não otimizadas.

6. **Filtros de data em queries do mês atual:** Dashboard, contas e empresa todos filtram corretamente por `gte/lt` de data, evitando scan completo da tabela.

7. **`select` específico em `/relatorios`:** As queries de transactions (`occurred_on, amount, responsible`) e income_records (`reference_month, kind, amount`) já têm colunas específicas — bom exemplo a ser replicado.

8. **`select` específico em `/empresa`:** As queries de transactions PJ, compromissos e obligations têm colunas explícitas bem definidas.

9. **`FiscalNoteForm` — cálculo de ISS em tempo real:** Feito inteiramente em JS no cliente, sem queries. Correto.

10. **Autenticação sequencial necessária:** `auth.getUser()` → `profiles.select()` é um waterfall inevitável — `user.id` é necessário para buscar o profile. Não é um bug.

---

## Resumo Executivo

**Os 3 problemas que mais impactam performance hoje:**

1. **`select('*')` em `transactions`** — tabela que cresce sem fim, payload desnecessário em 3 telas. Fix: 15 minutos, ganho imediato.

2. **Waterfall de 5 queries em `/empresa`** — ~160ms extras de TTFB em cada load. Fix: 45 minutos com Promise.all em 2 rodadas.

3. **`FiscalNoteForm` fazendo 2 queries no browser durante upload** — `household_id` já está no pai. Fix: 20 minutos passando como prop.

**`Suspense fallback={null}`** em 4 lugares é o maior risco de CLS. Cada componente que aparece sem placeholder de dimensão fixa vai shiftar o layout. Substituir por skeletons com altura estimada correta.

---

*Auditoria de Performance — Pedro · i2 Finance · 18/05/2026*
