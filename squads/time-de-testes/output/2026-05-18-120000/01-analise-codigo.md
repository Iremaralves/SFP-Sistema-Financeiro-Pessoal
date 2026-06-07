# Relatório de Análise Estática de Código — i2 Finance
**QA Lead:** Ana  
**Data:** 2026-05-18  
**Sprint:** Features implementadas a partir de 2026-05-17  
**Arquivos analisados:** 15 arquivos (pages, components, actions, skeletons, login)

---

## 1. Bugs Encontrados

### BUG-001 — `mesFim` usa dia 31 fixo para todos os meses
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linha:** 47  
**Severidade:** ALTO  
**Descrição:**
```ts
const mesFim = `${meses[0]}-31`;
```
O código assume que todos os meses têm 31 dias. Meses como fevereiro (28/29 dias), abril, junho, setembro e novembro (30 dias) causarão um filtro incorreto no Supabase. Para um mês como `2026-02`, o filtro `.lte('occurred_on', '2026-02-31')` retornará dados, mas a string de data `2026-02-31` é inválida — dependendo de como o Supabase/PostgreSQL interpreta, pode silenciosamente truncar ou retornar resultados inesperados.

**Correção sugerida:**
```ts
// Calcular o último dia do mês mais recente corretamente
const [anoFim, mesFimNum] = meses[0]!.split('-').map(Number);
const ultimoDia = new Date(anoFim!, mesFimNum!, 0).getDate(); // dia 0 do próximo mês = último do mês atual
const mesFim = `${meses[0]}-${String(ultimoDia).padStart(2, '0')}`;
```

---

### BUG-002 — `incomeAll` busca sem filtro de período (performance + dados incorretos)
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linhas:** 64–68  
**Severidade:** ALTO  
**Descrição:**
```ts
supabase
  .from('income_records')
  .select('reference_month, kind, amount')
  .eq('household_id', profile.household_id),
  // SEM .gte() nem .lte() nem .limit()
```
A query busca **todos** os `income_records` da household sem nenhum filtro de data e sem `limit`. Se a household tiver anos de dados, isso pode retornar centenas ou milhares de registros desnecessariamente. O fluxo de caixa só precisa dos últimos 12 meses; a aba "Receber" só olha os próximos 3 meses; e o histórico usa `.slice(0, 6)`. A ausência de filtro impacta diretamente a performance da página e pode causar timeout.

**Correção sugerida:**
```ts
supabase
  .from('income_records')
  .select('reference_month, kind, amount')
  .eq('household_id', profile.household_id)
  .gte('reference_month', mesInicio)
  .limit(200),
```

---

### BUG-003 — Signed URL expira em 10 anos mas não é renovada no update
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linhas:** 83–90  
**Severidade:** MÉDIO  
**Descrição:**
```ts
const { data: signed } = await db.storage
  .from('fiscal-notes')
  .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

setFileUrl(signed?.signedUrl ?? '');
```
O cálculo de 10 anos em segundos é: `60 * 60 * 24 * 365 * 10 = 315.360.000`. Dependendo do limite máximo do Supabase Storage para signed URLs (que pode ser menor), esta URL pode ser criada com duração reduzida silenciosamente. Além disso, ao editar uma NF já existente e não trocar o PDF, o `fileUrl` no state é inicializado com a URL assinada antiga (linha 56), que pode estar próxima de expirar se foi gerada há muito tempo. Quando o form é salvo sem novo upload, a `file_url` antiga (potencialmente expirada) é reenviada ao banco sem renovação.

**Correção sugerida:** Verificar o limite real do Supabase. Considerar usar `getPublicUrl` se o bucket for público, ou renovar a signed URL no momento de exibição.

---

### BUG-004 — `handleDelete` ignora o retorno de `actionExcluirNF`
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linhas:** 134–141  
**Severidade:** MÉDIO  
**Descrição:**
```ts
async function handleDelete() {
  if (!existingNote) return;
  setDeleting(true);
  await actionExcluirNF(existingNote.id);  // retorno ignorado
  setDeleting(false);
  setConfirmDelete(false);
  setOpen(false);
}
```
A Server Action `actionExcluirNF` retorna `{ ok: false, error: string }` em caso de erro. O `handleDelete` não verifica esse retorno. Se a exclusão falhar no banco (ex.: erro de RLS, conexão), o form fecha normalmente, o usuário acredita que a NF foi excluída, mas ela permanece no banco. Na próxima visita, a NF reaparece — comportamento confuso e sem feedback de erro.

