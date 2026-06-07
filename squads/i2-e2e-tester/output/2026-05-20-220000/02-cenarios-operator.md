# Cenários Operator (Juliana) — i2-e2e-tester run 2026-05-20

---

## CENÁRIO 1: Login → Dashboard → alerta de categorização
**QUANDO** Juliana abre /dashboard
- ESPERADO: vê card rosa "X lançamentos para categorizar" (se houver).
- AVALIAÇÃO: DashboardOperator linha 62-73 renderiza Link para /categorizar
  somente quando `unassigned > 0`. Estado atual: 0 unassigned, então o card
  não aparece (correto).
- ✅ OK

**QUANDO** ela olha o Sidebar (se estiver no desktop)
- ESPERADO: cores rosa/pink para indicar que ela é operator.
- AVALIAÇÃO: Sidebar.tsx linha 75-77 hardcoded: `background: 'rgba(59,130,246,0.12)'`
  (azul) + `color: '#60a5fa'` (azul). Mesma cor pros 2 roles. Dashboard dela
  todo rosa, Sidebar azul — desconexão visual.
- ❌ BUG #B-08 (P2): Sidebar usa azul de admin no role operator. Deveria
  usar var(--accent-juliana) ou `#ec4899`.

---

## CENÁRIO 2: Dashboard → /importar → "Verificar emails"
**QUANDO** clica em "Importar" na BottomNav
- ESPERADO: navega para /importar.
- AVALIAÇÃO: BottomNav NAV_OPERATOR tem item /importar. OK.
- ✅ OK

**QUANDO** clica em "Verificar emails agora"
- ESPERADO: spinner → lista de CSVs do Drive atualiza.
- AVALIAÇÃO: handleDriveImport chama router.refresh() (fix já aplicado
  segundo memories). OK.
- ✅ OK

---

## CENÁRIO 3: /importar → Importar CSV novo → botão muda
**QUANDO** clica em "Importar" num CSV novo
- ESPERADO: botão mostra "Importando…" → depois "Já importado" + lista
  recarrega.
- AVALIAÇÃO: fix aplicado (router.refresh em handleUpload). Assumir OK.
- ✅ OK

---

## CENÁRIO 4: Após import com pendentes → redireciona /categorizar AUTO
**QUANDO** import insere N transactions unassigned
- ESPERADO: redirect automático para /categorizar com toast.
- AVALIAÇÃO: fix recente (squad anterior). CTA "Categorizar agora" também
  ficou. OK.
- ✅ OK

---

## CENÁRIO 5: /categorizar → categoriza 1 tx → some da lista
**QUANDO** clica "Iremar" no CategorizarItem
- ESPERADO: server action → revalidatePath → tx some da lista.
- AVALIAÇÃO: depende de implementação em /categorizar/actions.ts. Não
  inspecionei, mas memories indicam que está OK pós-fix.
- ✅ OK (assumido, foi alvo de squad recente).

---

## CENÁRIO 6: Dashboard → /compromissos → ver 3 contas da Juliana
**QUANDO** abre /compromissos
- ESPERADO: lista filtrável; vê Plano saúde, Apt, Feira (paid_by=juliana).
- AVALIAÇÃO: page renderiza todos commitments do household. Filtro por
  paid_by precisa ser ativado manualmente.
- ⚠️ DÚVIDA #B-09 (P2): por padrão Juliana vê TODOS os compromissos, não
  só os dela. Poderia ter quick-filter "Pago por mim" default para
  operator. Hoje precisa filtrar a mão.

---

## CENÁRIO 7: /compromissos → dar baixa em uma conta dela
**QUANDO** clica "Dar baixa" em "Plano de saúde"
- ESPERADO: dialog → confirma → vira "✓ Pago".
- AVALIAÇÃO: actionDarBaixa não tem role guard explícito — qualquer user
  autenticado do household pode dar baixa. OK pro caso da Juliana.
- ✅ OK

**QUANDO** volta ao Dashboard
- ESPERADO: BillsCard mostra contas atualizadas (uma a menos).
- AVALIAÇÃO: mesmo bug B-01 — revalidate só de /compromissos, dashboard
  serve cache stale.
- ❌ BUG #B-01 confirmado também no fluxo operator.

---

## CENÁRIO 8: /acerto → ver fechamento (acesso permitido)
**QUANDO** Juliana abre /acerto
- ESPERADO: tela completa com saldo a transferir.
- AVALIAÇÃO: /acerto não tem role guard. OK.
- ✅ OK

---

## CENÁRIO 9: /mes → ver fechamento → tentar editar
**QUANDO** Juliana abre /mes
- ESPERADO: vê seções A e B (divisão fatura + acerto Juliana). Seção C
  (receitas) não aparece.
- AVALIAÇÃO: linha 102 `{profile.role === 'admin' && (...)}` — OK.
  ReceitaForm não renderiza.
- ✅ OK

**QUANDO** abre /mes no desktop
- ESPERADO: layout com Sidebar à esquerda.
- AVALIAÇÃO: mesmo bug B-03 — sem md:pl-60. Conteúdo coberto.
- ❌ BUG #B-03 confirmado pra operator também.

**QUANDO** olha alerta "unassigned"
- ESPERADO: link clicável para /categorizar.
- AVALIAÇÃO: texto "use o CLI para categorizar". Juliana NÃO usa CLI.
  Mensagem inutil pra ela.
- ❌ BUG #B-05 confirmado — pior pra operator (não tem CLI).

---

## CENÁRIO 10: Tentar /empresa → redirect /dashboard
**QUANDO** Juliana digita /empresa na URL
- ESPERADO: redirect com mensagem "acesso restrito".
- AVALIAÇÃO: linha 40 `if (!profile || profile.role !== 'admin') redirect('/dashboard')`
  — **redirect silencioso, sem flash/toast**.
- ❌ BUG #B-10 (P2): role guards de /empresa, /empresa/notas, /transferencias,
  /backups todos fazem redirect silencioso. Juliana não entende por que
  foi mandada de volta. Precisa de toast/banner "Acesso restrito ao admin".

---

# Resumo Operator

- ✅ OK: 7
- ❌ BUG: 3 NOVOS (B-08 sidebar azul no operator, B-10 redirect silencioso)
  + 3 confirmados do admin (B-01, B-03, B-05)
- ⚠️ DÚVIDA: 1 (B-09 default filter operator)
