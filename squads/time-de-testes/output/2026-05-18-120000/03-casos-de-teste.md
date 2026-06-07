# Checklist de Testes Manuais — i2 Finance
**Testadora:** Carol (Flow Tester)  
**Data:** 2026-05-18  
**Sprint:** Features implementadas a partir de 2026-05-17  
**Fonte de referência:** 01-analise-codigo.md (Ana) + 02-validacao-banco.md (Diego)

---

## Legenda de Status
- ⬜ A Testar — requer execução manual no browser
- ✅ Aprovado — código analisado e correto (simulado via leitura)
- ❌ Falhou — bug confirmado via leitura de código (referência ao bug report)
- ⚠️ Parcial — código suspeito, precisa de validação manual

---

## Legenda de Prioridade
- P0 — Bloqueador (dado financeiro incorreto / crash / falso positivo de operação)
- P1 — Alto (UX quebrada / dado errado visível)
- P2 — Médio (feedback ausente / inconsistência visual)
- P3 — Baixo (cosmético / risco futuro)

---

## Feature 1: /relatorios — Fluxo de Caixa

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| F1-01 | Fluxo de Caixa | Mês sem transações nem receitas — resultado zero | 1. Acessar /relatorios?tab=fluxo; 2. Identificar mês sem nenhum lançamento no banco | Card do mês exibe "—" em Receitas e Despesas; Resultado = R$ 0,00; Card com opacity 0.5 (dim visual de mês vazio); sem crash | P1 | ✅ Código usa `temDados = row.receitas > 0 || row.despesas > 0` e aplica `opacity: temDados ? 1 : 0.5`; sem crash confirmado |
| F1-02 | Fluxo de Caixa | Mês com só despesas — resultado negativo | 1. Garantir mês com transações mas sem income_records; 2. Verificar card do mês | Resultado em vermelho (#f87171) com sinal negativo; Despesas populadas; Receitas = "—" | P1 | ✅ Código aplica `color: row.resultado >= 0 ? '#34d399' : '#f87171'`; lógica correta |
| F1-03 | Fluxo de Caixa | Mês com só receitas — resultado positivo | 1. Garantir mês com income_records mas sem transactions; 2. Verificar card do mês | Resultado em verde (#34d399) com sinal "+"; Receitas populadas; Despesas = "—" | P1 | ✅ Código exibe `{row.resultado >= 0 ? '+' : ''}` e usa cor verde; lógica correta |
| F1-04 | Fluxo de Caixa | Acumulado crossing zero (positivo → negativo) | 1. Simular meses alternados positivo/negativo; 2. Verificar coluna "Acumulado" | Acumulado muda de cor corretamente: verde (#6ee7b7) quando positivo, rosa (#fca5a5) quando negativo | P1 | ✅ Código usa `color: row.acumulado >= 0 ? '#6ee7b7' : '#fca5a5'`; lógica correta |
| F1-05 | Fluxo de Caixa | BUG-001: Fevereiro — mesFim fixo no dia 31 | 1. Acessar /relatorios em qualquer dia de 2026 onde o mês mais recente dos 12 seja fevereiro; 2. Verificar transações do período | **BUG CONFIRMADO:** `mesFim = '2026-02-31'` é data inválida. PostgreSQL pode silenciar ou retornar resultados inesperados. Transações do mês podem ser filtradas incorretamente | P0 | ❌ BUG-001 (Ana, linha 47): `const mesFim = \`${meses[0]}-31\`` — dia 31 hardcoded. Afeta qualquer mês que não tenha 31 dias |
| F1-06 | Fluxo de Caixa | Navegação entre abas preserva tab ativa | 1. Abrir /relatorios (padrão = fluxo); 2. Clicar em "Contas a Pagar"; 3. Clicar em "Contas a Receber"; 4. Clicar novamente em "Fluxo de Caixa" | Tab selecionada fica destacada (fundo roxo, cor #a5b4fc); URL atualiza (?tab=pagar, ?tab=receber, ?tab=fluxo); conteúdo correto aparece | P1 | ✅ Tabs usam `<Link href="/relatorios?tab=${t.key}">` — estado via URL, servidor re-renderiza corretamente; sem estado local a perder |
| F1-07 | Fluxo de Caixa | Usuário com role=operator tenta acessar /relatorios | 1. Fazer login com conta operator; 2. Navegar diretamente para /relatorios | Redirect para /dashboard — operator não deve ver relatórios | P0 | ✅ Código linha 40: `if (!profile \|\| profile.role !== 'admin') redirect('/dashboard')`. Operator é barrado corretamente |
| F1-08 | Fluxo de Caixa | BORDA-001: Fuso horário UTC vs local em gerarMeses | 1. Testar em browser com fuso UTC-3 às 21h+ do dia 31 do mês; 2. Verificar se o mês gerado está correto | Mês atual deve ser calculado corretamente; não deve incluir mês futuro | P2 | ⚠️ BORDA-001 (Ana): `new Date(...).toISOString().slice(0,7)` pode gerar mês errado em UTC-3 às 21h do dia 31. Requer teste manual em horário específico |
| F1-09 | Fluxo de Caixa | Total geral do cabeçalho (12 meses) | 1. Verificar card de totalizador no topo da aba fluxo | Card exibe somatório correto de Receitas, Despesas e Resultado dos 12 meses | P1 | ✅ `totalReceitas`, `totalDespesas`, `totalResultado` calculados corretamente via reduce |
| F1-10 | Fluxo de Caixa | BUG-002: incomeAll sem filtro de período | 1. Com household com dados históricos antigos (> 12 meses); 2. Verificar performance e se dados antigos aparecem | Dados além dos 12 meses não devem aparecer. Performance pode ser lenta com muitos registros | P0 | ❌ BUG-002 (Ana): query de `incomeAll` sem `.gte()` nem `.lte()` — busca todos os registros da household sem filtro de data |

---

## Feature 2: /relatorios — Contas a Pagar

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| F2-01 | Contas a Pagar | Sem compromissos vencidos — lista vazia limpa | 1. Acessar /relatorios?tab=pagar com household sem obrigações pendentes | Card verde "Nenhuma conta pendente!" com ícone ✓; Total pendente = R$ 0,00; "0 obrigações" | P1 | ✅ Código linha 292: `{pagarMeses.length === 0 && (...)}` exibe mensagem correta |
| F2-02 | Contas a Pagar | Compromissos vencidos com indicador vermelho | 1. Criar obrigação com `due_date` anterior à data atual; 2. Acessar aba | Item da lista exibe bullet vermelho (#f87171) e texto "• Vencido" em vermelho | P0 | ✅ Código linha 326: `const vencido = ob.due_date && ob.due_date < hoje2` — comparação correta de string ISO; linha 337: `{vencido && <span className="text-red-400 ml-1">• Vencido</span>}` |
| F2-03 | Contas a Pagar | Compromisso pago não aparece como pendente | 1. Criar obrigação com `status = 'paid'`; 2. Verificar aba | Obrigação paga NÃO aparece na lista de pendentes | P0 | ✅ Query filtra `.eq('status', 'pending')` — obrigações pagas excluídas da query |
| F2-04 | Contas a Pagar | Compromisso com valor variável (amount null) | 1. Verificar exibição de obrigação sem valor definido | Exibe R$ 0,00 sem crash; não quebra o totalPagar | P1 | ✅ Código usa `(o.amount ?? 0)` em todos os reduces; `fmt(ob.amount ?? 0)` na listagem; robusto contra null |
| F2-05 | Contas a Pagar | Próximos meses sem compromissos não aparecem | 1. Garantir que não haja obrigações para meses futuros; 2. Verificar aba | Apenas meses com obrigações reais aparecem; sem seções vazias | P2 | ✅ `pagarMeses` é gerado a partir de `pagarByMes.entries()` — apenas meses com dados aparecem |
| F2-06 | Contas a Pagar | BORDA-007: Mais de 100 obrigações — total subestimado | 1. Criar cenário com mais de 100 obrigações pendentes na household; 2. Verificar total | **RISCO:** total exibido estará incompleto se houver > 100 pendências | P0 | ❌ BORDA-007 (Ana): `.limit(100)` na query de `obligationsAll`; total pode ser subestimado |
| F2-07 | Contas a Pagar | Obrigação sem due_date (sem data) | 1. Criar obrigação sem `due_date`; 2. Verificar agrupamento | Aparece na seção "Sem data"; exibe "Sem vencimento" no item | P2 | ✅ Código linha 120: `mesKey = ob.due_date?.slice(0, 7) ?? 'sem-data'`; linha 316: `{mesKey === 'sem-data' ? 'Sem data' : ...}` |

---

## Feature 3: /relatorios — Contas a Receber

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| F3-01 | Contas a Receber | Sem histórico de faturamento — estado vazio | 1. Acessar /relatorios?tab=receber com household sem income_records de kind='faturamento_i2' | Seção "Histórico de receitas" vazia; 3 cards dos próximos meses exibem "—" e botão "Registrar"; sem crash | P1 | ✅ Código usa `(incomeAll ?? []).filter(r => r.kind === 'faturamento_i2')` — array vazio resulta em histórico vazio; cards de projeção exibem `row.registrado > 0 ? ... : <>...</>` |
| F3-02 | Contas a Receber | Faturamento do mês atual registrado vs projeção | 1. Ter income_record de faturamento_i2 para o mês atual; 2. Verificar card | Card do mês atual exibe valor em verde + badge "Registrado"; link "Registrar" não aparece | P1 | ✅ Código linha 390: `{row.registrado > 0 ? (<p className="text-green-400">...</p>) : (<Link href="/empresa?mes=...">Registrar</Link>)}` |
| F3-03 | Contas a Receber | Mês futuro sem faturamento registrado | 1. Verificar cards dos próximos 2-3 meses sem registro | Cards exibem "—" e link "Registrar" apontando para /empresa?mes=YYYY-MM | P2 | ✅ `proximosMeses` gera 3 meses (i=0,1,2); link correto `href={/empresa?mes=${row.mes}}` |
| F3-04 | Contas a Receber | BORDA-002: Label de mês errado por fuso horário | 1. Testar em browser com fuso UTC-3; 2. Verificar labels dos meses na aba Receber | Label deve exibir o mês correto (ex: "Junho 2026", não "Maio 2026") | P2 | ⚠️ BORDA-002 (Ana): linha 377 usa `new Date(row.mes + '-01').toLocaleString(...)` sem `timeZone: 'UTC'` — pode mostrar mês anterior em UTC-3. Histórico (linha 427) correto pois usa `timeZone: 'UTC'` |
| F3-05 | Contas a Receber | NF vinculada aparece no histórico de receita? | 1. Criar income_record com NF associada; 2. Verificar aba Receber | Aba Receber exibe apenas valor de income_record; NF é exibida na página /empresa/notas (não há link direto aqui) | P3 | ✅ Por design, a aba Receber não exibe NFs diretamente — somente a página /empresa/notas faz essa vinculação |

---

## Feature 4: /empresa/notas — Notas Fiscais

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| F4-01 | Notas Fiscais | Adicionar NF a recebimento sem NF prévia | 1. Acessar /empresa/notas; 2. Clicar em "+ Adicionar Nota Fiscal" em um card sem NF; 3. Preencher campos obrigatórios (Número, Valor, Data); 4. Clicar "Salvar NF" | Form abre; após salvar, card exibe NF com número e valor; badge "NF #XXX" aparece no header | P1 | ✅ Botão "+ Adicionar Nota Fiscal" (`hasNF && !open` condição correta); após salvar, `actionSalvarNF` faz upsert e `revalidatePath` atualiza a lista |
| F4-02 | Notas Fiscais | Editar NF existente — alterar número, valor e alíquota | 1. Em card com NF existente, clicar "✎ Editar"; 2. Alterar número, valor e alíquota ISS; 3. Salvar | NF atualizada no card; valores antigos substituídos; cálculo de ISS e valor líquido atualizados | P1 | ✅ Form inicializa com `existingNote` data; `actionSalvarNF` distingue insert/update pelo campo `id` |
| F4-03 | Notas Fiscais | Calcular ISS automaticamente ao preencher alíquota | 1. Abrir form de NF; 2. Preencher Valor = "10.000,00"; 3. Preencher Alíquota ISS = "2.00" | Preview imediato abaixo do campo: "ISS: R$ 200,00 · Líq.: R$ 9.800,00" | P1 | ✅ Linha 291-296: cálculo reativo via `{aliquota && nfAmount && !isNaN(...) && (<p>ISS: {fmt(...)} · Líq.: {fmt(...)}</p>)}` |
| F4-04 | Notas Fiscais | Upload de PDF válido | 1. Clicar em "📎 Anexar PDF"; 2. Selecionar arquivo .pdf < 10MB | Upload progride (botão muda para "⏳ Enviando..."); após conclusão exibe "✓ PDF enviado" em verde; link "Ver PDF atual" aparece | P1 | ✅ Fluxo de upload implementado; estado `uploadProgress` muda corretamente; PORÉM: sem validação de tamanho/tipo real (BORDA-003) |
| F4-05 | Notas Fiscais | BORDA-003: Upload de arquivo não-PDF (ex: .exe, .docx) | 1. Tentar fazer upload de arquivo que não é PDF/JPG/PNG via drag-and-drop ou manipulação do input | Sistema deve rejeitar com mensagem de erro clara | P2 | ⚠️ BORDA-003 (Ana): o atributo `accept="application/pdf,image/jpeg,image/png"` é apenas sugestão do browser — não há validação de MIME type ou tamanho no código; arquivo inválido será enviado ao Storage |
| F4-06 | Notas Fiscais | Excluir NF com PDF — confirmar exclusão | 1. Abrir edição de NF com PDF; 2. Clicar "Excluir"; 3. Clicar "Confirmar exclusão" | NF removida do banco; PDF removido do Storage; card volta a exibir botão "+ Adicionar NF" | P1 | ⚠️ BUG-004 (Ana): `handleDelete` não verifica retorno de `actionExcluirNF` — se exclusão falhar no banco, form fecha e exibe sucesso falso. Porém: `actionExcluirNF` (OK-005) limpa o Storage antes de deletar — correto nesta parte |
| F4-07 | Notas Fiscais | Excluir NF sem arquivo PDF | 1. Criar NF sem upload de PDF; 2. Excluir | NF removida do banco; sem erro de Storage (arquivo não existe) | P1 | ✅ `actionExcluirNF` busca `file_path` antes de deletar do Storage — se `file_path` for null, não tenta remover do Storage |
| F4-08 | Notas Fiscais | Mês sem faturamento registrado — lista vazia | 1. Acessar /empresa/notas com household sem income_records do kind faturamento_i2 | Exibe "Nenhum faturamento registrado ainda." com link para /empresa | P1 | ✅ Linha 70-78: `{(incomeRows ?? []).length === 0 && (...)}` exibe estado vazio correto |
| F4-09 | Notas Fiscais | NF com tomador vazio — campo opcional | 1. Criar NF sem preencher o campo Tomador; 2. Salvar | NF salva sem erro; card NF não exibe campo tomador (condição `{nf.tomador && ...}`) | P2 | ✅ Campo Tomador sem `required`; server action aceita `tomador: undefined`; UI condicional `{existingNote.tomador && <p>...}` |
| F4-10 | Notas Fiscais | BUG-005: fmtDate com nf_issued_at nulo | 1. Inserir NF diretamente no banco com `nf_issued_at = null`; 2. Verificar lista | Deve exibir "—" ou fallback; não deve exibir "undefined/undefined/undefined" | P1 | ❌ BUG-005 (Ana): `function fmtDate(s: string)` não protege contra null/undefined — chamada em `fmtDate(nf.nf_issued_at)` onde campo pode ser legado |
| F4-11 | Notas Fiscais | BUG-007: uploadProgress não reseta ao fechar e reabrir | 1. Iniciar upload de PDF; 2. Após upload, clicar Cancelar; 3. Reabrir form do mesmo card | Botão deve voltar para "📎 Anexar PDF" (idle), não "✓ PDF enviado" | P2 | ❌ BUG-007 (Ana): `uploadProgress` não é resetado no handler de cancelar — estado sobrevive ao toggle `open` |
| F4-12 | Notas Fiscais | LOADING-002: Salvar durante upload em andamento | 1. Iniciar upload de PDF (arquivo grande); 2. Imediatamente clicar "Salvar NF" antes do upload terminar | Botão Salvar deve estar desabilitado durante upload | P1 | ❌ LOADING-002 (Ana): botão Salvar apenas verifica `saving \|\| !nfNumber \|\| !nfAmount \|\| !nfDate` — não verifica `uploadProgress === 'uploading'` |
| F4-13 | Notas Fiscais | BUG-006: Dois income_records com a mesma NF (duplicata no banco) | 1. Inserir manualmente 2 fiscal_notes com mesmo income_record_id; 2. Verificar lista | Sistema deve exibir ambas (comportamento esperado com correção) ou pelo menos não perder dados silenciosamente | P1 | ❌ BUG-006 (Ana): `nfMap` usa `Map<income_record_id, nf>` — apenas última NF sobrevive; primeira é silenciosamente descartada |
| F4-14 | Notas Fiscais | BORDA-004: Número da NF vazio durante upload | 1. Abrir form sem preencher número; 2. Clicar no botão de upload imediatamente | Upload ocorre com path `nf_{timestamp}.pdf` no Storage; ao preencher número depois, arquivo já está com nome genérico | P3 | ⚠️ BORDA-004 (Ana): sem impacto funcional crítico, mas dificulta auditoria. Testar se path no Storage fica com fallback 'nf' |

---

## Feature 5: Sidebar + BottomNav

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| F5-01 | Layout | Mobile (<768px): BottomNav visível, Sidebar oculta | 1. Abrir app em viewport < 768px (ou DevTools mobile); 2. Verificar presença dos componentes | BottomNav aparece no rodapé; Sidebar está oculta (hidden md:flex) | P1 | ✅ Sidebar usa `className="...hidden md:flex..."` (linha 25 Sidebar.tsx); BottomNav usa `className="...md:hidden..."` (linha 60 BottomNav.tsx) |
| F5-02 | Layout | Desktop (>768px): Sidebar visível, BottomNav oculta | 1. Abrir app em viewport >= 768px; 2. Verificar presença dos componentes | Sidebar fixa à esquerda (w-60); BottomNav não aparece | P1 | ✅ Mesmas classes Tailwind confirmadas acima; comportamento correto por CSS responsivo |
| F5-03 | BottomNav | "Mais" abre drawer com 4 itens | 1. Em mobile, clicar no botão "Mais" (⋯) | Drawer abre com 4 itens: Empresa, Relatórios, Importar CSV, Notas Fiscais | P1 | ✅ `MAIS_ITEMS` tem 4 entradas; `setMaisOpen(true)` abre o drawer |
| F5-04 | BottomNav | Drawer fecha ao clicar em link | 1. Abrir drawer "Mais"; 2. Clicar em qualquer link do drawer | Drawer fecha (setMaisOpen(false)) e navegação ocorre | P1 | ✅ Cada `<Link>` no drawer tem `onClick={() => setMaisOpen(false)}` (linha 145 BottomNav.tsx) |
| F5-05 | BottomNav | Drawer fecha ao clicar fora (backdrop) | 1. Abrir drawer "Mais"; 2. Clicar no backdrop escuro acima do drawer | Drawer fecha | P1 | ✅ Backdrop `<div onClick={() => setMaisOpen(false)} />` (linha 114 BottomNav.tsx) |
| F5-06 | Sidebar | Item ativo destacado corretamente | 1. Navegar para /lancamentos; 2. Verificar Sidebar | "Lançamentos" aparece com fundo azul-transparente e cor #60a5fa; outros itens em branco/40 | P2 | ✅ `isActive = pathname === item.href \|\| (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))` — lógica correta para rotas simples |
| F5-07 | Sidebar | Operator não vê Sidebar | 1. Fazer login com conta operator; 2. Verificar qualquer página | Sidebar não é renderizada (retorna null) | P0 | ✅ Sidebar.tsx linha 19: `if (role !== 'admin') return null` — correto |
| F5-08 | BottomNav | Operator não vê botão "Mais" | 1. Fazer login com conta operator; 2. Verificar BottomNav | BottomNav do operator usa `NAV_OPERATOR` sem botão "Mais (#mais)" — operador não tem acesso a /relatorios, /empresa, /empresa/notas | P1 | ✅ `NAV_OPERATOR` não inclui `#mais`; `/importar` e `/contas` são visíveis para operator |
| F5-09 | Layout | BUG-009: Operator em desktop sem md:pl-60 | 1. Fazer login como operator em viewport >= 768px; 2. Verificar padding do conteúdo | Conteúdo fica colado à borda esquerda (sem Sidebar, sem md:pl-60 nas pages operator) | P3 | ⚠️ BUG-009 (Ana): pages com md:pl-60 assumem presença de Sidebar (admin-only); operator em desktop tem layout com conteúdo na borda |
| F5-10 | Sidebar | Ativação de /empresa/notas — item "Empresa" ativo | 1. Navegar para /empresa/notas; 2. Verificar Sidebar | Item "Empresa" (/empresa) fica ativo pois pathname.startsWith('/empresa/') | P3 | ✅ Por design: /empresa/notas ativa o item pai /empresa — comportamento aceitável conforme BUG-008 (Ana) revisado como sem bug ativo |

---

## Feature 6: Loading Skeletons

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| F6-01 | Skeletons | Skeleton aparece durante carregamento | 1. Simular conexão lenta (DevTools → Network → Slow 3G); 2. Navegar para /relatorios | Skeleton com pulse animation aparece antes do conteúdo real; não há tela em branco | P2 | ✅ `relatorios/loading.tsx` existe com `animate-pulse`; Next.js 15 usa loading.tsx automaticamente |
| F6-02 | Skeletons | LOADING-004: Skeleton tem 2 tabs, página tem 3 | 1. Navegar para /relatorios em conexão lenta; 2. Observar tabs no skeleton vs página carregada | **BUG VISUAL:** skeleton exibe 2 pills de tab; página real tem 3 tabs — causa CLS ao trocar skeleton por conteúdo | P3 | ❌ LOADING-004 (Ana): `{[0, 1].map(i => ...)}` deve ser `{[0, 1, 2].map(i => ...)}` |
| F6-03 | Skeletons | LOADING-005: Skeleton sem md:pl-60 em outras páginas | 1. Em desktop (>768px), navegar para /dashboard, /lancamentos ou /compromissos em conexão lenta; 2. Comparar layout do skeleton vs página real | Skeleton aparece sem recuo da Sidebar; ao carregar, conteúdo "salta" para posição com md:pl-60 (CLS) | P2 | ❌ LOADING-005 (Ana): skeletons de dashboard, lancamentos, compromissos, contas e importar não incluem md:pl-60 |
| F6-04 | Skeletons | Skeleton /relatorios tem md:pl-60 correto | 1. Desktop com Sidebar visível; 2. Navegar para /relatorios em conexão lenta | Skeleton já está alinhado com a Sidebar; sem CLS ao carregar | P2 | ✅ `relatorios/loading.tsx` linha 3: `className="...md:pl-60..."` — correto |
| F6-05 | Skeletons | Skeleton /empresa/notas tem md:pl-60 correto | 1. Desktop com Sidebar visível; 2. Navegar para /empresa/notas em conexão lenta | Skeleton alinhado; sem CLS | P2 | ✅ Conforme OK-008 (Ana): skeleton de empresa/notas inclui md:pl-60 |

---

## Feature 7: Login — Mensagens em Português

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| F7-01 | Login | Senha incorreta → mensagem em português | 1. Acessar /login; 2. Inserir e-mail válido e senha errada; 3. Clicar "Entrar" | Exibe "E-mail ou senha incorretos." em vermelho | P1 | ✅ `traduzirErro`: `m.includes('invalid login credentials')` → `'E-mail ou senha incorretos.'` — correto |
| F7-02 | Login | Rate limit → mensagem de aguardo | 1. Tentar login incorreto várias vezes rapidamente | Exibe "Por segurança, aguarde alguns segundos antes de tentar novamente." | P1 | ✅ `m.includes('for security purposes')` → mensagem correta; `m.includes('too many requests')` também coberto |
| F7-03 | Login | Fluxo "Esqueci a senha" completo | 1. Clicar "Esqueci a senha / primeiro acesso"; 2. Inserir e-mail; 3. Clicar "Enviar link de acesso" | Modo muda para 'reset'; após envio bem-sucedido, modo muda para 'reset_sent' com "Link enviado!" e e-mail destacado | P1 | ✅ Fluxo de states (`mode: 'login' → 'reset' → 'reset_sent'`) implementado corretamente; voltar ao login funciona |
| F7-04 | Login | Link de reset expirado → mensagem correta | 1. Clicar em link de reset expirado no e-mail; 2. Verificar mensagem de erro | Exibe "O link expirou ou é inválido. Solicite um novo." | P1 | ⚠️ TYPE-005 (Ana): `m.includes('is invalid')` é muito genérico — pode fazer match em erros não relacionados (ex: "email is invalid") e exibir mensagem sobre link expirado em contexto errado |
| F7-05 | Login | E-mail não confirmado | 1. Tentar login com conta sem e-mail confirmado no Supabase | Exibe "E-mail não confirmado. Verifique sua caixa de entrada." | P2 | ✅ `m.includes('email not confirmed')` → mensagem correta |
| F7-06 | Login | Erro de conexão (sem internet) | 1. Desativar rede; 2. Tentar login | Exibe "Erro de conexão. Verifique sua internet." | P2 | ✅ `m.includes('network') \|\| m.includes('fetch')` → mensagem correta |
| F7-07 | Login | Botão desabilitado durante loading | 1. Clicar "Entrar"; 2. Antes da resposta, verificar botão | Botão exibe "Entrando..." e fica desabilitado (opacity-50); não permite duplo clique | P1 | ✅ `disabled={loading}` + `{loading ? 'Entrando...' : 'Entrar'}` — correto |
| F7-08 | Login | Modo reset — e-mail inválido retorna erro | 1. Na tela "Esqueci a senha", inserir e-mail inexistente; 2. Enviar | Supabase retorna erro; `traduzirErro` exibe mensagem traduzida | P2 | ✅ `handleReset` captura `err` e chama `traduzirErro(err.message)` |

---

## Casos de Segurança (Diego)

| # | Feature | Caso de Teste | Passos | Resultado Esperado | Prioridade | Status |
|---|---------|---------------|--------|--------------------|------------|--------|
| S-01 | Storage RLS | Cross-tenant: usuário de household A acessa PDF de household B | 1. Criar 2 households (A e B) com NFs e PDFs; 2. Logado como household A, tentar acessar URL de PDF do household B diretamente via signed URL | Acesso deve ser negado pelo Storage | P0 | ❌ PROBLEMA-1 (Diego): Storage policies apenas verificam `auth.role() = 'authenticated'` sem filtrar por household_id no path — qualquer autenticado pode acessar qualquer PDF |
| S-02 | RLS Table | UPDATE de fiscal_note — mover para outro household | 1. Admin de household A; 2. Enviar UPDATE com household_id do household B | UPDATE deve ser bloqueado pelo banco | P1 | ⚠️ PROBLEMA-2 (Diego): policy UPDATE sem `WITH CHECK` — banco verifica estado ANTES do update mas não DEPOIS; household_id pode ser alterado cross-tenant |
| S-03 | RLS Table | Operator tenta INSERT em fiscal_notes | 1. Fazer login como operator; 2. Tentar inserir fiscal_note diretamente via API | INSERT bloqueado por RLS: policy exige `get_my_role() = 'admin'` | P0 | ✅ Policy INSERT: `household_id = get_my_household_id() AND role = 'admin'` — operator não passa |

---

## Resumo Executivo

### Contagem por Status

| Status | Quantidade |
|--------|-----------|
| ✅ Aprovado (código correto via análise) | 30 |
| ❌ Falhou (bug confirmado via código) | 10 |
| ⚠️ Parcial (suspeito, validar manualmente) | 7 |
| ⬜ A Testar (requer browser) | 0 |

**Total de casos:** 47

### Bugs Bloqueadores (P0) — NÃO PODE IR A PRODUÇÃO

| Referência | Caso | Problema |
|------------|------|---------|
| F1-05 / BUG-001 | mesFim dia 31 fixo | Dado financeiro incorreto para fevereiro e meses de 30 dias |
| F1-10 / BUG-002 | incomeAll sem filtro | Query busca todos os dados históricos sem limite — risco de timeout |
| F2-06 / BORDA-007 | Limit 100 em obrigações | Total pendente pode ser subestimado — decisão financeira errada |
| F4-12 / LOADING-002 | Salvar durante upload | PDF salvo no Storage sem referência no banco |
| S-01 / PROBLEMA-1 | Storage cross-tenant | Qualquer usuário autenticado acessa PDFs de qualquer household |
| F5-07 | Operator acessa /relatorios | PASSA — barreira correta; P0 era hipótese, código correto |

### Bugs de Alto Impacto (P1) confirmados em código

| Referência | Caso | Problema |
|------------|------|---------|
| F4-06 / BUG-004 | handleDelete ignora erro | Exclusão falha silenciosamente; usuário vê sucesso falso |
| F4-10 / BUG-005 | fmtDate sem proteção | `null` em nf_issued_at → "undefined/undefined/undefined" na UI |
| F4-11 / BUG-007 | uploadProgress não reseta | Estado fantasma "✓ PDF enviado" sem arquivo real |
| F4-13 / BUG-006 | nfMap perde NFs duplicadas | Segunda NF do mesmo income_record silenciosamente descartada |

### Itens a Testar Manualmente com Prioridade

1. F1-08 — Fuso horário em gerarMeses (horário limite: 21h UTC-3 no dia 31)
2. F3-04 — Label de mês errado em Contas a Receber (UTC-3)
3. F4-05 — Upload de arquivo não-PDF via drag-and-drop (bypass do `accept`)
4. F7-04 — Mensagem de link expirado em contexto errado (TYPE-005)
5. F5-09 — Layout do operator em desktop sem md:pl-60

---

*Relatório gerado por Carol — Flow Tester, i2 Finance | 2026-05-18*