**Correção sugerida:**
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

### BUG-005 — `fmtDate` em `notas/page.tsx` não protege contra string inválida
**Arquivo:** `apps/web/src/app/empresa/notas/page.tsx`  
**Linhas:** 12–15  
**Severidade:** MÉDIO  
**Descrição:**
```ts
function fmtDate(s: string) {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}
```
A função é chamada em `fmtDate(nf.nf_issued_at)` (linha 113). O campo `nf_issued_at` vem do banco sem garantia de formato. Se o valor for `null`, `undefined` ou uma string vazia (por inserção manual ou dado legado), o `.split('-')` vai retornar `['']`, resultando em `undefined/undefined/undefined` sendo renderizado na UI. Não há proteção nem fallback.

**Correção sugerida:**
```ts
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s; // fallback: retorna original
  return `${d}/${m}/${y}`;
}
```

---

### BUG-006 — `nfMap` assume um-para-um, múltiplas NFs por income_record são silenciosamente ignoradas
**Arquivo:** `apps/web/src/app/empresa/notas/page.tsx`  
**Linha:** 44  
**Severidade:** MÉDIO  
**Descrição:**
```ts
const nfMap = new Map((fiscalNotes ?? []).map(n => [n.income_record_id, n]));
```
O `Map` usa `income_record_id` como chave. Se por qualquer razão (bug anterior, inserção manual no banco, race condition no save) existirem duas NFs com o mesmo `income_record_id`, apenas a última do array será mantida no Map. As demais NFs serão silenciosamente descartadas da UI sem nenhum aviso.

**Correção sugerida:** Adicionar constraint `UNIQUE` em `fiscal_notes.income_record_id` no banco, ou mudar o Map para `Map<string, FiscalNote[]>` e tratar múltiplas NFs na UI.

---

### BUG-007 — `uploadProgress` não reseta ao fechar e reabrir o form
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linhas:** 44, 130–131  
**Severidade:** BAIXO  
**Descrição:**
O estado `uploadProgress` é inicializado como `'idle'` mas não é resetado quando o usuário clica em "Cancelar" e reabre o form. Se o usuário fez upload, cancelou e reabriu, o botão mostrará "✓ PDF enviado" mesmo sem nenhum arquivo novo ter sido selecionado nessa sessão (o estado sobreviveu ao toggle `open`). Isso ocorre porque `open` é um state no mesmo componente — fechar o form não destrói o componente, apenas condiciona a renderização.

**Correção sugerida:** Resetar `uploadProgress` para `'idle'` no handler de cancelar/fechar, junto com a limpeza de outros estados temporários.

---

### BUG-008 — Sidebar: `pathname.startsWith(item.href + '/')` não cobre rota exata de sub-páginas com query string
**Arquivo:** `apps/web/src/components/Sidebar.tsx`  
**Linhas:** 51–53  
**Severidade:** BAIXO  
**Descrição:**
```ts
const isActive =
  pathname === item.href ||
  (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
```
A lógica de ativo está correta para sub-rotas. Porém, `/empresa/notas` ativa tanto o item `/empresa` quanto `/empresa/notas` não existe no `NAV_ITEMS` da Sidebar — o usuário que navega para `/empresa/notas` verá "Empresa" como ativo, o que é aceitável. O problema real: `/relatorios?tab=pagar` — o `pathname` do Next.js 15 **não inclui** query params, então isso funciona corretamente. Sem bug funcional neste caso, mas a lógica `startsWith(href + '/')` falharia se o href fosse `/contas` e a rota fosse `/contasbancarias` (coincidência de prefixo). Com os hrefs atuais isso não ocorre, mas é um risco latente.

**Severidade revisada:** BAIXO (risco futuro, não bug ativo).

---

