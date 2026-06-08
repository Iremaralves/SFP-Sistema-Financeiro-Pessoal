# 07 — Plano de Implementação em 3 Ondas

**Persona:** Diego — Frontend Implementation Lead
**Data:** 2026-06-07
**Escopo:** transformar os outputs 01–06 em deploys reais, sem downtime, em ondas pequenas validadas. Stack: Next.js 15 (App Router) + Tailwind v4 + Supabase + Vercel.
**Filosofia desta fase:** redesenho é refatoração com cara nova. Não dá pra parar a Iremar/Juliana por dois dias enquanto o app "se acerta". Cada PR deve ser deployável em produção sem que nenhum dos dois perceba quebra. Visual evolui em ondas; comportamento permanece.

A regra mestra: **toda onda termina com main verde, deploy estável, e rollback documentado de 1 linha.**

---

## Visão geral das 3 ondas

| Onda | Tema | Deploys | Duração | Risco |
|---|---|---|---|---|
| 1 | Fundação (tokens + base) | 1 | 1–2h | Baixo (infra) |
| 2 | Telas críticas (4 telas) | 3–4 | 4–6h | Médio (mudança visual) |
| 3 | Secundárias + polish | 2–3 | 3–5h | Baixo–Médio |

Total: 6–8 deploys em ~8–13h de trabalho concentrado, distribuídos em 1–2 semanas para deixar Iremar usar entre deploys.

---

## Onda 1 — Fundação (1 deploy, 1-2 horas)

**Objetivo:** criar a infraestrutura visual sem mudar o que o usuário vê. Tokens, fonte, dois componentes base. Se Iremar abrir o app após esse deploy, ele NÃO deve perceber diferença visual relevante — só uma sutil afinação de tipografia e radius. Esse é o ponto.

### O que entrega

**A) Tokens CSS em `app/globals.css`** — substituir o arquivo atual pelo conjunto completo definido no output 03:
- `--bg-base`, `--bg-elevated`, `--surface-1..3`, `--surface-glass`
- `--border-subtle/default/strong`
- `--text-primary/secondary/tertiary/inverse`
- `--accent-iremar/juliana/i2/casal` + variações `-light` e `-strong`
- `--status-success/warning/danger/info` + variantes `-soft`
- `--radius-sm..xl`, `--space-1..24`, `--shadow-sm/md/lg/glass/glow`
- `--duration-fast/base/slow`, `--easing-standard/emphasized/decel/accel`

Manter os tokens antigos com `@deprecated` no comentário durante 1 onda para componentes legados não quebrarem. Nada de remoção agressiva nesse deploy.

**B) Fonte Inter Tight** via `next/font/google`:
- Em `app/layout.tsx`, importar `Inter_Tight` com weights 400/500/600/700, `display: 'swap'`, `variable: '--font-inter-tight'`.
- Em `globals.css`, definir `body { font-family: var(--font-inter-tight), 'Inter', -apple-system, ...; font-variant-numeric: tabular-nums; }` aplicando tabular-nums globalmente em valores monetários via classe utilitária `.tabular`.
- Geist é fallback considerado, mas Inter Tight venceu no output 03 pela densidade horizontal e tabular-nums por padrão.

**C) Componente `<Button>` refinado** em `components/ui/Button.tsx`:
- Variantes: `primary | secondary | ghost | danger`
- Sizes: `sm` (32px) | `md` (40px) | `lg` (48px) | `xl` (56px — CTAs mobile)
- Accent prop: `iremar | juliana | i2 | casal` (default herda da role)
- Suporta `leftIcon`, `rightIcon`, `loading`, `disabled`, `fullWidth`
- Foco visível com ring 2px na cor accent
- Hover/active states com `transition: var(--duration-fast) var(--easing-standard)`

**D) Componente `<Card>` padronizado** em `components/ui/Card.tsx`:
- Variantes: `solid` (default, `--surface-1`) | `elevated` (`--surface-2` + shadow-md) | `glass` (apenas para elementos flutuantes)
- Sizes de radius: `md` (16px) | `lg` (24px)
- Prop `accent?: 'iremar' | 'juliana' | 'i2' | 'casal'` que aplica borda esquerda 2px na cor
- Prop `padding`: `none | sm | md | lg`
- Esse Card NÃO substitui ainda os usos existentes — só fica disponível para Onda 2

