# 03 — Recomendação final

**Squad:** i2-integracao-email · **Engenheiro:** Léo · **Data:** 2026-05-19

---

## Matriz Esforço × Robustez × Custo

Escala: 1 = ruim, 5 = ótimo. **Score = (Robustez × 2) + (Inverso_Esforço × 1.5) + (Inverso_Custo × 1) − Manutenção**.

| #   | Opção                       | Esforço↓ | Robustez↑ | Custo↓ | Manutenção↓ | Score |
|-----|-----------------------------|----------|-----------|--------|-------------|-------|
| 1   | Apps Script + webhook       | 5 (P)    | 3         | 5      | 2           | **17.5** ⭐ |
| 3   | Cloudflare Email Workers    | 3 (M)    | 5         | 5      | 1           | **17.5** ⭐ |
| 6   | Botão "Verificar agora"     | 5 (P)    | 3         | 5      | 2           | 17.5     |
| 2   | Gmail API OAuth             | 2 (G)    | 3         | 5      | 3           | 11.0     |
| 4   | Postmark/Resend Inbound     | 4 (P-M)  | 4         | 4      | 1           | 16.0     |
| 5   | IMAP polling                | 2 (M-G)  | 2         | 5      | 4           | 8.0      |

Empate técnico entre **Opção 1** e **Opção 3**. Desempate pelo perfil do Iremar.

---

## Perfil do Iremar (refresher)

- **Dev solo**, sem tempo para manutenção contínua
- **Microempresa**, sem orçamento para SaaS
- **Google Workspace já em uso** (i2solucoes.com)
- Quer **setup-and-forget**
- **Já tem Apps Script funcionando** (não foi do zero — investiu tempo no setup)
- Quer **saber quando chegou CSV novo** (problema central)

### Por que Opção 3 (Cloudflare) perde no desempate

Para configurar Cloudflare Email Workers, o Iremar precisa:
1. Mover DNS do `i2solucoes.com` para Cloudflare (ou criar subdomínio dedicado) — **mexer em DNS de produção do Workspace é arriscado**
2. Trocar o e-mail cadastrado no app do Nubank
3. Escrever e fazer deploy de um Worker
4. Reconfigurar webhook

São 3-4h de setup envolvendo DNS de produção, e Iremar **já tem o fluxo Gmail funcionando**. O ganho de robustez não compensa o risco de mexer no DNS do domínio principal do Workspace.

### Por que Opção 1 vence

Iremar **já investiu** no Apps Script. Já está rodando, já tem trigger automático às 8h, já salva no Drive, já popula a planilha. **Falta só uma coisa: avisar o Iremar quando isso acontece.**

Solução: o Apps Script chama um webhook do Next.js sempre que importa CSV novo. O Next.js processa direto no Supabase (sem precisar do Iremar clicar em "Importar") e envia uma notificação (e-mail, push web, ou só uma badge no app).

---

## ✅ Recomendação: Opção 1 — Apps Script com webhook para o Next.js

**Por quê:**
- Aproveita 100% do que já existe e funciona
- 1-2h de trabalho
- Resolve o problema central (notificação) sem rearquitetar nada
- Zero custo, zero novo serviço, zero novo token pra gerenciar
- Reversível: se um dia o Iremar quiser trocar pra Cloudflare, é só desativar o trigger do Apps Script

---

## Plano de implementação detalhado

> Tempo total estimado: **1h30 a 2h**.

### Passo 1 — Criar route handler no Next.js (20 min)

Criar `apps/web/src/app/api/webhooks/csv-nubank/route.ts`:

```ts
// Pseudocódigo — não implementar agora, esse squad é só decisão.
// POST /api/webhooks/csv-nubank
// Header: x-webhook-secret: <SECRET>
// Body: { fileId: string, fileName: string, modifiedTime: string }
//
// 1. Validar header secret contra env WEBHOOK_SECRET_CSV
// 2. Baixar CSV via Drive API (mesma lógica do actionImportarDrive)
// 3. Rodar processCSV()
// 4. Inserir notificação na tabela notifications (ou enviar e-mail via Resend)
// 5. Retornar { ok: true, inserted, skipped, ... }
```

**Como testar:** `curl -X POST http://localhost:3000/api/webhooks/csv-nubank -H "x-webhook-secret: $SECRET" -d '{"fileId":"<id-real>","fileName":"Nubank_2026-05.csv"}'`

