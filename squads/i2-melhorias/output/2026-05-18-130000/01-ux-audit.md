# Auditoria UX — i2 Finance · Sofia
**Data:** 18/05/2026  
**Auditora:** Sofia — UX Strategist  
**Método:** Revisão estática de código-fonte (pages + components), análise de fluxo de navegação e padrões de interação.

---

## Resumo Executivo

| Usuário | Nota UX | Diagnóstico principal |
|---|---|---|
| **Iremar** | 7 / 10 | App funcional e denso de informação, mas exige muitos toques para tarefas cotidianas. Algumas rotas são difíceis de encontrar. |
| **Juliana** | 4 / 10 | Dashboard útil, mas nav escondida atrás de "⋯ Mais", touch targets insuficientes em vários pontos, terminologia técnica que confunde. |

**Pontos críticos imediatos:**
1. A BottomNav do operator tem 5 itens — "Importar CSV" não tem nenhuma utilidade para Juliana no dia a dia.
2. O alerta de categorização ("Categorize via CLI: i2fin categorizar") aparece no dashboard de Iremar — é código de linha de comando exposto na UI de produção.
3. Textos em `text-[9px]` e `text-[10px]` são ilegíveis em telas de celular real, especialmente para a Juliana.
4. O fluxo "dar baixa" em compromissos (boleto/PIX) não tem feedback visual de sucesso claro — `DarBaixaButton` é um componente isolado sem confirmação visível no servidor.
5. Estados vazios existem mas são inconsistentes: alguns orientam o usuário, outros apenas confirmam a ausência de dados.

---

## Por Tela — Problemas e Oportunidades

### Dashboard (Admin — `DashboardAdmin`)

**O que funciona bem:**
- Equação visual "Pessoal + Casal ÷ 2 = Total" por pessoa é uma ideia excelente — comunica a divisão sem planilha.
- Card "i2 Soluções" clicável que leva direto ao /empresa é uma ótima atalho contextual.
- Hero com total da fatura em `text-4xl` garante legibilidade imediata.
- Alerta de lançamentos sem responsável é proativo.

**O que confunde:**
- O alerta de `unassigned > 0` instrui o usuário a rodar `i2fin categorizar` no terminal. Isso jamais deveria aparecer em uma UI de produção. É jargão de desenvolvedor disfarçado de mensagem de usuário. Iremar pode saber o que é, mas a mensagem gera fricção cognitiva mesmo assim.
- "Juliana deve transferir" aparece sempre, mesmo quando o valor é zero — o card fica presente com R$ 0,00, o que gera confusão ("ela me deve zero? ou não calculou ainda?").
- Os últimos 15 lançamentos são exibidos sem botão "Ver todos" claro — o usuário precisa saber ir em /lancamentos.
- Não há indicador de período mutável — o mês atual está fixado, não há forma de navegar para meses anteriores no dashboard.

**O que está faltando:**
- Atalho rápido "Dar baixa em compromissos" direto do dashboard quando há contas vencendo hoje.
- Indicador de progresso mensal (% do mês já gasto vs. média histórica).

---

### Dashboard (Operator — `DashboardOperator`)

**O que funciona bem:**
- Foco total em "Sua parte a pagar" — exatamente o que Juliana precisa saber.
- CTA "Adicionar lançamento" em rosa, grande e proeminente — excelente.
- Equação Pessoal + Casal ÷ 2 é clara visualmente.
- Barra de progresso indicando % da fatura pertencente a Juliana é intuitiva.

**O que confunde:**
- Os mini-textos dentro da EquacaoCard (`text-[9px]` com `uppercase tracking-wider`) são ilegíveis no mundo real. "Seus gastos", "Casal ÷ 2", "Total" ficam invisíveis em telas com escala de acessibilidade maior.
- "Casal (total)" no rodapé da card exibe a fórmula `÷ 2 = x p/ pessoa` — redundante com o que já está acima. Gera poluição visual.
- Os lançamentos recentes não têm indicação de qual é de quem — Juliana pode ver despesas do Iremar misturadas e se confundir ("por que aparece isso aqui?").

