#!/usr/bin/env tsx
/**
 * Lista todos os backups disponíveis (local + Supabase Storage).
 *
 * Uso:
 *   pnpm backup:list
 *   pnpm backup:list --remote   (lê só do Supabase Storage)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BACKUPS_DIR, BUCKET, adminClient, loadEnv, type Manifest } from './_backup-lib.js';

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function ageInDays(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function listLocal(): Array<{ folder: string; manifest: Manifest | null }> {
  if (!existsSync(BACKUPS_DIR)) return [];
  const out: Array<{ folder: string; manifest: Manifest | null }> = [];
  for (const name of readdirSync(BACKUPS_DIR)) {
    const full = join(BACKUPS_DIR, name);
    if (!statSync(full).isDirectory()) continue;
    const mPath = join(full, 'manifest.json');
    let manifest: Manifest | null = null;
    if (existsSync(mPath)) {
      try {
        manifest = JSON.parse(readFileSync(mPath, 'utf8'));
      } catch {}
    }
    out.push({ folder: name, manifest });
  }
  return out.sort((a, b) => b.folder.localeCompare(a.folder));
}

async function listRemote(): Promise<string[]> {
  const env = loadEnv();
  if (!env['SUPABASE_URL'] || !env['SUPABASE_SERVICE_ROLE_KEY']) return [];
  try {
    const sb = adminClient();
    const { data, error } = await sb.storage.from(BUCKET).list('', { limit: 1000 });
    if (error) return [];
    return (data || []).filter((d) => d.name).map((d) => d.name).sort().reverse();
  } catch {
    return [];
  }
}

async function main() {
  const remoteOnly = process.argv.includes('--remote');

  if (!remoteOnly) {
    const local = listLocal();
    console.log(`\n📦 Backups locais — ${BACKUPS_DIR}\n`);
    if (local.length === 0) {
      console.log('  (vazio)');
    } else {
      console.log(
        '  ' +
          'PASTA'.padEnd(40) +
          'TIPO'.padEnd(16) +
          'ROWS'.padStart(8) +
          '  ' +
          'TAMANHO'.padStart(10) +
          '  ' +
          'IDADE'.padStart(8) +
          '  LABEL',
      );
      console.log('  ' + '─'.repeat(110));
      for (const { folder, manifest } of local) {
        const kind = manifest?.kind ?? '?';
        const rows = manifest?.total_rows ?? 0;
        const bytes = manifest?.total_bytes ?? 0;
        const age = manifest ? `${ageInDays(manifest.created_at)}d` : '?';
        const label = manifest?.label ?? '';
        const warn = manifest && ageInDays(manifest.created_at) > 90 ? ' ⚠️' : '';
        console.log(
          '  ' +
            folder.padEnd(40) +
            kind.padEnd(16) +
            String(rows).padStart(8) +
            '  ' +
            fmtBytes(bytes).padStart(10) +
            '  ' +
            age.padStart(8) +
            '  ' +
            label +
            warn,
        );
      }
    }
  }

  const remote = await listRemote();
  console.log(`\n☁️  Backups no Supabase Storage (bucket "${BUCKET}")\n`);
  if (remote.length === 0) {
    console.log('  (vazio ou bucket não acessível)');
  } else {
    for (const r of remote) console.log(`  ${r}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('✗ Erro:', err);
  process.exit(1);
});
