#!/usr/bin/env tsx
/**
 * Cria um snapshot completo das 14 tables core.
 *
 * Uso:
 *   pnpm backup:create                       (manual, sem label)
 *   pnpm backup:create "pre-migration-0008"  (manual, com label)
 *   pnpm backup:create --kind=pre-migration --label="0008-add-fiscal-notes"
 *
 * Resultado:
 *   /Users/iremaralvesii/Financeiro/backups/YYYYMMDD-HHmmss[-slug]/
 *     manifest.json
 *     {table}.json (× 14)
 *
 * Se SUPABASE_BACKUP_UPLOAD=1, também faz upload para Supabase Storage.
 *
 * Quando rodar? Antes de:
 *   - Migrations
 *   - UPDATEs/DELETEs em massa
 *   - Importação de histórico
 *   - Refatorações grandes do schema
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  TABLES,
  BACKUPS_DIR,
  BUCKET,
  adminClient,
  loadEnv,
  slug,
  timestamp,
  sha256,
  fetchAll,
  type Manifest,
  type ManifestTable,
} from './_backup-lib.js';

async function main() {
  const args = process.argv.slice(2);
  let label: string | null = null;
  let kind: Manifest['kind'] = 'manual';

  for (const a of args) {
    if (a.startsWith('--label=')) label = a.slice(8);
    else if (a.startsWith('--kind=')) kind = a.slice(7) as Manifest['kind'];
    else if (!a.startsWith('--')) label = a;
  }

  const ts = timestamp();
  const folderName = label ? `${ts}-${slug(label)}` : ts;
  const folder = join(BACKUPS_DIR, folderName);
  mkdirSync(folder, { recursive: true });

  console.log(`\n🛡️  Criando backup: ${folderName}`);
  console.log(`    Tipo: ${kind}${label ? ` · Label: "${label}"` : ''}`);
  console.log(`    Pasta: ${folder}\n`);

  const sb = adminClient();
  const env = loadEnv();
  const tableInfo: ManifestTable[] = [];
  let totalRows = 0;
  let totalBytes = 0;
  let failed = false;

  for (const t of TABLES) {
    process.stdout.write(`  ${t.padEnd(26)} `);
    try {
      const rows = await fetchAll(sb, t);
      const json = JSON.stringify({ table: t, rows, count: rows.length }, null, 2);
      const filePath = join(folder, `${t}.json`);
      writeFileSync(filePath, json);
      const bytes = statSync(filePath).size;
      const hash = sha256(json);
      tableInfo.push({ name: t, count: rows.length, bytes, sha256: hash });
      totalRows += rows.length;
      totalBytes += bytes;
      console.log(`✓ ${String(rows.length).padStart(6)} rows · ${(bytes / 1024).toFixed(1).padStart(7)} KB`);
    } catch (err) {
      failed = true;
      console.log(`✗ ${(err as Error).message}`);
    }
  }

  const manifest: Manifest = {
    version: '1.0',
    created_at: new Date().toISOString(),
    label,
    kind,
    supabase_project: env['SUPABASE_URL']?.match(/\/\/([^.]+)\./)?.[1] ?? 'unknown',
    tables: tableInfo,
    total_rows: totalRows,
    total_bytes: totalBytes,
  };
  writeFileSync(join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n  ─────────────────────────────────────────`);
  console.log(`  Total: ${totalRows} rows · ${(totalBytes / 1024).toFixed(1)} KB`);

  // Upload opcional para Supabase Storage
  if (env['SUPABASE_BACKUP_UPLOAD'] === '1') {
    console.log(`\n  ☁️  Subindo para Supabase Storage (bucket "${BUCKET}")...`);
    try {
      for (const t of [...TABLES, 'manifest' as any]) {
        const fileName = `${t}.json`;
        const filePath = join(folder, fileName);
        const { readFileSync } = await import('node:fs');
        const buf = readFileSync(filePath);
        const { error } = await sb.storage
          .from(BUCKET)
          .upload(`${folderName}/${fileName}`, buf, {
            contentType: 'application/json',
            upsert: true,
          });
        if (error) console.log(`     ✗ ${fileName}: ${error.message}`);
      }
      console.log(`     ✓ Upload completo`);
    } catch (err) {
      console.log(`     ✗ Upload falhou: ${(err as Error).message}`);
    }
  }

  if (failed) {
    console.log(`\n  ✗ Backup completou com erros. Revise antes de prosseguir.\n`);
    process.exit(1);
  }
  console.log(`\n  ✓ Backup salvo com sucesso\n`);
  console.log(`  Para restaurar:  pnpm backup:restore ${folderName}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n✗ Erro fatal:', err);
  process.exit(1);
});