**O que está faltando:**
- Status claro: "Você já transferiu?" / "Falta R$ X" com ação de marcar transferência.
- Juliana não tem como saber se o valor já está atualizado ou se é de ontem.

---

### Lançamentos (`/lancamentos`)

**O que funciona bem:**
- Filtros por mês, responsável, origem, min/max e busca livre — cobertura excelente para Iremar.
- Botão "+ Novo" no header é visível e fácil de acessar.
- Label do período selecionado no subheader é contextual e útil.
- Fallback de 18 meses de histórico no seletor.

**O que confunde:**
- O componente `<Filtros>` não está no arquivo analisado, mas pelo código o `activeFiltersCount` conta o mês padrão como filtro ativo — um usuário sem nenhum filtro aplicado pode ver "1 filtro ativo" o que gera desorientação.
- Nenhuma indicação de totais de receita vs. despesa no cabeçalho — só `totalValor` que some despesas e receitas sem distinção.
- Sem distinção visual clara entre entradas e saídas na listagem (depende do `TransactionList`).

**O que está faltando:**
- Para Juliana: a tela de lançamentos é a mesma que para Iremar, com todos os filtros técnicos. Ela não precisa de filtro por "origem" ou "responsável" — gera ruído.
- Paginação ou infinite scroll — uma lista ilimitada em mobile é problema de performance e usabilidade.

---

### Compromissos (`/compromissos`)

**O que funciona bem:**
- Divisão clara entre "Boleto / PIX" e "Cartão de crédito" — arquitetura de informação correta.
- Badges de status (Pago / Atrasado / Vence hoje / A vencer) com cores consistentes.
- Filtro de entidade (Todas / Família / i2) bem posicionado.
- Estado vazio do boleto/PIX orienta o usuário com instrução.
- O badge "dia X" com cor do status é uma das melhores affordances do app.

**O que confunde:**
- O `DarBaixaButton` nos itens de boleto/PIX não tem confirmação inline de sucesso. O usuário toca, mas não sabe se funcionou sem recarregar a página.
- A seção de cartão tem um hint `text-[10px]` "Toque para editar tipo" — completamente invisível no mobile. Nenhum usuário lerá isso.
- O rodapé "Toque em qualquer conta para editar — mude para Boleto/PIX se necessário" em `text-[10px] text-white/18` (opacidade 18%) é ilegível e resolve um problema que deveria estar na própria UI do item.
- O ícone `✎` no canto direito do cartão também é `text-[10px] text-white/20` — praticamente invisível.
- A instrução "Cadastrar primeira conta" no estado vazio total é um link de texto simples — deveria ser um botão com destaque.
- A tela é exclusiva para admin (`profile.role !== 'admin' → redirect('/dashboard')`) — correto, mas não documentado na UI (usuário operator que eventualmente acesse recebe um redirect silencioso sem explicação).

**O que está faltando:**
- Feedback visual imediato ("Baixa registrada!") após dar baixa em boleto/PIX.
- Total da seção de cartão de crédito (a seção boleto/PIX tem totais de Pago/Pendente/Atrasado, mas cartão não mostra total).
- Possibilidade de dar baixa em cartão também (hoje é só link para editar).

---

### Contas (`/contas`)

**O que funciona bem:**
- Mini barra de progresso multicolor é visualmente elegante e comunica a proporção de cada um.
- Card de status Juliana com verde/rosa é claro e binário — ideal.
- Hero com total da fatura em `text-4xl` mantém a hierarquia visual correta.
- Os cards de PersonCard com mini barra individual são consistentes com o hero.
- Links rápidos para /mes e /compromissos são contextuais e úteis.

**O que confunde:**
- O título "Divisão da fatura" é excelente para Iremar mas estranho para Juliana se ela acessar (a tela não bloqueia operator, então é acessível via BottomNav).
- "atualizado agora" abaixo do contador de lançamentos pode ser enganoso — os dados são do servidor e podem ter até alguns segundos de defasagem em alta carga.
- Os cards `PersonCard` têm mini progress bar com lógica `Math.min(pct * 2.5, 100)` — o multiplicador 2.5 significa que uma pessoa com 40% da fatura já fica com barra cheia, distorcendo a percepção visual.
- Não há navegação entre meses — sempre o mês atual.

