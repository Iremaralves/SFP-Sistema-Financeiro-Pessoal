'use server';

/**
 * Server actions para /backups.
 *
 * IMPORTANTE: este app roda em Vercel (serverless), portanto:
 *   - O backup PRIMÁRIO do app vai para Supabase Storage (bucket "backups")
 *   - O backup LOCAL (/Users/iremaralvesii/Financeiro/backups/) é apenas
 *     em desenvolvimento, via CLI (pnpm backup:create)
 *
 * Toda action exige role = 'admin' e household_id válido.
 */

import { createServerSupabase } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createHash } from 'node:crypto';

const TABLES = [
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
type TableName = (typeof TABLES)[number];

const BUCKET = 'backups';

interface ManifestTable {
  name: string;
  count: number;
  bytes: number;
  sha256: string;
}
interface Manifest {
  version: string;
  created_at: string;
  label: string | null;
  kind: 'auto' | 'manual' | 'pre-migration';
  supabase_project: string;
  tables: ManifestTable[];
  total_rows: number;
  total_bytes: number;
}

function admin() {
  const url = process.env['SUPABASE_URL']!;
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
  if (!url || !key) throw new Error('SUPABASE_URL/SERVICE_ROLE_KEY ausentes');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function slug(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function timestamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles').select('id, household_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');
  return { supabase, profile };
}

// ─── actionCreateBackup ──────────────────────────────────────────────────────
export async function actionCreateBackup(formData: FormData): Promise<void> {
  const { profile } = await requireAdmin();
  const labelRaw = String(formData.get('label') ?? '').trim();
  const kindRaw = String(formData.get('kind') ?? 'manual').trim();
  const kind: Manifest['kind'] =
    kindRaw === 'pre-migration' ? 'pre-migration' : 'manual';
  const label = labelRaw || null;

  const ts = timestamp();
  const folderName = label ? `${ts}-${slug(label)}` : ts;
  const prefix = `${profile.household_id}/${folderName}`;

  const sb = admin();
  const tableInfo: ManifestTable[] = [];
  let totalRows = 0;
  let totalBytes = 0;

  for (const t of TABLES) {
    const all: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await sb.from(t).select('*').range(from, from + 999);
      if (error) throw new Error(`${t}: ${error.message}`);
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < 1000) break;
      from += 1000;
    }
    const json = JSON.stringify({ table: t, rows: all, count: all.length }, null, 2);
    const bytes = Buffer.byteLength(json, 'utf8');
    const hash = createHash('sha256').update(json).digest('hex');
    const { error: upErr } = await sb.storage.from(BUCKET).upload(
      `${prefix}/${t}.json`,
      new Blob([json], { type: 'application/json' }),
      { upsert: true, contentType: 'application/json' },
    );
    if (upErr) throw new Error(`upload ${t}: ${upErr.message}`);
    tableInfo.push({ name: t, count: all.length, bytes, sha256: hash });
    totalRows += all.length;
    totalBytes += bytes;
  }

  const manifest: Manifest = {
    version: '1.0',
    created_at: new Date().toISOString(),
    label,
    kind,
    supabase_project: 'jvfdzcouychlfxxnzams',
    tables: tableInfo,
    total_rows: totalRows,
    total_bytes: totalBytes,
  };
  const manifestJson = JSON.stringify(manifest, null, 2);
  const { error: mErr } = await sb.storage.from(BUCKET).upload(
    `${prefix}/manifest.json`,
    new Blob([manifestJson], { type: 'application/json' }),
    { upsert: true, contentType: 'application/json' },
  );
  if (mErr) throw new Error(`upload manifest: ${mErr.message}`);

  revalidatePath('/backups');
}

// ─── actionListBackups ───────────────────────────────────────────────────────
export interface BackupRow {
  folder: string;
  manifest: Manifest | null;
}