### BUG-009 — BottomNav: operador tem `/importar` na nav mas Sidebar (admin-only) não renderiza para operador, sem md:pl-60
**Arquivo:** `apps/web/src/components/BottomNav.tsx`  
**Linhas:** 16–22 + lógica de renderização  
**Severidade:** BAIXO  
**Descrição:**
O `BottomNav` renderiza a `Sidebar` internamente (`<Sidebar role={role} name={name} />`). A `Sidebar` retorna `null` para operadores (linha 19 de Sidebar.tsx). Logo, as páginas que o operador acessa (`/importar`, `/lancamentos`, etc.) não têm `md:pl-60` no layout da página, pois esse padding foi aplicado nas pages individuais assumindo a presença da sidebar. Isso não é um crash, mas em telas `md+` o conteúdo do operador ficará colado à borda esquerda enquanto o admin tem recuo de 240px. Verificar se todas as pages com `md:pl-60` são admin-only.

---

## 2. Condições de Borda Não Tratadas

### BORDA-001 — `gerarMeses` retorna meses no fuso local; datas do banco podem ser UTC
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linhas:** 19–25, 94–95  
**Descrição:**
```ts
const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
return d.toISOString().slice(0, 7);
```
`new Date(y, m, 1).toISOString()` converte para UTC. Se o servidor Next.js estiver em UTC-3 (Brasil), às 21h do dia 31 de dezembro, `new Date()` local retorna dezembro mas `toISOString()` retorna janeiro do ano seguinte — gerando um mês errado no array `meses`. O filtro de transações pode perder o último mês ou incluir um mês futuro inexistente.

**Correção sugerida:** Construir o string de mês manualmente sem depender de `toISOString()`:
```ts
const y = hoje.getFullYear();
const m = hoje.getMonth() - i;
const d = new Date(y, m, 1);
return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
```

---

### BORDA-002 — `receber` em Contas a Receber usa `new Date(row.mes + '-01')` sem timeZone
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linha:** 377  
**Descrição:**
```ts
const label = capitalize(new Date(row.mes + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
```
`new Date('2026-06-01')` é parsed como UTC midnight. Em browsers com fuso UTC-3, isso resulta em `2026-05-31 21:00` local — o mês exibido pode ser o mês anterior ao esperado. Na linha 427 (histórico), corretamente usa `timeZone: 'UTC'`, mas nas linhas 377 e 83 de `notas/page.tsx` não usa. Inconsistência que gera label de mês errado para usuários no fuso de Brasília.

**Correção sugerida:** Adicionar `timeZone: 'UTC'` em todos os `toLocaleString` que recebem strings de data do banco.

---

### BORDA-003 — Upload de arquivo sem validação de tamanho ou tipo real
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linhas:** 302–308  
**Descrição:**
O input aceita `application/pdf,image/jpeg,image/png` pelo atributo `accept`, mas isso é apenas uma sugestão ao browser — qualquer arquivo pode ser enviado via drag-and-drop ou manipulação. Não há validação do tamanho do arquivo antes do upload, nem verificação do MIME type real do arquivo. Um arquivo de 500MB será enviado ao Supabase Storage sem aviso, podendo causar timeout ou erro de quota.

**Correção sugerida:**
```ts
onChange={e => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (f.size > 10 * 1024 * 1024) { // 10MB
    setError('Arquivo muito grande. Máximo: 10MB.');
    return;
  }
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(f.type)) {
    setError('Formato inválido. Aceitos: PDF, JPG, PNG.');
    return;
  }
  handleUpload(f);
}}
```

---

### BORDA-004 — `nfNumber` vazio no path do arquivo no Storage
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linha:** 71  
**Descrição:**
```ts
const path = `${profile.household_id}/${incomeRecordId}/${nfNumber || 'nf'}_${Date.now()}.${ext}`;
```
O campo `nfNumber` é `required` no form, mas o upload pode ser acionado antes de o usuário preencher o número (o botão de upload é independente do submit). Se `nfNumber` estiver vazio no momento do upload, o path usa `'nf'` como fallback. Isso é aceitável como fallback, mas o arquivo ficará salvo como `nf_123456789.pdf` — se o usuário depois preencher o número da NF e salvar, o arquivo já foi enviado com nome genérico. Sem impacto funcional crítico, mas dificulta auditoria manual do Storage.

---

### BORDA-005 — `mesLabel` em `notas/page.tsx` tem fallback redundante
**Arquivo:** `apps/web/src/app/empresa/notas/page.tsx`  
**Linhas:** 82–85  
**Descrição:**
```ts
const mesLabel = income.reference_month
  ? new Date(income.reference_month).toLocaleString(...)
  : income.reference_month ?? '—';
```
O `else` retorna `income.reference_month ?? '—'`. Mas o `else` só é alcançado quando `income.reference_month` é falsy (null/undefined/vazio). Então `income.reference_month ?? '—'` sempre retornará `'—'` — a expressão `income.reference_month` no `??` nunca tem valor útil nesse ramo. É código morto/redundante. Deveria ser simplesmente `'—'`.