**O que está faltando:**
- Para Juliana: uma view simplificada que mostrasse apenas "você deve R$ X — transferir agora" com instrução de chave Pix seria muito mais efetivo que a divisão completa.
- Botão de ação "Registrar transferência de Juliana" — hoje o Iremar precisa ir em /mes ou outro lugar para registrar isso.

---

### Empresa (`/empresa`)

**O que funciona bem:**
- DRE simplificado com hierarquia clara: Faturamento → Despesas → Resultado.
- Indicação "Não registrado" em vermelho quando o faturamento está ausente é proativo.
- Navegação prev/next por mês com setas é intuitiva.
- Botão "Contas fixas ›" contextual para /compromissos?entidade=i2.
- Estado vazio das seções com dashed border é esteticamente consistente.

**O que confunde:**
- O `<select disabled>` para seleção de mês é um anti-padrão grave: um select desabilitado parece quebrado. O usuário vai tentar interagir e não vai entender por que não responde. A navegação real são as setas laterais — o select deveria ser substituído por um display de texto simples.
- "DRE" no título da seção é jargão contábil. Mesmo Iremar, que conhece TI, pode precisar de um segundo para processar. Para um app que aspira ser familiar, "Resultado do mês" seria mais acessível.
- O FiscalNoteForm só aparece se o faturamento já foi registrado — não há indicação prévia de que a NF pode ser adicionada, o que quebra o fluxo de quem quer registrar ambos ao mesmo tempo.
- Não há totalizador de "Resultado acumulado" — só o mês atual em isolamento.
- A lista de lançamentos PJ não é clicável (não leva a /lancamentos/[id]) — só exibe. Dificulta correção de erros.

**O que está faltando:**
- Aviso de alíquota ISS quando não há NF registrada ("Lembre de emitir a NF antes do dia X").
- Link direto para /empresa/notas no header ou em destaque — hoje está escondido em /Mais do bottom nav.

---

### Relatórios (`/relatorios`)

**O que funciona bem:**
- Divisão em 3 tabs (Fluxo / Pagar / Receber) é lógica e progressiva.
- Estado vazio de "Contas a Pagar" com verde e checkmark é positivo e motivador.
- Histórico de receitas na tab "Receber" é contextualmente útil.
- O totalizador de 12 meses na tab Fluxo dá visão consolidada rápida.

**O que confunde:**
- Os nomes das tabs são corretos para um gestor financeiro, mas "Contas a Receber" pode confundir — no contexto familiar, não há clientes. É na verdade "Faturamento i2 esperado". O label é impreciso para o contexto.
- A tab "Receber" mostra só os próximos 3 meses de faturamento i2 e um histórico de 6 — sem contexto de por que estão em "Contas a Receber" e não em /empresa.
- O fluxo de caixa exibe 12 meses sem filtro — para meses sem dados, o card fica com opacity 50% e todos os valores em "—". São muitos cards vazios que poluem a tela.
- Não há gráfico visual — só tabela de valores. Em mobile, comparar 12 linhas de texto não é natural.
- Os itens da tab "Pagar" não têm ação de marcar como pago — é só listagem de leitura.

**O que está faltando:**
- Exportação em PDF ou compartilhamento do relatório mensal.
- Gráfico de barras ou sparkline para o fluxo de caixa — mesmo um SVG inline simples já melhoraria muito a legibilidade.

---

### Notas Fiscais (`/empresa/notas`)

**O que funciona bem:**
- Agrupamento por mês de faturamento é a organização correta.
- Badge "NF #X" no header do card sinaliza imediatamente que a NF já existe.
- Botão "Adicionar Nota Fiscal" com borda dashed é um padrão de "adicionar" bem estabelecido.
- Feedback de upload ("Enviando... / PDF enviado") é claro.
- Double-confirm para excluir NF é boa prática de segurança.

