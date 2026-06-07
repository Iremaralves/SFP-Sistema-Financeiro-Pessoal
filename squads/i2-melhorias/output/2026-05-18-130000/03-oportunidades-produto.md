# Oportunidades de Produto — i2 Finance · Lena
**Data:** 18/05/2026  
**Autora:** Lena — Product Manager  
**Fontes:** Auditoria UX (Sofia) · Auditoria de Performance (Pedro) · Contexto operacional i2 Finance

---

## Resumo Executivo

O app hoje tem a estrutura certa — dashboards separados, DRE PJ, compromissos, NF. O que falta não é funcionalidade core: é **velocidade de execução para Iremar** e **clareza radical para Juliana**.

O critério de priorização é simples: **valor entregue / esforço**, com peso maior para dores que aparecem toda semana. Features XG só entram se tiverem impacto sistêmico. Dev solo = foco cirúrgico.

**Distribuição do roadmap:**
- 8 features P (< 1 dia cada) → semana 1
- 5 features M (1–3 dias cada) → semanas 2–3
- 4 features G (1–2 semanas cada) → próximo mês
- 2 features XG → quando tiver momentum

---

## Dimensão 1 — Automações que economizariam tempo de Iremar

### 1.1 — Dar Baixa em Lote nos Compromissos

**Dor:** Como Iremar, quero marcar 5–8 boletos como pagos de uma vez, sem ter que tocar um por um toda semana.

**Solução:** Checkbox de seleção múltipla em /compromissos + botão "Dar baixa nos selecionados". Alternativamente, um botão "Marcar todos os de hoje como pagos".

- **Esforço:** M (1–2 dias)
- **Impacto:** 🔥 Alto — tarefa semanal recorrente
- **Dependências:** DarBaixaButton já existe; precisa de estado de seleção (useState) + Server Action de baixa em batch

---

### 1.2 — Card de Fechamento Mensal no Dashboard (dia 1–10 do mês)

**Dor:** Como Iremar, quero ser lembrado no início do mês de registrar o faturamento da i2 do mês anterior, sem ter que navegar 8–12 toques até /empresa.

**Solução:** Card contextual no DashboardAdmin entre os dias 1–10 do mês, quando faturamento do mês anterior não está registrado. Card com campo inline de valor + link direto para /empresa?mes=anterior.

- **Esforço:** M (2 dias)
- **Impacto:** 🔥 Alto — evita esquecimento de fechamento, fluxo hoje tem 8–12 toques
- **Dependências:** Lógica de verificação de faturamento já existe em /empresa. Precisa de Server Action inline no dashboard.

---

### 1.3 — Lembrete de NF antes do Prazo Municipal

**Dor:** Como Iremar, quero ser alertado quando o faturamento foi registrado mas a NF ainda não foi emitida, para não perder o prazo de emissão.

**Solução:** Badge/alerta no card da i2 no dashboard e na página /empresa quando `faturamento != null && fiscal_note == null && dia_do_mes >= [configurável, padrão 15]`. Texto: "NF de [mês] ainda não emitida".

- **Esforço:** P (2–3 horas)
- **Impacto:** 🔥 Alto — risco fiscal real; alíquota ISS + multa por NF fora do prazo
- **Dependências:** Dados já disponíveis em /empresa. Só lógica condicional de display.

---

### 1.4 — Categorização de Lançamentos na UI (substituir alerta de CLI)

**Dor:** Como Iremar, quero categorizar lançamentos importados sem sair do app e sem usar terminal.

**Solução:** Em /lancamentos, lançamentos sem responsável (unassigned) ganham badge visual "Sem categoria" + botão inline "Categorizar" que abre um drawer com dropdown de responsável/entidade. Remove completamente o alerta de CLI do dashboard.

- **Esforço:** M (2–3 dias)
- **Impacto:** 🔥 Alto — fluxo pós-importação de CSV hoje exige CLI; isso bloqueia o app de ser mobile-first
- **Dependências:** Server Action de update de responsible/entity já deve existir (usado no CRUD de lançamentos). Precisa de filtro de "sem responsável" e drawer de edição rápida.

---

### 1.5 — Navegação por Mês com Salto Rápido (mês picker unificado)

