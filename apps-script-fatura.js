// ====================================================
// FATURA CARTÃO — Apps Script Completo
// - Captura CSV do e-mail Nubank (1x/dia) → salva no Drive
// - Importa CSV da pasta do Drive → aba Faturas
// - Dashboard inteligente com divisão do Casal
// ====================================================

const CONFIG = {
  folderId: '15tcAPDuR_sIQ0HwRg16GqfCgGJp-DJqD',
  sheetName: 'Faturas',
  dashboardName: 'Dashboard',
  responsaveis: ['Juliana', 'Iremar', 'i2 Soluções Digitais', 'Casal'],
  processedKey: 'processedFiles_v1',
  processedEmailKey: 'processedEmails_v1',
  gmailQuery: 'from:todomundo@nubank.com.br has:attachment filename:csv'
};

// ====================================================
// MENU PERSONALIZADO
// ====================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💳 Fatura')
    .addItem('📱 Ver link do app mobile', 'mostrarLinkMobile')
    .addItem('🔄 Verificar novos CSVs na pasta agora', 'verificarNovoCSV')
    .addItem('📧 Verificar e-mail do Nubank agora', 'verificarEmailNubank')
    .addItem('📊 Atualizar Dashboard', 'atualizarDashboard')
    .addSeparator()
    .addItem('⚙️ Primeira instalação (rodar apenas 1x)', 'primeiraInstalacao')
    .addToUi();
}

function mostrarLinkMobile() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(
    '📱 Link do App Mobile\n\n' + url +
    '\n\nSalve esse link nos favoritos do celular.\n' +
    'Ou peça para a Juliana salvar no iPhone dela também!'
  );
}

// ====================================================
// SETUP INICIAL
// ====================================================
function primeiraInstalacao() {
  salvarIdPlanilha();
  configurarSheet();
  configurarDashboard();
  configurarGatilhos();
  importarCSVsExistentes();
  atualizarDashboard();
  SpreadsheetApp.getUi().alert(
    '✅ Instalação concluída!\n\n' +
    '• Todo dia às 8h o script verifica seu Gmail e salva o CSV do Nubank na pasta\n' +
    '• Em seguida importa os lançamentos novos para a planilha\n' +
    '• Dashboard atualizado automaticamente\n\n' +
    'PRÓXIMO PASSO: publique o Web App (veja as instruções).'
  );
}

// ====================================================
// ABA FATURAS
// ====================================================
function configurarSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.sheetName);
    ['Sheet1', 'Página1', 'Plan1'].forEach(name => {
      const s = ss.getSheetByName(name);
      if (s && s.getLastRow() <= 1) { try { ss.deleteSheet(s); } catch (e) {} }
    });
  }

  // Colunas: Data | Descrição | Valor | Responsável | Observação | Fatura | ID(oculto)
  sheet.getRange(1, 1, 1, 7).setValues([['Data', 'Descrição', 'Valor (R$)', 'Responsável', 'Observação', 'Fatura', 'ID']]);

  const h = sheet.getRange(1, 1, 1, 7);
  h.setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff').setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 260);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 260); // Observação
  sheet.setColumnWidth(6, 160);
  sheet.setColumnWidth(7, 1);
  sheet.hideColumns(7);
  sheet.setFrozenRows(1);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.responsaveis, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 4, 3000, 1).setDataValidation(rule);

  sheet.getRange(2, 1, 3000, 1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2, 3, 3000, 1).setNumberFormat('R$ #,##0.00');

  try {
    sheet.getRange(1, 1, 3001, 6)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  } catch (e) {}

  return sheet;
}