**O que confunde:**
- O formulário `FiscalNoteForm` expande inline dentro do card — em mobile, o formulário (com 7+ campos) fica espremido dentro de um card que já estava dentro de uma lista. É uma das telas mais densas do app em mobile.
- O campo "Competência" (tipo `month`) com formato nativo do browser é inconsistente com os outros inputs que são estilizados. Em iOS especialmente o seletor de mês é incômodo.
- "Alíquota ISS (%)" é campo aberto — não há validation de range (0–100) e o placeholder "2.00" usa ponto decimal, mas o campo aceita vírgula. Pode gerar erros de parsing silenciosos.
- A rota `/empresa/notas` não aparece na BottomNav do operator — correto, mas também não há breadcrumb ou link contextual óbvio vindo de /empresa (só no menu "Mais").
- Após salvar a NF (`handleSave`), o form fecha sem reload da página — como é Server Action + estado React, funciona, mas não há toast/snackbar de confirmação. O usuário fecha o form e fica incerto.

**O que está faltando:**
- Toast de sucesso "NF salva!" após gravar.
- Validação de alíquota ISS (deve ser entre 0 e 20%).
- Link proeminente para /empresa/notas dentro da página /empresa.

---

### FiscalNoteForm (componente)

**O que funciona bem:**
- Cálculo automático de ISS e Líquido em tempo real é excelente UX.
- Upload de PDF com estado visual (idle/uploading/done) é bem pensado.
- O formulário distingue corretamente modo "Nova NF" vs "Editar NF".

**O que confunde:**
- O botão de fechar (`×`) usa `text-lg leading-none hover:text-white/60` — hover não funciona em touch. Em mobile o botão de fechar é um alvo de 24px sem padding adicional.
- O grid `grid-cols-2` com campos de formulário em mobile resulta em inputs com ~160px de largura em telas pequenas — justo para campo de número, mas apertado para "Data Emissão" e "Competência" que têm pickers nativos largos.
- O estado `uploadProgress === 'done'` mostra "✓ PDF enviado" mas o arquivo já foi enviado ao Supabase — se o usuário não salvar o form depois, a NF não é criada, mas o arquivo já está no storage. Silently orphaned.

---

## Juliana First — Barreiras de Adoção

Juliana é usuária **não-técnica, mobile-only**. Estas são as fricções que podem travar sua adoção:

### Barreira 1 — Terminologia opaca
- "Casal ÷ 2" pode não ser óbvio sem contexto. Melhor: "Gastos divididos com Iremar".
- Os mini-labels `text-[9px] uppercase tracking-wider` são ilegíveis em qualquer celular com font-size padrão. Ela não saberá o que cada número significa.
- "Sua parte: 38% da fatura" — percentual sem referência de "boa" ou "ruim".

### Barreira 2 — Navegação fragmentada
- A BottomNav operator tem: Início / Lançamentos / + / Importar / Contas.
- "Importar CSV" (ícone `↑`) é completamente irrelevante para Juliana e ocupa um slot valioso na nav. Ela nunca vai importar um extrato bancário.
- Não há indicação de qual aba está ativa além de um ponto de 4px abaixo do ícone — invisível para usuários com visão normal.

### Barreira 3 — Touch targets insuficientes
- Botões de ação como o `×` de fechar form: ~24px sem padding.
- Os mini-links `text-[10px]` como "Cadastrar primeira conta" e o `✎` de editar cartão no /compromissos são toques impossíveis em mobile.
- Tabs de entidade em /compromissos com `py-1.5` têm ~28px de altura — abaixo do mínimo recomendado de 44px.
- A `LogoutButton` no DashboardOperator: sem ver o componente, mas se estiver no canto superior direito ao lado do mês, provavelmente tem target pequeno.

### Barreira 4 — Falta de call-to-action clara
- Juliana entra no app, vê "R$ 847,32 — Sua parte a pagar". E então? Não há ação óbvia: "Como eu marco que já transferi?", "Preciso fazer alguma coisa?".
- O CTA "Adicionar lançamento" é proeminente, mas Juliana talvez não saiba o que é um "lançamento" nesse contexto.

