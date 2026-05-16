import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

type DB = SupabaseClient<Database>;

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactionsByMonth(
  db: DB,
  householdId: string,
  month: string, // "2026-05"
) {
  const from = `${month}-01`;
  const to = `${month}-31`;

  const { data, error } = await db
    .from('transactions')
    .select('*')
    .eq('household_id', householdId)
    .gte('occurred_on', from)
    .lte('occurred_on', to)
    .order('occurred_on', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUnassignedTransactions(db: DB, householdId: string, limit = 50) {
  const { data, error } = await db
    .from('transactions')
    .select('*')
    .eq('household_id', householdId)
    .eq('responsible', 'unassigned')
    .order('occurred_on', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function upsertTransaction(
  db: DB,
  tx: Database['public']['Tables']['transactions']['Insert'],
) {
  const { data, error } = await db
    .from('transactions')
    .upsert(tx, { onConflict: 'household_id,fingerprint', ignoreDuplicates: true })
    .select()
    .single();

  if (error && error.code === '23505') return null; // duplicate — silently skip
  if (error) throw error;
  return data;
}

export async function updateTransactionResponsible(
  db: DB,
  id: string,
  responsible: string,
) {
  const { error } = await db
    .from('transactions')
    .update({ responsible })
    .eq('id', id);
  if (error) throw error;
}

// ─── Categorization rules ─────────────────────────────────────────────────────

export async function getCategorizationRules(db: DB, householdId: string) {
  const { data, error } = await db
    .from('categorization_rules')
    .select('*')
    .eq('household_id', householdId)
    .order('confidence', { ascending: false });
  if (error) throw error;
  return data;
}

export async function learnRule(
  db: DB,
  householdId: string,
  matchPattern: string,
  responsible: string,
) {
  const { error } = await db.from('categorization_rules').upsert(
    {
      household_id: householdId,
      match_pattern: matchPattern,
      responsible,
      confidence: 0.7,
      hits: 1,
      created_from_manual: true,
    },
    {
      onConflict: 'household_id,match_pattern',
    },
  );
  if (error) throw error;

  // Increment hits on existing rule
  await db.rpc('increment_rule_hits', { p_household_id: householdId, p_pattern: matchPattern });
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function getAccounts(db: DB, householdId: string) {
  const { data, error } = await db
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .eq('active', true);
  if (error) throw error;
  return data;
}

export async function getCreditCardAccount(db: DB, householdId: string) {
  const { data, error } = await db
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .eq('kind', 'credit_card')
    .single();
  if (error) throw error;
  return data;
}

// ─── Settlements ──────────────────────────────────────────────────────────────

export async function getOrCreateSettlement(
  db: DB,
  householdId: string,
  referenceMonth: string,
  data: Database['public']['Tables']['monthly_settlements']['Insert'],
) {
  const { data: existing } = await db
    .from('monthly_settlements')
    .select('*')
    .eq('household_id', householdId)
    .eq('reference_month', referenceMonth)
    .single();

  if (existing) return existing;

  const { data: created, error } = await db
    .from('monthly_settlements')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created;
}

// ─── CSV Imports ──────────────────────────────────────────────────────────────

export async function findImportBySha256(db: DB, householdId: string, sha256: string) {
  const { data } = await db
    .from('csv_imports')
    .select('id')
    .eq('household_id', householdId)
    .eq('raw_content_sha256', sha256)
    .single();
  return data;
}

export async function createCsvImport(
  db: DB,
  imp: Database['public']['Tables']['csv_imports']['Insert'],
) {
  const { data, error } = await db
    .from('csv_imports')
    .insert(imp)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Recurring commitments ────────────────────────────────────────────────────

export async function getActiveRecurringCommitments(db: DB, householdId: string) {
  const { data, error } = await db
    .from('recurring_commitments')
    .select('*')
    .eq('household_id', householdId)
    .eq('active', true);
  if (error) throw error;
  return data;
}

// ─── Monthly obligations ──────────────────────────────────────────────────────

export async function getMonthlyObligations(db: DB, householdId: string, month: string) {
  const { data, error } = await db
    .from('monthly_obligations')
    .select('*, recurring_commitments(description)')
    .eq('household_id', householdId)
    .eq('reference_month', `${month}-01`)
    .order('due_date');
  if (error) throw error;
  return data;
}

// ─── Income records ───────────────────────────────────────────────────────────

export async function getIncomeByMonth(db: DB, householdId: string, month: string) {
  const { data, error } = await db
    .from('income_records')
    .select('*')
    .eq('household_id', householdId)
    .eq('reference_month', `${month}-01`);
  if (error) throw error;
  return data;
}
