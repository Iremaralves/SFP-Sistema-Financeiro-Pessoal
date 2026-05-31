'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { parseNubankCsv, fingerprint, categorize, detectDuplicates } from '@i2fin/core';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const DRIVE_FOLDER_ID = '15tcAPDuR_sIQ0HwRg16GqfCgGJp-DJqD';

// ─── Action: dispara verificação de email no Apps Script ───────────────────
// Setup necessário (uma vez):
//   1. No Apps Script: Script Properties → adicionar WEBHOOK_TOKEN = <valor secreto>
//   2. Implantar → Web App → "Qualquer pessoa" → copiar URL
//   3. No Vercel env: APPS_SCRIPT_WEBHOOK_URL=<url> e APPS_SCRIPT_WEBHOOK_TOKEN=<token>
export async function actionVerificarEmail() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const url   = process.env.APPS_SCRIPT_WEBHOOK_URL;
  const token = process.env.APPS_SCRIPT_WEBHOOK_TOKEN;
  if (!url || !token) {
    return {
      ok: false as const,
      error: 'Webhook não configurado. Configure APPS_SCRIPT_WEBHOOK_URL e APPS_SCRIPT_WEBHOOK_TOKEN no Vercel.',
      configured: false as const,
    };
  }

  try {
    // Timeout de 30s — Apps Script pode ser lento ao escanear email
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(`${url}?token=${encodeURIComponent(token)}&action=both`, {
      method: 'GET',
      signal: controller.signal,
      // Apps Script Web App redireciona — segue redirect
      redirect: 'follow',
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false as const, error: `HTTP ${res.status}` };
    }

    // Detecta HTML (login do Google) — Web App não publicado como "Qualquer pessoa"
    const ctype = res.headers.get('content-type') ?? '';
    if (!ctype.includes('application/json')) {
      const sample = (await res.text()).slice(0, 80);
      if (sample.toLowerCase().includes('<!doctype') || sample.includes('<html')) {
        return {
          ok: false as const,
          error: 'Web App não está público. No Apps Script → Implantar → Gerenciar implantações → editar → "Quem tem acesso: Qualquer pessoa".',
        };
      }
      return { ok: false as const, error: `Resposta inesperada (${ctype || 'sem content-type'})` };
    }

    const data = await res.json() as { ok: boolean; novosArquivos?: number; error?: string };
    if (!data.ok) {
      return { ok: false as const, error: data.error ?? 'Erro desconhecido' };
    }

    revalidatePath('/importar');
    return {
      ok: true as const,
      novosArquivos: data.novosArquivos ?? 0,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, error: msg };
  }
}

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

  // CSV do Nubank usa convenção "saldo da fatura": compras=positivo, pagamento=negativo.
  // O app usa convenção "saldo da conta": compras=negativo (dívida), pagamento=positivo (entrada).
  // Por isso, inverter o sinal de TODAS as linhas ao importar para conta credit_card.
  const normalizedRows = rows.map(r => ({ ...r, amount: -r.amount }));

  // Detectar duplicatas dentro do próprio CSV (usa amount já normalizado)
  const dupes = detectDuplicates(normalizedRows);
  const skipFingerprints = new Set<string>();
  for (const dupe of dupes) {
    const older = dupe.rowA.date < dupe.rowB.date ? dupe.rowA : dupe.rowB;
    const fp = await fingerprint(older.date, older.title, older.amount, account.id);
    skipFingerprints.add(fp);
  }

  // Pre-fetch content-keys das transactions existentes com tolerância de ±2 dias.
  // Motivações:
  //   1. Fingerprint sozinho não basta — algoritmo mudou ao longo do tempo,
  //      rows antigas têm hash incompatível.
  //   2. Nubank reajusta data da compra (parcial → consolidada): mesma compra
  //      aparece em 19/mai num CSV e em 20/mai no próximo. Dedup precisa
  //      tolerar pequena variação de data.
  //
  // Estratégia: indexa por (descrição|valor) → Map<data, quantidadeDisponível>.
  // Pra cada CSV row, procura data dentro de ±2 dias com slot disponível.
  // Preserva duplicatas legítimas (2 cafés iguais no mesmo dia) pela contagem.
  const TOLERANCE_DAYS = 2;
  const minDate = normalizedRows.reduce((m, r) => r.date < m ? r.date : m, normalizedRows[0]!.date);
  const maxDate = normalizedRows.reduce((m, r) => r.date > m ? r.date : m, normalizedRows[0]!.date);
  // Expande range em ±2 dias pra capturar matches próximos
  const expandDate = (iso: string, days: number) => {
    const d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const { data: existingRows } = await supabase
    .from('transactions')
    .select('occurred_on, description, amount')
    .eq('account_id', account.id)
    .gte('occurred_on', expandDate(minDate, -TOLERANCE_DAYS))
    .lte('occurred_on', expandDate(maxDate, TOLERANCE_DAYS));

  const dedupKey = (desc: string, amt: number) => `${desc}|${amt.toFixed(2)}`;
  // (desc|amount) → Map<date, count> — datas disponíveis pra consumir como duplicata
  const availableByKey = new Map<string, Map<string, number>>();
  for (const r of (existingRows ?? [])) {
    const k = dedupKey(r.description, Number(r.amount));
    if (!availableByKey.has(k)) availableByKey.set(k, new Map());
    const dates = availableByKey.get(k)!;
    dates.set(r.occurred_on, (dates.get(r.occurred_on) ?? 0) + 1);
  }

  // Procura data próxima dentro de ±TOLERANCE_DAYS e consome (decrementa)
  // Retorna true se encontrou (= é duplicata), false se não há match
  function consumeNearbyDate(key: string, targetDate: string): boolean {
    const dates = availableByKey.get(key);
    if (!dates) return false;
    const target = new Date(targetDate + 'T00:00:00Z').getTime();
    // Prioriza data exata, depois mais próxima
    let bestDate: string | null = null;
    let bestDiff = Infinity;
    for (const [date, count] of dates) {
      if (count <= 0) continue;
      const diff = Math.abs((new Date(date + 'T00:00:00Z').getTime() - target) / 86_400_000);
      if (diff <= TOLERANCE_DAYS && diff < bestDiff) {
        bestDate = date;
        bestDiff = diff;
        if (diff === 0) break; // match exato, ótimo
      }
    }
    if (bestDate !== null) {
      dates.set(bestDate, dates.get(bestDate)! - 1);
      return true;
    }
    return false;
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

  for (const row of normalizedRows) {
    const fp = await fingerprint(row.date, row.title, row.amount, account.id);
    if (skipFingerprints.has(fp)) { skipped++; continue; }

    // Dedup tolerante: procura (descrição|valor) com data dentro de ±2 dias.
    // Cobre o caso Nubank reajustar data (parcial 19/mai → consolidada 20/mai).
    if (consumeNearbyDate(dedupKey(row.title, row.amount), row.date)) {
      skipped++;
      continue;
    }

    const cat = categorize(row.title, rules);

    // A UNIQUE constraint é (household_id, fingerprint) — composta.
    // onConflict precisa listar AMBAS as colunas, senão Postgres não encontra
    // a constraint pra resolver e a inserção falha silenciosamente em TODA linha.
    const { data: upserted, error: upsertError } = await supabase.from('transactions').upsert(
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
      { onConflict: 'household_id,fingerprint', ignoreDuplicates: true }
    ).select('id');

    if (upsertError) { skipped++; continue; }

    // Com ignoreDuplicates+select, data.length === 0 significa "conflito ignorado"
    // (linha já existia). Sem isso, não dá pra distinguir inserção de conflito.
    if (!upserted || upserted.length === 0) { skipped++; continue; }

    // Registra inserção: adiciona essa data ao mapa pra que a próxima
    // ocorrência da mesma (desc|amount) seja tratada como duplicata
    const k = dedupKey(row.title, row.amount);
    if (!availableByKey.has(k)) availableByKey.set(k, new Map());
    const dates = availableByKey.get(k)!;
    dates.set(row.date, (dates.get(row.date) ?? 0) + 1);
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
  if (!profile) redirect('/login');
  // Operator (Juliana) também importa — ela é quem categoriza

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

// ─── Busca auto-categorizados recentes (últimos 10 min) ──────────────────

export async function actionBuscarAutoCategorizadas() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('transactions')
    .select('id, description, amount, occurred_on, responsible')
    .eq('household_id', profile.household_id)
    .eq('source', 'csv_import')
    .neq('responsible', 'unassigned')
    .gte('created_at', tenMinutesAgo)
    .order('occurred_on', { ascending: false })
    .limit(50);

  return (data ?? []) as Array<{
    id: string;
    description: string;
    amount: number;
    occurred_on: string;
    responsible: string;
  }>;
}

// ─── Criar regra de categorização automática ──────────────────────────────

export async function actionCriarRegra(description: string, responsible: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  // Padrão: primeiras palavras significativas da descrição (até 20 chars)
  const pattern = description.toLowerCase().slice(0, 20).trim();

  // Verificar se já existe regra similar
  const { data: existing } = await supabase
    .from('categorization_rules')
    .select('id')
    .eq('household_id', profile.household_id)
    .ilike('match_pattern', `%${pattern.slice(0, 10)}%`)
    .limit(1);

  if (existing && existing.length > 0) return; // já existe

  await supabase.from('categorization_rules').insert({
    household_id: profile.household_id,
    match_pattern: pattern,
    responsible,
    confidence: 0.85,
    hits: 1,
    created_from_manual: true,
  });
}

// ─── Salvar info de parcela num lançamento ────────────────────────────────

export async function actionSalvarParcela(id: string, current: number, total: number) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await supabase
    .from('transactions')
    .update({ installment_current: current, installment_total: total })
    .eq('id', id);
}