### Barreira 5 — Ausência de confirmação de ações
- Após adicionar um lançamento (assumindo que /lancamentos/novo funciona), não há confirmação clara na tela atual. O usuário é redirecionado de volta — mas para onde?
- Não há notificações ou badges que indiquem "você tem algo pendente".

### Barreira 6 — Estados de erro invisíveis
- Erros de validação em formulários dependem do componente `FiscalNoteForm` e outros. Em formulários React sem feedback inline (fora da NF), erros de campo obrigatório podem não ser óbvios para usuária não-técnica.

---

## Iremar Workflow — Eficiência

### Tarefas repetitivas identificadas

**1. Registro mensal de faturamento PJ**
- Fluxo atual: BottomNav → "⋯ Mais" → Empresa → Mês correto → Clicar lápis/editar Faturamento → Preencher valor → Salvar → Abrir FiscalNoteForm → 7+ campos → Salvar NF
- Estimativa: 8–12 toques para completar o fechamento mensal completo
- Oportunidade: "Quick close" — um card no dashboard de admin do dia 1 do mês: "Registrar faturamento de [mês passado]" com campo inline.

**2. Dar baixa em compromissos mensais**
- Fluxo atual: BottomNav → "⋯ Mais" → Compromissos → Rolagem → DarBaixaButton para cada item
- Com 5–8 contas fixas, são 5–8 toques individuais sem bulk-action
- Oportunidade: "Marcar todas como pagas" ou seleção múltipla.

**3. Categorização de lançamentos**
- O alerta no dashboard aponta para CLI: completamente fora do fluxo mobile
- Oportunidade: Swipe para categorizar direto na lista de lançamentos (padrão Mail/Tinder).

**4. Verificar se Juliana transferiu**
- Fluxo atual: Dashboard → card "Juliana deve transferir" → se não mostrar ✅, ir em /contas para confirmar
- A informação está em dois lugares (dashboard + /contas) mas com granularidades diferentes
- Oportunidade: Card no dashboard com botão "Marcar transferência recebida" inline.

**5. Navegar entre meses em /empresa**
- As setas de mês funcionam, mas o select desabilitado confunde e não permite pular diretamente para um mês específico. Para consultar 6 meses atrás são 6 cliques.
- Oportunidade: Transformar o select em dropdown funcional ou permitir toque no label para abrir modal de seleção de mês.

---

## Consistência e Design System

### Inconsistências visuais identificadas

**1. Seletor de mês — padrões diferentes por tela**
- `/empresa`: setas laterais + select desabilitado (confuso)
- `/compromissos`: `FiltroMes` — componente não analisado, mas provavelmente scroll horizontal de chips
- `/lancamentos`: Filtros com select (componente `Filtros`)
- `/relatorios`: sem seletor de mês — sempre 12 meses fixos
- **Deveria haver um componente único de seleção de mês.**

**2. Tamanhos de texto inconsistentes para metadados**
- Alguns metadados usam `text-[9px]`, outros `text-[10px]`, outros `text-xs` (12px). Não há escala tipográfica definida — cada dev usou o que achou certo.
- Títulos de seção variam: `text-xs font-semibold uppercase tracking-wider` vs `text-white/25 text-[10px] uppercase tracking-wider`.

**3. Estados vazios com padrões diferentes**
- `/compromissos` vazio: box com borda dashed + mensagem + instrução de ação.
- `/empresa` seções vazias: box com borda dashed + só texto, sem instrução.
- `/relatorios/pagar` vazio: card verde com checkmark — positivo e motivador.
- `/empresa/notas` vazio: texto + link. Sem box.
- Deveria haver um componente `<EmptyState icon label action />` unificado.

**4. Bordas e backgrounds inconsistentes**
- Alguns cards usam `border: '1px solid rgba(255,255,255,0.08)'` diretamente
- Outros usam o objeto `glass` compartilhado
- Outros usam inline style direto
- Não há token de design — se o tema mudar, serão 50+ lugares para atualizar.