// ====================================================
// ABA DASHBOARD
// ====================================================
function configurarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let dash = ss.getSheetByName(CONFIG.dashboardName);
  if (!dash) {
    dash = ss.insertSheet(CONFIG.dashboardName, 0);
  }
  dash.clear();
  dash.clearFormats();
  dash.getCharts().forEach(c => dash.removeChart(c));

  // ── Título ──────────────────────────────────────────
  dash.getRange('A1:G1').merge();
  dash.getRange('A1').setValue('💳  Dashboard — Fatura Nubank');
  dash.getRange('A1').setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center');
  dash.getRange('A1:G1').setBackground('#1a73e8').setFontColor('#ffffff');

  // ── Bloco 1: Resumo por Responsável ─────────────────
  dash.getRange('A3').setValue('👥  Quanto cada um deve pagar');
  dash.getRange('A3').setFontSize(13).setFontWeight('bold');

  dash.getRange('A4:E4').setValues([['Responsável', 'Gastos próprios', 'Parte do Casal (÷2)', 'Total a pagar', 'Nº itens']]);
  estiloCabecalho(dash.getRange('A4:E4'));

  // Juliana (row 5) — separador ; para pt-BR
  dash.getRange('A5').setValue('Juliana').setFontWeight('bold');
  dash.getRange('B5').setFormula('=SUMIF(Faturas!D:D;"Juliana";Faturas!C:C)');
  dash.getRange('B5').setNumberFormat('R$ #,##0.00');
  dash.getRange('C5').setFormula('=SUMIF(Faturas!D:D;"Casal";Faturas!C:C)/2');
  dash.getRange('C5').setNumberFormat('R$ #,##0.00');
  dash.getRange('D5').setFormula('=B5+C5');
  dash.getRange('D5').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBackground('#e8f5e9');
  dash.getRange('E5').setFormula('=COUNTIF(Faturas!D:D;"Juliana")+COUNTIF(Faturas!D:D;"Casal")');

  // Iremar (row 6)
  dash.getRange('A6').setValue('Iremar').setFontWeight('bold');
  dash.getRange('B6').setFormula('=SUMIF(Faturas!D:D;"Iremar";Faturas!C:C)');
  dash.getRange('B6').setNumberFormat('R$ #,##0.00');
  dash.getRange('C6').setFormula('=SUMIF(Faturas!D:D;"Casal";Faturas!C:C)/2');
  dash.getRange('C6').setNumberFormat('R$ #,##0.00');
  dash.getRange('D6').setFormula('=B6+C6');
  dash.getRange('D6').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBackground('#e3f2fd');
  dash.getRange('E6').setFormula('=COUNTIF(Faturas!D:D;"Iremar")+COUNTIF(Faturas!D:D;"Casal")');

  // i2 Soluções Digitais (row 7)
  dash.getRange('A7').setValue('i2 Soluções Digitais').setFontWeight('bold');
  dash.getRange('B7').setFormula('=SUMIF(Faturas!D:D;"i2 Soluções Digitais";Faturas!C:C)');
  dash.getRange('B7').setNumberFormat('R$ #,##0.00');
  dash.getRange('C7').setValue('—').setHorizontalAlignment('center').setFontColor('#999999');
  dash.getRange('D7').setFormula('=B7');
  dash.getRange('D7').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBackground('#fff8e1');
  dash.getRange('E7').setFormula('=COUNTIF(Faturas!D:D;"i2 Soluções Digitais")');

  // Total (row 8)
  dash.getRange('A8').setValue('TOTAL CLASSIFICADO').setFontWeight('bold');
  dash.getRange('A8').setBackground('#e8eaf6');
  dash.getRange('B8').setFormula('=B5+B6+B7');
  dash.getRange('B8').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBackground('#e8eaf6');
  dash.getRange('C8').setBackground('#e8eaf6');
  dash.getRange('D8').setFormula('=D5+D6+D7');
  dash.getRange('D8').setNumberFormat('R$ #,##0.00').setFontWeight('bold').setBackground('#e8eaf6');
  dash.getRange('E8').setFormula('=E5+E6+E7').setFontWeight('bold').setBackground('#e8eaf6');

  // ── Bloco 2: Casal ───────────────────────────────────
  dash.getRange('A10').setValue('💑  Gastos do Casal (cada um paga metade)');
  dash.getRange('A10').setFontSize(11).setFontWeight('bold').setFontColor('#555555');

  dash.getRange('A11:C11').setValues([['Total Casal', 'Juliana paga', 'Iremar paga']]);
  estiloCabecalho(dash.getRange('A11:C11'));
  dash.getRange('A12').setFormula('=SUMIF(Faturas!D:D;"Casal";Faturas!C:C)');
  dash.getRange('A12').setNumberFormat('R$ #,##0.00');
  dash.getRange('B12').setFormula('=A12/2');
  dash.getRange('B12').setNumberFormat('R$ #,##0.00');
  dash.getRange('C12').setFormula('=A12/2');
  dash.getRange('C12').setNumberFormat('R$ #,##0.00');

  // ── Bloco 3: Visão Geral ─────────────────────────────
  dash.getRange('A14').setValue('📋  Visão Geral da Fatura');
  dash.getRange('A14').setFontSize(13).setFontWeight('bold');

  dash.getRange('A15:B15').setValues([['Indicador', 'Valor']]);
  estiloCabecalho(dash.getRange('A15:B15'));

  dash.getRange('A16').setValue('Total da fatura').setFontWeight('bold');
  dash.getRange('B16').setFormula('=SUMIF(Faturas!C2:C3000;">"&0)');
  dash.getRange('B16').setNumberFormat('R$ #,##0.00').setFontSize(14).setFontColor('#c00000').setFontWeight('bold');

  dash.getRange('A17').setValue('Total de lançamentos').setFontWeight('bold');
  dash.getRange('B17').setFormula('=COUNTA(Faturas!A2:A3000)');

  dash.getRange('A18').setValue('⚠️ Pendentes (sem responsável)').setFontWeight('bold').setFontColor('#e65100');
  // Conta linhas com data preenchida mas sem responsável
  dash.getRange('B18').setFormula('=COUNTA(Faturas!A2:A3000)-COUNTA(Faturas!D2:D3000)');
  dash.getRange('B18').setFontColor('#e65100').setFontWeight('bold');

  dash.getRange('A19').setValue('Última atualização').setFontColor('#999999');
  dash.getRange('B19').setFormula('=TEXT(NOW();"dd/MM/yyyy HH:mm")');
  dash.getRange('B19').setFontColor('#999999');

  // ── Bloco 4: Top 10 maiores gastos (QUERY) ───────────
  dash.getRange('A21').setValue('🔝  10 Maiores Gastos');
  dash.getRange('A21').setFontSize(13).setFontWeight('bold');

  dash.getRange('A22:D22').setValues([['Data', 'Descrição', 'Valor (R$)', 'Responsável']]);
  estiloCabecalho(dash.getRange('A22:D22'));

  // QUERY retorna as 10 maiores compras (valor positivo), ordenado desc
  dash.getRange('A23').setFormula(
    '=IFERROR(QUERY(Faturas!A2:D3000;"SELECT A,B,C,D WHERE C > 0 ORDER BY C DESC LIMIT 10";0);"")'
  );
  dash.getRange('A23:A32').setNumberFormat('dd/MM/yyyy');
  dash.getRange('C23:C32').setNumberFormat('R$ #,##0.00');

  // ── Larguras ─────────────────────────────────────────
  dash.setColumnWidth(1, 150);
  dash.setColumnWidth(2, 200);
  dash.setColumnWidth(3, 150);
  dash.setColumnWidth(4, 200);
  dash.setColumnWidth(5, 90);

  criarGraficoDashboard(dash);
  return dash;
}

