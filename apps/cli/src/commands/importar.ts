import { categorize, detectDuplicates, fingerprint, parseNubankCsv } from '@i2fin/core';
import {
  createCsvImport,
  findImportBySha256,
  getCategorizationRules,
  getCreditCardAccount,
  getSupabaseClient,
  upsertTransaction,
} from '@i2fin/db';
import pc from 'picocolors';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import type { Credentials } from '../types.js';

export async function cmdImportar(filePath: string, creds: Credentials): Promise<void> {
  const db = getSupabaseClient();
  const { householdId } = creds;

  console.log(pc.cyan(`\nImportando ${basename(filePath)}...`));

  // Read and parse
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    console.error(pc.red(`✗ Não foi possível ler o arquivo: ${filePath}`));
    process.exit(1);
  }

  const { rows, sha256, errors } = parseNubankCsv(content);

  if (errors.length > 0) {
    console.error(pc.yellow(`⚠ ${errors.length} erro(s) de parse:`));
    for (const e of errors.slice(0, 5)) {
      console.error(pc.dim(`  Linha ${e.line}: ${e.error}`));
    }
  }

  if (rows.length === 0) {
    console.error(pc.red('✗ Nenhuma linha válida encontrada.'));
    process.exit(1);
  }

  // Check if already imported
  const existing = await findImportBySha256(db, householdId, sha256);
  if (existing) {
    console.log(pc.yellow(`⚠ Este arquivo já foi importado (importação ${existing.id.slice(0, 8)}).`));
    console.log(pc.dim('Use --force para reimportar (não insere duplicatas).'));
    return;
  }

  // Get credit card account
  const account = await getCreditCardAccount(db, householdId);

  // Detect duplicates within the CSV itself
  const dupes = detectDuplicates(rows);
  if (dupes.length > 0) {
    console.log(pc.yellow(`\n⚠ ${dupes.length} provável(is) duplicata(s) detectada(s) no CSV:`));
    for (const d of dupes) {
      const icon = d.reason === 'iof_rename' ? '🔄' : d.reason === 'date_shift' ? '📅' : '💱';
      console.log(
        pc.dim(
          `  ${icon} ${d.reason}: ${d.rowA.date} | ${d.rowA.title} | R$ ${d.rowA.amount} ↔ ${d.rowB.date} | R$ ${d.rowB.amount}`,
        ),
      );
    }
    console.log(pc.dim('  (A linha mais recente será importada, a mais antiga ignorada)'));
  }

  // Get categorization rules
  const rules = await getCategorizationRules(db, householdId);

  // Process each row
  let inserted = 0;
  let skipped = 0;
  let flagged = 0;
  let autoAssigned = 0;

  // Build set of duplicate fingerprints to skip (keep newer)
  const skipFingerprints = new Set<string>();
  for (const dupe of dupes) {
    const olderRow = dupe.rowA.date < dupe.rowB.date ? dupe.rowA : dupe.rowB;
    const fp = await fingerprint(olderRow.date, olderRow.title, olderRow.amount, account.id);
    skipFingerprints.add(fp);
  }

  for (const row of rows) {
    const fp = await fingerprint(row.date, row.title, row.amount, account.id);

    if (skipFingerprints.has(fp)) {
      skipped++;
      continue;
    }

    const cat = categorize(row.title, rules as Parameters<typeof categorize>[1]);
    const isAutoAssigned = cat.autoAssigned;

    const result = await upsertTransaction(db, {
      household_id: householdId,
      account_id: account.id,
      occurred_on: row.date,
      description: row.title,
      amount: row.amount,
      responsible: cat.responsible,
      fingerprint: fp,
      source: 'csv_import',
      created_by: creds.userId,
    });

    if (result === null) {
      skipped++;
    } else {
      inserted++;
      if (isAutoAssigned) autoAssigned++;
      else if (cat.responsible === 'unassigned') flagged++;
    }
  }

  // Record import
  await createCsvImport(db, {
    household_id: householdId,
    filename: basename(filePath),
    account_id: account.id,
    imported_by: creds.userId,
    rows_total: rows.length,
    rows_inserted: inserted,
    rows_skipped_duplicate: skipped,
    rows_flagged_review: flagged,
    rows_auto_assigned: autoAssigned,
    raw_content_sha256: sha256,
  });

  // Summary
  console.log(pc.green(`\n✓ Importação concluída!`));
  console.log(`  ${pc.green(`${inserted} inseridas`)}  ${pc.yellow(`${skipped} duplicatas ignoradas`)}  ${pc.cyan(`${autoAssigned} auto-categorizadas`)}  ${flagged > 0 ? pc.red(`${flagged} para revisar`) : ''}`);

  if (flagged > 0) {
    console.log(pc.yellow(`\n⚠ ${flagged} lançamento(s) sem responsável definido.`));
    console.log(pc.dim('  Execute: i2fin categorizar'));
  }
}

export async function cmdImportarDir(dir: string, creds: Credentials): Promise<void> {
  const absDir = resolve(dir);
  let files: string[];
  try {
    files = readdirSync(absDir)
      .filter((f) => /^nubank_/i.test(f) && f.toLowerCase().endsWith('.csv'))
      .map((f) => join(absDir, f))
      .sort();
  } catch {
    console.error(pc.red(`✗ Não foi possível ler o diretório: ${absDir}`));
    process.exit(1);
  }

  if (files.length === 0) {
    console.log(pc.yellow(`⚠ Nenhum arquivo CSV encontrado em: ${absDir}`));
    return;
  }

  console.log(pc.cyan(`\n${files.length} arquivo(s) CSV encontrado(s) em ${absDir}`));

  for (const file of files) {
    await cmdImportar(file, creds);
  }

  console.log(pc.bold(`\n✓ Todos os arquivos processados.`));
}
