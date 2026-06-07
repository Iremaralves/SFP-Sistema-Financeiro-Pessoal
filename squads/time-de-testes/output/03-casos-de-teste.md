# Casos de Teste por Fluxo
**Carol (Testadora) | 2026-05-17**

---

## DAR BAIXA em contas fixas

| # | Cenário | Passos | Esperado | Risco |
|---|---------|--------|----------|-------|
| T01 | Dar baixa pela primeira vez | Abrir /compromissos → toque em "Dar baixa" | Botão vira "✓ Pago", status vira verde | — |
| T02 | Dar baixa já existente (update) | Dar baixa, desfazer, dar baixa novamente | Mesmo comportamento (upsert) | — |
| T03 | Desfazer baixa | Toque em "✓ Pago" → hover mostra "↩ Desfazer" | Volta para "Dar baixa" | BUG-02: erro silencioso |
| T04 | Dar baixa em mês passado | Filtrar para mês anterior, toque em dar baixa | Baixa gravada no mês correto (não no atual) | — |
| T05 | Dar baixa em conta cartão | — | Botão não aparece (seção de cartão não tem DarBaixaButton) | — |

## FILTRO DE ENTIDADE em /compromissos

| # | Cenário | Esperado |
|---|---------|----------|
| T06 | Tab "Todas" | Mostra todas as 11 contas |
| T07 | Tab "Família" | Mostra 8 contas pessoais; DAS/INSS/PJ some |
| T08 | Tab "i2" | Mostra 3 contas PJ; badge âmbar visível |
| T09 | Mudar mês + filtro de entidade | URL mantém ambos os params (?mes=...&entidade=i2) |
| T10 | Nova conta com responsável i2 | Badge i2 aparece na lista, entidade correta |

## SELETOR DE CONTA em /lancamentos/novo

| # | Cenário | Usuário | Esperado |
|---|---------|---------|----------|
| T11 | Abrir formulário | Admin (Iremar) | Vê seção "Conta" com 💳 Nubank + 🏢 i2 Soluções |
| T12 | Abrir formulário | Operator (Juliana) | Não vê seção "Conta"; Nubank implícito |
| T13 | Selecionar responsável i2 | Admin | Conta muda automaticamente para i2 Soluções |
| T14 | Mudar de i2 para Iremar | Admin | Conta volta para Nubank |
| T15 | Salvar com conta i2 | Admin | Transação criada com account_id da i2 + entity_id business |
| T16 | Salvar sem selecionar conta | Admin | Botão desabilitado (accountId vazio) — ⚠️ pode ocorrer durante loading |

## PÁGINA /empresa

| # | Cenário | Esperado |
|---|---------|----------|
| T17 | Abrir /empresa | Header âmbar, DRE visível, 3 obrigações fixas listadas |
| T18 | Faturamento não registrado | "Não registrado" em vermelho, resultado mostra "—" |
| T19 | Registrar faturamento | Toque em "+ Registrar faturamento" → salvar → DRE atualiza |
| T20 | Editar faturamento | Toque em "✎ R$ X.XXX" → alterar valor → salvar |
| T21 | Excluir faturamento | Botão ✕ → faturamento some, resultado vira "—" |
| T22 | Navegar meses | Botões ‹ › mudam a URL e recarregam dados do mês correto |
| T23 | Link "Contas fixas ›" | Leva para /compromissos?entidade=i2 |
| T24 | Clicar em conta fixa PJ | Leva para /compromissos/[id] para editar |

## CRUD COMPLETO /compromissos

| # | Cenário | Esperado |
|---|---------|----------|
| T25 | Criar nova conta com responsável i2 | Aparece na aba i2, badge âmbar |
| T26 | Editar conta de cartão → mudar para boleto | Sai da seção cartão, entra em boleto com botão "Dar baixa" |
| T27 | Excluir conta (2 toques) | Some da lista, active=false no banco |
| T28 | Criar conta boleto para Família | Aparece na aba Família, seção Boleto/PIX |

## EDGE CASES identificados pela Carol

| # | Edge Case | Observação |
|---|-----------|------------|
| EC01 | /empresa acessado por operator | Redireciona para /dashboard (✅ protegido) |
| EC02 | Dar baixa offline | Botão fica em "…" → erro exibido ao reconectar |
| EC03 | Mês com 0 compromissos | Seção mostra estado vazio correto |
| EC04 | Empresa sem entidade cadastrada | Redireciona para /dashboard (✅ tratado) |
| EC05 | Faturamento com vírgula (5.000,00) | Input tipo number aceita só ponto — pode confundir usuário |