---

### BORDA-006 — Drawer "Mais" sem scroll: muitos itens futuros quebrariam o layout
**Arquivo:** `apps/web/src/components/BottomNav.tsx`  
**Linhas:** 132–175  
**Descrição:**
O drawer "Mais" usa `grid grid-cols-2 gap-2.5` sem `overflow-y-auto` ou altura máxima. Atualmente tem 4 itens (2 linhas), sem problema. Mas ao adicionar novos itens no `MAIS_ITEMS`, o drawer crescerá além da tela em dispositivos pequenos sem nenhum scroll ou truncamento. É uma condição de borda de crescimento de produto, não um bug hoje.

---

### BORDA-007 — `obligationsAll` limitado a 100 registros: total pode ser subestimado
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linhas:** 71–77  
**Descrição:**
```ts
.limit(100),
```
`totalPagar` é calculado como soma de `obligationsAll`. Se houver mais de 100 obrigações pendentes, o total exibido estará errado (subestimado). O card mostra "X obrigações" (linha 289) baseado em `obligationsAll.length`, que também estará truncado. Para uma gestão financeira, exibir um total errado pode induzir decisão equivocada.

**Correção sugerida:** Remover o `.limit(100)` ou fazer uma query separada para `SUM(amount)` via RPC/função, ou no mínimo exibir "100+ obrigações" quando o limite for atingido.

---

## 3. Queries Supabase sem Tratamento de Erro

### QUERY-001 — Múltiplas queries destruturam apenas `data`, ignorando `error`
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linhas:** 50–85  
**Descrição:**
```ts
const [
  { data: txAll },         // sem error
  { data: incomeAll },     // sem error
  { data: obligationsAll }, // sem error
  { data: compromissosAll }, // sem error
] = await Promise.all([...]);
```
Nenhuma das 4 queries verifica o campo `error`. Se qualquer uma falhar (conexão, RLS, timeout), `data` será `null` e o código continua com `(txAll ?? [])` — renderizando uma página em branco sem dados, sem erro para o usuário, sem log. O problema mais grave: a query de `obligationsAll` com `.limit(100)` pode silenciosamente retornar `null` em erro e mostrar "0 obrigações pendentes" e "R$ 0,00 total" — dado financeiro crítico exibido errado.

**Correção sugerida:**
```ts
const [txResult, incomeResult, obligationsResult, compromissosResult] = await Promise.all([...]);
if (txResult.error || incomeResult.error || obligationsResult.error) {
  // redirecionar para /error ou lançar error para o error boundary
  throw new Error('Erro ao carregar dados de relatórios.');
}
```

---

### QUERY-002 — `actionExcluirFaturamento` sem verificação de erro no delete
**Arquivo:** `apps/web/src/app/empresa/actions.ts`  
**Linhas:** 145–146  
**Descrição:**
```ts
await supabase.from('income_records').delete().eq('id', id)
  .eq('household_id', profile.household_id);
// retorno ignorado completamente
```
A operação de delete não captura nem verifica o `error`. Se o delete falhar (ex.: constraint de FK, RLS), a função retorna `{ ok: true }` — sinalizando sucesso para o caller quando a operação falhou. O dado permanece no banco mas o caller (e o usuário) acredita que foi excluído.

**Correção sugerida:**
```ts
const { error } = await supabase.from('income_records').delete()
  .eq('id', id)
  .eq('household_id', profile.household_id);
if (error) return { ok: false as const, error: error.message };
```

---

### QUERY-003 — `handleUpload`: `createSignedUrl` sem verificação de erro
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linhas:** 83–90  
**Descrição:**
```ts
const { data: signed } = await db.storage
  .from('fiscal-notes')
  .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

setFileUrl(signed?.signedUrl ?? '');
```
O campo `error` de `createSignedUrl` é ignorado. Se a geração da URL falhar, `signed` será `null`, `fileUrl` será setado como string vazia `''`, e quando o formulário for salvo, `file_url` será enviado como `undefined` (linha 119: `file_url: fileUrl || undefined`) — o arquivo foi carregado no Storage mas a URL não foi salva no banco. O PDF existe mas fica inacessível pela UI.

