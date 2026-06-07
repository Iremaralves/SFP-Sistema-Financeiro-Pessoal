# Plano de Melhorias — i2 Finance · 2026-05-18
*Gerado pelo squad i2-melhorias: Sofia (UX) · Pedro (Perf) · Lena (PM)*

---

## Resumo Executivo

- **Total de melhorias identificadas:** 38
- **Quick Wins (alto impacto, baixo esforço):** 8
- **Grandes Apostas (alto impacto, alto esforço):** 5
- **Estado atual do sistema:** 7/10 (UX Iremar) · 4/10 (UX Juliana) · 6/10 (Performance)

**Diagnóstico em uma linha:** O app tem estrutura sólida e lógica de negócio correta. O que trava o dia a dia são pequenos atritos acumulados — feedback ausente, texto invisível, queries sem limite. Nenhum item aqui exige reescrever nada do zero.

---

## Correções Obrigatórias — P0 antes de qualquer melhoria

> Estes 5 itens são bugs funcionais ou riscos técnicos que precisam ser corrigidos ANTES de qualquer nova feature. São rápidos e têm impacto imediato.

| # | Problema | Onde | O que fazer | Esforço |
|---|---|---|---|---|
| P0-1 | `select('*')` em `transactions` sem colunas específicas | `dashboard/page.tsx:29`, `lancamentos/page.tsx:58`, `contas/page.tsx:34` | Substituir por `select('id, description, amount, occurred_on, responsible, entity_id, source')` em cada query | 15 min |
| P0-2 | `/lancamentos` sem `.limit()` quando `mes=todos` — busca o banco inteiro | `lancamentos/page.tsx:61-67` | Adicionar `.limit(200)` na query sem filtro de data. Mover filtros `q`, `min`, `max` para `.ilike()` e `.gte().lte()` no Supabase | 30 min |
| P0-3 | `FiscalNoteForm` faz 2 queries Supabase no browser durante cada upload | `empresa/FiscalNoteForm.tsx:63-71` | Passar `householdId` como prop do `empresa/page.tsx` para o componente e remover `auth.getUser()` + `profiles.select()` client-side | 20 min |
| P0-4 | `Suspense fallback={null}` em 4 lugares causa CLS (layout shift visível) | `empresa/page.tsx:194,204`, `lancamentos/page.tsx:125`, `compromissos/page.tsx:196` | Substituir `fallback={null}` por skeleton com altura estimada equivalente ao componente | 45 min |
| P0-5 | Alerta "Categorize via CLI: i2fin categorizar" exposto na UI de produção | `DashboardAdmin` — componente de alerta de unassigned | Remover instrução de terminal. Substituir por: "X lançamentos sem categoria — [Ver lançamentos]" com link para `/lancamentos?sem-categoria=true` | 15 min |

**Tempo total P0: ~2h. Faça em sequência antes de qualquer outro item.**

---

## Quick Wins — Semana 1 (alto impacto, baixo esforço)

> Ordenados por impacto/esforço. Cada item é menos de 1 dia de trabalho.

