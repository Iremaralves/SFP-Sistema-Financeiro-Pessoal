# 02 — 6 opções para captura automática do CSV

**Squad:** i2-integracao-email · **Engenheiro:** Léo · **Data:** 2026-05-19

> Comparação honesta. Custos em R$/mês considerando câmbio de R$ 5,80/USD. Complexidade considera **dev solo**.

---

## Opção 1 — Apps Script com trigger automático (melhorar o atual)

### Como funciona
Mantém o `apps-script-fatura.js` rodando todo dia às 8h, mas **adiciona uma chamada HTTP** para o webhook do app Next.js (`/api/webhooks/csv-recebido`) sempre que um CSV novo é salvo no Drive. O Next.js processa direto e envia push/e-mail pro Iremar avisando.

### Vantagens
- ✅ Reaproveita tudo que já existe e funciona
- ✅ Zero custo (cota Apps Script é gratuita para esse volume)
- ✅ Não muda nada do fluxo Gmail → Drive
- ✅ Adiciona observabilidade real (logs no Vercel)
- ✅ Resolve o problema #1 (notificação) sem trocar arquitetura

### Desvantagens
- ❌ Apps Script continua rodando "como o Iremar" (problema #2 persiste)
- ❌ Continua acoplado a uma planilha
- ❌ Continua frágil a inatividade prolongada (>6 meses sem abrir a planilha pausa triggers)
- ❌ Webhook precisa de secret (mais 1 env var pra gerenciar)
- ❌ Se Apps Script falhar, ninguém é notificado (precisa monitor externo tipo UptimeRobot)

### Custo
**R$ 0/mês**

### Complexidade
**P (1-2h)** — adicionar `UrlFetchApp.fetch()` no Apps Script + 1 route handler no Next.js.

### Manutenção
**Baixa-Média** — uma vez por ano provavelmente vai precisar reautorizar o script.

### Robustez
Falha em:
- Iremar perder acesso ao Google
- Nubank mudar formato do remetente
- Planilha for deletada
- Apps Script atingir cota diária (improvável neste volume)

### Veredito
✅ **Recomendado** — menor delta, maior aproveitamento do que já existe.

---

## Opção 2 — Gmail API direto no Next.js com OAuth

### Como funciona
Iremar autoriza o app uma vez (OAuth consent screen) dando acesso ao Gmail dele. O Next.js guarda o refresh token no Supabase e, num cron job (Vercel Cron, gratuito), busca e-mails do Nubank diretamente, baixa o anexo, processa e insere no banco. **Apps Script é aposentado.**

### Vantagens
- ✅ Consolida tudo em um lugar (Next.js)
- ✅ Independente da planilha Google Sheets
- ✅ Observabilidade nativa (logs Vercel)
- ✅ Vercel Cron é gratuito (até 2 crons no plano Hobby)
- ✅ Iremar pode revogar acesso quando quiser via console.cloud.google.com

### Desvantagens
- ❌ Precisa configurar **OAuth consent screen** no Google Cloud Console (chato, exige verificação se for escopo sensível)
- ❌ Gmail API tem escopos sensíveis (`gmail.readonly`) → app precisa de **verificação do Google** se for público. Para uso interno (≤100 usuários) dá pra rodar como "Testing", mas refresh tokens **expiram em 7 dias** nesse modo
- ❌ Refresh token pode invalidar se Iremar trocar senha → quebra
- ❌ Setup inicial pesado (configurar projeto GCP, criar credentials, gerenciar tokens)
- ❌ Vercel Cron no Hobby roda **só 1x/dia** (suficiente, mas inflexível)

### Custo
**R$ 0/mês** (Vercel Hobby + Gmail API)

### Complexidade
**G (1-3 dias)** — OAuth flow, gerenciamento de tokens, cron, lógica de busca + parse.

### Manutenção
**Média-Alta** — refresh tokens podem expirar, OAuth consent screen exige re-verificação periódica do Google, scopes sensíveis viram problema se um dia Iremar quiser abrir o app pra outras pessoas.

### Robustez
Falha em:
- Token expirar (Testing mode = 7 dias)
- Google mudar política de verificação
- Iremar trocar senha
- App precisar passar verificação (semanas de espera)

### Veredito
🟡 **Talvez** — boa em teoria, mas a burocracia do OAuth para Gmail (escopo sensível) é desproporcional ao problema. Vale a pena se o app for crescer pra mais usuários.

---

## Opção 3 — Cloudflare Email Workers

### Como funciona
Iremar cria um endereço dedicado (ex: `nubank@i2solucoes.com` via Cloudflare Email Routing, gratuito se o domínio estiver no Cloudflare) que **redireciona pra um Worker**. O Worker recebe o e-mail bruto, extrai o anexo CSV, e chama o webhook do Next.js com o conteúdo do CSV. Iremar precisa **mudar o e-mail cadastrado no Nubank** para esse endereço.

### Vantagens
- ✅ Endereço dedicado = filtro perfeito (só recebe Nubank)
- ✅ Cloudflare Workers + Email Routing são **gratuitos** até 100k requests/dia
- ✅ Independente do Google (sem OAuth, sem tokens)
- ✅ Robusto: e-mail é protocolo padrão, raramente quebra
- ✅ Worker é serverless, sem manutenção de infra

### Desvantagens
- ❌ **Exige domínio próprio no Cloudflare** (i2solucoes.com hoje está no Google Workspace, precisa migrar DNS pra Cloudflare ou criar subdomínio dedicado)
- ❌ Iremar precisa **trocar o e-mail cadastrado no Nubank** (chato, exige login no app Nubank + confirmação)
- ❌ Setup inicial chato: configurar Email Routing, escrever Worker, configurar webhook
- ❌ Email Workers ainda têm limitações (anexos >25MB falham; o CSV do Nubank é minúsculo, mas é uma pegadinha futura)
- ❌ Se Iremar quiser ver o e-mail original "em algum lugar", precisa também redirecionar pro Gmail (configurável, mas +1 step)

### Custo
**R$ 0/mês** (Cloudflare Free)

### Complexidade
**M (meio-dia)** — Worker é simples, mas migração de DNS / criação de subdomínio + reconfiguração no Nubank consome tempo.

### Manutenção
**Baixa** — uma vez configurado, é setup-and-forget de verdade.

### Robustez
Falha em:
- DNS quebrar (raro)
- Nubank mudar formato de anexo
- Cloudflare cair (raríssimo, e mesmo assim e-mail fica em fila)

### Veredito
🟡 **Talvez** — solução mais elegante e robusta, **mas exige mexer no DNS e no Nubank**. Excelente se Iremar topar o setup inicial; overkill se ele só quer "resolver o aviso de CSV novo".

---

## Opção 4 — Postmark/Resend Inbound Email

### Como funciona
Cria um endereço dedicado tipo `csv@inbound.postmarkapp.com` (ou `csv@i2solucoes.com` via Resend Inbound) que entrega o e-mail recebido como **webhook POST JSON** com anexos em base64. O Next.js recebe esse webhook, parseia o CSV e processa. Iremar precisa **mudar o e-mail no Nubank**.

### Vantagens
- ✅ Setup mais fácil que Cloudflare (não mexe em DNS no Free tier do Postmark)
- ✅ Webhook estruturado (anexos vêm parseados em JSON)
- ✅ Logs e replay de webhooks no painel do Postmark/Resend
- ✅ Independente do Google
- ✅ Pode testar enviando e-mail manualmente

### Desvantagens
- ❌ **Free tier limitado** (Postmark: 100 e-mails/mês total; Resend: 100/dia mas inbound não é grátis em todos os planos)
- ❌ Custo escala se o app crescer
- ❌ Iremar precisa **trocar o e-mail no Nubank** (mesma fricção da opção 3)
- ❌ Dependência de SaaS externo (vendor lock-in leve)
- ❌ Se SaaS sair do ar, perde a captura

### Custo
**R$ 0/mês** no free tier (suficiente para 1 CSV/mês), **~R$ 60-90/mês** se precisar de plano pago.

### Complexidade
**P-M (2-4h)** — configurar endereço inbound + webhook + processar.

### Manutenção
**Baixa**

### Robustez
Falha em:
- SaaS cair
- Exceder free tier
- Nubank mudar formato

### Veredito
❌ **Não recomendado** — paga (ou quase paga) por algo que Cloudflare faz de graça com a mesma robustez. Memory do squad já diz: "Não recomendar SaaS pago para algo que pode ser feito free".

---

## Opção 5 — IMAP polling no backend

### Como funciona
Um job no Next.js (Vercel Cron) conecta no Gmail do Iremar via **IMAP** usando "senha de app" (App Password do Google), busca e-mails do Nubank, baixa anexos e processa.

### Vantagens
- ✅ IMAP é protocolo aberto e estável há 30 anos
- ✅ App Password do Google é mais simples que OAuth (não precisa consent screen)
- ✅ Independente da planilha

### Desvantagens
- ❌ **App Passwords só funcionam com 2FA ativo** (Iremar já tem, ok)
- ❌ **Google está desativando App Passwords** para muitos cenários — em contas Workspace gerenciadas, admin pode bloquear
- ❌ Senha vive em env var → se vazar, atacante lê todo o Gmail
- ❌ Vercel Functions têm timeout (60s no Hobby), e IMAP pode demorar
- ❌ Bibliotecas IMAP em Node são notoriamente chatas (node-imap, imapflow, mailparser)
- ❌ Setup mais complexo que parece (parsing MIME, anexos, encoding)
- ❌ Quase nada de observabilidade

### Custo
**R$ 0/mês**

### Complexidade
**M-G (1-2 dias)** — escrever cliente IMAP, lidar com MIME, gerenciar conexões.

### Manutenção
**Alta** — App Password pode ser revogada pelo Google sem aviso; biblioteca IMAP costuma quebrar em updates.

### Robustez
Falha em:
- Google revogar App Password
- IMAP timeout
- Mudança de política de Workspace
- Biblioteca quebrar em update

### Veredito
❌ **Não recomendado** — todas as desvantagens da Opção 2 (depende do Gmail) sem nenhuma vantagem real. Tecnologia antiga + risco de descontinuação.

---

## Opção 6 — Manter manual com botão "Verificar email agora"

### Como funciona
Mantém o Apps Script como está (cron diário), mas **adiciona um botão "Verificar e-mail agora"** no app Next.js que chama um endpoint que dispara o Apps Script via [Apps Script API](https://developers.google.com/apps-script/api/reference/rest/v1/scripts/run) ou um deployment Web App (`doGet`/`doPost`). Iremar tem controle total — quando quiser, clica.

### Vantagens
- ✅ Mínimo de mudança
- ✅ Custo zero
- ✅ Iremar tem **controle explícito** (sabe exatamente quando rodou)
- ✅ Não precisa notificação push (Iremar só clica quando quer ver)
- ✅ Funciona como "fallback de emergência" mesmo se o cron diário quebrar

### Desvantagens
- ❌ Não resolve "esquece de verificar" — só muda de "esquecer de olhar o app" pra "esquecer de clicar no botão"
- ❌ Continua dependendo do Apps Script (problemas #2, #4, #8 do estado atual persistem)
- ❌ Apps Script API exige OAuth (mesmo problema da Opção 2) **OU** Web App público (com token simples)
- ❌ Não é "automático" de verdade

### Custo
**R$ 0/mês**

### Complexidade
**P (1-2h)** — publicar Apps Script como Web App + chamar via fetch no botão.

### Manutenção
**Baixa** (herda Apps Script)

### Robustez
Mesma do Apps Script atual.

### Veredito
🟡 **Talvez** — bom como **complemento** da Opção 1, não como solução principal. Iremar disse que quer "saber quando chega", não "ter mais um botão pra clicar".

---

## Resumo rápido

| #   | Opção                       | Custo R$/mês | Complexidade | Manutenção | Robustez   | Veredito |
|-----|-----------------------------|--------------|--------------|------------|------------|----------|
| 1   | Apps Script + webhook       | 0            | P (1-2h)     | Baixa-Méd  | Média      | ✅       |
| 2   | Gmail API OAuth no Next.js  | 0            | G (1-3 dias) | Méd-Alta   | Média      | 🟡       |
| 3   | Cloudflare Email Workers    | 0            | M (meio-dia) | Baixa      | Alta       | 🟡       |
| 4   | Postmark/Resend Inbound     | 0-90         | P-M (2-4h)   | Baixa      | Alta       | ❌       |
| 5   | IMAP polling                | 0            | M-G (1-2d)   | Alta       | Baixa      | ❌       |
| 6   | Botão "Verificar agora"     | 0            | P (1-2h)     | Baixa      | Média      | 🟡       |

Próximo step: matriz Esforço × Robustez × Custo + recomendação final.
