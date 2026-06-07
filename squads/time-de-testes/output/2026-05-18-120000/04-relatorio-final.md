# Relatório QA — i2 Finance · 2026-05-18

**QA Lead:** Ana  
**Time:** Ana (código) · Diego (banco) · Carol (fluxos)  
**Veredicto:** 🔴 **BLOQUEADO — 5 P0s impedem o deploy**

---

## Resumo Executivo

| Severidade | Bugs |
|-----------|------|
| P0 Bloqueador | 5 |
| P1 Alto | 7 |
| P2 Médio | 8 |
| P3 Baixo / Cosmético | 7 |
| **Total** | **27** |

**Banco de dados:** 13/15 checks aprovados. 2 falhas de segurança a corrigir.  
**Casos de teste:** 47 verificados · 30 aprovados · 10 falhas · 7 parciais.

**Veredicto:** Não fazer deploy enquanto os 5 P0s não forem corrigidos. P1s devem entrar nas próximas 48h. O resto pode esperar o próximo sprint.

---

## Bloqueadores P0 — Corrigir ANTES do deploy

### P0-01 · Storage cross-tenant: qualquer autenticado acessa PDF de qualquer household

**Arquivo:** Supabase Dashboard → Storage → `fiscal-notes` → Policies  
**Impacto:** Usuário do household A consegue ler, sobrescrever ou deletar PDFs de NFs do household B se souber o path. Vazamento de dados financeiros entre clientes.

**Correção — SQL completo (executar via Supabase SQL Editor):**
```sql
DROP POLICY IF EXISTS "Authenticated can read own fiscal notes" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload fiscal notes" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update fiscal notes storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete fiscal notes storage" ON storage.objects;

CREATE POLICY "Users read own household fiscal notes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );

CREATE POLICY "Admin upload own household fiscal notes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND get_my_role() = 'admin'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );

CREATE POLICY "Admin update own household fiscal notes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND get_my_role() = 'admin'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );

CREATE POLICY "Admin delete own household fiscal notes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fiscal-notes'
    AND auth.role() = 'authenticated'
    AND get_my_role() = 'admin'
    AND (storage.foldername(name))[1] = (get_my_household_id())::text
  );
```

---

### P0-02 · BUG-001 · `mesFim` dia 31 fixo para todos os meses

**Arquivo:** `apps/web/src/app/relatorios/page.tsx` · Linha 47  
**Impacto:** Filtros de transações de fevereiro, abril, junho, setembro e novembro retornam dados incorretos. Dado financeiro errado na tela do admin.

**Correção:**
```ts
// ANTES (linha 47):
const mesFim = `${meses[0]}-31`;

// DEPOIS:
const [anoFim, mesFimNum] = meses[0]!.split('-').map(Number);
const ultimoDia = new Date(anoFim!, mesFimNum!, 0).getDate();
const mesFim = `${meses[0]}-${String(ultimoDia).padStart(2, '0')}`;
```

---

### P0-03 · BUG-002 · `incomeAll` busca todos os registros sem filtro de data

**Arquivo:** `apps/web/src/app/relatorios/page.tsx` · Linhas 64–68  
**Impacto:** Com dados históricos acumulados a query pode timeout. A página trava para households com histórico longo.

**Correção:**
```ts
// Adicionar antes do Promise.all, calcular mesInicio (já existe no código):
supabase
  .from('income_records')
  .select('reference_month, kind, amount')
  .eq('household_id', profile.household_id)
  .gte('reference_month', mesInicio)   // adicionar esta linha
  .limit(200),                          // adicionar esta linha
```

---

### P0-04 · BORDA-007 · Limit 100 em obrigações — total pendente subestimado

**Arquivo:** `apps/web/src/app/relatorios/page.tsx` · Linha ~74  
**Impacto:** Se a household tiver mais de 100 obrigações pendentes, o card "Total a pagar" exibe valor menor que o real. Decisão financeira baseada em dado errado.

**Correção — opção 1 (mais simples, suficiente para uso atual):**
```ts
// Remover o .limit(100) da query de obligationsAll
// ou aumentar para .limit(1000)
```
**Correção — opção 2 (correta a longo prazo):** criar RPC `sum_pending_obligations(household_id)` no Supabase que retorna apenas o SUM — sem trazer todos os registros.

---

### P0-05 · LOADING-002 · Botão Salvar não bloqueia durante upload em andamento

**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx` · Linha 377  
**Impacto:** Usuário inicia upload de PDF e clica "Salvar NF" antes do upload terminar. A NF é salva no banco sem `file_url`. O arquivo existe no Storage mas fica inacessível pela UI.

**Correção:**
```ts
// ANTES (linha 377):
disabled={saving || !nfNumber || !nfAmount || !nfDate}

// DEPOIS:
disabled={saving || uploadProgress === 'uploading' || !nfNumber || !nfAmount || !nfDate}
```

---

## Alta Prioridade P1 — 48h

### P1-01 · QUERY-002 · `actionExcluirFaturamento` retorna `ok: true` mesmo com erro no delete

**Arquivo:** `apps/web/src/app/empresa/actions.ts` · Linhas 145–146  
**Fix:**
```ts
const { error } = await supabase.from('income_records').delete()
  .eq('id', id).eq('household_id', profile.household_id);