**Correção sugerida:**
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

### QUERY-004 — `handleUpload`: `getUser` e `profiles` sem verificação de erro
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linhas:** 64–69  
**Descrição:**
```ts
const { data: { user } } = await db.auth.getUser();
if (!user) return;

const { data: profile } = await db.from('profiles').select('household_id').eq('id', user.id).single();
if (!profile) return;
```
Se `getUser` retornar erro (token expirado, sessão inválida), a desestruturação `data: { user }` pode lançar `TypeError` pois `data` pode ser estruturado diferente em erro. O `{ data: profile }` ignora o `error` da query de profiles. O `if (!profile) return` silencia o erro sem feedback: o `uploadProgress` fica em `'uploading'` para sempre, prendendo o botão em estado de loading infinito.

**Correção sugerida:** Adicionar `setUploadProgress('idle')` e `setError(...)` antes de todos os `return` antecipados dentro de `handleUpload`.

---

### QUERY-005 — `notas/page.tsx`: queries sem verificação de `error`
**Arquivo:** `apps/web/src/app/empresa/notas/page.tsx`  
**Linhas:** 27–43  
**Descrição:**
```ts
const { data: incomeRows } = await supabase.from('income_records')...
const { data: fiscalNotes } = incomeIds.length > 0 ? await supabase... : { data: [] };
```
Ambas as queries ignoram o campo `error`. Falha silenciosa renderiza a página como "Nenhum faturamento registrado ainda" mesmo que haja dados — o usuário não sabe que houve erro.

---

## 4. Estados de Loading/Error Ausentes

### LOADING-001 — `FiscalNoteForm`: upload sem feedback ao usuário caso `getUser`/`profile` falhe
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linhas:** 64–69  
**Severidade:** ALTO  
**Descrição:** Conforme descrito em QUERY-004, se o `getUser` ou `profile` falhar dentro de `handleUpload`, a função retorna silenciosamente com `uploadProgress` em `'uploading'` — o botão fica desabilitado e travado em "⏳ Enviando..." para sempre, sem mensagem de erro. O usuário não consegue tentar novamente e não entende o que aconteceu.

---

### LOADING-002 — `FiscalNoteForm`: botão Salvar não bloqueia enquanto upload está em andamento
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
**Linha:** 377  
**Severidade:** MÉDIO  
**Descrição:**
```ts
disabled={saving || !nfNumber || !nfAmount || !nfDate}
```
O botão de submit não verifica `uploadProgress === 'uploading'`. Um usuário pode iniciar um upload, e antes de o upload terminar, clicar em "Salvar NF". O form será salvo sem a `fileUrl` (ainda vazia), e o arquivo terminará de subir no Storage sem referência no banco.

**Correção sugerida:**
```ts
disabled={saving || uploadProgress === 'uploading' || !nfNumber || !nfAmount || !nfDate}
```

---

### LOADING-003 — `relatorios/page.tsx` sem estado de error — page server component sem error boundary específico
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Severidade:** MÉDIO  
**Descrição:** Como server component, qualquer exceção não tratada nas queries vai para o error boundary global do Next.js. Não há um `error.tsx` específico para `/relatorios`, então o usuário vê uma tela de erro genérica sem contexto. Recomendado criar `apps/web/src/app/relatorios/error.tsx`.

---

### LOADING-004 — Relatorios `loading.tsx` renderiza apenas 2 tabs no skeleton, page tem 3
**Arquivo:** `apps/web/src/app/relatorios/loading.tsx`  
**Linhas:** 11–14  
**Severidade:** BAIXO  
**Descrição:**
```tsx
{[0, 1].map(i => (
  <div key={i} className="h-8 w-32 rounded-full bg-white/08" />
))}
```
O skeleton de `/relatorios` renderiza 2 tab pills, mas a página real tem 3 tabs (Fluxo de Caixa, Contas a Pagar, Contas a Receber). Pequena inconsistência visual que causa CLS (Cumulative Layout Shift) no carregamento.

**Correção sugerida:** Mudar `[0, 1]` para `[0, 1, 2]`.

---