**Dor:** Como Iremar, quero navegar para qualquer mês em /empresa ou /dashboard em 1 toque, não em 6 cliques consecutivos de seta.

**Solução:** Transformar o label de mês em /empresa em botão que abre modal com grid de meses (ex: últimos 18). Reutilizar o mesmo componente `<MesPicker>` em dashboard (se ganhar navegação) e /relatorios.

- **Esforço:** P (3–4 horas)
- **Impacto:** 📈 Médio — qualidade de vida constante
- **Dependências:** Remove o `<select disabled>` de /empresa (bug de UX). Componente novo, sem dependências de dados.

---

## Dimensão 2 — Funcionalidades para Juliana

### 2.1 — Tela "Minha Situação" (Juliana-first)

**Dor:** Como Juliana, quero abrir o app e entender em 3 segundos quanto devo, se já paguei, e o que preciso fazer — sem navegar por menus.

**Solução:** Redesign do DashboardOperator com foco em 3 estados:
1. **"Você deve R$ X — Mês de [mês]"** → CTA grande "Já transferi" (registra a transferência)
2. **"Tudo certo! Você transferiu R$ X"** → checkmark, data da transferência
3. **"Nenhuma despesa este mês ainda"** → estado vazio positivo

Eliminar jargão "Lançamento" → usar "Gasto" ou "Compra". Esconder botão "Importar CSV" da BottomNav da Juliana (já identificado pela Sofia, é P).

- **Esforço:** M (2–3 dias)
- **Impacto:** 🔥 Alto — é a razão de existir do app para Juliana; sem isso ela não adota
- **Dependências:** Precisa de Server Action "marcar transferência como realizada" do lado da Juliana (hoje só Iremar registra). Avaliar se Juliana deve poder auto-registrar ou só Iremar confirma.

---

### 2.2 — Ação "Registrar Recebimento de Juliana" no Dashboard do Iremar

**Dor:** Como Iremar, quero marcar que recebi a transferência da Juliana direto do dashboard, sem ir em /mes ou outra tela.

**Solução:** No DashboardAdmin, quando `julianaTransf < julianaPart`, exibir botão "Registrar recebimento" inline → abre modal simples com campo de valor + botão confirmar.

- **Esforço:** P (3–4 horas)
- **Impacto:** 🔥 Alto — fluxo mensal do casal, hoje não tem caminho óbvio
- **Dependências:** Server Action de criação de income_record tipo `juliana_transfer`. Sem dependências complexas.

---

### 2.3 — Resumo de Gastos por Categoria para Juliana

**Dor:** Como Juliana, quero entender onde estou gastando mais este mês, apresentado de forma simples — não uma planilha.

**Solução:** Na tela de lançamentos da Juliana (operator), adicionar um mini-resumo colapsável: top 3 categorias do mês com valor e barra de proporção. Ex: "Mercado R$ 340 ████░ · Farmácia R$ 120 ██░░░ · Restaurante R$ 90 █░░░░".

- **Esforço:** M (1–2 dias)
- **Impacto:** 📈 Médio — contexto valioso, mas não é bloqueador de adoção
- **Dependências:** Dados de lançamentos com responsável já existem. Precisa de agrupamento por categoria (hoje existe o campo `responsible` — verificar se há campo de categoria separado).

---

### 2.4 — Notificação "Fatura fechou — você deve R$ X"

**Dor:** Como Juliana, quero saber automaticamente quando a fatura do cartão fechar e quanto devo, sem ter que abrir o app para verificar.

**Solução:** Push notification (via Web Push API ou, na versão simples, um e-mail) no fechamento da fatura com o valor da parte de Juliana e link direto para o app.

- **Esforço:** G (1 semana — setup de Web Push + integração com fechamento de fatura)
- **Impacto:** 📈 Médio — Juliana não tem o hábito de abrir o app; a notificação cria o gatilho
- **Dependências:** Precisa definir "evento de fechamento de fatura" (manual? automático no dia X?). Web Push requer service worker, certificado VAPID, tabela de subscriptions.

---

## Dimensão 3 — Inteligência Financeira

### 3.1 — Alertas de Variação Mensal ("Você gastou X% mais em [categoria]")