### Checklist exato de arquivos a mudar

- [ ] `app/globals.css` — adicionar bloco `:root` completo com novos tokens; manter tokens antigos comentados como `@deprecated`
- [ ] `app/layout.tsx` — importar `Inter_Tight`, aplicar variable em `<html className>`
- [ ] `tailwind.config.ts` (ou `globals.css` se Tailwind v4 puro) — mapear novos tokens para classes utilitárias: `bg-surface-1`, `text-primary`, `border-default`, `text-iremar`, etc.
- [ ] `components/ui/Button.tsx` — criar (novo arquivo)
- [ ] `components/ui/Card.tsx` — criar (novo arquivo)
- [ ] `components/ui/index.ts` — re-exportar Button e Card
- [ ] `.eslintrc` — adicionar regra custom (ou comentário) banindo `rgba(255,255,255,0.0X)` solto em styles inline (warning, não error, ainda)

### Como testar sem deploy

1. **Preview branch na Vercel**: criar branch `redesign/onda-1-fundacao`, push, e a Vercel gera URL `i2-finance-git-redesign-onda-1.vercel.app` automaticamente.
2. **Comparar visualmente**: abrir prod + preview lado a lado em duas janelas (mesma rota /dashboard, /lancamentos, /compromissos, /contas). Se houver diferença perceptível, é bug.
3. **Storybook leve** (opcional, se quiser investir 30min): criar `app/_dev/components/page.tsx` que renderiza todas as variantes de Button e Card. Acessível só em dev. Validar 5×5×4 (variant × size × accent) combinações.
4. **Lighthouse no preview**: rodar audit antes/depois. Score visual e performance não deve cair.
5. **Login real**: abrir preview com sessão de Iremar e clicar em todas as rotas. Olho clínico em tipografia (Inter Tight muda altura de linha sutilmente) — se algum card cortou texto ou sumiu linha, ajustar antes do merge.

### Rollback

```bash
git revert <sha-onda-1> && git push origin main
```

Vercel re-deploya em ~90s. Como nada de comportamento mudou, basta voltar arquivos. Nenhuma migração de banco, nenhum estado novo. Zero risco de perda de dado.

---

## Onda 2 — Telas críticas (3-4 deploys, 4-6 horas)

**Objetivo:** atacar as 4 telas que Iremar e Juliana usam todo dia, na ordem de impacto definida no output 01. Cada tela vira um deploy independente, validado, com checkbox de pronto antes do próximo.

### Deploy 2.1 — Dashboard (Admin + Operator)