| ID | Feature | Dor resolvida | Esforço | Impacto | Área |
|---|---|---|---|---|---|
| QW-1 | **Toast/Snackbar global com Sonner** | Nenhuma ação do app tem feedback visual. Dar baixa, salvar NF, adicionar lançamento — tudo some em silêncio. | 3–4h — instalar `sonner`, criar wrapper de contexto, conectar nos 5 pontos: dar baixa, salvar NF, salvar faturamento, adicionar lançamento, registrar transferência | Alto — afeta TODA escrita do app | UX + Produto |
| QW-2 | **Alerta de NF não emitida no dashboard** | Faturamento registrado mas NF esquecida = multa de ISS. Hoje não há aviso nenhum. | 2–3h — condicional: `faturamento != null && fiscal_note == null && dia >= 15`. Exibir: "NF de [mês] ainda não emitida" no card i2 do dashboard | Alto — risco fiscal real | Produto |
| QW-3 | **Resultado Acumulado YTD em /empresa** | Iremar precisa somar mês a mês manualmente para saber o resultado do ano. | 3–4h — query de `income_records` + `transactions` filtrada por `year = atual`. Card colapsável no topo de /empresa: Faturamento YTD / Despesas YTD / Resultado YTD | Alto — visão que todo PJ precisa | Produto |
| QW-4 | **"Registrar recebimento de Juliana" direto no dashboard** | Iremar precisa ir em /mes ou outra tela para registrar que recebeu a transferência. Não há caminho óbvio. | 3–4h — botão inline no DashboardAdmin quando `julianaTransf < julianaPart`. Abre modal simples: campo de valor + confirmar → Server Action cria `income_record` tipo `juliana_transfer` | Alto — fluxo mensal do casal | UX + Produto |
| QW-5 | **Remover "Importar CSV" da BottomNav do operator (Juliana)** | Juliana nunca vai importar extrato. O slot ocupa espaço valioso e confunde a navegação. | 30min — em `NAV_OPERATOR`, trocar `{ href: '/importar', icon: '↑', label: 'Importar' }` por `{ href: '/compromissos', icon: '◫', label: 'Contas' }` | Alto — navegação primária da Juliana | UX |
| QW-6 | **Substituir `select desabilitado` em /empresa por texto simples** | O `<select disabled>` parece quebrado. Usuário tenta clicar, não funciona, fica confuso. As setas já fazem a navegação. | 15min — remover `<select>`. Colocar `<p className="text-white font-medium text-center">{mesLabel}</p>`. Opcionalmente tornar clicável para abrir modal de mês. | Alto — UX toda vez que /empresa é aberta | UX |
| QW-7 | **Touch targets mínimo 44px nas áreas críticas** | Juliana não consegue tocar em tabs de /compromissos (28px), botão ×, ícone de editar cartão — todos abaixo do mínimo. | 1–2h — tabs de entidade: `py-1.5` → `py-3`. Botão `×` do form: adicionar `p-3`. Ícone `✎` do cartão: envolver em botão com padding ou substituir por link full-row. | Alto — usabilidade básica Juliana | UX |
| QW-8 | **Filtro de data em `income_records` de /relatorios** | Query busca todos os registros históricos do household. Só usa últimos 12 meses. | 5min — adicionar `.gte('reference_month', mesInicio)` na query de `relatorios/page.tsx:65-70` | Médio — evita overfetch crescente | Perf |

---

## Sprints 2–4 — Melhorias Estruturais (médio esforço, alto impacto)

> 1 a 3 dias por item. Podem ser feitos em qualquer ordem dentro deste bloco.

| ID | Feature | Dor resolvida | Esforço | Impacto |
|---|---|---|---|---|
| ME-1 | **Dar baixa em lote nos compromissos** | 5–8 boletos mensais exigem 5–8 toques individuais. Sem bulk action. | M (1–2 dias) — checkbox de seleção múltipla + botão "Dar baixa nos selecionados". O `DarBaixaButton` já existe; precisa de estado de seleção + Server Action batch | Alto — tarefa semanal recorrente |
| ME-2 | **Card de fechamento mensal no dashboard (dias 1–10)** | Fluxo de registrar faturamento PJ tem 8–12 toques. Sem lembrete, Iremar esquece. | M (2 dias) — card no DashboardAdmin entre dias 1–10 quando faturamento do mês anterior está ausente. Mostra: "Fechamento de [mês] pendente" + campo inline de valor + link para /empresa | Alto — evita mês sem DRE |
| ME-3 | **Tela "Minha Situação" para Juliana (redesign DashboardOperator)** | Juliana abre o app e não sabe o que fazer. "Lançamento" é jargão. "Casal ÷ 2" confunde. Não há CTA de transferência. | M (2–3 dias) — 3 estados: "Você deve R$X → [Já transferi]" / "Tudo certo! Transferiu R$X em [data]" / "Nenhuma despesa ainda". Trocar "Lançamento" por "Gasto". Remover redundâncias visuais da EquacaoCard. | Alto — razão de existir do app para Juliana |
| ME-4 | **Categorização de lançamentos direto na UI (sem CLI)** | Pós-importação de CSV, Iremar precisa usar terminal para categorizar. App não tem fluxo mobile para isso. | M (2–3 dias) — badge "Sem categoria" em lançamentos sem responsável + botão inline "Categorizar" abre drawer com dropdown de responsável/entidade. Server Action de update já deve existir. | Alto — desbloqueia fluxo mobile-first |
| ME-5 | **Pró-labore e DAS MEI no DRE** | DRE não reflete a realidade fiscal: faltam as duas despesas obrigatórias de MEI. | M (2 dias) — duas linhas fixas no DRE PJ: Pró-labore (valor configurável) e DAS MEI (valor fixo ou calculado). Campo "Pago / Pendente" por mês. | Alto — DRE incorreto sem isso |
| ME-6 | **Waterfall de queries em /empresa → 2 rodadas de Promise.all** | 5 queries sequenciais. Podiam ser 2 rounds paralelos. ~160ms de TTFB desperdiçado. | M (45min) — Round 1: `Promise.all([transactions, recurring_commitments, income_records])`. Round 2: `Promise.all([monthly_obligations, fiscal_notes])`. Ambos dependem do Round 1. | Alto — TTFB de /empresa |
| ME-7 | **Escala tipográfica mínima 12px em toda a UI** | Textos em `text-[9px]` e `text-[10px]` são ilegíveis em celular real. Especialmente nos labels da EquacaoCard e rodapés de /compromissos. | M (2–3h distribuídas) — auditar e substituir todos os `text-[9px]` e `text-[10px]` funcionais por `text-xs` (12px) mínimo. Textos decorativos: adicionar `aria-hidden`. | Alto — acessibilidade básica Juliana |
| ME-8 | **Gráfico de barras SVG no fluxo de caixa de /relatorios** | 12 meses de dados em tabela de texto. Em mobile, comparar linhas não é natural. | M (1–2 dias) — barras SVG inline: receita (verde) vs. despesa (vermelho) por mês. Usar Recharts se já no projeto, ou SVG manual para evitar bundle extra. | Médio — legibilidade em mobile |
| ME-9 | **Feedback visual imediato no DarBaixaButton** | Usuário toca "Dar baixa", não sabe se funcionou sem recarregar. | M (3–4h) — após Server Action de baixa: exibir badge "Pago ✓" imediatamente no item (optimistic update ou toast via QW-1). | Médio — confiança do usuário |
| ME-10 | **Projeção de gasto até fim do mês no dashboard** | Iremar não sabe se está no ritmo certo. Sem projeção, só vê o gasto atual isolado. | P–M (2–3h) — indicador abaixo do total: "Projeção: R$X até fim do mês" calculado por `(gasto_atual / dias_passados) * dias_no_mes`. Comparar com mês anterior. Dados já existem. | Médio — contexto para decisão |