**Dor:** Como Iremar, quero saber quando alguma categoria de gasto está fora do padrão histórico, sem ter que comparar manualmente mês a mês.

**Solução:** Na aba de Relatórios ou no Dashboard, um card "Destaques do mês": até 3 alertas automáticos baseados em desvio vs. média dos 3 meses anteriores. Ex: "Restaurantes: R$ 890 este mês vs. média de R$ 420 — +112%". Só aparece quando desvio > 30%.

- **Esforço:** M (2–3 dias)
- **Impacto:** 🔥 Alto — o app tem dados mas não gera insight nenhum; esse é o diferencial de um app "inteligente" vs. planilha
- **Dependências:** Precisa de campo de categoria em transactions (verificar se existe). Lógica de média é simples (SQL ou JS). Sem APIs externas.

---

### 3.2 — Projeção de Gasto até o Final do Mês

**Dor:** Como Iremar, quero saber se estou no caminho certo para fechar o mês dentro do orçamento, baseado no ritmo atual de gastos.

**Solução:** No dashboard, abaixo do total atual, um indicador pequeno: "Projeção: R$ X até o fim do mês" baseado em `(gasto_atual / dias_passados) * dias_no_mes`. Com comparação simples vs. mês anterior.

- **Esforço:** P (2–3 horas)
- **Impacto:** 📈 Médio — útil mas não urgente; funciona melhor quando há histórico consolidado
- **Dependências:** Zero — dados já existem no dashboard. Só cálculo matemático simples.

---

### 3.3 — Gráfico de Barras no Relatório de Fluxo de Caixa

**Dor:** Como Iremar, quero visualizar o fluxo de caixa dos últimos 12 meses em formato gráfico para identificar tendências rapidamente.

**Solução:** Substituir (ou complementar) a tabela de 12 meses em /relatorios por um gráfico de barras SVG inline — barras de receita (verde) vs. despesa (vermelho) por mês. Biblioteca leve: Recharts ou SVG puro (sem dependência).

- **Esforço:** M (1–2 dias)
- **Impacto:** 📈 Médio — a tabela atual é difícil de ler em mobile; gráfico é mais natural
- **Dependências:** Dados já disponíveis em /relatorios. Considerar Recharts (já pode estar no projeto) ou SVG manual para evitar bundle extra.

---

### 3.4 — Score de Saúde Financeira Mensal

**Dor:** Como Iremar, quero um indicador rápido de como foi o mês financeiro do casal, sem ter que somar e comparar manualmente.

**Solução:** Um número simples de 0–100 ou categorias (Ótimo / Bom / Atenção / Crítico) calculado com base em: % do orçamento gasto, inadimplência de compromissos, variação vs. mês anterior. Exibido no dashboard como um badge com cor.

- **Esforço:** G (1 semana — definir métricas, calibrar pesos, UI)
- **Impacto:** 📈 Médio — é mais gamificação do que gestão real; interessante mas não prioritário
- **Dependências:** Precisa de definição de "orçamento" (hoje o app não tem orçamento configurado). Sem orçamento base, o score não tem referência.

---

## Dimensão 4 — Gestão da i2 Soluções

### 4.1 — Controle de Pró-labore e DAS MEI

**Dor:** Como Iremar, quero registrar o pró-labore mensal e o pagamento do DAS MEI como despesas fixas da empresa, para que apareçam corretamente no DRE.

**Solução:** Adicionar duas linhas fixas no DRE PJ abaixo de "Custos Fixos": Pró-labore (valor configurável) e DAS MEI (calculado automaticamente pela alíquota MEI vigente sobre o faturamento ou valor fixo). Ambos com campo de "Pago / Pendente" mensal.

- **Esforço:** M (2 dias)
- **Impacto:** 🔥 Alto — sem isso o DRE não reflete a realidade fiscal da i2; é despesa obrigatória ignorada
- **Dependências:** Precisa de nova tabela ou campo em `income_records`/`recurring_commitments` para distinguir DAS e pró-labore. Alíquota DAS MEI pode ser hardcoded (atualizada manualmente).

---

### 4.2 — Fluxo de Caixa PJ Separado (projeção 3 meses)

