# 🔄 Setup: Webhook Apps Script para captura instantânea de CSVs

Este guia configura o botão **"🔄 Verificar agora"** no `/importar` para disparar a busca de emails do Nubank em tempo real (≈30s do envio até aparecer no app).

## 🎯 Fluxo final

```
1. Você envia fatura CSV pelo app Nubank        (5s)
2. Email chega em iremar@i2solucoes.com          (instantâneo)
3. No app i2-finance → /importar
4. Toca "🔄 Verificar agora"                     (1 clique)
5. Apps Script lê email + salva no Drive         (10s)
6. Arquivo aparece como NOVO
7. Toca "↑ Importar"                             (5s)
8. Categorizar (se necessário)
```

Bônus: trigger automático também passa a rodar **1×/hora** (em vez de 1×/dia), garantindo que mesmo sem clicar em "Verificar agora" a fatura chega em até 60min.

---

## 📋 Setup — 6 passos (≈10 minutos)

### Passo 1 — Abrir o Apps Script

1. Acesse a planilha do Google Sheets onde o Apps Script está vinculado
2. Menu: **Extensões → Apps Script**
3. Confirma que o código contém as funções `doGet`, `configurarGatilhosHorario`, `contarArquivosPasta_` (adicionadas recentemente)

> Se não tiver, copie o código atualizado de `/Users/iremaralvesii/Financeiro/apps-script-fatura.js` e cole.

### Passo 2 — Gerar token secreto

Gere um token aleatório forte (ex: copie o resultado de `openssl rand -hex 32` no terminal):

```bash
openssl rand -hex 32
# Exemplo de saída: a3f5b9c2d8e1f4a7b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5
```

### Passo 3 — Configurar Script Properties (Apps Script)

1. No editor do Apps Script, ícone de engrenagem ⚙️ (Configurações do projeto)
2. Role até **Propriedades do script**
3. Clique em **"Adicionar propriedade do script"**
4. **Property:** `WEBHOOK_TOKEN`
5. **Value:** cole o token gerado no passo 2
6. **Salvar propriedades do script**

### Passo 4 — Instalar trigger horário

No editor do Apps Script:

1. No dropdown de funções (no topo), selecione `configurarGatilhosHorario`
2. Clique em **▶ Executar**
3. Autorize quando pedir
4. Vá em **Gatilhos** (ícone de relógio ⏰ no menu lateral)
5. Confirme que existem 2 triggers ativos:
   - `verificarEmailNubank` — Time-driven — Every hour
   - `verificarNovoCSV` — Time-driven — Every hour

### Passo 5 — Publicar como Web App

1. Botão azul **Implantar** (canto superior direito)
2. **Nova implantação**
3. Tipo: ⚙️ → **Aplicativo da Web**
4. Configure:
   - **Descrição:** `i2-finance webhook`
   - **Executar como:** `Eu (iremar@i2solucoes.com)`
   - **Quem tem acesso:** `Qualquer pessoa`
5. **Implantar**
6. Autorize se pedir
7. **Copie a URL do Web App** (formato: `https://script.google.com/macros/s/AKfy.../exec`)

### Passo 6 — Configurar Vercel

1. Acesse https://vercel.com → projeto **i2-finance** → **Settings → Environment Variables**
2. Adicione DUAS variáveis:

| Name | Value | Environments |
|------|-------|--------------|
| `APPS_SCRIPT_WEBHOOK_URL` | URL do passo 5 | Production, Preview, Development |
| `APPS_SCRIPT_WEBHOOK_TOKEN` | Token do passo 2 | Production, Preview, Development |

3. **Save**
4. Trigger novo deploy (ou aguardar próximo push): Settings → Deployments → ⋯ → **Redeploy**

---

## ✅ Como testar

1. Acesse `https://i2-finance.vercel.app/importar`
2. Toque em **"🔄 Verificar agora"**
3. Esperado: spinner 5-15s → mensagem verde "✓ N CSV(s) novo(s) baixado(s)" ou "✓ Nenhum CSV novo no email"

### Teste end-to-end (real)

1. App Nubank → cartão → fatura → **Enviar fatura** → CSV
2. Aguarde 1min (email chega)
3. App i2-finance `/importar` → **Verificar agora**
4. Arquivo aparece como NOVO em segundos
5. Importa → categoriza se preciso

---

## 🐛 Troubleshooting

### Mensagem: "Webhook não configurado"
→ Confirme env `APPS_SCRIPT_WEBHOOK_URL` e `APPS_SCRIPT_WEBHOOK_TOKEN` no Vercel. Redeploy obrigatório após adicionar env.

### Mensagem: "HTTP 401" ou "unauthorized"
→ Token no Vercel ≠ token no Script Properties. Re-cole exatamente o mesmo valor nos dois lugares.

### Mensagem: "HTTP 302"
→ A URL do Web App precisa ser a "final" (com `/exec`), não a de teste. Verifique que copiou a URL após o **Implantar** (não a do "Implantar test").

### Botão fica girando para sempre
→ Apps Script demora >30s. Aumente o timeout em `actions.ts → actionVerificarEmail → setTimeout(30_000)` para 60_000.

### Trigger horário não roda
→ Veja a aba **Gatilhos** no Apps Script. Se houver erros, clique no trigger e veja o log. Pode ser que precise re-autorizar (Gmail API ou Drive API).

---

## 🔒 Segurança

- O token vai como query param. Em HTTPS o conteúdo é encriptado, mas a URL pode ficar em logs intermediários.
- Para produção crítica, considere mover para header `X-Webhook-Token` (precisa adicionar `doPost` ou usar Cloudflare Worker proxy).
- O token é **independente** das suas credenciais Google — se vazar, basta gerar um novo no Script Properties + atualizar no Vercel.

---

## 📊 Monitoramento

No Apps Script, em **Executions**, você pode ver:
- Quantas vezes `doGet` foi chamado (cliques no botão)
- Quantas vezes `verificarEmailNubank` rodou pelo trigger horário
- Erros recentes

Use para diagnóstico se algo parar de funcionar.