function estiloCabecalho(range) {
  range.setFontWeight('bold').setBackground('#37474f').setFontColor('#ffffff').setHorizontalAlignment('center');
}

function criarGraficoDashboard(dash) {
  dash.getCharts().forEach(c => dash.removeChart(c));

  // Gráfico: Total a pagar por responsável (col A + col D, linhas 5-7)
  const chart = dash.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dash.getRange('A5:A7'))   // labels
    .addRange(dash.getRange('D5:D7'))   // valores (total a pagar)
    .setPosition(3, 6, 10, 0)
    .setOption('title', 'Total a pagar por responsável')
    .setOption('width', 400)
    .setOption('height', 280)
    .setOption('pieHole', 0.4)
    .setOption('legend', { position: 'right' })
    .build();
  dash.insertChart(chart);
}

function atualizarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dash = ss.getSheetByName(CONFIG.dashboardName);
  if (!dash) { configurarDashboard(); return; }
  criarGraficoDashboard(dash);
  SpreadsheetApp.flush();
}

// ====================================================
// GMAIL → DRIVE (1x ao dia)
// ====================================================
function verificarEmailNubank() {
  const props = PropertiesService.getScriptProperties();
  const processedEmails = JSON.parse(props.getProperty(CONFIG.processedEmailKey) || '[]');

  const folder = DriveApp.getFolderById(CONFIG.folderId);
  const threads = GmailApp.search(CONFIG.gmailQuery);

  let salvos = 0;

  threads.forEach(thread => {
    const threadId = thread.getId();
    if (processedEmails.includes(threadId)) return;

    thread.getMessages().forEach(msg => {
      msg.getAttachments().forEach(att => {
        const nome = att.getName();
        if (!nome.toLowerCase().endsWith('.csv')) return;

        // Se já existe arquivo com mesmo nome, substitui (mês atualizado)
        const existentes = folder.getFilesByName(nome);
        while (existentes.hasNext()) existentes.next().setTrashed(true);

        folder.createFile(att);
        salvos++;
        console.log(`📧 CSV atualizado na pasta: ${nome}`);
      });
    });

    processedEmails.push(threadId);
  });

  props.setProperty(CONFIG.processedEmailKey, JSON.stringify(processedEmails));

  if (salvos > 0) {
    verificarNovoCSV();
    console.log(`✅ ${salvos} CSV(s) atualizados.`);
  }
}