### Passo 2 — Gerar secret e adicionar nas envs (5 min)

```bash
# Gerar secret
openssl rand -hex 32
# Adicionar no Vercel (production + preview)
vercel env add WEBHOOK_SECRET_CSV
# Copiar mesmo valor pra cole no Apps Script (próximo passo)
```

### Passo 3 — Adicionar chamada HTTP no Apps Script (15 min)

No `apps-script-fatura.js`, função `verificarEmailNubank()`, depois do `folder.createFile(att); salvos++;` adicionar:

```js
// Pseudocódigo — não implementar agora.
// const fileId = folder.createFile(att).getId();
// UrlFetchApp.fetch('https://app.i2solucoes.com/api/webhooks/csv-nubank', {
//   method: 'post',
//   contentType: 'application/json',
//   headers: { 'x-webhook-secret': PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') },
//   payload: JSON.stringify({ fileId, fileName: nome }),
//   muteHttpExceptions: true
// });
```

**Antes:** salvar o secret nas Script Properties (Console Apps Script → Project Settings → Script Properties → `WEBHOOK_SECRET=<mesmo valor>`).

### Passo 4 — Notificação para o Iremar (30 min)

Escolher um dos três:

**(a) E-mail via Resend** (mais visível, +1 dependência):
- Adicionar `RESEND_API_KEY` nas envs
- No route handler, após processar, chamar `resend.emails.send({ to: 'iremar@i2solucoes.com', subject: 'Nova fatura Nubank importada' })`

**(b) Badge no app** (mais leve, zero dependência nova):
- Inserir registro em `notifications` table no Supabase
- Header do app já busca essa tabela e mostra contador

**(c) Web Push** (mais "moderno", exige user opt-in):
- Service Worker + VAPID keys → complexo, fica pra depois

> Recomendação: começar com **(b) Badge**. Se em 2-3 ciclos de fatura ainda achar pouco, adicionar **(a) E-mail**.

### Passo 5 — Testar end-to-end (20 min)

1. No console Apps Script, rodar `verificarEmailNubank()` manualmente
2. Confirmar no Vercel Logs que o webhook foi chamado
3. Confirmar que o CSV foi processado (consultar `csv_imports` no Supabase)
4. Confirmar que apareceu badge/email
5. **Forçar erro** (mudar secret no Apps Script) e confirmar que o Apps Script loga falha sem quebrar o resto

### Passo 6 — Documentar (10 min)

Adicionar uma seção em `README.md` ou `CLAUDE.md` do projeto:
- "Captura de CSV do Nubank é automática via Apps Script → webhook"
- Como reautorizar o Apps Script se um dia parar
- Link para o console do Apps Script

---

## O que **não** fazer agora

- ❌ Não implementar Opção 3 (Cloudflare) sem antes ter o webhook funcionando — é fácil migrar depois
- ❌ Não criar OAuth do Gmail só pra "consolidar tudo no Next.js" — burocracia não compensa
- ❌ Não pagar por Postmark/Resend Inbound enquanto Apps Script funcionar
- ❌ Não deletar o Apps Script depois de implementar — ele é a fonte da automação

---

## Quando reavaliar

Trocar a Opção 1 pela **Opção 3 (Cloudflare)** se:
- O Apps Script falhar 2+ vezes em 6 meses, ou
- Iremar quiser desacoplar a captura da conta dele (ex: outro sócio quer acesso), ou
- Vier outro cartão/banco e queira centralizar tudo num endereço dedicado

---

## Resumo executivo (para responder ao Iremar)

> **Recomendado: melhorar o Apps Script atual com um webhook que avisa o app quando chega CSV novo.**
>
> Custa R$ 0, leva 1h30 de implementação, e resolve o problema real (você só não sabia que o CSV tinha chegado).
>
> As alternativas mais "modernas" (Cloudflare Email Workers, Gmail API OAuth) são tecnicamente superiores, mas exigem trocar coisas que já funcionam — mexer em DNS do Workspace ou montar OAuth flow — sem ganho proporcional ao esforço hoje.
>
> Se um dia o Apps Script começar a dar problema (>2 falhas em 6 meses), aí migramos pra Cloudflare. O custo dessa migração futura é o mesmo que fazer agora.