**O que entrega:**
- `<PageHeader>` único (substitui os 5 headers customizados das rotas)
- `<AnchorHero>` component (output 05/06) — número-âncora 48px mobile / 64px desktop, sparkline, delta
- `<QuickActions>` v2 — fileira horizontal scrollável em mobile, strip 4×1 em desktop
- `<BillsCard>` v2 e `<IncomeCard>` v2 usando Card sólido + borda 2px responsável (saem os `const glass = {...}` inline)
- Reorganização vertical: AnchorHero ANTES de QuickActions (resolve problema #1 do audit — densidade)
- ProfileScopeToggle migrado para dentro do PageHeader (remove duplicidade sidebar + drawer — problema #10)

**Arquivos:**
- `components/ui/PageHeader.tsx` (criar)
- `components/dashboard/AnchorHero.tsx` (criar)
- `components/dashboard/Sparkline.tsx` (criar — usar `recharts` ou SVG manual)
- `components/dashboard/QuickActions.tsx` (refatorar — horizontal scroll mobile)
- `components/dashboard/BillsCard.tsx` (refatorar — usar `<Card>` e `<StatusBadge>`)
- `components/dashboard/IncomeCard.tsx` (refatorar — idem)
- `components/dashboard/DashboardAdmin.tsx` (reordenar blocos)
- `components/dashboard/DashboardOperator.tsx` (reordenar + CategorizeCallout)
- `components/Sidebar.tsx` (remover ProfileScopeToggle daqui)
- `components/Drawer.tsx` (remover idem)

**Como reverter se quebrar:** `git revert` do deploy 2.1. Todos os componentes novos são arquivos novos; refatorações usam o mesmo nome de export, então o revert é limpo. Sem mudança de schema, sem migração.

**Como validar:**
- Mobile 375px: AnchorHero ocupa o topo, sem precisar scrollar pra ver o número da fatura.
- Desktop 1440px: AnchorHero ocupa col 1-7, painel "Hoje" implícito (ou placeholder) em col 8-12.
- ProfileScopeToggle só aparece em 1 lugar (header). Verificar visualmente nas duas viewports.
- Trocar de Admin/Operator (login Juliana) — confirmar que Juliana NÃO vê ProfileScopeToggle e que CategorizeCallout aparece com count correto.
- Bills e Income usam Card sólido (não glass). Olhar com olho em backdrop-filter: não deve haver blur nesses cards.

### Deploy 2.2 — Compromissos

**O que entrega:**
- `<PageHeader>` aplicado aqui também
- `<StatusBadge>` único (consolida STATUS_CFG do Bills com STATUS_CONFIG dos Compromissos — resolve #6)
- Filtros colapsados: mês + status no topo; entidade + ordenação atrás de botão "Filtros" com badge de count (resolve #3 do audit)
- Group headers por semana
- `<CompromissoRow>` com borda esquerda 2px responsável

**Arquivos:**
- `components/ui/StatusBadge.tsx` (criar)
- `components/ui/FilterBar.tsx` (criar — chips removíveis + botão "+ Filtro")
- `components/compromissos/CompromissoRow.tsx` (refatorar)
- `components/compromissos/WeekGroupHeader.tsx` (criar)
- `app/compromissos/page.tsx` (reorganizar)

**Reverter:** `git revert` do deploy 2.2. StatusBadge novo não quebra Bills/Income porque eles já receberam a refatoração no 2.1. Mas para segurança máxima, manter o STATUS_CFG antigo em BillsCard por mais uma onda (deprecated), e só remover no final da Onda 3.

**Validar:**
- Filtros visíveis ocupam < 100px no topo em mobile (vs ~200px atual).
- Status "pago" do cartão NÃO depende mais de `slice(0,8)` — vincular a `recurring_id` se possível, ou deixar a heurística MAS mostrar dica visual de "inferido" (resolve #5).
- Cores de StatusBadge consistentes entre Bills e Compromissos (era 0.10 vs 0.12 rgba — agora token único).

### Deploy 2.3 — Lançamentos

**O que entrega:**
- `<TransactionRow>` componente único (mobile 56px / desktop 36px no mesmo componente, via prop ou `@container`)
- Borda esquerda 2px responsável (remove chips redundantes — recupera 60px de largura)
- Group headers por dia em mobile (mantém ordenação por data)
- Sub-header com número-âncora "Total filtrado" + filtros pill removíveis
- Swipe gestures mobile (direita = ação primária, esquerda = secundária + destrutiva)
- Master-detail em desktop: lista col 1-8 + drawer col 9-12

**Arquivos:**
- `components/transactions/TransactionRow.tsx` (refatorar — densidade dual)
- `components/transactions/DayHeader.tsx` (criar)
- `components/transactions/SwipeableRow.tsx` (criar — wrapper com gesture handler)
- `components/transactions/TransactionDrawer.tsx` (criar — usado desktop)
- `app/lancamentos/page.tsx` (reorganizar layout)
- `app/lancamentos/[id]/page.tsx` (em desktop, renderiza com drawer aberto)

**Reverter:** `git revert` do deploy 2.3. Atenção especial: TransactionRow é usado em outros lugares (Dashboard lista de "últimos lançamentos"). Antes de revert, conferir se o uso lá quebra. Solução: criar TransactionRow v2 como novo arquivo, deixar v1 intacto até validação final.

**Validar:**
- Mobile 375px: 6-8 lançamentos visíveis sem scroll.
- Swipe direita em uma linha → toast "Marcado pago · Desfazer" aparece.
- Desktop: clicar uma linha NÃO navega (abre drawer 480px à direita, lista permanece).
- Cmd+K em desktop ainda não funciona (Onda 3) — mas atalhos J/K na lista podem entrar aqui se houver tempo.

### Deploy 2.4 — Contas

**O que entrega:**
- **HOTFIX do bug #2 do audit**: mover `getEffectiveScope` para antes de qualquer filtro em `app/contas/page.tsx`
- `<AccountCard>` componente único (mobile 96px / desktop 340×220 com sparkline expandida e ações inline)
- AnchorHero "Patrimônio Líquido" no topo
- Separação visual cartões vs contas correntes vs investimentos
- Tap em conta abre BottomSheet (mobile) / Drawer (desktop) com extrato resumido — NÃO navega para sub-rota

**Arquivos:**
- `app/contas/page.tsx` (fix do scope + reorganização)
- `components/contas/AccountCard.tsx` (refatorar)
- `components/contas/CardCreditoCard.tsx` (criar — específico cartões)
- `components/contas/AccountSheet.tsx` (criar — extrato resumido)
- `components/ui/Sheet.tsx` (criar componente base se ainda não existe)

**Reverter:** `git revert` do deploy 2.4. O hotfix do scope vai junto, mas se o resto quebrar e o scope estiver OK, fazer cherry-pick do commit do fix.

**Validar:**
- Console limpo (sem warning de "scope is not defined").
- Filtro de contas por escopo funciona corretamente (testar Pessoal/Empresa/Tudo e contar quantas contas aparecem em cada).
- Tap em conta abre sheet (não muda URL).

---

## Onda 3 — Telas secundárias + polish (2-3 deploys, 3-5 horas)

**Objetivo:** completar o set de 16 telas com o padrão já estabelecido, e adicionar microinterações que dão "alma" ao redesign.

### Deploy 3.1 — Categorizar (Juliana flow crítico)

**O que entrega:**
- `<SwipeCard>` em mobile (direita = Juliana / esquerda = Iremar / tap-hold = Casal)
- Painel split em desktop (lista + foco lateral + cheat sheet de atalhos no rodapé)
- Atalhos de teclado em desktop: I/J/C/2 + Cmd+1..9 categoria
- Categoria sugerida pré-preenchida (ML básico — last-used por merchant)
- Bulk apply ("aplicar a 3 Ubers similares")
- AnchorHero com barra progress + count "0 de 32 feitas"
- Empty state ilustrado + confetti ao zerar

**Arquivos:**
- `components/categorizar/SwipeCard.tsx`
- `components/categorizar/KeyboardCheatSheet.tsx` (desktop)
- `components/categorizar/BulkApplyCallout.tsx`
- `components/ui/EmptyState.tsx` (criar — usado também em /lancamentos vazio, /backups vazio)
- `lib/categorizar/suggestions.ts` (sugestão de categoria via histórico)

**Reverter:** `git revert`. Lógica de gestos vive em hook isolado (`useSwipeGesture`) — não afeta dados.

**Validar:**
- Juliana mobile: categorizar 5 lançamentos com swipe deve levar < 15s.
- Desktop: pressionar I em foco de linha aplica Iremar + avança.
- Empty state aparece quando count = 0.

### Deploy 3.2 — Importar, Acerto, Empresa, Relatórios

**Bundle de telas menos críticas** em um deploy maior, porque cada uma sozinha é pequena:

**Importar:**
- Three-state machine clara (Upload / Processando / Revisão) sem inventar stepper
- Drop-zone full-window em desktop
- Auto-categorização visível antes de confirmar (transparência)
- Heurística NU_* deixa de filtrar silenciosamente — mostra "4 ignoradas: NU_*.csv (extrato pessoal). Mudar?" como callout

**Acerto:**
- AnchorHero "Iremar deve R$ X à Juliana" com direção clara
- Detalhamento de composição auditável
- Botão "Fechar acerto" único e dominante (cor ciano Casal)
- Histórico colapsado abaixo

**Empresa:**
- Remover redirect para /dashboard quando escopo=pessoal — mostrar empty state "Esta seção é da i2 Soluções. Troque o escopo no header."
- DRE Hero com Receita/Despesas/Resultado em 3 colunas
- Notas pendentes como callout no topo

**Relatórios:**
- Tabs (Visão Geral / Categorias / Fluxo / Comparativo)
- Charts touch-friendly em mobile, com sidebar de presets em desktop
- Export PDF/CSV/XLSX como ação primária

**Arquivos:** ~12-15 arquivos refatorados/criados. Listar no PR.

**Reverter:** cada tela é independente — se Importar quebrar mas Acerto estiver OK, cherry-pick o revert. Manter PR pequeno por tela se possível.

### Deploy 3.3 — Polish + microinterações + Cmd+K

**O que entrega:**
- `<CommandPalette>` (desktop) com Cmd+K — navegação + ações contextuais + escopo
- Microinterações do output 05:
  - Count-up no número-âncora ao mudar valor
  - Sparkline desenha-se da esquerda pra direita ao abrir
  - Borda esquerda pulsa ao adicionar item novo
  - Confetti em /categorizar empty state
  - Toast com countdown visual
  - ProfileScopeToggle com crossfade ao trocar
- Skeleton states em todas as telas-lista (substituem spinners)
- Empty states ilustrados (linha 1px monocromática) em listas vazias
- Atalhos de teclado globais: G+letra (navegação), N+letra (criação)
- Telas restantes: `/transferencias`, `/mes`, `/backups`, `/empresa/notas`, `/login` ajustes finais

**Arquivos:**
- `components/ui/CommandPalette.tsx`
- `components/ui/Toast.tsx`
- `components/ui/Skeleton.tsx`
- `components/ui/EmptyState.tsx` (já criado no 3.1, expandir)
- `hooks/useKeyboardShortcuts.ts`
- `lib/motion/count-up.ts`

**Reverter:** Cmd+K e microinterações são adicionais — desativar via feature flag se algo der ruim. Manter `NEXT_PUBLIC_ENABLE_CMDK=true` controlando.

**Validar:**
- Cmd+K abre palette em qualquer rota desktop.
- G+L vai para /lancamentos sem reload.
- Count-up funciona no AnchorHero do Dashboard ao mudar de mês.
- Skeleton aparece por <500ms em listas (não persiste).

---

## Rollback strategy (por onda)

### Onda 1
- **Cenário:** Inter Tight quebra layout (linhas cortam, ellipsis errado em algum lugar).
- **Ação:** `git revert <sha>` e push. Vercel re-deploya em ~90s. Tokens antigos seguem no CSS (deixamos comentado), então comportamento volta 100%.
- **Plano B:** se só a fonte quebrou mas tokens funcionam, comentar o `next/font` em `layout.tsx`, manter tokens.

### Onda 2
- **Cenário (mais provável):** PageHeader ou Card novo quebra responsividade em alguma tela inesperada.
- **Ação:** revert do deploy específico (2.1, 2.2, 2.3 ou 2.4). Como cada deploy é independente, o revert de um não afeta outros.
- **Plano B:** feature flag `NEXT_PUBLIC_REDESIGN_LEVEL` controlando se cada tela usa v1 ou v2. Permite rollback de tela específica via env-var sem revert de código.
- **Cenário do bug do scope (/contas):** se o fix do scope causar regressão de filtro, reverter o page.tsx e manter o bug conhecido até patch. Bug atual já é silencioso, não piora.

### Onda 3
- **Cenário:** Cmd+K conflita com atalho do browser ou de extension.
- **Ação:** desativar via feature flag (`NEXT_PUBLIC_ENABLE_CMDK=false`).
- **Cenário:** confetti causa lag em mobile fraco.
- **Ação:** isolar animação atrás de `prefers-reduced-motion` e `navigator.deviceMemory < 4`. Se ainda lagar, remover.

### Rollback nuclear (todas as ondas)
Tag git `pre-redesign` antes da Onda 1:
```bash
git tag pre-redesign && git push origin pre-redesign
```
Se TUDO der errado: `git reset --hard pre-redesign && git push --force-with-lease`. Vercel deploya o tag. Comunicar Iremar/Juliana antes (1min de tela branca).

Banco de dados: **zero migrações em todo redesign** (é puramente frontend). Não há nada pra reverter no Supabase.

---

## Métricas de sucesso

O redesign funcionou se essas três famílias de sinais derem positivo. Sem isso, é só "ficou bonito".

### Sinais qualitativos (Iremar e Juliana falam)

- **Iremar diz "tá mais rápido"** numa conversa em até 1 semana de uso. Especificamente: "abro o app de manhã e vejo o número da fatura na hora" (resolve problema #1 do audit — densidade do dashboard).
- **Juliana erra menos** ao categorizar. Hoje ela pergunta "essa é minha ou nossa?" via WhatsApp ~3x/semana. Meta: cair pra 1x ou menos no primeiro mês pós-Onda 3. Indicador indireto de que a UI deixou a decisão mais clara.
- **Iremar para de usar a sidebar** pra navegar em desktop e passa a usar Cmd+K. Helena previu isso no output 06 — testar perguntando "como você navegou hoje?" após 2 semanas.

### Sinais quantitativos (métricas mensuráveis)

- **Tempo médio de categorização** (Juliana flow): hoje categorizar 30 itens = ~5 minutos (10s/item, todos clicks). Meta pós-Onda 3: ~90 segundos (3s/item via swipe). Medir com timing no Supabase (`created_at` do bulk de categorizações).
- **Time-to-first-glance no /dashboard**: hoje, abrir o app e ver o saldo consolidado exige ~2s de scroll mental. Meta: 0s (AnchorHero no topo). Medir com sessão gravada (FullStory/Hotjar opcional) ou self-report.
- **Profundidade de scroll no /dashboard mobile**: hoje média de ~2500px de scroll vertical. Meta: <1200px (uma viewport e meia).
- **Lighthouse score**: manter ou melhorar. Performance ≥85, Accessibility ≥90, Best Practices ≥95.
- **Bundle size**: não crescer mais que 15% (Inter Tight + recharts + framer-motion somam mas Cmd+K e palette são dinâmicos via `next/dynamic`).
- **Bugs em produção nas 2 semanas pós-Onda 3**: ≤2 bugs visuais reportados. Zero bug de dado/cálculo (lembre: nada de comportamento mudou).

### Sinais comportamentais (uso real)

- **Categorização em lote ("aplicar a 3 similares")** é usada em ≥30% das sessões de Juliana após 2 semanas. Mede que a feature foi descoberta e adotada.
- **ProfileScopeToggle** continua sendo trocado pelo menos 1x/dia por Iremar — confirma que a consolidação em um único lugar (header) não escondeu o controle.
- **Backups page** recebe ao menos 1 visita/semana de Iremar pós-redesign — hoje provavelmente nunca abre porque está escondido. Sinal de que a IA da Fase 04 funcionou.

### Como medir sem instrumentação pesada

Iremar é o dono e usuário. Conversa direta a cada onda:
1. **Após Onda 1:** "Sentiu alguma diferença?" Resposta esperada: "Não, talvez fonte." (sucesso = invisível)
2. **Após Onda 2:** "O que está melhor? O que está pior?" Coletar 3-5 frases. Refinar antes da Onda 3.
3. **Após Onda 3:** "Em 1 frase, como o app está agora?" Se a frase contiver "rápido", "claro", "limpo" — vitória. Se contiver "estranho", "confuso", "perdido" — voltar pra prancheta na área específica.

Juliana é mais econômica em palavras. Métrica dela é uso: ela categoriza mais ou menos no mês seguinte? Pergunta direta vale após 30 dias: "Tá legal categorizar agora?"

---

## Encerramento

O plano respeita três regras: **deploys pequenos**, **rollback trivial**, **validação humana entre cada onda**. Não é redesign big-bang. É refatoração visual em camadas, com Iremar usando o app durante o caminho inteiro.

Onda 1 é invisível e infra. Onda 2 ataca o sangue (4 telas que importam). Onda 3 completa e polui (no bom sentido — confetti, count-up, Cmd+K).

A maior aposta: que a sequência Dashboard → Compromissos → Lançamentos → Contas resolve 80% da fricção que a auditoria mapeou, deixando o resto (Empresa, Importar, Relatórios) como complemento natural do mesmo padrão.

A menor aposta (e a mais segura): o app não vai quebrar. Zero migração de banco, zero mudança de comportamento, feature flags onde houver risco. Se a Vercel deploya, Iremar continua pagando boleto.

Diego entrega o cronograma. Designer aprovou os tokens. Iremar abre o app em 1 semana e diz "rápido". Juliana categoriza 32 itens em 90 segundos no sofá. Acaba o redesign.