// ====================================================
// GATILHOS (1x ao dia às 8h)
// ====================================================
function configurarGatilhos() {
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'verificarNovoCSV' || fn === 'verificarEmailNubank') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // E-mail: 1x ao dia às 8h
  ScriptApp.newTrigger('verificarEmailNubank')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();

  // Pasta: 1x ao dia às 8h15 (logo após o e-mail)
  ScriptApp.newTrigger('verificarNovoCSV')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();
}

// ====================================================
// GATILHO HORÁRIO (a cada 1h) — melhor que diário
// Rodar 1× pra trocar do diário para o horário.
// ====================================================
function configurarGatilhosHorario() {
  // Remove triggers antigos (diário ou outros)
  ScriptApp.getProjectTriggers().forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'verificarNovoCSV' || fn === 'verificarEmailNubank') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // E-mail: a cada 1 hora
  ScriptApp.newTrigger('verificarEmailNubank')
    .timeBased()
    .everyHours(1)
    .create();

  // Pasta: a cada 1 hora
  ScriptApp.newTrigger('verificarNovoCSV')
    .timeBased()
    .everyHours(1)
    .create();
}

// ====================================================
// WEB APP — endpoint público (HTTP GET) com token
// Permite o app i2-finance disparar verificação sob demanda.
//
// Setup:
//   1. Script Properties → adicionar WEBHOOK_TOKEN com um valor aleatório
//   2. Implantar → Aplicativo da web → executar como "Eu" + acesso "Qualquer pessoa"
//   3. Copiar URL e adicionar no Vercel: APPS_SCRIPT_WEBHOOK_URL
//
// Endpoint:  <URL>?token=<TOKEN>&action=email|drive|both
// Resposta:  { ok: true, novosArquivos: N }
// ====================================================
function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty('WEBHOOK_TOKEN');
  const token = (e.parameter && e.parameter.token) || '';
  const action = (e.parameter && e.parameter.action) || 'both';

  if (!expected || token !== expected) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let novosArquivos = 0;
  try {
    if (action === 'email' || action === 'both') {
      const before = contarArquivosPasta_();
      verificarEmailNubank();
      novosArquivos += Math.max(0, contarArquivosPasta_() - before);
    }
    if (action === 'drive' || action === 'both') {
      verificarNovoCSV();
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, novosArquivos, timestamp: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function contarArquivosPasta_() {
  const folder = DriveApp.getFolderById(CONFIG.folderId);
  const files = folder.getFilesByType('text/csv');
  let count = 0;
  while (files.hasNext()) { files.next(); count++; }
  return count;
}

// ====================================================
// IMPORTAÇÃO DE CSV DA PASTA
// Chave única por transação: "data|descrição|valor"
// Assim o mesmo arquivo pode ser sobrescrito com mais
// lançamentos que apenas os novos entram na planilha.
// ====================================================
function verificarNovoCSV() {
  const folder = DriveApp.getFolderById(CONFIG.folderId);
  const files = folder.getFilesByType('text/csv');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.sheetName);
  if (!sheet) sheet = configurarSheet();

  // Carrega todas as chaves já existentes na planilha (coluna G — ID oculto)
  const lastRow = sheet.getLastRow();
  const existingKeys = new Set();
  if (lastRow > 1) {
    sheet.getRange(2, 7, lastRow - 1, 1).getValues()
      .flat().forEach(k => existingKeys.add(String(k)));
  }

  let novasLinhas = 0;

  while (files.hasNext()) {
    const file = files.next();
    novasLinhas += importarArquivoCSV(sheet, file, existingKeys);
  }

  if (novasLinhas > 0) {
    atualizarDashboard();
    console.log(`✅ ${novasLinhas} novo(s) lançamento(s) adicionado(s).`);
  }
}

function importarArquivoCSV(sheet, file, existingKeys) {
  const content = file.getBlob().getDataAsString('UTF-8');
  const rows = Utilities.parseCsv(content);
  const faturaLabel = file.getName()
    .replace('.csv', '')
    .replace('Nubank_', 'Nubank ');

  const newRows = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const [date, title, amountStr] = row;
    if (!date || !title || amountStr === undefined) continue;

    // Chave por conteúdo da transação — independente do arquivo
    const uniqueKey = `${date.trim()}|${title.trim()}|${amountStr.trim()}`;
    if (existingKeys.has(uniqueKey)) continue;

    const [ano, mes, dia] = date.split('-').map(Number);
    const dateObj = new Date(ano, mes - 1, dia);
    const amount = parseFloat(amountStr);

    newRows.push([dateObj, title.trim(), amount, '', '', faturaLabel, uniqueKey]);
    existingKeys.add(uniqueKey); // evita duplicar dentro do próprio arquivo
  }

  const lastRow = sheet.getLastRow();
  if (newRows.length > 0) {
    sheet.getRange(lastRow + 1, 1, newRows.length, 7).setValues(newRows);
  }

  return newRows.length;
}

