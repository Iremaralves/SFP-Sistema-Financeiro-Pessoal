# 02 — Benchmark de Referências

**Persona:** Marcus (Design Lead)
**Data:** 2026-06-07
**Escopo:** análise de 3 produtos consagrados em fintech/produtividade/dados, extraindo padrões aplicáveis ao redesign do i2 Finance.

---

## 1. Nubank (app mobile)

**Descrição visual mental.** Tela inicial dominada por um único número gigante (saldo da conta), tipografia sem-serifa pesada, fundo roxo profundo ou preto OLED dependendo do tema. Abaixo do saldo, uma fileira horizontal de atalhos circulares (Pix, Pagar, Transferir, Recarga) com ícones monocromáticos e label curto. Mais abaixo, "Meus cartões" como card colapsável com a fatura atual em destaque (valor + data de vencimento), e o feed de transações como lista densa com avatar circular do estabelecimento, descrição em uma linha e valor à direita. A navegação inferior só aparece quando faz sentido — caso contrário, scroll vertical contínuo.

### 3 patterns que FUNCIONAM
1. **Hierarquia radical do número-chave.** O saldo (ou o valor da fatura) ocupa sozinho o topo da tela com tipografia 2-3x maior que qualquer outro elemento. Zero competição visual. Aplicável ao dashboard do Iremar (saldo consolidado por perfil) e à tela de fatura do cartão (`/lancamentos` filtrada).
2. **Atalhos horizontais com ícone + label curto.** A fileira de ações rápidas (Pix, Pagar...) usa ícone circular preenchido em cor de marca + 1-2 palavras embaixo. É mobile-first nativo, escaneável em 1s. O `QuickActions` atual usa 4 cards quadrados — pode evoluir pra fileira horizontal scrollável com mais ações sem ocupar mais vertical.
3. **Fatura como card autocontido.** O bloco da fatura mostra: valor total, vencimento, % usado do limite, CTA "Ver fatura" — tudo em ~120px de altura. Aplicável diretamente ao `BillsCard` e a um futuro `CreditCardCard` no dashboard.

### 1 pattern que NÃO encaixa
**Gestos de swipe horizontal entre "Conta" e "Cartão" como contextos paralelos.** O Nubank trata conta e cartão como dois mundos navegáveis lateralmente. No i2 Finance, o usuário precisa enxergar PF+PJ+cartão simultaneamente pra tomar decisão de transferência/acerto — separar em swipes esconde a visão consolidada que é o diferencial do produto.

---

## 2. Linear

**Descrição visual mental.** Sidebar fixa estreita à esquerda (~240px) com hierarquia de workspace > times > views, tudo em tons de cinza-grafite sobre fundo quase preto. Densidade altíssima: tabelas de issues mostram 20+ linhas sem scroll, cada linha com ícone de status, ID, título, assignee, prioridade, label, data. Tipografia Inter pequena (13-14px) mas legível por excelente kerning e contraste calibrado. Comando `Cmd+K` abre um palette central que faz tudo — criar issue, navegar, mudar status, filtrar. Atalhos de teclado de uma tecla (`C` cria, `F` filtra, `/` busca).

### 3 patterns que FUNCIONAM
1. **Command palette (Cmd+K) como atalho universal.** Iremar é admin desktop+mobile e poweruser do próprio sistema — um palette resolveria "novo lançamento", "ir pra contas", "filtrar últimos 30d", "rodar acerto" em 2s sem caçar menu. Aplicável transversalmente a todas as telas desktop. Mobile pode ter versão simplificada como sheet inferior.
2. **Densidade calibrada em tabelas.** As tabelas de Linear cabem muita informação sem se sentir poluídas porque usam: row-height 32-36px, divisores quase invisíveis (1px cinza 8% opacidade), ícones 14px, e estados hover sutis. Aplicável a `/lancamentos` (lista grande), `/categorizar`, `/relatorios` — telas que hoje provavelmente respiram demais e exigem scroll excessivo.
3. **Sidebar com hierarquia colapsável + indicador de contexto ativo.** A sidebar do Linear marca claramente onde você está com background sutil + borda esquerda de 2px na cor do projeto. Aplicável ao `Sidebar` atual do i2 + integração com `ProfileScopeToggle` (a borda esquerda da seção ativa pode usar a cor do perfil: azul/rosa/âmbar/ciano).

### 1 pattern que NÃO encaixa
**Workspace switcher no topo da sidebar.** Linear tem múltiplos workspaces (empresas/clientes diferentes). No i2 Finance há um único "workspace" — o casal Iremar+Juliana. Trocar workspace não existe; o que existe é trocar *escopo* (Pessoal/Empresa/Tudo), que já é resolvido pelo `ProfileScopeToggle` no header. Importar a mecânica seria adicionar nível de hierarquia sem ganho.