**5. Botões de ação primária sem padrão único**
- "+ Novo" nos headers: `px-4 py-2 rounded-xl` com gradient — consistente entre Lançamentos e Compromissos. Bom.
- "Adicionar lançamento" no DashboardOperator: `py-4 rounded-2xl` — maior, diferente.
- Botão salvar no FiscalNoteForm: `py-2.5 rounded-xl text-xs` — menor que os outros.
- Os três representam ações primárias mas têm tamanhos e estilos distintos.

**6. Ícones da BottomNav — mistura de unicode e emoji**
- Admin nav: `'⌂', '≡', '+', '◉', '⋯'` — unicode puro
- Drawer "Mais": `'🏢', '📊', '↑', '🧾'` — emoji
- Sidebar desktop: `'⌂', '≡', '◫', '◉', '🏢', '📊', '↑'` — mistura
- Inconsistência visual entre plataformas: unicode renderiza diferente no iOS vs Android.

---

## Estados Vazios e Feedback

### Qualidade dos estados vazios

| Tela / Seção | Estado Vazio | Qualidade | Observação |
|---|---|---|---|
| /compromissos — Boleto/PIX | Dashed box + texto + instrução | Bom | Orienta com "+ Nova" |
| /compromissos — total | Texto + link subline | Regular | Link de texto, sem destaque |
| /empresa — contas fixas | Dashed box + só texto | Fraco | Sem ação |
| /empresa — lançamentos PJ | Dashed box + só texto | Fraco | Sem ação |
| /empresa/notas — sem faturamento | Texto + link | Regular | Orienta para /empresa |
| /relatorios — pagar | Card verde + checkmark | Excelente | Positivo e motivador |
| /relatorios — fluxo (meses sem dados) | Cards com opacity 50% | Fraco | Polui a tela com 12 cards opacos |

### Qualidade do feedback de ações

| Ação | Feedback atual | Qualidade | Problema |
|---|---|---|---|
| Dar baixa em compromisso (DarBaixaButton) | Não verificado no código analisado | Incerto | Botão sem feedback visível na listagem pai |
| Salvar NF (FiscalNoteForm) | Fecha o form, sem toast | Fraco | Usuário não sabe se salvou |
| Upload de PDF | "Enviando... / ✓ PDF enviado" | Bom | Claro e sequencial |
| Excluir NF | Double-confirm antes | Bom | Seguro |
| Salvar faturamento (FaturamentoForm) | Não analisado diretamente | Incerto | — |
| Adicionar lançamento | Redirect (assumido) | Regular | Sem confirmação na tela de destino |
| Registrar transferência Juliana | Não existe como ação direta | Ausente | Precisa ser implementado |

### Ausência crítica: sem sistema de toast/notificação
O app não tem um sistema global de feedback (toast, snackbar, alert). Cada form resolve isso individualmente — o FiscalNoteForm mostra erro inline, mas o sucesso não tem representação visual. Isso é uma lacuna de design system, não de feature individual.

---

## Top 10 Melhorias de UX

Priorizadas por impacto (usuários afetados × frequência de uso × gravidade da fricção).

---

### #1 — Substituir instrução de CLI no alerta de unassigned
**Impacto:** Alto (aparece para Iremar toda vez que há lançamentos sem categoria)  
**Esforço:** P  
**O que fazer:** Trocar "Categorize via CLI: i2fin categorizar" por um link direto para a página de categorização, ou remover a instrução e deixar só o contador com link para /lancamentos filtrado por "sem responsável".

---

### #2 — Toast/Snackbar global de feedback
**Impacto:** Alto (Juliana e Iremar — toda ação de salvar/excluir/dar baixa)  
**Esforço:** M  
**O que fazer:** Implementar um contexto React de notificações (Sonner, react-hot-toast ou componente próprio). Chamar em: salvar NF, salvar faturamento, dar baixa em compromisso, adicionar lançamento. Mensagens em português claro: "Baixa registrada!", "Nota Fiscal salva!", "Lançamento adicionado!".