function importarCSVsExistentes() {
  // Limpa chaves e reimporta tudo (não apaga responsáveis já preenchidos)
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 7, sheet.getLastRow() - 1, 1).clearContent();
  }
  verificarNovoCSV();
}

// ====================================================
// WEB APP MOBILE — Classificar lançamentos pelo celular
// ====================================================

// Ponto de entrada do Web App
function doGet() {
  return HtmlService.createHtmlOutput(getHtmlApp())
    .setTitle('Fatura Nubank')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Retorna lançamentos sem responsável para o frontend
function getLancamentosPendentes() {
  const ss = SpreadsheetApp.openById(ScriptApp.getScriptId ? getSpreadsheetId_() : '');
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const pendentes = [];

  data.forEach((row, i) => {
    const [date, descricao, valor, responsavel] = row;
    if (descricao && !responsavel && Number(valor) > 0) {
      const dateObj = new Date(date);
      const dateStr = isNaN(dateObj) ? date : dateObj.toLocaleDateString('pt-BR');
      pendentes.push({
        row: i + 2,
        data: dateStr,
        descricao: descricao,
        valor: Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      });
    }
  });

  return pendentes;
}

// Salva responsável e observação de uma linha
function classificarLancamento(rowIndex, responsavel, observacao) {
  const ss = SpreadsheetApp.getActiveSpreadsheet() ||
             SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  sheet.getRange(rowIndex, 4).setValue(responsavel);
  if (observacao) sheet.getRange(rowIndex, 5).setValue(observacao);
  return true;
}

// Helper: pega o ID da planilha a partir das propriedades do script
function getSpreadsheetId_() {
  return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';
}

// Salva o ID da planilha nas propriedades (rodar 1x junto com primeiraInstalacao)
function salvarIdPlanilha() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
}