---

## Grandes Apostas — Q3 2026 (alto esforço, alto impacto)

> Planejamento necessário. Não iniciar sem terminar os blocos anteriores.

| ID | Feature | Por que vale | Esforço estimado |
|---|---|---|---|
| GA-1 | **Notificação de fechamento de fatura para Juliana (Web Push)** | Juliana não tem hábito de abrir o app. A notificação cria o gatilho mensal. Sem ela, a adoção depende de memória. | G (1 semana) — service worker, VAPID, tabela de subscriptions, definição do "evento de fechamento". |
| GA-2 | **PWA instalável + biometria (WebAuthn)** | Transforma o app em "app de verdade" no celular da Juliana. Ícone na homescreen + Face ID/digital = barreira de acesso zero. Fazer PWA primeiro (P), biometria depois (G). | PWA: P (4–6h). Biometria: G (1 semana). Pode fazer em fases. |
| GA-3 | **Alertas de variação mensal por categoria ("você gastou X% mais em restaurantes")** | O app tem dados mas não gera insight nenhum. Essa é a diferença de um app "inteligente" vs. planilha. Requer campo de categoria em transactions — verificar existência antes de iniciar. | M–G (2–3 dias de lógica + calibragem) — desvio > 30% vs. média dos 3 meses anteriores. |
| GA-4 | **Suporte a importação OFX além de CSV** | Praticamente todo banco brasileiro exporta OFX. Elimina a dependência de formato específico por banco. Lib `ofx-js` já existe em npm. | M (2 dias) — parser OFX → converter para formato de `transactions` existente → reutilizar fluxo de categorização. |
| GA-5 | **Exportação PDF do DRE mensal** | Iremar compartilha DRE com contador via screenshot. PDF resolve isso com profissionalismo. | M (2–3 dias) — `@react-pdf/renderer` no servidor. Botão "Exportar PDF" em /empresa. Cuidado com bundle size. |

---

## Nao fazer agora

> Parecem boas ideias mas o ROI para dev solo não compensa no momento.

- **NFSe via API da prefeitura:** Cada município tem API diferente e autenticação por certificado digital. Variabilidade regulatória é inviável para dev solo. Manter upload manual de PDF.
- **Open Finance (receptor de dados):** Processo burocrático no Banco Central. Escopo incompatível com dev solo.
- **Orçamento por categoria configurável:** Sem histórico consolidado de categorias, criar orçamentos é prematuro. Fazer depois de ME-4 (categorização na UI) ter rodado por 2–3 meses.
- **Score de saúde financeira gamificado:** Sem campo de "orçamento base" no app, o score não tem referência. Feature interessante mas prematura.
- **Multi-household / multi-empresa:** Escopo creep. O app serve uma família específica.
- **OCR de nota fiscal por câmera:** A maioria dos gastos entra via CSV. Esforço G para uso marginal. Reavaliar quando a entrada manual for > 30% dos lançamentos.
- **Integração com apps de investimento:** Fora do escopo de controle de fluxo de caixa.
- **IA generativa / chat de suporte:** Overhead técnico e custo operacional incompatíveis com dev solo.

