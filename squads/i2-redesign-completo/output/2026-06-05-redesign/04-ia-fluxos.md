# 04 — Arquitetura de Informação & Fluxos

**Persona:** Marcus (Senior Product UX Strategist)
**Data:** 2026-06-07
**Escopo:** sitemap, jornadas críticas, hierarquia de menus e padrões de transição.
**Premissa:** o redesign não inventa feature — reorganiza o que já existe para que cada ação tenha um caminho canônico (Princípio 5 da Fase 03) e cada tela um número-âncora claro (Princípio 1).

---

## 1) Sitemap Proposto

A topologia atual mistura três naturezas distintas — telas de **operação diária** (decisões hoje), telas de **análise** (decisões do mês/ano), e telas de **configuração/manutenção** (estado do sistema). A nova IA torna isso explícito. Empresa **não** vira top-level porque o usuário não pensa "vou pra Empresa" — pensa "quanto a i2 deve este mês?", o que se resolve com `ProfileScopeToggle = Empresa` aplicado às telas universais (Dashboard, Lançamentos, Compromissos, Contas). Empresa permanece como **dimensão paralela** ativada por escopo, e ganha **uma única tela dedicada** (`/empresa`) para o que é estritamente PJ: DRE, faturamento, notas fiscais.

```
┌─ Top-level (sidebar desktop / BottomNav mobile) ────────────────┐
│                                                                  │
│  GESTÃO DIÁRIA                  ANÁLISE              SISTEMA     │
│  ├─ Dashboard          [home]   ├─ Relatórios        ├─ Importar │
│  ├─ Lançamentos                 ├─ Acerto (mês)      ├─ Backups  │
│  ├─ Compromissos                └─ Empresa (DRE)     └─ Login    │
│  ├─ Contas                                                       │
│  └─ Categorizar*                                                 │
│                                                                  │
│  *aparece com badge quando há unassigned > 0; some quando = 0   │
└──────────────────────────────────────────────────────────────────┘

Dimensão paralela (afeta TODAS as telas acima):
  ProfileScopeToggle [Pessoal | Empresa | Tudo]   (header, canônico único)

Sub-rotas (não top-level):
  /lancamentos/[id]        ─ detail (drawer em desktop, fullscreen em mobile)
  /lancamentos/novo        ─ form (sheet inferior em mobile, modal em desktop)
  /empresa/notas           ─ sub de Empresa
  /transferencias          ─ atalho dentro de Lançamentos (filtro "transferência")
                             OU rota própria acessível via QuickActions
  /mes                     ─ deprecar; consolida-se em /relatorios?periodo=mes
```

**Decisões-chave do sitemap:**