---

### #3 — Aumentar touch targets para mínimo 44px
**Impacto:** Alto (Juliana — afeta usabilidade básica)  
**Esforço:** P  
**O que fazer:** 
- Tabs de entidade em /compromissos: mudar de `py-1.5` para `py-3`.
- Botão `×` do form: adicionar `p-3` ao redor.
- Ícone `✎` no cartão: envolver em botão com padding adequado ou remover em favor de link full-row.
- Mini-links `text-[10px]`: transformar em botões ou aumentar para `text-sm` com área de toque.

---

### #4 — Substituir o select desabilitado em /empresa por texto clicável
**Impacto:** Alto (Iremar — toda vez que abre /empresa)  
**Esforço:** P  
**O que fazer:** Remover `<select disabled>` e exibir `<p className="text-white font-medium text-center">{mesLabel}</p>`. As setas já fazem a navegação. Opcionalmente, tornar o texto clicável para abrir um dropdown/modal de seleção rápida de mês.

---

### #5 — Substituir "Importar CSV" por funcionalidade útil para Juliana na BottomNav
**Impacto:** Alto (Juliana — navegação primária)  
**Esforço:** P  
**O que fazer:** No `NAV_OPERATOR`, trocar `{ href: '/importar', icon: '↑', label: 'Importar' }` por `{ href: '/compromissos', icon: '◫', label: 'Contas' }` ou uma tela simplificada de status da transferência. CSV import é fluxo de admin, não de operator.

---

### #6 — Escala tipográfica mínima de 12px para textos de UI
**Impacto:** Alto (Juliana + acessibilidade geral)  
**Esforço:** M  
**O que fazer:** Auditar e remover todos os `text-[9px]` e `text-[10px]` de textos que comunicam informação funcional (labels, status, instruções). Usar no mínimo `text-xs` (12px). Textos decorativos ou puramente visuais podem manter tamanho menor, mas com `aria-hidden`.

---

### #7 — Ação "Marcar transferência recebida" no dashboard
**Impacto:** Alto (fluxo principal Iremar → Juliana)  
**Esforço:** M  
**O que fazer:** No DashboardAdmin, quando `julianaTransf < settlement.julianaPart`, mostrar botão inline "Registrar recebimento de Juliana" que abre modal/form com campo de valor. Isso elimina a necessidade de ir em /mes ou outro lugar para registrar a income_record de `juliana_transfer`.

---

### #8 — Componente unificado de EmptyState
**Impacto:** Médio (consistência de experiência em todas as telas)  
**Esforço:** P  
**O que fazer:** Criar `<EmptyState icon={string} title={string} description={string} actionLabel={string} actionHref={string} />` e substituir os 6+ estados vazios distintos pelo componente padronizado. Padrão: ícone grande, título claro, descrição opcional, botão de ação primária.

---

### #9 — Indicador de mês navegável no Dashboard
**Impacto:** Médio (Iremar — consulta de histórico)  
**Esforço:** M  
**O que fazer:** Adicionar seletor de mês no DashboardAdmin (setas prev/next, igual a /empresa). O dashboard sempre fixa no mês atual — para consultar novembro, Iremar precisa ir em /lancamentos e filtrar manualmente. Permitir navegação de mês no dashboard reduziria esse fluxo para 2 toques.

---

### #10 — Card "Quick close" no primeiro dia do mês para Iremar
**Impacto:** Médio-alto (Iremar — fechamento mensal)  
**Esforço:** G  
**O que fazer:** Quando for o 1º ao 10º dia do mês e o faturamento do mês anterior não estiver registrado, exibir no DashboardAdmin um card de destaque: "Fechamento de [mês passado] pendente" com link direto para /empresa?mes=[mês-passado] e, opcionalmente, campo inline para digitar o valor. Elimina o fluxo de 8–12 toques atual.

---

*Auditoria concluída por Sofia — UX Strategist · i2 Finance · 18/05/2026*