---

## Roadmap Sugerido — 90 dias

### Semana 1–2: Correções P0 + Quick Wins

**Dia 1 (2h):**
1. P0-1: Corrigir `select('*')` em transactions (dashboard, lancamentos, contas)
2. P0-5: Remover instrução CLI do alerta de unassigned

**Dia 2 (2h):**
3. P0-3: Passar `householdId` como prop para FiscalNoteForm
4. P0-2: Adicionar `.limit(200)` em lancamentos + mover filtros q/min/max para Supabase
5. QW-8: Filtro de data em income_records de /relatorios (5 min, faça junto)

**Dia 3 (4h):**
6. P0-4: Substituir `fallback={null}` por skeletons em 4 lugares
7. QW-6: Trocar select desabilitado em /empresa por texto simples (15 min)
8. QW-5: Remover "Importar CSV" da BottomNav do operator (30 min)

**Dia 4–5 (1 dia):**
9. QW-1: Instalar Sonner e conectar em todos os pontos de escrita do app

**Semana 2:**
10. QW-2: Alerta de NF não emitida (2–3h)
11. QW-3: Resultado Acumulado YTD em /empresa (3–4h)
12. QW-4: "Registrar recebimento de Juliana" no dashboard (3–4h)
13. QW-7: Touch targets 44px nos itens críticos (1–2h)

---

### Mes 2: Melhorias Estruturais

**Semana 3:**
- ME-6: Promise.all em /empresa (45 min — fazer primeiro, é o mais rápido)
- ME-7: Escala tipográfica 12px mínima (distribuir ao longo da semana)
- ME-1: Dar baixa em lote nos compromissos

**Semana 4:**
- ME-4: Categorização de lançamentos na UI (sem CLI)
- ME-5: Pró-labore e DAS MEI no DRE

**Semana 5:**
- ME-3: Tela "Minha Situação" para Juliana
- ME-9: Feedback visual no DarBaixaButton

**Semana 6:**
- ME-2: Card de fechamento mensal no dashboard
- ME-10: Projeção de gasto até fim do mês
- ME-8: Gráfico de barras em /relatorios

---

### Mes 3: Primeira Grande Aposta

**GA-4 + GA-5 (Suporte OFX + Exportação PDF)** são as melhores primeiras Grandes Apostas por três razões:

1. **GA-4 (OFX):** Esforço M, impacto alto, sem dependências externas. Lib `ofx-js` pronta. Elimina o ponto de atrito mais recorrente do Iremar (importação manual por banco).
2. **GA-5 (PDF do DRE):** Esforço M, caso de uso claro (contador), resolve uma fricção mensurável ("tirar screenshot do app").
3. Ambos são funcionalidades discretas — não interferem com o restante do app enquanto estão em desenvolvimento.

Fazer **GA-1 (Web Push para Juliana)** logo em seguida, porque o crescimento do engajamento da Juliana depende de um gatilho externo ao app.

---

## Metrica de Sucesso

Sem analytics complexo. Métricas simples verificáveis pelo próprio Iremar:

| O que melhorou | Como medir |
|---|---|
| Performance de carregamento | Usar DevTools > Network > Disable Cache + medir tempo de resposta de /empresa antes e depois das correções P0. Alvo: < 800ms TTFB. |
| Adoção Juliana | Contar quantas vezes por mês ela abre o app (verificar logs Supabase Auth). Alvo: pelo menos 2× por semana. |
| Velocidade do fechamento mensal | Cronometrar o fluxo completo de fechamento (faturamento + NF + baixa em compromissos) antes e depois. Alvo: < 5 min total. |
| Erros silenciosos eliminados | Após implementar Sonner (QW-1): se o toast aparece, a ação funcionou. Nenhum "será que salvou?" mais. |
| Juliana auto-suficiente | Ela consegue verificar quanto deve e registrar a transferência sem pedir ajuda ao Iremar. Teste: deixar ela fazer sozinha depois da ME-3. |

---

*Plano consolidado por Sofia (UX) · Pedro (Perf) · Lena (PM) — squad i2-melhorias · 18/05/2026*