- **Empresa nivelada com Dashboard? Não.** Empresa fica em "Análise" como tela de DRE/faturamento. A operação cotidiana da PJ (pagar fornecedor, ver fatura cartão empresa) acontece nas telas universais com `scope=empresa`. Isso resolve a fricção identificada no audit (#22 do 01-audit: redirect confuso quando escopo=pessoal).
- **Categorizar e Importar — onde vão?** Categorizar é gestão diária (Juliana usa toda noite) — fica no top-level **com badge condicional**: aparece quando há transações pendentes, some quando inbox está zero. Importar é manutenção/sistema — vive em "Sistema" no sidebar e como ação de overflow no Drawer "Mais" do mobile.
- **`/transferencias` e `/mes` deprecam como rotas próprias?** `/transferencias` deveria existir como filtro de `/lancamentos?tipo=transferencia` (consistência: transferência É um lançamento). Mas como o squad pediu "não inventar feature nem deprecar sem motivo de redesign", mantemos a rota como atalho do QuickActions; ela renderiza `/lancamentos` filtrada. `/mes` (operator) consolida visualmente em `/relatorios` com preset "mês fechado anterior" — mantém a rota só pra Juliana ter atalho no Drawer.
- **Login fora do top-level.** Não navega lá voluntariamente; é só entrada/saída.

---

## 2) Três Jornadas Críticas

### Jornada A — Iremar no Uber, mobile, decisão urgente

**Cenário.** Iremar está no Uber a caminho de uma reunião às 9h47. Lembra que a Mapfre (seguro do carro da empresa) vence hoje — R$ 1.840. Precisa saber se a conta i2 (Inter PJ) tem saldo, ou se precisa transferir do Pessoal (Itaú) antes de chegar no escritório. Tempo disponível: 90 segundos no semáforo.

| # | Tela | Ação | Número-âncora visível | Decisão habilitada |
|---|------|------|----------------------|---------------------|
| 1 | `/dashboard` (carrega já com `scope=empresa` se foi o último usado; senão `Tudo`) | Abre app. | "Saldo i2 hoje: R$ 2.450" no topo (substitui "Total fatura" como número-âncora quando scope=empresa). | Tem saldo? 2.450 > 1.840 → sim, paga; abaixo do colchão de R$ 1.000 → não, precisa transferir. |
| 2 | `/dashboard` ainda | Vê sparkline 30d ao lado do saldo: linha caindo. Delta "–R$ 3.200 vs. mês passado". | Reforça decisão: melhor transferir mesmo, fica com gordura. | Decide transferir R$ 1.500 do Pessoal. |
| 3 | QuickActions: "Transferir" (3º atalho) | Tap. | — | Abre sheet inferior de transferência. |
| 4 | Sheet "Nova transferência" | Defaults inteligentes: De = Itaú PF (conta mais usada nas últimas 30d), Para = Inter i2, Valor vazio (foco automático). | Saldo das duas contas mostrado abaixo dos selects. | Digita 1500, tap "Transferir". |
| 5 | Sheet confirma com toast | "Transferido R$ 1.500 — Itaú → Inter i2" | Saldo i2 atualizado no toast: "Novo saldo i2: R$ 3.950". | Confecha sheet. |
| 6 | `/dashboard` (volta) | Header já reflete saldo novo. | Saldo i2: R$ 3.950 grande, fatura Mapfre em "A pagar hoje" abaixo. | Tap "A pagar hoje" → tap Mapfre → "Marcar como paga". |
| 7 | Compromisso marcado como pago | Toast "Mapfre paga. Próxima conta empresa: R$ 320 em 3 dias." | Saldo i2 atualizado: R$ 2.110. | Fecha app. Tempo: 65s. |

**Princípios em ação:** Hierarquia Radical (saldo i2 é O número), Uma Ação Um Caminho (Transferir só via QuickActions, sem CTA duplicado), Cor é Gramática (linhas i2 em âmbar em "A pagar" — Iremar reconhece sem ler "i2").

---

### Jornada B — Juliana no sofá, mobile, tarefa rotineira

**Cenário.** Juliana à noite no sofá. A fatura do Itaú do cartão Casal fechou ontem com 32 compras de Maio que precisam ser categorizadas (assinaladas a Iremar, Juliana ou Casal e categoria). Ela faz isso toda quarta-feira à noite. Tempo disponível: ~10 minutos enquanto a TV passa novela.

| # | Tela | Ação | Número-âncora visível | Decisão habilitada |
|---|------|------|----------------------|---------------------|
| 1 | `/dashboard` (Operator, scope=pessoal sempre) | Abre app. Vê badge "32 pra categorizar" no QuickActions "Categorizar". | "Sua parte da fatura: R$ 1.247 (42%)" no topo. | Sabe que 32 itens ainda mexem nesse número. |
| 2 | QuickActions "Categorizar" | Tap. | — | Vai pra `/categorizar`. |
| 3 | `/categorizar` | Lista densa: 32 cards 1-linha. Sticky header: "32 pendentes — R$ 2.890 total". Cada card mostra: avatar merchant, descrição, valor, data, [chip categoria sugerida]. | "32 pendentes" / "R$ 2.890" como par âncora. | Vê primeiro item: "Mercado Extra — R$ 380". |
| 4 | Item 1 | Swipe direita → Juliana, swipe esquerda → Iremar, tap-hold → Casal. Sugestão de categoria já vem preenchida ("Mercado") — só confirma. | Contador desce: "31 pendentes — R$ 2.510". | Continua próximo. |
| 5 | Item 5 (Uber R$ 18 + R$ 22 + R$ 14, três compras seguidas) | Tap longo no primeiro → menu "Aplicar mesma classificação aos similares (3)" → confirma "Casal / Transporte". | 3 itens resolvidos de uma vez. Contador: "27 pendentes". | Acelera categorização repetitiva. |
| 6 | Item 22 | Não sabe o que é — "PAG MercPag *XYZ". Tap no item expande sheet inferior com mais metadados (data exata, hora, parcela X de Y, link "Buscar no histórico"). | Detalhe inline sem perder lista. | Marca como "Juliana / A revisar" pra perguntar pro Iremar. |
| 7 | Última (#32) | Categorizada. Empty state: "Tudo em dia. Próxima fatura fecha em 8 dias." + ilustração leve. | "0 pendentes — Sua parte: R$ 1.247". | Volta sozinha pro dashboard via tap no logo. |

**Princípios em ação:** Densidade Calibrada (32 itens visíveis em ~3 viewports em vez de 8 com cards inflados), Hierarquia Radical (par "32 pendentes / R$ 2.890" como âncora dupla durante o fluxo), Uma Ação Um Caminho (swipe é o gesto canônico mobile, sem botões de "atribuir" duplicados em cada card).

---

### Jornada C — Iremar domingo, desktop, planejamento mensal

**Cenário.** Domingo de manhã, café passado, MacBook aberto na mesa. Iremar vai planejar Junho: compromissos fixos (luz, água, internet, escola, plano de saúde, parcelas), faturas de cartão estimadas, pró-labore, e quer ver se sobra colchão pra investir R$ 2.000 no Tesouro Selic. Tempo disponível: 25 minutos com calma.

| # | Tela | Ação | Número-âncora visível | Decisão habilitada |
|---|------|------|----------------------|---------------------|
| 1 | `/dashboard` (admin, desktop, scope=Tudo) | Abre. Hero consolidado: saldos PF + PJ + Cartão num único bloco grid 4 colunas, cada um com sparkline 30d e delta. | "Patrimônio líquido: R$ 47.320" como número macro no topo. | Visão geral em <2s. |
| 2 | Sidebar → "Compromissos" | Click. | Header de `/compromissos`: "Junho — R$ 8.940 a pagar (12 contas)". | Identifica o total do mês. |
| 3 | `/compromissos` | Filtro padrão: mês = Junho, status = A pagar. Lista em tabela densa desktop (24 linhas visíveis): data, descrição, valor, conta destino, status. Linhas com borda esquerda colorida (azul=PF, âmbar=i2, ciano=Casal). | "R$ 8.940" total no header. | Vê concentração nos dias 5, 10, 15. |
| 4 | Cmd+K | Digita "acerto" → enter. | — | Atalho universal (Princípio do Linear, Fase 02). |
| 5 | `/acerto` | Vê projeção: "Acerto previsto Maio: Iremar deve R$ 380 à Juliana (fecha dia 13/06)". Histórico de 6 acertos anteriores abaixo. | "+R$ 380" como número-âncora da relação. | Confirma que vai ter saída pra Juliana — entra no cálculo do colchão. |
| 6 | Sidebar → "Relatórios" → preset "Junho projetado" | Click. | Gráfico de área "Saldo projetado fim de Junho: R$ 4.120" (com base em compromissos + entradas recorrentes − acerto). | Sobra R$ 4.120 acima do colchão de R$ 2.000 → pode investir os R$ 2.000 do Tesouro. |
| 7 | QuickActions → "Novo lançamento" (FAB ou Cmd+K "novo") → modal | Cria transação "Aporte Tesouro Selic — R$ 2.000 — agendada para 10/06". | Confirma. Toast atualiza relatório: "Saldo projetado: R$ 2.120". | Fecha. Decisão registrada, plano fechado em 18min. |

**Princípios em ação:** Densidade Calibrada (desktop ativa modo denso de tabela, Linear-style, 24 linhas por viewport), Hierarquia Radical (cada tela tem UM número que ancora), Cor é Gramática (borda esquerda colorida em vez de chip de responsável repetido em cada linha), Cmd+K como atalho universal (apenas desktop, mobile não recebe — Juliana não pede).

---

## 3) Hierarquia de Menus

### Mobile (375px → 768px)

| Local | Itens | Regra |
|---|---|---|
| **Header (sticky, glass)** | Logo i2 + saudação compacta · `ProfileScopeToggle` (compact pill) · avatar (tap → menu rápido) | Canônico único do toggle. Drawer e sidebar NÃO replicam. |
| **BottomNav (5 slots, glass)** | [Início] [Lançamentos] [+ FAB destacado] [Compromissos] [Mais] | "A Pagar" SAI (estava redundante com Compromissos). FAB central é "Novo lançamento" e SÓ ele. |
| **Drawer "Mais"** | Contas · Categorizar (com badge) · Acerto · Transferências · Empresa · Relatórios · Importar · Backups · Sair | Overflow real. Itens menos frequentes. Sem ProfileScopeToggle aqui. |
| **QuickActions no `/dashboard`** | 4 atalhos horizontais scrolláveis: Cartão · A pagar · A receber · Transferir | Fileira horizontal (Nubank pattern) substitui grid 2×2. Itens contextualizados pelo scope ativo. |
| **Menus de contexto (long-press em linha)** | Editar · Duplicar · Marcar como paga · Mudar responsável · Excluir | Apenas em listas (Lançamentos, Compromissos). Long-press em mobile / right-click em desktop. |
| **FAB "+"** | Tap simples → Novo lançamento (default). Tap longo → menu radial: Novo lançamento · Nova receita · Nova transferência · Novo compromisso. | FAB é UM, mas revela tipos sob press longo. |

### Desktop (≥1024px)

| Local | Itens | Regra |
|---|---|---|
| **Sidebar fixa 240px** | Grupo "Gestão Diária" (Dashboard, Lançamentos, Compromissos, Contas, Categorizar) · Grupo "Análise" (Relatórios, Acerto, Empresa) · Grupo "Sistema" (Importar, Backups) · footer com avatar + Sair | Grupos visualmente separados por label `--text-xs --text-tertiary` uppercase + 16px de gap. |
| **Top bar (glass, sticky)** | Breadcrumb · `ProfileScopeToggle` (compact pill, canônico) · Cmd+K hint · avatar | Mantém escopo sempre visível. |
| **BottomNav** | Não existe em desktop. | — |
| **Cmd+K palette** | Navegar (16 rotas) · Criar (lançamento/compromisso/transferência) · Filtrar (mês, responsável, conta) · Ações (rodar acerto, importar CSV) · Trocar escopo | Universal. Atalho `/` ou `Cmd+K`. |
| **FAB** | Não existe em desktop. Botão `+ Novo` no header da página em vez disso. | — |

### Princípio operacional

**Uma ação, uma entrada visualmente dominante; atalhos existem mas são subordinados.**

Exemplo "Novo lançamento":
- Mobile: FAB BottomNav (dominante) · long-press do FAB pra tipo específico · "+ Novo" no header de `/lancamentos` (contextual).
- Desktop: botão `+ Novo` no header de `/lancamentos` (dominante) · Cmd+K → "novo" (atalho) · botão no QuickActions do dashboard (contextual).
- **NÃO existe** mais o CTA gigante no corpo do `DashboardOperator` (resolvido o problema #4 do audit).

---

## 4) Padrões de Transição entre Páginas

A transição comunica relação. Modal interrompe; sheet relaciona-se com a tela debaixo; full-screen substitui contexto; drawer mantém contexto adjacente. Aplicar isso de forma consistente reduz carga cognitiva.

| Padrão | Quando usar | Implementação | Exemplos |
|---|---|---|---|
| **Full-screen navigation** | Mudança de seção real, o usuário "vai pra outro lugar". Mantém histórico do browser/router. | Push de rota Next.js. Header da página muda. BottomNav permanece. | `/dashboard` → `/lancamentos`; `/compromissos` → `/contas`. |
| **Sheet inferior (mobile) / Modal central (desktop)** | Ação contextual que produz mudança no app mas não "muda de página". Bloqueia interação com o fundo. | Mobile: sheet sobe de baixo, ocupa 60-85% da altura, com handle drag-down pra fechar. Desktop: modal centrado, max-width 560px, backdrop blur. | Novo lançamento; Nova transferência; Confirmar exclusão; Editar categoria. |
| **Drawer lateral (desktop) / Full-screen (mobile)** | Ver/editar detalhe de um item sem perder a lista. | Desktop: drawer 480px da direita, lista permanece à esquerda. Mobile: navega pra `/lancamentos/[id]` full-screen com back claro. | Click numa transação na lista; click numa conta em `/contas` (desktop expande side panel, mobile vai pra detalhe). |
| **Drawer "Mais" (mobile)** | Menu overflow, navegação para rotas menos frequentes. | Slide da direita ocupa ~75% da largura. Fundo permanece visível com backdrop blur 60%. Tap fora fecha. | Drawer "Mais" do BottomNav. |
| **Toast (não-bloqueante)** | Confirmação de ação concluída, com ação inversa opcional ("Desfazer"). | Top-right desktop, top-center mobile. 4s de duração padrão, 8s se tem "Desfazer". | "Transferido R$ 1.500"; "Mapfre marcada como paga · Desfazer". |
| **Inline expand** | Mais detalhes sobre um item de lista sem sair da lista. | Item expande verticalmente (height auto), revelando metadados secundários e mini-actions. | Item "PAG MercPag *XYZ" em `/categorizar` — Juliana expande pra ver hora/parcela. |
| **Stepper / Wizard** | NÃO usar. | — | Nenhuma jornada do app exige mais de uma tela em sequência forçada. Importar CSV é a única que pode ter 2 passos, mas resolve-se com sheet único que muda de "Upload" pra "Resultado" via animação fade. |

### Regras de motion

- Entrada de sheet/drawer/modal: 200ms (`--duration-base`) com easing `decel`.
- Saída: 200ms com `accel`.
- Transição entre rotas (page navigation): 120ms (`--duration-fast`) com `standard` — quase imperceptível, dá sensação de instantâneo.
- Mudança de número-âncora (saldo atualizado, contador descendo em `/categorizar`): 320ms (`--duration-slow`) com `emphasized` — chama atenção sutil, reforça que algo importante mudou.
- Toast entra do topo: 200ms `decel`; sai com fade 120ms `accel`.

---

## Encerramento

A IA proposta organiza o app em três naturezas (Gestão Diária / Análise / Sistema), preserva Empresa como **dimensão** (escopo) em vez de seção paralela, e elimina as redundâncias mapeadas no audit: toggle único no header, FAB único pra criar, QuickActions como painel canônico de atalhos, BottomNav puramente nav, Drawer só pra overflow. As três jornadas confirmam que o sitemap funciona em três velocidades distintas — Iremar urgente mobile (90s), Juliana rotina mobile (10min), Iremar planejamento desktop (25min) — usando sempre a mesma gramática.

Próxima fase: traduzir essa IA em wireframes das 16 telas, começando por `/dashboard` (admin + operator) e validando cada um contra os 5 princípios da Fase 03 e as 3 jornadas desta Fase 04.