**Dor:** Como Iremar, quero ver uma projeção de 3 meses da i2 com faturamentos esperados e despesas fixas, para planejar retiradas e pagamentos.

**Solução:** Seção em /empresa ou nova aba com: faturamento médio dos últimos 3 meses como base + despesas fixas cadastradas = resultado projetado por mês. Não precisa ser sofisticado — uma tabela simples de 3 colunas (mês / receita estimada / despesa fixa / projeção).

- **Esforço:** M (2–3 dias)
- **Impacto:** 📈 Médio — útil para planejamento, mas só tem valor quando há histórico > 6 meses
- **Dependências:** Dados de recurring_commitments (entidade i2) e income_records já existem. Lógica de média dos últimos N meses é simples.

---

### 4.3 — Resultado Acumulado no Ano (DRE YTD)

**Dor:** Como Iremar, quero saber quanto a i2 lucrou/perdeu no acumulado do ano, não só no mês atual.

**Solução:** No topo de /empresa, adicionar um card colapsável "Acumulado [Ano]" com: Faturamento total YTD, Despesas totais YTD, Resultado YTD. Simples e direto.

- **Esforço:** P (3–4 horas)
- **Impacto:** 🔥 Alto — visão que todo gestor PJ precisa e que hoje exige somar mês a mês manualmente
- **Dependências:** Dados já existem. Query de `income_records` e `transactions` filtrada por `year(reference_month) = current_year`. Sem nova infraestrutura.

---

### 4.4 — Controle de Clientes / Projetos Ativos (pipeline básico)

**Dor:** Como Iremar, quero registrar os projetos ativos da i2 com valor contratado e status, para correlacionar com o faturamento registrado.

**Solução:** Lista simples de projetos/clientes em /empresa com: nome do cliente, valor contratado, status (Em andamento / Faturado / Encerrado), mês de início. Vinculável a income_records para reconciliação.

- **Esforço:** G (1–2 semanas — nova entidade, CRUD, vínculo com income_records)
- **Impacto:** 📈 Médio — útil, mas só quando a i2 tem > 3 clientes simultâneos; avaliar volume real
- **Dependências:** Nova tabela `projects` com FK para `entities` e `income_records`. Novo CRUD completo.

---

## Dimensão 5 — Integrações de Alto Valor

### 5.1 — Exportação PDF do DRE Mensal

**Dor:** Como Iremar, quero exportar o DRE da i2 em PDF para compartilhar com contador ou guardar como comprovante.

**Solução:** Botão "Exportar PDF" em /empresa que gera um PDF simples com: cabeçalho i2 Soluções, mês de referência, tabela DRE (faturamento / deduções / custos fixos / resultado), rodapé com data de geração. Usando `@react-pdf/renderer` ou Puppeteer server-side.

- **Esforço:** M (2–3 dias)
- **Impacto:** 📈 Médio — pedido comum de quem tem contador; remove fricção de "tirar screenshot do app"
- **Dependências:** `@react-pdf/renderer` ou similar. Cuidado com bundle size em Server Component.

---

### 5.2 — Importação Automática de Extrato (OFX / Open Finance)

**Dor:** Como Iremar, quero importar o extrato bancário automaticamente, sem baixar CSV e fazer upload manual todo mês.

**Solução fase 1 (M):** Suporte a arquivos OFX (padrão bancário universal) além de CSV. O parser OFX é simples e eliminaria a dependência de formato específico de cada banco.  
**Solução fase 2 (XG):** Integração Open Finance via API (requer cadastro como receptor de dados no Banco Central, processo burocrático e custoso para dev solo).

- **Esforço fase 1:** M (2 dias — parser OFX em JS já existe como lib `ofx-js`)
- **Esforço fase 2:** XG (> 2 semanas + burocracia regulatória)
- **Impacto fase 1:** 📈 Médio — simplifica importação; usuários com Nubank, Itaú, BB já têm OFX disponível
- **Impacto fase 2:** 🔥 Alto — mas complexidade regulatória não é adequada para dev solo
- **Dependências fase 1:** Parser OFX → converter para formato de transactions existente → reutilizar fluxo de categorização

---