if (error) return { ok: false as const, error: error.message };
```

---

### P1-02 · BUG-004 · `handleDelete` em `FiscalNoteForm` ignora retorno de `actionExcluirNF`

**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx` · Linhas 134–141  
**Fix:**
```ts
async function handleDelete() {
  if (!existingNote) return;
  setDeleting(true);
  const result = await actionExcluirNF(existingNote.id);
  setDeleting(false);
  if (!result.ok) {
    setError(result.error ?? 'Erro ao excluir.');
    setConfirmDelete(false);
    return;
  }
  setConfirmDelete(false);
  setOpen(false);
}
```

---

### P1-03 · QUERY-003 · `createSignedUrl` sem verificação de erro — arquivo sobe mas URL não é salva

**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx` · Linhas 83–90  
**Fix:**
```ts
const { data: signed, error: signErr } = await db.storage
  .from('fiscal-notes')
  .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

if (signErr || !signed?.signedUrl) {
  setError('Arquivo enviado, mas não foi possível gerar o link. Tente novamente.');
  setUploadProgress('idle');
  return;
}
setFileUrl(signed.signedUrl);
```

---

### P1-04 · QUERY-004 · Upload trava em "Enviando..." infinito se `getUser` ou `profile` falhar

**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx` · Linhas 64–69  
**Fix:** Adicionar `setUploadProgress('idle')` e `setError(...)` em todos os `return` antecipados dentro de `handleUpload`, especialmente após `if (!user) return` e `if (!profile) return`.

---

### P1-05 · BUG-005 · `fmtDate` em `notas/page.tsx` quebra com `nf_issued_at` nulo

**Arquivo:** `apps/web/src/app/empresa/notas/page.tsx` · Linhas 12–15  
**Fix:**
```ts
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}
```

---

### P1-06 · QUERY-001 · 4 queries em `/relatorios` ignoram campo `error` — página silencia falhas

**Arquivo:** `apps/web/src/app/relatorios/page.tsx` · Linhas 50–85  
**Fix:**
```ts
const [txResult, incomeResult, obligationsResult, compromissosResult] = await Promise.all([...]);
if (txResult.error || incomeResult.error || obligationsResult.error) {
  throw new Error('Erro ao carregar dados de relatórios.');
}
const txAll = txResult.data;
const incomeAll = incomeResult.data;
const obligationsAll = obligationsResult.data;
```

---

### P1-07 · TYPE-003 · `compromissosAll` buscado mas nunca usado — query desnecessária

**Arquivo:** `apps/web/src/app/relatorios/page.tsx` · Linhas 53, 83–85  
**Fix:** Remover a query de `recurring_commitments` do `Promise.all`. Economiza uma chamada ao banco em toda visita a `/relatorios`.

---

## Média Prioridade P2 — Próximo sprint

| ID | Arquivo | Descrição | Fix |
|----|---------|-----------|-----|
| P2-01 · BORDA-001 | `relatorios/page.tsx` L.19-25 | `gerarMeses` usa `toISOString()` — pode gerar mês errado em UTC-3 às 21h do dia 31 | Construir string manual: `` `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` `` |
| P2-02 · BORDA-002 | `relatorios/page.tsx` L.377 | Label de mês em Contas a Receber sem `timeZone: 'UTC'` — exibe mês anterior em UTC-3 | Adicionar `timeZone: 'UTC'` em todos os `toLocaleString` que recebem strings de data do banco |
| P2-03 · BORDA-003 | `FiscalNoteForm.tsx` L.302-308 | Upload sem validação de tamanho e MIME type real | Validar `f.size > 10MB` e `allowedTypes.includes(f.type)` antes de chamar `handleUpload` |
| P2-04 · BUG-006 | `notas/page.tsx` L.44 | `nfMap` perde segunda NF se houver duplicata por `income_record_id` | Adicionar constraint `UNIQUE` em `fiscal_notes.income_record_id` via migration |
| P2-05 · BUG-007 | `FiscalNoteForm.tsx` L.44 | `uploadProgress` não reseta ao fechar e reabrir o form | `setUploadProgress('idle')` no handler de cancelar/fechar |
| P2-06 · TYPE-005 | `login/page.tsx` L.20 | `'is invalid'` match muito genérico em `traduzirErro` | Usar `'token is invalid'` e `'otp has expired'` em vez de `'is invalid'` |
| P2-07 · LOADING-005 | Múltiplos `loading.tsx` | Skeletons de dashboard, lancamentos, compromissos, contas, importar sem `md:pl-60` — CLS no desktop | Adicionar `md:pl-60` nos 5 skeletons |
| P2-08 · SEC-P2 | Supabase — `fiscal_notes` policy | Policy UPDATE sem `WITH CHECK` — admin pode mover NF para outro household | Recriar policy com `WITH CHECK (household_id = get_my_household_id() AND get_my_role() = 'admin')` |

---

## Aprovado

As seguintes features estão OK para deploy (nenhuma ação necessária):