function getHtmlApp() { return getHtmlApp_(); }
function getHtmlApp_() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Fatura Nubank</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  html, body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f2f2f7;
  }

  /* ── Header ── */
  header {
    background: #820ad1;
    color: white;
    padding: 16px 16px 12px;
    text-align: center;
  }
  header h1 { font-size: 17px; font-weight: 800; }
  header p  { font-size: 12px; opacity: 0.75; margin-top: 3px; }

  #progresso { background: #5a0090; height: 4px; }
  #barra { height: 4px; background: #00e5a0; transition: width 0.4s; width: 0%; }

  #contador {
    font-size: 13px; color: #999; font-weight: 500;
    text-align: center; padding: 10px 0 6px;
  }

  #main {
    display: flex; flex-direction: column;
    padding: 0 16px 24px;
    gap: 12px;
  }

  /* ── Card ── */
  #card {
    background: white;
    border-radius: 22px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    padding: 24px 22px;
  }
  #card .data {
    font-size: 14px; font-weight: 600;
    color: #aaa; margin-bottom: 6px;
  }
  #card .valor {
    font-size: 56px; font-weight: 900;
    color: #820ad1; letter-spacing: -3px;
    line-height: 1.05; margin-bottom: 14px;
  }
  #card .desc {
    font-size: 20px; font-weight: 700;
    color: #222; line-height: 1.3;
    padding-top: 14px;
    border-top: 1.5px solid #f0f0f0;
  }

  /* ── Observação ── */
  #obs {
    width: 100%;
    border: 1.5px solid #ddd;
    border-radius: 16px;
    padding: 14px 16px;
    font-size: 16px;
    font-family: inherit;
    color: #333;
    resize: none;
    height: 80px;
    background: white;
    outline: none;
    transition: border-color 0.2s;
  }
  #obs::placeholder { color: #ccc; }
  #obs:focus { border-color: #820ad1; }

  /* ── Botões — empilhados, coloridos ── */
  #botoes {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn {
    width: 100%;
    height: 62px;
    border: none;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: transform 0.12s, opacity 0.2s, filter 0.2s;
  }
  .btn .emoji { font-size: 22px; }
  .btn:active { transform: scale(0.97); filter: brightness(0.88); }

  .btn[data-cls="sel-juliana"] { background: linear-gradient(135deg,#f0308a,#b5144f); }
  .btn[data-cls="sel-iremar"]  { background: linear-gradient(135deg,#2979ff,#0d47a1); }
  .btn[data-cls="sel-i2"]      { background: linear-gradient(135deg,#ff8f00,#bf360c); }
  .btn[data-cls="sel-casal"]   { background: linear-gradient(135deg,#43a047,#1b5e20); }

  /* Quando um está selecionado, os outros ficam opacos */
  #botoes.tem-selecao .btn:not(.selecionado) { opacity: 0.35; }
  .btn.selecionado { box-shadow: 0 4px 18px rgba(0,0,0,0.25); transform: scale(1.02); }

  /* ── Confirmar ── */
  #confirmar {
    width: 100%;
    height: 64px;
    border: none;
    border-radius: 16px;
    background: #1a1a1a;
    color: white;
    font-size: 18px;
    font-weight: 800;
    font-family: inherit;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }
  #confirmar:active { filter: brightness(0.85); }
  #confirmar.visivel { display: flex; }

  /* ── Pular ── */
  #skip {
    width: 100%;
    height: 56px;
    border: 2px solid #ccc;
    background: white;
    color: #666;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  #skip:active { background: #f0f0f0; }

  /* ── Concluído ── */
  #concluido {
    display: none; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 60px 24px;
  }
  #concluido .emoji { font-size: 80px; }
  #concluido h2 { font-size: 26px; font-weight: 800; color: #1a1a1a; margin-top: 24px; }
  #concluido p  { color: #888; margin-top: 10px; font-size: 16px; line-height: 1.6; }

  #loading {
    display: flex; align-items: center; justify-content: center;
    padding: 80px 0; color: #ccc; font-size: 15px;
  }
</style>
</head>
<body>

<header>
  <h1>💳 Fatura Nubank</h1>
  <p>Toque para classificar cada lançamento</p>
</header>
<div id="progresso"><div id="barra"></div></div>
<div id="contador"></div>

<div id="loading">Carregando...</div>

<div id="main" style="display:none">
  <div id="card">
    <div class="data"  id="c-data"></div>
    <div class="desc"  id="c-desc"></div>
    <div class="valor" id="c-valor"></div>
  </div>

  <textarea id="obs" placeholder="Observação opcional — ex: almoço trabalho, compras mês..."></textarea>

  <div id="botoes">
    <button class="btn" data-resp="Juliana" data-cls="sel-juliana" onclick="selecionar(this)">
      <span class="emoji">👩</span> Juliana
    </button>
    <button class="btn" data-resp="Iremar" data-cls="sel-iremar" onclick="selecionar(this)">
      <span class="emoji">👨</span> Iremar
    </button>
    <button class="btn" data-resp="i2 Soluções Digitais" data-cls="sel-i2" onclick="selecionar(this)">
      <span class="emoji">🏢</span> i2
    </button>
    <button class="btn" data-resp="Casal" data-cls="sel-casal" onclick="selecionar(this)">
      <span class="emoji">💑</span> Casal
    </button>
  </div>

  <button id="confirmar" onclick="confirmar()">
    <span id="confirmar-texto">✓ Confirmar</span>
  </button>

  <button id="skip" onclick="pular()">Pular este lançamento</button>
</div>

<div id="concluido">
  <div class="emoji">🎉</div>
  <h2>Tudo classificado!</h2>
  <p>Nenhum lançamento pendente.<br>Volte quando chegar a próxima fatura.</p>
</div>

<script>
  let pendentes = [];
  let atual = 0;
  let total = 0;
  let responsavelSelecionado = null;

  function init() {
    google.script.run
      .withSuccessHandler(function(dados) {
        document.getElementById('loading').style.display = 'none';
        pendentes = dados;
        total = dados.length;
        if (total === 0) mostrarConcluido();
        else mostrarAtual();
      })
      .withFailureHandler(function(e) {
        document.getElementById('loading').textContent = 'Erro: ' + e.message;
      })
      .getLancamentosPendentes();
  }

  function mostrarAtual() {
    if (atual >= pendentes.length) { mostrarConcluido(); return; }
    const item = pendentes[atual];
    const classificados = total - (pendentes.length - atual);

    document.getElementById('c-data').textContent  = item.data;
    document.getElementById('c-desc').textContent  = item.descricao;
    document.getElementById('c-valor').textContent = item.valor;
    document.getElementById('obs').value = '';
    document.getElementById('contador').textContent =
      classificados + ' de ' + total + ' classificados';
    document.getElementById('barra').style.width =
      (total > 0 ? classificados / total * 100 : 0) + '%';
    document.getElementById('main').style.display = 'flex';
    limparSelecao();
  }

  function selecionar(btn) {
    const responsavel = btn.dataset.resp;
    const classeCSS   = btn.dataset.cls;
    responsavelSelecionado = responsavel;

    document.querySelectorAll('.btn').forEach(b => {
      b.classList.remove('selecionado','sel-juliana','sel-iremar','sel-i2','sel-casal');
    });
    btn.classList.add('selecionado', classeCSS);
    document.getElementById('botoes').classList.add('tem-selecao');

    const nome = responsavel === 'i2 Soluções Digitais' ? 'i2' : responsavel;
    document.getElementById('confirmar-texto').textContent = '✓ Confirmar — ' + nome;
    document.getElementById('confirmar').classList.add('visivel');
  }

  function limparSelecao() {
    responsavelSelecionado = null;
    document.querySelectorAll('.btn').forEach(b => {
      b.classList.remove('selecionado','sel-juliana','sel-iremar','sel-i2','sel-casal');
    });
    document.getElementById('botoes').classList.remove('tem-selecao');
    document.getElementById('confirmar').classList.remove('visivel');
  }

  function confirmar() {
    if (!responsavelSelecionado) return;
    const item = pendentes[atual];
    const obs  = document.getElementById('obs').value.trim();
    desativarTudo(true);
    google.script.run
      .withSuccessHandler(function() {
        atual++;
        desativarTudo(false);
        mostrarAtual();
      })
      .withFailureHandler(function() { desativarTudo(false); })
      .classificarLancamento(item.row, responsavelSelecionado, obs);
  }

  function pular() { limparSelecao(); atual++; mostrarAtual(); }

  function desativarTudo(v) {
    document.querySelectorAll('.btn, #confirmar, #skip').forEach(b => b.disabled = v);
  }

  function mostrarConcluido() {
    document.getElementById('main').style.display      = 'none';
    document.getElementById('contador').textContent    = '';
    document.getElementById('barra').style.width       = '100%';
    document.getElementById('concluido').style.display = 'flex';
  }

  function ajustarAltura() {
    const h = window.innerHeight;
    document.documentElement.style.height = h + 'px';
    document.body.style.height = h + 'px';
    document.getElementById('main').style.maxHeight = (h - 120) + 'px';
  }
  ajustarAltura();
  window.addEventListener('resize', ajustarAltura);

  init();
</script>
</body>
</html>`;
}
