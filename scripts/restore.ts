#!/usr/bin/env tsx
/**
 * Restaura um backup. NUNCA roda sem confirmação dupla.
 *
 * Uso:
 *   pnpm backup:restore YYYYMMDD-HHmmss[-label]
 *   pnpm backup:restore YYYYMMDD-HHmmss --yes           (pula 1ª confirmação)
 *   pnpm backup:restore YYYYMMDD-HHmmss --yes --confirm (pula AMBAS — APENAS para script automatizado)
 *   pnpm backup:restore YYYYMMDD-HHmmss --only transactions,categories
 *
 * Estratégia:
 *   1. Valida checksums do backup
 *   2. DELETE em ordem inversa de FK
 *   3. INSERT em ordem topológica, em batches de 100
 *   4. Compara contagens — aborta se divergir
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import {
  TABLES,
  BACKUPS_DIR,
  adminClient,
  sha256,
  type Manifest,
  type TableName,
} from './_backup-lib.js';

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  const args = process.argv.slice(2);
  const folderName = args.find((a) => !a.startsWith('--'));
  if (!folderName) {
    console.error('✗ Uso: pnpm backup:restore <folder-name>');
    console.error('  Veja backups disponíveis com: pnpm backup:list');
    process.exit(1);
  }

  const skip1 = args.includes('--yes');
  const skip2 = args.includes('--confirm');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const onlyTables = onlyArg
    ? (onlyArg.slice(7).split(',') as TableName[])
    : ([...TABLES] as TableName[]);

  const folder = join(BACKUPS_DIR, folderName);
  if (!existsSync(folder)) {
    console.error(`✗ Backup não encontrado: ${folder}`);
    console.error('  Veja backups disponíveis com: pnpm backup:list');
    process.exit(1);
  }

  const manifestPath = join(folder, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`✗ manifest.json ausente em ${folder}`);
    process.exit(1);
  }
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  console.log(`\n⚠️  RESTORE — operação destrutiva\n`);
  console.log(`  Backup: ${folderName}`);
  console.log(`  Criado: ${manifest.created_at}`);
  console.log(`  Tipo:   ${manifest.kind}${manifest.label ? ` · ${manifest.label}` : ''}`);
  console.log(`  Total:  ${manifest.total_rows} rows em ${manifest.tables.length} tables`);
  console.log(`  Tables a restaurar: ${onlyTables.join(', ')}\n`);

  // ─── Validação de checksums ─────────────────────────────────────────────────
  console.log(`  Validando integridade...`);
  for (const t of onlyTables) {
    const info = manifest.tables.find((x) => x.name === t);
    if (!info) {
      console.error(`  ✗ Table "${t}" não está no manifest`);
      process.exit(1);
    }
    const file = join(folder, `${t}.json`);
    const buf = readFileSync(file, 'utf8');
    const got = sha256(buf);
    if (got !== info.sha256) {
      console.error(`  ✗ ${t}: checksum NÃO bate (esperado ${info.sha256}, obtido ${got})`);
      process.exit(1);
    }
  }
  console.log(`  ✓ Todos os checksums OK\n`);

  // ─── Confirmação 1 ──────────────────────────────────────────────────────────
  if (!skip1) {
    const a1 = await ask(`  Digite EXATAMENTE "restaurar" para prosseguir: `);
    if (a1.trim() !== 'restaurar') {
      console.log('  ✗ Cancelado.\n');
      process.exit(0);
    }
  }

  // ─── Confirmação 2 ──────────────────────────────────────────────────────────
  if (!skip2) {
    const a2 = await ask(`  Tem CERTEZA? Isso vai APAGAR e reinserir dados. Digite o nome do backup (${folderName}): `);
    if (a2.trim() !== folderName) {
      console.log('  ✗ Nome não bate. Cancelado.\n');
      process.exit(0);
    }
  }

  // ─── Execução ───────────────────────────────────────────────────────────────
  const sb = adminClient();
  console.log(`\n  Iniciando restore...\n`);

  // DELETE em ordem inversa
  const deleteOrder = [...onlyTables].reverse();
  for (const t of deleteOrder) {
    process.stdout.write(`  DELETE ${t.padEnd(26)} `);
    const { error } = await sb.from(t).delete().not('id', 'is', null);
    if (error) {
      console.log(`✗ ${error.message}`);
      console.error('\n  ✗ Restore abortado. Banco pode estar em estado inconsistente.');
      process.exit(1);
    }
    console.log('✓');
  }

  // INSERT em ordem topológica
  for (const t of onlyTables) {
    const file = join(folder, `${t}.json`);
    const payload = JSON.parse(readFileSync(file, 'utf8'));
    const rows: any[] = payload.rows || [];
    process.stdout.write(`  INSERT ${t.padEnd(26)} `);
    if (rows.length === 0) { console.log('✓ (vazio)'); continue; }

    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await sb.from(t).insert(batch);
      if (error) {
        console.log(`✗ batch ${i}: ${error.message}`);
        console.error('\n  ✗ Restore parcial. Considere rodar de novo ou usar plano B.');
        process.exit(1);
      }
      inserted += batch.length;
    }

    // Verifica contagem
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
    const expected = payload.count ?? rows.length;
    if (count !== expected) {
      console.log(`✗ contagem divergente (esperado ${expected}, banco tem ${count})`);
      process.exit(1);
    }
    console.log(`✓ ${inserted} rows`);
  }

  console.log(`\n  ✓ Restore concluído com sucesso\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n✗ Erro fatal:', err);
  process.exit(1);
});