### LOADING-005 — Skeletons sem `md:pl-60` consistente
**Arquivos:** `apps/web/src/app/dashboard/loading.tsx`, `apps/web/src/app/lancamentos/loading.tsx`, `apps/web/src/app/compromissos/loading.tsx`, `apps/web/src/app/contas/loading.tsx`, `apps/web/src/app/importar/loading.tsx`  
**Severidade:** BAIXO  
**Descrição:**
Os skeletons de dashboard, lancamentos, compromissos, contas e importar **não incluem** `md:pl-60` no container principal. Os skeletons de `relatorios/loading.tsx` e `empresa/notas/loading.tsx` têm `md:pl-60` corretamente. Nos outros, durante o loading em desktop, o skeleton aparece sem o recuo da sidebar, causando CLS ao transicionar para a page real (que tem `md:pl-60`).

---

## 5. TypeScript / Tipos

### TYPE-001 — Asserção `!` (non-null assertion) sem garantia real em `gerarMeses`
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linhas:** 11–12, 92  
**Descrição:**
```ts
const [y, m] = ym.split('-').map(Number);
return new Date(y!, m! - 1, 1)...
```
O operador `!` (non-null assertion) é usado em `y!` e `m!`. O TypeScript infere o tipo como `number | undefined` após `.map(Number)`. Se `ym` tiver formato inesperado (ex.: `'sem-data'` que vem de `pagarByMes`), `y` e `m` serão `NaN`. A construção de `new Date(NaN, NaN - 1, 1)` retorna `Invalid Date`, e `mesLabel('sem-data')` vai retornar `'Invalid Date'`. Na linha 316, há proteção condicional `mesKey === 'sem-data' ? 'Sem data' : capitalize(mesLabel(mesKey))` — mas essa proteção existe apenas na aba Contas a Pagar. Em outros contextos onde `mesLabel` é chamada, não há proteção.

---

### TYPE-002 — `profile.role` castado com `as` sem validação de runtime
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linha:** 445  
**Descrição:**
```ts
<BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} />
```
O cast `as 'admin' | 'operator'` é aplicado sem validar que `profile.role` realmente contém um desses valores. Se o banco retornar outro valor (ex.: `'superadmin'`, `'viewer'`, `null`), o TypeScript não detecta em runtime e o componente pode ter comportamento inesperado. Em `notas/page.tsx` linha 145, está hardcoded como `role="admin"` — correto para essa page (só admin acessa), mas inconsistente com o padrão.

---

### TYPE-003 — `compromissosAll` declarado mas nunca usado
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linhas:** 53, 83–85  
**Descrição:**
```ts
{ data: compromissosAll },
// ...
supabase
  .from('recurring_commitments')
  .select(...)
```
A variável `compromissosAll` é buscada no `Promise.all` mas nunca referenciada no código abaixo. É uma query desnecessária que consome recursos do banco e tempo de carregamento da página. Deve ser removida ou o dado deve ser utilizado.

---

### TYPE-004 — `pagarByMes` tipo implícito com `typeof obligationsAll`
**Arquivo:** `apps/web/src/app/relatorios/page.tsx`  
**Linha:** 118  
**Descrição:**
```ts
const pagarByMes = new Map<string, typeof obligationsAll>();
```
`typeof obligationsAll` é `{...}[] | null`. Portanto o tipo do Map é `Map<string, {id: string, ...}[] | null>`. Na linha 302, `(obs ?? [])` trata o null corretamente, mas o tipo no Map poderia ser mais preciso: `Map<string, NonNullable<typeof obligationsAll>>`.

---

### TYPE-005 — `traduzirErro` usa `.toLowerCase()` mas match `'is invalid'` é muito genérico
**Arquivo:** `apps/web/src/app/login/page.tsx`  
**Linha:** 20  
**Descrição:**
```ts
if (m.includes('token has expired') ||
    m.includes('is invalid'))
```
`'is invalid'` é uma substring extremamente genérica que pode fazer match em mensagens de erro não relacionadas a tokens (ex.: "email is invalid", "password is invalid"). Isso causaria a mensagem "O link expirou ou é inválido. Solicite um novo." em contextos onde essa mensagem não faz sentido para o usuário (ex.: durante o fluxo de login, não de reset).

**Correção sugerida:** Tornar o match mais específico:
```ts
m.includes('token has expired') ||
m.includes('token is invalid') ||
m.includes('otp has expired')
```

---

## 6. O que Está Correto ✅