### 5.3 — NFSe via Prefeitura (emissão direto do app)

**Dor:** Como Iremar, quero emitir a NFSe do município direto do app, sem acessar o portal da prefeitura separadamente.

**Solução:** Integração com a API do webISS ou ePMF (depende do município de Iremar) para emissão de NFSe via API. O app preenche os dados da nota a partir do faturamento registrado.

- **Esforço:** XG (> 2 semanas — cada município tem API diferente, autenticação por certificado digital)
- **Impacto:** 🔥 Alto (se implementado) — elimina um passo manual obrigatório todo mês
- **Dependências:** API específica do município de Iremar. Certificado digital A1 ou token. Muito variável por localidade — avaliar se o município tem API pública antes de iniciar.

---

## Dimensão 6 — Mobile Experience

### 6.1 — Toast/Snackbar Global de Feedback

**Dor:** Como qualquer usuário, quero saber imediatamente quando uma ação foi concluída (salvar NF, dar baixa, adicionar lançamento) sem ter que adivinhar se funcionou.

**Solução:** Implementar sistema global de toast com Sonner (já é padrão no ecossistema Next.js/shadcn). Conectar em: dar baixa em compromisso, salvar NF, salvar faturamento, adicionar lançamento, registrar transferência. Mensagens em português: "Baixa registrada!", "Nota salva!", etc.

- **Esforço:** P (3–4 horas — instalar Sonner, criar wrapper, conectar nos 5 pontos identificados)
- **Impacto:** 🔥 Alto — hoje o app não tem sistema de feedback; afeta TODA ação de escrita
- **Dependências:** `sonner` como nova dependência (2KB gzip). Sem dependências de dados.

---

### 6.2 — OCR de Nota Fiscal por Câmera

**Dor:** Como Iremar, quero fotografar uma nota fiscal física ou comprovante e ter os dados (valor, data, descrição) preenchidos automaticamente no formulário de lançamento.

**Solução:** Botão "Fotografar NF" em /lancamentos/novo que abre câmera → envia imagem para OCR (Google Cloud Vision ou Tesseract.js local) → preenche campos automaticamente.

- **Esforço:** G (1–2 semanas — integração de câmera no mobile web + OCR + parsing de campos)
- **Impacto:** 📈 Médio — útil para comprovantes físicos, mas a maioria dos gastos já entra via CSV; avaliar % de entrada manual atual
- **Dependências:** Google Cloud Vision API (pago por volume) ou Tesseract.js (gratuito, menor precisão). Permissão de câmera no browser.

---

### 6.3 — PWA com Ícone na HomeScreen e Splash Screen

**Dor:** Como Juliana, quero acessar o app pelo ícone no celular como se fosse um app nativo, sem ter que abrir o browser.

**Solução:** Configurar manifest.json, service worker básico e splash screen para PWA instalável. No iOS via "Adicionar à Tela de Início", no Android via banner de instalação automático.

- **Esforço:** P (4–6 horas — manifest.json, ícones, configuração Next.js PWA)
- **Impacto:** 📈 Médio — reduz barreira de acesso para Juliana; aumenta percepção de "app de verdade"
- **Dependências:** `next-pwa` ou configuração manual de service worker. Não afeta funcionalidade, só instalabilidade.

---

### 6.4 — Biometria / PIN para Abertura Rápida

**Dor:** Como qualquer usuário, quero abrir o app com digital ou Face ID sem ter que digitar senha toda vez, especialmente para consultas rápidas de saldo.

**Solução:** Usar Web Authentication API (WebAuthn) para autenticação biométrica após primeiro login. O Supabase suporta passkeys nativamente — avaliar ativação.

- **Esforço:** G (1 semana — WebAuthn setup + integração Supabase)
- **Impacto:** 📈 Médio — conforto de uso, especialmente para Juliana que acessa só para ver saldo
- **Dependências:** Supabase Passkeys (em beta). Requer HTTPS com domínio configurado. iOS 16+ e Android recentes.

---

## Backlog Priorizado — Quadrante Valor × Esforço

### Executar Imediatamente (Quick Wins — semana 1)

