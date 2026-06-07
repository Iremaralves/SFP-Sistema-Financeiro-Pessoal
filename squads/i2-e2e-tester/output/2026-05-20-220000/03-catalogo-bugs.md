# Catálogo de Bugs — i2-e2e-tester run 2026-05-20

10 cenários admin + 10 cenários operator = 20 fluxos. 8 bugs distintos + 2
dúvidas. Detalhamento:

---

## B-01 (P1) · revalidate ausente do /dashboard após dar baixa
- **Cenário:** Admin C1+C2, Operator C7 — dar baixa em /compromissos e
  voltar pro /dashboard.
- **Arquivo:** `apps/web/src/app/compromissos/actions.ts:82, 110`
- **Sintoma:** BillsCard do dashboard continua mostrando a conta como
  pendente após pagar em /compromissos.
- **Fix sugerido:** Adicionar `revalidatePath('/dashboard')` ao lado de
  `revalidatePath('/compromissos')` em actionDarBaixa e actionDesfazerBaixa.
- **Como time-de-testes deixou passar:** lia o código e via revalidatePath
  presente — não notou que era pra rota errada. Faltou seguir o fluxo
  "dou baixa → volto pro dashboard → o BillsCard mudou?".

---

## B-03 (P1) · /mes sem md:pl-60 → Sidebar sobrepõe conteúdo no desktop
- **Cenário:** Admin C7, Operator C9.
- **Arquivo:** `apps/web/src/app/mes/page.tsx:54`
- **Sintoma:** No desktop o Sidebar fixo de 240px cobre o início do header
  e cards do /mes.
- **Fix sugerido:** Trocar `className="min-h-screen pb-28"` por
  `className="min-h-screen pb-28 md:pl-60"`.
- **Como time-de-testes deixou passar:** auditou em mobile (375px), onde
  Sidebar é `hidden md:flex`. No mobile o bug não aparece.

---

## B-04 (P2) · Sidebar com nome vazio em /mes
- **Cenário:** Admin C7.
- **Arquivo:** `apps/web/src/app/mes/page.tsx:129`
- **Sintoma:** No rodapé do Sidebar aparece em branco onde deveria estar
  "Iremar".
- **Fix sugerido:** Trocar `<BottomNav role={profile.role as 'admin' | 'operator'} />`
  por `<BottomNav role={profile.role as 'admin' | 'operator'} name={profile.name ?? ''} />`.
- **Como time-de-testes deixou passar:** prop `name` é opcional na assinatura
  do componente — TypeScript não acusou. Auditoria foi de tipos, não de UX.

---

## B-05 (P1) · Mensagem stale "use o CLI para categorizar"
- **Cenário:** Admin C7, Operator C9.
- **Arquivo:** `apps/web/src/app/mes/page.tsx:65-72`
- **Sintoma:** Quando há `unassigned > 0` mostra:
  `"X lançamento(s) sem responsável — use o CLI para categorizar."`
  Juliana não tem CLI. Iremar tem /categorizar agora também.
- **Fix sugerido:** trocar a mensagem por um `<Link href="/categorizar">`
  estilizado, com texto: `"X lançamento(s) sem responsável — toque para
  categorizar →"`.
- **Como time-de-testes deixou passar:** texto estático foi escrito antes
  da /categorizar existir. Auditoria não validou que strings continuam
  coerentes com features mais recentes (stale copy).

---

## B-06 (P1) · /lancamentos/[id] sem md:pl-60
- **Cenário:** Admin C8.
- **Arquivo:** `apps/web/src/app/lancamentos/[id]/page.tsx:209` (e linhas
  189, 197 — estados de loading/erro).
- **Sintoma:** Mesmo problema do /mes — Sidebar cobre conteúdo no desktop.
- **Fix sugerido:** Adicionar `md:pl-60` aos 3 wrappers `min-h-screen`.
- **Como time-de-testes deixou passar:** mesmo motivo do B-03 — só testou
  mobile.

---

## B-08 (P2) · Sidebar com cor azul (admin) mesmo no operator
- **Cenário:** Operator C1.
- **Arquivo:** `apps/web/src/components/Sidebar.tsx:74-77`
- **Sintoma:** Itens ativos do Sidebar da Juliana ficam azuis
  (`rgba(59,130,246,...)` + `#60a5fa`), enquanto o resto do app dela
  (dashboard, badge) é rosa (`#ec4899`). Quebra a paridade UX.
- **Fix sugerido:**
  ```ts
  const accent = role === 'admin' ? '#3b82f6' : '#ec4899';
  const accentLight = role === 'admin' ? '#60a5fa' : '#f9a8d4';
  // depois usar `${accent}1f` no background e accentLight no color
  ```
- **Como time-de-testes deixou passar:** Sidebar foi criado pro admin
  primeiro e nunca foi reauditado quando virou compartilhado com operator.

---

## B-10 (P2) · Role guards com redirect silencioso
- **Cenário:** Operator C10 (cobre /empresa, /empresa/notas, /transferencias,
  /backups).
- **Arquivos:**
  - `apps/web/src/app/empresa/page.tsx:40`
  - `apps/web/src/app/empresa/notas/page.tsx:24`
  - `apps/web/src/app/transferencias/page.tsx:27`
  - `apps/web/src/app/backups/page.tsx:33`
- **Sintoma:** Juliana digita URL ou recebe link → cai em /dashboard sem
  explicação. Parece bug do sistema.
- **Fix sugerido:** trocar `redirect('/dashboard')` por
  `redirect('/dashboard?msg=acesso-restrito')` e mostrar toast/banner no
  dashboard quando esse param chega. Alternativa: page de "acesso negado"
  dedicada com link de volta.
- **Como time-de-testes deixou passar:** auditou que o guard EXISTE — não
  testou a UX do guard. Filosofia code-only.

---

## Dúvidas (não bugs, mas observações)

### B-02 (P2) · Cards de conta em /contas sem drill-down
- Cliente espera ver extrato ao clicar; hoje nada acontece. Decisão de produto.

### B-07 (P2) · Anexo só dentro do edit, não inline na lista
- Friccionoso pra uso real: precisa abrir o item pra anexar. Considerar
  ícone clipe inline no TransactionList.

### B-09 (P2) · /compromissos não tem filtro default "pago por mim" pro
operator
- Juliana vê todos os compromissos do household — fica perdida nos do Iremar.

---

# Sumário por severidade

- **P0:** 0 (nenhum bug bloqueante encontrado neste passe)
- **P1:** 4 (B-01, B-03, B-05, B-06)
- **P2:** 3 (B-04, B-08, B-10) + 3 dúvidas

# Por que o time-de-testes deixou passar (meta-análise)

1. **Auditoria 100% mobile.** B-03 e B-06 só aparecem em desktop ≥768px.
2. **Verifica existência, não comportamento.** B-10: existe role guard ✓.
   Mas redirect silencioso é UX ruim. Faltou passar pela jornada errada.
3. **Não cruza páginas.** B-01: leu actions.ts isoladamente, viu
   `revalidatePath('/compromissos')` e aprovou. Não simulou "volto pro
   dashboard depois".
4. **Strings = ignorado.** B-05: texto "use o CLI" passou batido — auditoria
   focou em lógica, não em coerência narrativa.
5. **Props opcionais = não preenchidos = OK.** B-04: TS permite, então
   passa. Mas o UI fica degradado.