### OK-001 — Autenticação e autorização por role bem implementadas
**Arquivos:** Todos os server components e actions  
Todas as pages e server actions verificam `user` e `profile.role === 'admin'` antes de processar qualquer dado. O padrão é consistente e aplicado em todas as rotas analisadas. O redirect para `/login` e `/dashboard` está correto.

---

### OK-002 — `actionSalvarNF`: upsert diferenciado insert/update com isolamento por household
**Arquivo:** `apps/web/src/app/empresa/actions.ts`  
A action distingue insert vs update pelo campo `id`. Em ambos os casos, a query inclui `.eq('household_id', profile.household_id)` no update (linha 91), garantindo que um usuário não possa sobrescrever NFs de outra household mesmo com um `id` válido. Boa prática de segurança.

---

### OK-003 — `traduzirErro()` cobre ampla gama de erros do Supabase Auth
**Arquivo:** `apps/web/src/app/login/page.tsx`  
A função `traduzirErro` cobre 12 casos distintos de erro da API do Supabase Auth, com fallback para o original em casos não mapeados. Boa cobertura para UX em português.

---

### OK-004 — Upload com `upsert: true` evita duplicidade no Storage
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
O uso de `upsert: true` no upload (linha 75) previne erros de arquivo duplicado no Supabase Storage. O path inclui `Date.now()` para evitar colisões, e o `incomeRecordId` no path garante organização por registro.

---

### OK-005 — `actionExcluirNF` limpa o Storage antes de deletar o registro
**Arquivo:** `apps/web/src/app/empresa/actions.ts`  
A action busca o `file_path` antes de deletar e limpa o arquivo do Storage (linha 121), evitando arquivos órfãos. Boa higiene de dados.

---

### OK-006 — FiscalNoteForm: validação básica antes do submit
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
Validação de `parsedAmount > 0`, botão disabled quando campos obrigatórios ausentes, e estado de loading durante save estão bem implementados.

---

### OK-007 — BottomNav: separação clara admin vs operador
**Arquivo:** `apps/web/src/components/BottomNav.tsx`  
O uso de `NAV_ADMIN` e `NAV_OPERATOR` como arrays distintos é limpo e fácil de manter. O drawer "Mais" com backdrop e fechamento por clique externo é bem implementado.

---

### OK-008 — Skeletons consistentes com layout real
**Arquivos:** Todos os `loading.tsx`  
Todos os skeletons usam `animate-pulse`, respeitam `pb-28` para o BottomNav e as classes de padding correspondem ao layout real das pages. Os skeletons de `empresa/notas` e `relatorios` incluem corretamente `md:pl-60`.

---

### OK-009 — `revalidatePath` em todas as mutations
**Arquivo:** `apps/web/src/app/empresa/actions.ts`  
Todas as server actions chamam `revalidatePath` nas rotas relevantes, garantindo que o cache do Next.js seja invalidado após mutações. Padrão correto para Next.js 15 com Server Actions.

---

### OK-010 — Confirmação de exclusão com duplo clique
**Arquivo:** `apps/web/src/app/empresa/FiscalNoteForm.tsx`  
O padrão de confirmação de exclusão (primeiro clique mostra "Confirmar exclusão", segundo executa) é boa prática de UX para operações destrutivas.

---

## Resumo Executivo

| Categoria | Crítico | Alto | Médio | Baixo |
|-----------|---------|------|-------|-------|
| Bugs | 0 | 2 | 4 | 3 |
| Condições de Borda | 0 | 0 | 3 | 4 |
| Queries sem Erro | 0 | 2 | 3 | 0 |
| Loading/Error ausentes | 0 | 1 | 2 | 2 |
| TypeScript | 0 | 0 | 3 | 2 |
| **Total** | **0** | **5** | **15** | **11** |

**Itens críticos para resolver antes do deploy:**
1. BUG-001 — `mesFim` dia 31 fixo (dado financeiro incorreto)
2. BUG-002 — Query `incomeAll` sem filtro (performance)
3. BUG-004 — `handleDelete` ignora erro (falso positivo de sucesso)
4. QUERY-002 — `actionExcluirFaturamento` retorna `ok: true` em caso de erro
5. LOADING-002 — Botão Salvar não bloqueia durante upload em andamento
6. TYPE-003 — `compromissosAll` buscado mas nunca usado (query desnecessária)

---

*Relatório gerado por Ana — QA Lead, i2 Finance | 2026-05-18*
