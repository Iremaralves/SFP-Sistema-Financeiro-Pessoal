# Squad Memory — time-de-testes

## Estilo de Escrita
- Relatórios diretos e acionáveis — Iremar é dev solo, cada linha deve gerar ação clara
- Bugs com código de correção pronto para copiar

## Design Visual

## Estrutura de Conteúdo
- Relatório final sempre com seções: P0/P1/P2/P3 + Aprovado + Segurança + Ordem de Correção

## Proibições Explícitas

## Técnico (específico do squad)
- Stack: Next.js 15 App Router · Supabase · Tailwind v4 · pnpm monorepo
- Auth: Supabase signInWithPassword · Roles: admin (Iremar) / operator (Juliana)
- **Iremar** (admin): empresa i2 Soluções, faturamento, NFs, relatórios, fechamento mensal, contas pessoais
- **Juliana** (operator): importa CSV do cartão, categoriza lançamentos, visualiza parte dela — não remover Importar da nav
- Supabase project: jvfdzcouychlfxxnzams
- Storage bucket `fiscal-notes`: policies devem usar `(storage.foldername(name))[1] = get_my_household_id()::text`
- `mesFim` em relatorios: nunca hardcodar dia 31 — usar `new Date(year, month, 0).getDate()` ou similar
- Queries grandes: sempre filtro de data + limit razoável (nunca sem restrição)
- Actions: sempre verificar `error` do Supabase antes de retornar `{ ok: true }`
- Botões de submit: desabilitar durante upload de arquivo para evitar race condition
- fiscal_notes UPDATE policy: precisa de `WITH CHECK` além do `USING`
- Run 2026-05-17: App liberado para Beta ✅ (3 bugs médios/baixos — features originais)
- Run 2026-05-18: BLOQUEADO 🔴 — 5 P0s nas novas features (relatorios, notas fiscais, storage policies)
  - 47 casos de teste: 30 ✅ aprovados, 10 ❌ falhos, 7 ⚠️ parciais
  - Tempo estimado de correção: ~1h código + 10min SQL Supabase

## Lições de campo — feedback Iremar 2026-05-19 (uso real)
**Bugs encontrados em produção que os testes anteriores deixaram passar:**
1. Truncação excessiva de descrição de transactions (UX) — incluir teste de "consigo identificar a transação?"
2. **Falta de paridade Admin × Operator** — mudanças no DashboardAdmin não replicaram no DashboardOperator. Adicionar regra: SEMPRE testar nos 2 logins.
3. Link `/importar` sumiu da nav do Iremar — testar acesso a TODAS as rotas em cada role
4. /contas mostra valores diferentes do /dashboard — adicionar teste de consistência entre páginas
5. Settlement no operator usava calculateSettlement (mês calendário) em vez de calculateInvoiceSettlement (ciclo) — testar settle em ambos dashboards
6. "Dar baixa" não permite editar valor/data antes — bugs estavam em testes não-cobertos
7. Acerto e Fechamento (mes) só estão para admin — operator também precisa

**Casos de teste obrigatórios novos:**
- TC#A: Abrir cada rota nos 2 logins (admin + operator) e verificar UI esperada
- TC#B: Comparar valor "Total fatura" do dashboard com soma exibida na /contas
- TC#C: Categorizar uma transação como Iremar → verificar settlement em ambos dashboards
- TC#D: Dar baixa em conta fixa → verificar se abre dialog de edição

## 🚨 LIÇÃO DURA — 2026-05-20 (squad falhou 3 vezes seguidas)
**O que o squad NÃO pegou (e o usuário pegou):**
1. Botão "Importar" no Drive — após clicar, file fica como "NOVO" mesmo já tendo importado. Causa: faltava `router.refresh()` após a action
2. Fluxo de categorização desconectado — após importar, usuário fica perdido na mesma tela. Falta CTA "Ir categorizar agora →"
3. Server actions tinham guards `role !== 'admin'` que silenciosamente redirecionavam — nunca testamos AÇÃO real do operator
4. `Sidebar` retornava `null` para operator, mas pages tinham `md:pl-60` → buraco visual no desktop dela
5. `/mes` actions: erro silencioso pra operator com botões visíveis

## ✅ REGRAS NOVAS PARA O SQUAD
Toda run do time-de-testes DEVE:
1. **Simular fluxo end-to-end completo** (não só ler código): clique → action → ver resultado → ver se router atualizou
2. **Testar TODAS as server actions** (não só páginas) com cada role
3. **Verificar `router.refresh()` após qualquer action que muda dados** — sem isso UI fica stale
4. **Confirmar CTA visível** — após ação importante (importar/pagar/transferir), o "próximo passo" deve estar OBVIO na tela
5. **Conferir paridade Sidebar/BottomNav** — operator também precisa de Sidebar quando o layout usa `md:pl-60`
6. **Nunca confiar em "read code"** — Carol (tester) deve descrever o fluxo COMO USUÁRIO clicando, não como dev lendo arquivo

## ⚠️ Regras vindas do squad i2-e2e-tester (2026-05-20)
O squad i2-e2e-tester rodou 20 cenários (10 admin + 10 operator) e encontrou
8 bugs distintos que esta squad havia deixado passar. Causa raiz comum:
auditar **existência** em vez de **comportamento**. Regras concretas:

1. **Sidebar sobrepondo conteúdo (md:pl-60).** Toda page com `BottomNav`
   sendo renderizado em desktop DEVE ter `md:pl-60` no wrapper raiz, porque
   Sidebar é `fixed w-60`. Checklist: abrir cada page no viewport ≥768px e
   confirmar que primeiro elemento do header NÃO está sob o Sidebar.
   Pages afetadas neste run: `/mes`, `/lancamentos/[id]`.

2. **revalidatePath precisa cobrir TODAS as rotas que consomem o dado, não
   só a rota da action.** Quando `actionDarBaixa` revalida só
   `/compromissos` mas o dashboard também mostra BillsCard, o dashboard
   serve cache stale. Checklist: pra cada server action, listar TODAS as
   pages que consomem a tabela mutada e revalidar cada uma.

3. **Role guard com redirect silencioso é bug.** `redirect('/dashboard')`
   sem mensagem deixa o operator confuso. Padrão correto: query param
   `?msg=acesso-restrito` + toast no destino, OU página dedicada de
   "acesso negado". Auditar TODAS as occurrences de `role !== 'admin')
   redirect(...)` e validar que existe feedback visual no destino.

4. **Strings hardcoded envelhecem.** Mensagens como "use o CLI para
   categorizar" passaram batido porque a auditoria foi de lógica.
   Checklist novo: ao final de cada run, fazer grep de palavras como
   "CLI", "TODO", "FIX", nomes de features antigas e validar coerência
   com o estado atual do produto.

5. **Props opcionais com default ruim = bug visual.** `<BottomNav
   role={...} />` sem `name=` faz o Sidebar mostrar "" como nome.
   TypeScript não acusa. Regra: pra props opcionais com impacto em UI
   (name, accent, etc), inspecionar em runtime se TODA chamada está
   passando valor real. Considerar tornar `name` obrigatório.

6. **Paridade de tema entre roles.** Sidebar.tsx hardcoda `#3b82f6/#60a5fa`
   (azul admin) para os dois roles, enquanto o DashboardOperator é todo
   rosa. Regra: qualquer cor de "active state" / "accent" em componente
   compartilhado deve derivar de `role` (azul admin / rosa operator).


1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