export async function actionListBackups(): Promise<BackupRow[]> {
  const { profile } = await requireAdmin();
  const sb = admin();
  const { data, error } = await sb.storage.from(BUCKET).list(profile.household_id, { limit: 1000 });
  if (error) return [];
  const rows: BackupRow[] = [];
  for (const dir of (data || [])) {
    if (!dir.name || dir.name.startsWith('.')) continue;
    const manifestPath = `${profile.household_id}/${dir.name}/manifest.json`;
    const { data: file } = await sb.storage.from(BUCKET).download(manifestPath);
    let manifest: Manifest | null = null;
    if (file) {
      try { manifest = JSON.parse(await file.text()); } catch {}
    }
    rows.push({ folder: dir.name, manifest });
  }
  return rows.sort((a, b) => b.folder.localeCompare(a.folder));
}

// ─── actionRestoreBackup ─────────────────────────────────────────────────────
/**
 * Restore via app. Requer 2-step confirm:
 *   1ª chamada: passa `confirm1 = "restaurar"` → retorna { needsSecondConfirm: true }
 *   2ª chamada: passa `confirm1 = "restaurar"` E `confirm2 = <folderName>`
 *
 * Restaura SOMENTE rows do household_id do admin logado — não afeta outros households.
 */
export async function actionRestoreBackup(formData: FormData): Promise<void> {
  const { profile } = await requireAdmin();
  const folderName = String(formData.get('folder') ?? '').trim();
  const confirm1 = String(formData.get('confirm1') ?? '').trim();
  const confirm2 = String(formData.get('confirm2') ?? '').trim();

  if (!folderName) throw new Error('folder ausente');
  if (confirm1 !== 'restaurar') {
    throw new Error('Confirmação 1 inválida — digite "restaurar"');
  }
  if (confirm2 !== folderName) {
    throw new Error(`Digite o nome do backup: ${folderName}`);
  }

  const sb = admin();
  const prefix = `${profile.household_id}/${folderName}`;

  // Manifest
  const { data: manFile, error: mErr } = await sb.storage.from(BUCKET).download(`${prefix}/manifest.json`);
  if (mErr || !manFile) throw new Error('manifest.json não encontrado');
  const manifest: Manifest = JSON.parse(await manFile.text());

  // Carrega + valida checksums
  const buffers = new Map<string, string>();
  for (const t of TABLES) {
    const { data: f, error } = await sb.storage.from(BUCKET).download(`${prefix}/${t}.json`);
    if (error || !f) throw new Error(`${t}.json não encontrado`);
    const text = await f.text();
    const info = manifest.tables.find((x) => x.name === t);
    if (info) {
      const got = createHash('sha256').update(text).digest('hex');
      if (got !== info.sha256) {
        throw new Error(`Checksum de ${t} não bate — backup corrompido`);
      }
    }
    buffers.set(t, text);
  }

  // DELETE (ordem inversa) — APENAS do household do admin
  const deleteOrder = [...TABLES].reverse();
  for (const t of deleteOrder) {
    const base = sb.from(t).delete().eq('household_id', profile.household_id);
    // Para 'profiles', não deletamos o profile do próprio admin (senão ele perde acesso)
    const q = t === 'profiles' ? base.neq('id', profile.id) : base;
    const { error } = await q;
    if (error) throw new Error(`DELETE ${t}: ${error.message}`);
  }

  // INSERT (ordem topológica)
  for (const t of TABLES) {
    const text = buffers.get(t)!;
    const payload = JSON.parse(text);
    const rows: any[] = (payload.rows || []).filter((r: any) =>
      // Restaura SOMENTE rows do próprio household. Para 'profiles', também pula o próprio admin
      (!('household_id' in r) || r.household_id === profile.household_id) &&
      (t !== 'profiles' || r.id !== profile.id),
    );
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await sb.from(t).upsert(batch);
      if (error) throw new Error(`INSERT ${t}: ${error.message}`);
    }
  }

  revalidatePath('/backups');
}
