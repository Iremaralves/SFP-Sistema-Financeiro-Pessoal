/**
 * Biblioteca compartilhada entre backup.ts, restore.ts e list-backups.ts.
 * Sem dependências externas além de @supabase/supabase-js (já no projeto).
 */
import { createClient, type SupabaseClient } from '../packages/db/node_modules/@supabase/supabase-js/dist/module/index.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const TABLES = [
  'profiles',
  'households',
  'entities',
  'accounts',
  'categories',
  'categorization_rules',
  'recurring_commitments',
  'monthly_obligations',
  'transactions',
  'income_records',
  'fiscal_notes',
  'transfers',
  'csv_imports',
  'monthly_settlements',
] as const;

export type TableName = (typeof TABLES)[number];

export const BACKUPS_DIR = '/Users/iremaralvesii/Financeiro/backups';
export const BUCKET = 'backups';

export interface ManifestTable {
  name: string;
  count: number;
  bytes: number;
  sha256: string;
}

export interface Manifest {
  version: string;
  created_at: string;
  label: string | null;
  kind: 'auto' | 'manual' | 'pre-migration';
  supabase_project: string;
  tables: ManifestTable[];
  total_rows: number;
  total_bytes: number;
}

/** Carrega variáveis do .env.local (parser mínimo, sem dotenv). */
export function loadEnv(): Record<string, string> {
  const path = '/Users/iremaralvesii/Financeiro/.env.local';
  if (!existsSync(path)) return process.env as Record<string, string>;
  const out: Record<string, string> = { ...(process.env as Record<string, string>) };
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in out)) out[k] = v;
  }
  return out;
}

export function adminClient(): SupabaseClient {
  const env = loadEnv();
  const url = env['SUPABASE_URL'] || env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) {
    console.error('✗ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local');
    console.error('  Encontre em: https://app.supabase.com/project/jvfdzcouychlfxxnzams/settings/api');
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export function sha256(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex');
}

export function folderPath(folderName: string): string {
  return join(BACKUPS_DIR, folderName);
}

/** Busca TODAS as rows de uma table, paginando 1000-a-1000. */
export async function fetchAll(sb: SupabaseClient, table: string): Promise<any[]> {
  const all: any[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await sb.from(table).select('*').range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