| Área | O que está correto |
|------|-------------------|
| Autenticação e role | Todas as pages e actions verificam `user` e `role === 'admin'` consistentemente |
| `actionSalvarNF` | Upsert insert/update com isolamento duplo: filtro no action + policy RLS |
| Upload Storage | `upsert: true` + path com `Date.now()` evita duplicidade |
| `actionExcluirNF` | Limpa arquivo do Storage antes de deletar o registro — sem orphans |
| Confirmação de exclusão | Duplo clique (confirm) antes de deletar — boa UX |
| Sidebar / BottomNav | Separação admin vs operator correta; drawer "Mais" funcional |
| Login — mensagens PT | `traduzirErro` cobre 12 casos; fluxo "Esqueci senha" completo |
| `revalidatePath` | Todas as mutations invalidam cache corretamente |
| Banco — estrutura | 13/15 checks aprovados: schema, FKs cascade, indexes, RLS, integridade referencial |

---

## Segurança

| # | Severidade | Problema | Status |
|---|-----------|---------|--------|
| SEC-01 | **P0** | Storage `fiscal-notes`: policies sem `household_id` — cross-tenant leak | Corrigir com SQL do P0-01 acima |
| SEC-02 | **P2** | `fiscal_notes` UPDATE policy sem `WITH CHECK` — admin pode mover NF cross-tenant | SQL em P2-08 |
| SEC-03 | OK | Operator bloqueado de INSERT em `fiscal_notes` via RLS | Aprovado |
| SEC-04 | OK | `actionSalvarNF` UPDATE com `.eq('household_id', profile.household_id)` | Aprovado |

---

## Ordem de Correção Recomendada

Execute nesta ordem — cada etapa desbloqueia a próxima:

| Ordem | ID | O que fazer | Estimativa |
|-------|----|-------------|-----------|
| 1 | P0-01 | SQL das Storage policies no Supabase Dashboard | 10 min |
| 2 | P0-05 | `disabled` no botão Salvar — 1 linha | 2 min |
| 3 | P0-02 | Fix `mesFim` — 3 linhas substituindo 1 | 5 min |
| 4 | P0-03 | Adicionar `.gte()` e `.limit(200)` em `incomeAll` | 5 min |
| 5 | P0-04 | Remover `.limit(100)` de `obligationsAll` | 2 min |
| 6 | P1-02 | `handleDelete` verificar retorno — 8 linhas | 5 min |
| 7 | P1-01 | `actionExcluirFaturamento` capturar `error` | 5 min |
| 8 | P1-03 | `createSignedUrl` verificar `signErr` | 5 min |
| 9 | P1-04 | `handleUpload` retornos antecipados com `setError` | 10 min |
| 10 | P1-05 | `fmtDate` com guard para null | 5 min |
| 11 | P1-06 | `relatorios/page.tsx` verificar erros das 4 queries | 10 min |
| 12 | P1-07 | Remover query `compromissosAll` do Promise.all | 3 min |
| — | Sprint | P2-01 a P2-08 (fuso, validação upload, UNIQUE constraint, etc.) | 3–4h |

**Total estimado para liberar deploy: ~1h de código + 10 min de SQL no Supabase.**

---

## Testes Manuais Pendentes

Os itens abaixo precisam de browser real para validar — análise estática não é suficiente:

| # | O que testar | Como reproduzir | Por quê requer browser |
|---|-------------|-----------------|------------------------|
| M-01 | Fuso horário em `gerarMeses` (BORDA-001) | Abrir /relatorios às 21h+ de qualquer dia 31 com browser em UTC-3 | Comportamento depende do horário real do sistema |
| M-02 | Label de mês errado em Contas a Receber (BORDA-002) | Verificar aba "Contas a Receber" em qualquer horário em UTC-3 | Parsing de `new Date('YYYY-MM-01')` como UTC midnight |
| M-03 | Upload de arquivo não-PDF via drag-and-drop (BORDA-003) | Arrastar um `.exe` ou `.docx` para o campo de upload | Attribute `accept` só bloqueia via picker, não drag-and-drop |
| M-04 | Mensagem de link expirado em contexto errado (TYPE-005) | Tentar login com senha errada que contenha a substring "is invalid" no erro | Match de substring genérica em erro de autenticação |
| M-05 | Layout do operator em desktop sem `md:pl-60` (BUG-009) | Login como operator + viewport >= 768px | Impacto visual depende de resolução real |
| M-06 | CLS no skeleton de /relatorios (LOADING-004) | Abrir /relatorios em conexão lenta (DevTools → Slow 3G) | Requer ver a transição skeleton → conteúdo em tempo real |
| M-07 | Storage cross-tenant após aplicar fix SEC-01 | Criar 2 households, tentar acessar URL do PDF do household A logado como household B | Confirmar que o SQL das policies está bloqueando corretamente |

---

*Relatório consolidado por Ana — QA Lead, i2 Finance | 2026-05-18*  
*Fontes: 01-analise-codigo.md (Ana) · 02-validacao-banco.md (Diego) · 03-casos-de-teste.md (Carol)*