---

## 3. Stripe Dashboard

**Descrição visual mental.** Layout web denso, sidebar à esquerda com seções (Payments, Customers, Products, Reports), área central dominada por gráficos de área com gradiente suave + número agregado gigante no topo de cada card ("$ 124,580.32" em 32-40px, abaixo "+12.4% vs last week" em verde discreto). Paleta predominantemente branca (modo light é o default deles) mas o modo dark usa cinza-azulado #0A0F1C com gráficos em roxo/verde fluorescente. Tabelas com filtros pill no topo, paginação inferior, e drawers laterais ao clicar numa linha (não navega — abre overlay).

### 3 patterns que FUNCIONAM
1. **Número agregado + delta comparativo + sparkline.** Cada KPI vem com: valor grande, variação % vs período anterior (verde/vermelho), e mini-gráfico de 30 pontos ao lado. Aplicável ao `/dashboard` do Iremar (saldo total, gastos do mês, receitas) e ao `/relatorios`. Hoje os cards mostram só o valor — adicionar delta + sparkline transforma o dashboard de "extrato" em "instrumento de decisão".
2. **Drawer lateral em vez de nova página pra detalhe.** Clicar numa transação abre painel lateral de 480px com detalhes + ações, mantendo a lista visível ao fundo. Aplicável a `/lancamentos/[id]` no desktop (mantém a lista, edita num drawer) — preserva contexto e elimina o "voltar".
3. **Filtros como pills horizontais editáveis.** No topo das tabelas: `Status: Succeeded ×` `Amount: > $100 ×` `+ Add filter`. Cada filtro vira pill removível, compõem AND. Aplicável a `/lancamentos`, `/categorizar`, `/relatorios` — substitui dropdowns múltiplos por uma linha visível do estado da query.

### 1 pattern que NÃO encaixa
**Modo light como padrão / cards com sombra elevada sobre fundo branco.** O i2 Finance tem dark OLED como identidade definida na regra do squad. Importar a estética Stripe de "white card on white background com shadow" quebra o glassmorphism dark e a hierarquia já estabelecida com transparências e blur.

---

## Patterns Aplicáveis — Cruzamento

| # | Referência | Pattern | Telas i2 onde cabe | Prioridade |
|---|-----------|---------|---------------------|------------|
| 1 | Nubank | Hierarquia radical do número-chave | `/dashboard`, `/lancamentos` (fatura), `/empresa` | Alta |
| 2 | Nubank | Atalhos horizontais com ícone circular + label | `QuickActions` do `/dashboard`, `BottomNav` Drawer "Mais" | Alta |
| 3 | Nubank | Fatura como card autocontido (valor + vencto + CTA) | `BillsCard`, futuro `CreditCardCard` no `/dashboard` | Alta |
| 4 | Linear | Command palette (Cmd+K) universal | Global desktop; sheet inferior no mobile | Média |
| 5 | Linear | Densidade calibrada de tabelas | `/lancamentos`, `/categorizar`, `/relatorios`, `/contas` | Alta |
| 6 | Linear | Sidebar com borda-esquerda colorida do escopo ativo | `Sidebar` + integração com `ProfileScopeToggle` | Média |
| 7 | Stripe | Número + delta % + sparkline | `/dashboard` (KPIs), `/relatorios`, `/mes` | Alta |
| 8 | Stripe | Drawer lateral pra detalhe (sem trocar de página) | `/lancamentos/[id]` em desktop, `/contas` detalhe | Média |
| 9 | Stripe | Filtros como pills removíveis | `/lancamentos`, `/categorizar`, `/relatorios`, `/importar` | Alta |

---

## Síntese estratégica

Os três patterns que devem orientar o redesign são:

- **Do Nubank:** clareza radical em mobile — um número manda, o resto serve.
- **Do Linear:** poder pro admin — densidade + Cmd+K dão ao Iremar a velocidade que ele precisa em desktop sem prejudicar a Juliana no mobile.
- **Do Stripe:** dados acionáveis — todo número importante carrega delta e tendência, transformando o app de "registro" em "instrumento".

A regra do squad (dark OLED + cores de responsável preservadas + mobile-first 375px) atravessa tudo: nenhum pattern aqui exige luz, troca de paleta, ou densidade que quebre em tela pequena. Os mobile-natives (Nubank patterns) viram base; os desktop-power (Linear, Stripe patterns) viram camadas opcionais ativadas por breakpoint.