| # | Feature | Esforço | Impacto | Usuário |
|---|---|---|---|---|
| 1 | Toast/Snackbar global (Sonner) | P | 🔥 Alto | Ambos |
| 2 | Alerta de NF não emitida no dashboard | P | 🔥 Alto | Iremar |
| 3 | Resultado Acumulado YTD em /empresa | P | 🔥 Alto | Iremar |
| 4 | Projeção de gasto até fim do mês | P | 📈 Médio | Iremar |
| 5 | Ação "Registrar recebimento de Juliana" no dashboard | P | 🔥 Alto | Iremar |
| 6 | MesPicker unificado (substituir select desabilitado) | P | 📈 Médio | Iremar |
| 7 | PWA instalável (manifest + ícones) | P | 📈 Médio | Juliana |

### Próximas Sprints (semanas 2–4)

| # | Feature | Esforço | Impacto | Usuário |
|---|---|---|---|---|
| 8 | Dar baixa em lote nos compromissos | M | 🔥 Alto | Iremar |
| 9 | Card de fechamento mensal no dashboard | M | 🔥 Alto | Iremar |
| 10 | Tela "Minha Situação" para Juliana | M | 🔥 Alto | Juliana |
| 11 | Categorização de lançamentos na UI (sem CLI) | M | 🔥 Alto | Iremar |
| 12 | Pró-labore e DAS MEI no DRE | M | 🔥 Alto | Iremar |
| 13 | Alertas de variação mensal por categoria | M | 🔥 Alto | Iremar |
| 14 | Gráfico de barras no fluxo de caixa | M | 📈 Médio | Iremar |
| 15 | Fluxo de caixa PJ — projeção 3 meses | M | 📈 Médio | Iremar |
| 16 | Exportação PDF do DRE | M | 📈 Médio | Iremar |
| 17 | Resumo de categorias para Juliana | M | 📈 Médio | Juliana |

### Próximo Mês

| # | Feature | Esforço | Impacto | Usuário |
|---|---|---|---|---|
| 18 | Notificação de fechamento de fatura (Juliana) | G | 📈 Médio | Juliana |
| 19 | Score de Saúde Financeira | G | 📈 Médio | Ambos |
| 20 | OCR de nota fiscal por câmera | G | 📈 Médio | Iremar |
| 21 | Biometria/PIN (WebAuthn) | G | 📈 Médio | Ambos |
| 22 | Controle de clientes/projetos ativos | G | 📈 Médio | Iremar |

### Avaliar antes de iniciar (XG — só se houver demanda clara)

| # | Feature | Esforço | Impacto | Risco |
|---|---|---|---|---|
| 23 | NFSe via API da prefeitura | XG | 🔥 Alto | Alto — varia por município |
| 24 | Open Finance (receptor de dados) | XG | 🔥 Alto | Muito alto — burocracia regulatória |

---

## Oportunidades Não Óbvias (vale investigar)

**Suporte OFX além de CSV:** O esforço é baixo (lib `ofx-js` já existe) e o ganho é significativo — praticamente todo banco brasileiro exporta OFX. Seria a maior melhoria de importação com menor esforço.

**Separação visual PF × PJ mais explícita:** O maior risco estratégico do app é a confusão entre gastos pessoais e da empresa. Considerar uma sinalização permanente na interface (cor de fundo diferente ou badge) quando o usuário está em contexto PJ vs. PF.

**Onboarding guiado para Juliana:** Um fluxo de 3 telas na primeira abertura explicando "Seu saldo / Como transferir / Como adicionar gasto" eliminaria a necessidade de treinamento manual. Esforço P–M, impacto alto na adoção.

---

## O que NÃO fazer agora

- **Orçamento por categoria configurável:** Útil no futuro, mas sem baseline de histórico consolidado, criar orçamentos é prematuro e gera ruído.
- **Multi-household / Multi-empresa:** Escopo creep claro. O app serve uma família específica.
- **Integração com apps de investimento (Rico, XP, etc.):** Fora do escopo de controle de fluxo de caixa. Adiciona complexidade sem resolver a dor atual.
- **Chat de suporte ou IA generativa:** Overhead técnico e de custo operacional incompatível com dev solo.

---

*Relatório de Oportunidades de Produto — Lena · i2 Finance · 18/05/2026*
