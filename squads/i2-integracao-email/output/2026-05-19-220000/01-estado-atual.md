# 01 — Estado atual da integração e-mail → CSV → app

**Squad:** i2-integracao-email · **Engenheiro:** Léo · **Data:** 2026-05-19

---

## TL;DR

A captura **já é automática**, mas vive em **duas camadas desconectadas**:

1. **Apps Script** (vinculado à planilha Google Sheets do Iremar) roda **todo dia às 8h**, busca e-mails do Nubank, salva o anexo CSV na pasta do Drive, e popula uma planilha paralela (`Faturas` + `Dashboard`).
2. **Next.js `/importar`** lista os arquivos da mesma pasta do Drive via **Service Account**, e o Iremar **clica manualmente** em "Importar" para cada CSV virar transação no Supabase.

O elo que falta é **notificação**: o Iremar só descobre que tem CSV novo se entrar no app e ver a lista. Não há push, e-mail nem badge.

---

## 1. Apps Script (`apps-script-fatura.js`)

### Trigger automático? **SIM.**

`configurarGatilhos()` cria dois triggers `timeBased()` quando o Iremar roda `primeiraInstalacao()`:

| Função                  | Quando        | O que faz                                                                 |
|-------------------------|---------------|---------------------------------------------------------------------------|
| `verificarEmailNubank`  | Todo dia, 8h  | Busca `from:todomundo@nubank.com.br has:attachment filename:csv` no Gmail do dono da planilha, baixa o anexo, salva no Drive folder `15tcAPDuR_sIQ0HwRg16GqfCgGJp-DJqD` (sobrescreve se já existir um arquivo com mesmo nome). |
| `verificarNovoCSV`      | Todo dia, 8h  | Lê a pasta do Drive, parseia o CSV, popula a aba `Faturas` da planilha (dedupe por chave `data|descrição|valor`). |

> Observação: ambos triggers são configurados para 8h, mas o código tinha intenção de `verificarNovoCSV` rodar às 8h15 (comentário). Como ambos chamam `.atHour(8)`, na prática rodam quase ao mesmo tempo. **Funcional, mas não é exatamente o que o comentário promete.**

### Como Iremar saberia que rodou?

Não há notificação. O Apps Script só faz `console.log()`. Para o Iremar ver que veio CSV novo, ele precisa:
- Abrir a planilha (vê `Dashboard` atualizado), ou
- Abrir o app `/importar` (vê CSV novo na lista do Drive).

### Permissões / Escopos do Apps Script

Quando o Iremar autorizou o script (1ª instalação), o Google pediu acesso a:
- `GmailApp.search()` → ler Gmail (escopo `gmail.readonly`)
- `DriveApp.getFolderById()` + `createFile()` → ler/escrever no Drive
- `SpreadsheetApp` → ler/escrever a própria planilha
- `ScriptApp.newTrigger()` → criar gatilhos
- `PropertiesService` → persistir cache de e-mails processados

**Permissões vivem na conta do Iremar.** Não há service account aqui — o script roda **como o Iremar**, herdando o acesso ao Gmail dele.

---

## 2. Next.js `/importar`

### `listDriveFiles()` (actions.ts:181)

- Lista CSVs da pasta `15tcAPDuR_sIQ0HwRg16GqfCgGJp-DJqD` (mesma do Apps Script).
- Usa **Service Account** (env `GOOGLE_SERVICE_ACCOUNT_KEY`) com scope `drive.readonly`.
- Para isso funcionar, **a pasta do Drive precisa ter sido compartilhada com o e-mail da service account** (provavelmente algo como `xxx@xxx.iam.gserviceaccount.com`).
- Retorna até 20 arquivos, ordenados por `modifiedTime desc`.
- Falha silenciosa: se `GOOGLE_SERVICE_ACCOUNT_KEY` não estiver setada, retorna `[]` sem erro.

### `actionImportarDrive(fileId, fileName)` (actions.ts:151)

- Baixa o CSV via Drive API.
- Roda `processCSV()`: parseia (formato Nubank), dedupe SHA-256 do arquivo + fingerprint por linha, aplica regras de categorização, insere em `transactions` no Supabase.
- Registra o import em `csv_imports` (auditoria).

### `ImportClient.tsx`

Não foi lido neste step, mas o fluxo é claro: lista os arquivos da `listDriveFiles()`, e cada um tem botão "Importar" que chama `actionImportarDrive`.

---

## 3. Variáveis de ambiente envolvidas

| Variável                       | Onde                | Para quê                                                                   |
|--------------------------------|---------------------|----------------------------------------------------------------------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY`   | Next.js (Vercel)    | JSON da service account com acesso à pasta do Drive (escopo `drive.readonly`). |

Outras envs envolvidas (Supabase) não fazem parte deste squad.

---

## 4. Pontos de fragilidade

| # | Risco                                                                                          | Severidade |
|---|------------------------------------------------------------------------------------------------|------------|
| 1 | **Falta notificação push.** Iremar não sabe quando chegou CSV novo. Hoje ele descobre por acaso. | Alta       |
| 2 | **Apps Script roda como o Iremar.** Se ele rotacionar senha do Google, perder acesso à conta, ou o token expirar (90 dias de inatividade), os triggers silenciosamente param de rodar. **Google envia e-mail de aviso, mas é fácil de perder.** | Alta       |
| 3 | **Nenhuma observabilidade.** Se o Apps Script falhar (cota Gmail, mudança de formato do e-mail Nubank, anexo .csv vira .xlsx), só dá pra descobrir lendo o "Executions" no console do Apps Script. | Alta       |
| 4 | **Acoplamento Apps Script + Planilha.** Toda a parte de Gmail→Drive depende de uma planilha existir. Se Iremar deletar a planilha, perdeu a automação inteira. | Média      |
| 5 | **Duplicação de lógica.** A planilha e o Supabase guardam as mesmas transações em paralelo, com regras de dedupe diferentes (`data|desc|valor` vs SHA-256 + fingerprint). | Média      |
| 6 | **Service Account no Vercel.** Se o JSON vazar (commit acidental, log de erro), qualquer um lê a pasta do Drive. | Média      |
| 7 | **Query Gmail hardcoded** (`from:todomundo@nubank.com.br`). Se o Nubank mudar o remetente ou o nome do anexo, quebra silenciosamente. | Baixa      |
| 8 | **Triggers Apps Script** podem ser interrompidos pelo Google sem aviso quando a planilha fica sem aberturas por muito tempo (≈6 meses). | Baixa      |

---

## 5. O que **já funciona bem**

- Captura **automática diária** sem ação do Iremar (desde que ele tenha rodado `primeiraInstalacao` uma vez).
- Dedupe em duas camadas (planilha e Supabase) garante que o Iremar pode reimportar sem medo.
- Não precisa de servidor próprio.
- Não tem custo recorrente.

---

## 6. O que o squad precisa decidir

Iremar quer **eliminar o "abrir o app pra ver se chegou"**. As opções variam de:
- **Manter o Apps Script + adicionar notificação** (caminho conservador)
- **Trocar Apps Script por Gmail API no Next.js** (consolida)
- **Endereço dedicado com webhook** (Cloudflare / Postmark) — mais robusto, mais setup
- **Manter manual com botão "Verificar agora"** (zero automação, controle total)

Próximo step: comparação detalhada das 6 opções.
