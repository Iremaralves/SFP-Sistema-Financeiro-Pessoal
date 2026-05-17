'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { parseNubankCsv, fingerprint, categorize, detectDuplicates } from '@i2fin/core';
import { redirect } from 'next/navigation';

const DRIVE_FOLDER_ID = '15tcAPDuR_sIQ0HwRg16GqfCgGJp-DJqD';

// ─── Shared processing logic (mesma que o CLI) ─────────────────────────────

async function processCSV(content: string, filename: string, userId: string, householdId: string) {
  const supabase = await createServerSupabase();

  const { rows, sha256, errors } = parseNubankCsv(content);

  if (rows.length === 0) {
    return { ok: false as const, error: 'Nenhuma linha válida encontrada. Verifique se o arquivo é um CSV do Nubank.', errors };
  }

  // Verificar se já foi importado (dedup por SHA-256)
  const { data: existing } = await supabase
    .from('csv_imports')
    .select('id, filename')
    .eq('household_id', householdId)
    .eq('raw_content_sha256', sha256)
    .single();

  if (existing) {
    return {
      ok: false as const,
      error: `Este arquivo já foi importado anteriormente (${existing.filename}).`,
      alreadyImported: true,
    };
  }

  // Buscar conta de crédito
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('household_id', householdId)
    .eq('kind', 'credit_card')
    .single();

  if (!account) {
    return { ok: false as const, error: 'Nenhuma conta de crédito encontrada.' };
  }

  // Detectar duplicatas dentro do próprio CSV
  const dupes = detectDuplicates(rows);
  const skipFingerprints = new Set<string>();
  for (const dupe of dupes) {
    const older = dupe.rowA.date < dupe.rowB.date ? dupe.rowA : dupe.rowB;
    const fp = await fingerprint(older.date, older.title, older.amount, account.id);
    skipFingerprints.add(fp);
  }

  // Buscar regras de categorização
  const { data: rulesRaw } = await supabase
    .from('categorization_rules')
    .select('*')
    .eq('household_id', householdId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rules = (rulesRaw ?? []) as any as Parameters<typeof categorize>[1];

  // Processar cada linha
  let inserted = 0, skipped = 0, autoAssigned = 0, flagged = 0;

  for (const row of rows) {
    const fp = await fingerprint(row.date, row.title, row.amount, account.id);
    if (skipFingerprints.has(fp)) { skipped++; continue; }

    const cat = categorize(row.title, rules);

    const { error: upsertError } = await supabase.from('transactions').upsert(
      {
        household_id: householdId,
        account_id: account.id,
        occurred_on: row.date,
        description: row.title,
        amount: row.amount,
        responsible: cat.responsible,
        fingerprint: fp,
        source: 'csv_import',
        created_by: userId,
      },
      { onConflict: 'fingerprint', ignoreDuplicates: true }
    );

    if (upsertError) { skipped++; continue; }

    inserted++;
    if (cat.autoAssigned) autoAssigned++;
    else if (cat.responsible === 'unassigned') flagged++;
  }

  // Registrar importação
  await supabase.from('csv_imports').insert({
    household_id: householdId,
    filename,
    account_id: account.id,
    imported_by: userId,
    rows_total: rows.length,
    rows_inserted: inserted,
    rows_skipped_duplicate: skipped + dupes.length,
    rows_flagged_review: flagged,
    rows_auto_assigned: autoAssigned,
    raw_content_sha256: sha256,
  });

  return {
    ok: true as const,
    inserted,
    skipped: skipped + dupes.length,
    autoAssigned,
    flagged,
    total: rows.length,
    parseErrors: errors.length,
  };
}

// ─── Action: upload manual ─────────────────────────────────────────────────

export async function actionImportarUpload(formData: FormData) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const file = formData.get('csv') as File | null;
  if (!file || file.size === 0) {
    return { ok: false as const, error: 'Nenhum arquivo selecionado.' };
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { ok: false as const, error: 'Apenas arquivos .csv são aceitos.' };
  }

  const content = await file.text();
  return processCSV(content, file.name, user.id, profile.household_id);
}

// ─── Action: importar do Google Drive ─────────────────────────────────────

export async function actionImportarDrive(fileId: string, fileName: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return { ok: false as const, error: 'Google Drive não configurado.' };

  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(keyJson),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  // Baixar conteúdo do arquivo
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  );

  const content = res.data as string;
  return processCSV(content, fileName, user.id, profile.household_id);
}

// ─── Lista arquivos do Google Drive ───────────────────────────────────────

export async function listDriveFiles(): Promise<Array<{ id: string; name: string; modifiedTime: string; size: string }>> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return [];

  try {
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(keyJson),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and mimeType='text/csv' and trashed=false`,
      fields: 'files(id,name,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
      pageSize: 20,
    });

    return (res.data.files ?? []).map((f) => ({
      id: f.id ?? '',
      name: f.name ?? '',
      modifiedTime: f.modifiedTime ?? '',
      size: f.size ?? '0',
    }));
  } catch {
    return [];
  }
}

// ─── Busca lançamentos sem responsável do mês atual ───────────────────────

export async function actionBuscarNaoCategorizados() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('household_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const month = new Date().toISOString().slice(0, 7);
  const [ly, lm] = month.split('-').map(Number);
  const nextMonth = new Date(ly!, lm!, 1).toISOString().slice(0, 10);

  const { data } = await supabase
    .from('transactions')
    .select('id, description, amount, occurred_on')
    .eq('household_id', profile.household_id)
    .eq('responsible', 'unassigned')
    .gte('occurred_on', `${month}-01`)
    .lt('occurred_on', nextMonth)
    .order('occurred_on', { ascending: false });

  return (data ?? []) as Array<{ id: string; description: string; amount: number; occurred_on: string }>;
}

// ─── Salva responsável de um lançamento ──────────────────────────────────

export async function actionSalvarResponsavel(id: string, responsible: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await supabase
    .from('transactions')
    .update({ responsible })
    .eq('id', id);
}
