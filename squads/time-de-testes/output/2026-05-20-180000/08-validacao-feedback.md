# Validação 5 fixes — 2026-05-20

## Resumo executivo
- **Veredito:** 🟡 (4 fixes 100% OK; Fix 3 com brecha leve)
- **Aprovados:** 4 / 5 (Fix 3 parcial — guards de página OK, mas server actions ainda travam operator)
- Banco: 100% OK (tabela `transaction_attachments` com 12 colunas, RLS ativo, bucket `tx-attachments` configurado com 3 policies e MIMEs corretos; bucket `backups` preservado)
- Build: nenhum import quebrado detectado

## Por fix

### Fix 1 — Layout Juliana (DashboardOperator) · ✅
- **Evidência:** `apps/web/src/components/DashboardOperator.tsx:45` — header com `px-5 md:px-8 pt-14 md:pt-8 pb-6 ... page-container`
- **Evidência:** linha 50-52 — badge `operator` em rosa (paridade com badge `admin` do DashboardAdmin)
- **Evidência:** linha 59 — `px-4 md:px-8 pb-28 md:pb-12 ... page-container fade-up-stagger`
- **Observação:** sem useEffect → zero risco de loop. Hero responsivo (`md:p-7`, `md:text-5xl`) OK.

### Fix 2 — Sidebar para Operator · ✅
- **Evidência:** `apps/web/src/components/Sidebar.tsx:20-30` — array `NAV_ITEMS_OPERATOR` com 9 itens (Início, Lançamentos, Categorizar, Importar CSV, Compromissos, Contas, Acerto, Fechamento, Relatórios)
- **Evidência:** linha 34 — `role === 'admin' ? NAV_ITEMS_ADMIN : NAV_ITEMS_OPERATOR` (não retorna `null` mais)
- **Observação:** Operator NÃO vê Empresa, Transferências nem Backups na sidebar — alinhado com role guards.

### Fix 3 — Role guards removidos · 🟡 (parcial)
- **Página `/compromissos`** ✅ — `compromissos/page.tsx:1-40` sem guard de role (só checa user)
- **Página `/relatorios`** ✅ — `relatorios/page.tsx:35-40` sem guard de role
- **`actionImportarDrive`** ✅ — `importar/actions.ts:151-178` sem guard de role; comentário linha 158 confirma "Operator (Juliana) também importa"
- **🚨 Server actions de compromissos ainda travam operator:**
  - `compromissos/actions.ts:96` — `actionDesfazerBaixa` redireciona se role !== admin
  - `compromissos/actions.ts:120` — `actionExcluirCompromisso` redireciona se role !== admin
  - Consequência: Juliana abre /compromissos OK, mas se tentar desfazer baixa ou excluir compromisso → vai pra /dashboard sem feedback. **Provável intencional**, mas precisa decisão do produto.

### Fix 4 — Importar (Verificar agora + ocultar) · ✅
- **Evidência:** `ImportClient.tsx:38-44` — `handleRefresh` chama `router.refresh()`
- **Evidência:** linhas 127-140 — botão `🔄 Verificar agora` no header do card Drive, com spin durante refresh
- **Evidência:** linhas 35-36 — separação `pendingFiles` / `importedFiles`
- **Evidência:** linhas 203-226 — toggle colapsável "▸ X já importado(s)" / "▾ ocultar"

### Fix 5 — Anexos em transactions · ✅
- **Tabela `transaction_attachments`:** 12 colunas confirmadas via SQL (`id, household_id, transaction_id, file_name, file_path, file_url, mime_type, size_bytes, kind, notes, uploaded_by, created_at`). RLS ativo (`relrowsecurity=true`).
- **Bucket `tx-attachments`:** private, MIMEs = `application/pdf, image/jpeg, image/png, image/heic` (✓ bate com requisito)
- **Bucket `backups`:** preservado (private, `application/json`)
- **Policies storage:** 3 confirmadas — `tx_attachments: read own household` (SELECT), `upload own household` (INSERT), `delete own household` (DELETE)
- **Componente:** `apps/web/src/components/TxAttachments.tsx` (197 linhas) — usa kind selector (nf/comprovante/recibo/outro), upload com path `{household}/{tx}/{ts}-{file}`, signed URL 5 anos, delete dupla (storage + DB)
- **Integração:** `apps/web/src/app/lancamentos/[id]/page.tsx:6, 85, 337` — import + query `transaction_attachments` + render

## 🚨 Bugs encontrados

1. **(P2) Server actions de /compromissos travam Juliana silenciosamente** — `compromissos/actions.ts:96, 120`. Se foi intenção que ela só visualize, mostrar UI bloqueada (botões desabilitados quando `role==='operator'`) em vez de redirect silencioso.
2. **(P3) `mes/actions.ts:12, 42`** lança `throw new Error('Sem permissão')` para operator — mas /mes está na sidebar do operator (item "Fechamento", linha 28 da Sidebar). Operator vê a página mas qualquer ação dispara erro. **Inconsistência sidebar × action.**
3. **(P3) `relatorios/page.tsx` importa `BarChart`** de `@/components/charts/BarChart` — confirmar que o diretório `components/charts/` (untracked no git status) está commitado, senão build do Vercel quebra.

## 📋 Casos de teste a executar manualmente

- **TC1** — Juliana abre `/compromissos` → vê filtros + lista; checar que aparecem Plano saúde, Apartamento, Feira (filtrar por `paid_by = juliana`)
- **TC2** — Juliana abre `/relatorios` → tab Fluxo carrega `BarChart` sem erro de hidratação
- **TC3** — Juliana abre `/importar` → clica `🔄 Verificar agora` → spinner gira ~800ms → lista re-renderiza; expandir "▸ X já importados"
- **TC4** — Iremar abre `/lancamentos/<id-faturamento>` → seção "📎 Anexos" → seleciona kind "Nota Fiscal" → anexa PDF; depois clica "Ver" (deve abrir signed URL em aba nova) e 🗑️ (deve sumir da lista e do storage)
- **TC5** — Operator: confirmar que Backups **NÃO aparece** na sidebar (linhas 20-30 não incluem `/backups`); se digitar `/backups` na URL, redirect para `/dashboard` (backups/page.tsx:33 ✓)
- **TC6 (novo)** — Operator no Fechamento (`/mes`) → tentar qualquer botão → deve falhar com `Sem permissão`. Decidir: ocultar página da sidebar ou abrir ação para operator.
- **TC7 (novo)** — Anexar arquivo `.docx` (MIME não permitido) → deve falhar no storage com mensagem do bucket
- **TC8 (novo)** — Logar como Juliana e tentar `actionDesfazerBaixa` via UI → confirmar comportamento (silencioso ou bloqueado)
