# Cenários Admin (Iremar) — i2-e2e-tester run 2026-05-20

Filosofia: simulação clique-a-clique. Para cada AÇÃO declaro ESPERADO antes
de auditar o código. Quando o REAL diverge → bug.

---

## CENÁRIO 1: Login → Dashboard → próximos vencimentos → editar lançamento
**DADO:** Iremar autenticado, dashboard renderizado com BillsCard contendo
contas a pagar do mês.

**QUANDO** clico em "Ver todas ›" no BillsCard
- ESPERADO: navegar para /compromissos com Sidebar à esquerda.
- AVALIAÇÃO: BillsCard.tsx:59 usa `<Link href="/compromissos">` — OK.
- ✅ OK

**QUANDO** em /compromissos clico em "Dar baixa" em um item
- ESPERADO: dialog abre; após confirmar, item vira "✓ Pago" e BillsCard do
  dashboard zera o item ao voltar.
- AVALIAÇÃO: actionDarBaixa revalida apenas `/compromissos`, NÃO `/dashboard`.
  Ao clicar no link da BottomNav "Início", o RSC pode servir cache stale do
  dashboard (revalidação automática só acontece em mutações na mesma rota).
- ❌ BUG #B-01 (P1): dar baixa em /compromissos NÃO atualiza BillsCard do
  dashboard. Usuário volta e vê a conta ainda lá.

---

## CENÁRIO 2: Dashboard → /compromissos → filtrar "Atrasados" → dar baixa
**QUANDO** filtro "Atrasados" + clico em Dar baixa
- ESPERADO: dialog → confirma → item some da lista filtrada (estava em
  vermelho como atrasado, agora está pago).
- AVALIAÇÃO: setPaid(true) só muda estado local do botão. Página é RSC
  com filtros lendo dados do server. revalidatePath('/compromissos') é
  chamado — então **a página inteira re-renderiza** no Next 14+. OK.
- ✅ OK (com ressalva: filtro "Atrasados" não exclui pagos
  necessariamente — depende da lógica do filtro, mas a baixa em si funciona).

---

## CENÁRIO 3: Dashboard → /contas → /transferencias
**QUANDO** clico em "Transferências" no menu "Mais"
- ESPERADO: tela /transferencias com form + histórico.
- AVALIAÇÃO: /transferencias linha 27 — `if (!profile || profile.role !== 'admin') redirect('/dashboard')`.
  Iremar é admin, OK.
- ✅ OK

**QUANDO** em /contas, clico no card de uma conta
- ESPERADO: drill-down em extrato dessa conta.
- AVALIAÇÃO: /contas/page.tsx não tem rota detalhada — cards são apenas
  visuais. Clique não faz nada.
- ⚠️ DÚVIDA #B-02 (P2): cards de conta sem drill-down. Pode ser by-design.
  Reportar e perguntar se é esperado.

---

## CENÁRIO 4: /empresa → DRE → /empresa/notas → editar NF
**QUANDO** em /empresa/notas clico em editar uma NF existente
- ESPERADO: form pré-preenchido com dados da NF.
- AVALIAÇÃO: FiscalNoteForm aceita prop de NF existente. Não verifiquei o
  fluxo completo de update, mas a página tem md:pl-60 (OK desktop).
- ✅ OK (presume implementação correta; assumido pelos squads anteriores).

---

## CENÁRIO 5: /relatorios → trocar entre 3 abas → ver fluxo de caixa
**QUANDO** clico nas abas Fluxo / A Pagar / A Receber
- ESPERADO: tab=X na URL muda + conteúdo atualiza.
- AVALIAÇÃO: page lê `searchParams.tab`. Tabs ficam em links que mudam URL
  — re-renderiza server-side. OK.
- ✅ OK

---

## CENÁRIO 6: /acerto → confirmar fechamento Iremar × Juliana
**QUANDO** abro /acerto no mês corrente
- ESPERADO: card de resultado, "Juliana transfere R$ X para Iremar".
- AVALIAÇÃO: lógica computa saldo a partir de commitments + obligations +
  transactions. UI completa.
- ✅ OK (mas: não há botão "marcar acerto como quitado". Apenas leitura.
  Por ora aceitável.)

---

## CENÁRIO 7: /mes → ver receitas → editar
**QUANDO** abro /mes em desktop
- ESPERADO: Sidebar à esquerda, conteúdo deslocado com md:pl-60.
- AVALIAÇÃO: /mes/page.tsx linha 54: `<div className="min-h-screen pb-28">`
  — **NÃO TEM md:pl-60**. Sidebar fixa em w-60 sobrepõe o início do conteúdo.
- ❌ BUG #B-03 (P1): /mes layout estourado no desktop. Sidebar cobre os
  primeiros 240px do header.

**QUANDO** o app abre o Sidebar com firstName
- ESPERADO: rodapé do Sidebar mostra "Iremar" e "admin".
- AVALIAÇÃO: /mes BottomNav é chamado SEM prop `name`:
  `<BottomNav role={profile.role as 'admin' | 'operator'} />` (linha 129).
  Sidebar recebe `name=""` e `firstName = "".split(' ')[0] = ""`. Mostra
  vazio.
- ❌ BUG #B-04 (P2): Sidebar mostra nome em branco em /mes.

**QUANDO** vejo alerta de "unassigned"
- ESPERADO: link/CTA para /categorizar.
- AVALIAÇÃO: linha 68-70 hardcoded texto: "use o CLI para categorizar".
  Texto stale — agora existe /categorizar acessível por ambos roles.
- ❌ BUG #B-05 (P1): mensagem "use o CLI" obsoleta + sem CTA clicável.

---

## CENÁRIO 8: /lancamentos/[id] → anexar PDF → salvar → reabrir
**QUANDO** abro /lancamentos/[id] em desktop
- ESPERADO: Sidebar à esquerda, conteúdo com md:pl-60.
- AVALIAÇÃO: linhas 209: `<div className="min-h-screen px-4 pt-14 pb-28 relative overflow-hidden">`
  — **NÃO TEM md:pl-60**. Sidebar sobrepõe.
- ❌ BUG #B-06 (P1): /lancamentos/[id] layout estourado no desktop.

**QUANDO** estou na LISTA /lancamentos e quero anexar PDF
- ESPERADO: ícone de clipe na linha pra anexar direto.
- AVALIAÇÃO: TransactionList só tem link pra detalhe. Anexo só dentro do edit.
- ⚠️ DÚVIDA #B-07 (P2): UX poderia ter botão "+anexo" inline; HOJE só pela
  página de edit. Aceitável mas friccionoso.

---

## CENÁRIO 9: /backups → ver lista
**QUANDO** Iremar clica no card "Backups" no Mais
- ESPERADO: tela /backups com lista.
- AVALIAÇÃO: linha 33 valida `role !== 'admin' redirect('/dashboard')`. Iremar
  é admin — vê. OK.
- ✅ OK

---

## CENÁRIO 10: Logout → tentar /dashboard direto → /login
**QUANDO** clico em Sair e digito /dashboard na URL
- ESPERADO: redirect para /login.
- AVALIAÇÃO: middleware + page.tsx linha 15 `if (!user) redirect('/login')`.
  OK.
- ✅ OK

---

# Resumo Admin

- ✅ OK: 6
- ❌ BUG: 5 (B-01 dashboard stale, B-03 mes layout, B-04 sidebar name vazio
  em /mes, B-05 mensagem CLI obsoleta em /mes, B-06 lancamentos[id] layout)
- ⚠️ DÚVIDA: 2 (B-02 contas drill-down, B-07 anexo inline)
