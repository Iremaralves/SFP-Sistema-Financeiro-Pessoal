'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type Responsible = 'iremar' | 'juliana' | 'casal' | 'i2';

export async function actionCategorizarTx(
  txId: string,
  responsible: Responsible,
  options?: { criarRegra?: boolean; eParcelado?: boolean; parcelaAtual?: number; parcelaTotal?: number; notes?: string },
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  // 1. Atualizar a transaction
  const updates: Record<string, unknown> = { responsible };
  if (options?.eParcelado && options.parcelaAtual && options.parcelaTotal) {
    updates.installment_current = options.parcelaAtual;
    updates.installment_total = options.parcelaTotal;
  }
  // Nota opcional — só atualiza se Juliana digitou algo
  const trimmedNotes = options?.notes?.trim();
  if (trimmedNotes) {
    updates.notes = trimmedNotes;
  }

  const { data: tx, error: updErr } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', txId)
    .eq('household_id', profile.household_id)
    .select('description')
    .single();

  if (updErr) return { ok: false as const, error: updErr.message };

  // 2. Opcionalmente criar regra de categorização automática
  if (options?.criarRegra && tx?.description) {
    // Extrai primeiro termo significativo (até 2 palavras)
    const words = tx.description.toLowerCase()
      .replace(/[*"']/g, '')
      .replace(/\s+/g, ' ')
      .split(' ')
      .slice(0, 2);
    const pattern = words.join(' ');

    // Inserir regra (ignora se já existe via constraint)
    await supabase.from('categorization_rules').upsert(
      {
        household_id: profile.household_id,
        match_pattern: pattern,
        responsible,
        confidence: 0.9,
        hits: 1,
        created_from_manual: true,
      },
      { onConflict: 'household_id,match_pattern', ignoreDuplicates: true },
    );
  }

  revalidatePath('/categorizar');
  revalidatePath('/dashboard');
  revalidatePath('/lancamentos');
  return { ok: true as const };
}

export async function actionCategorizarLote(
  txIds: string[],
  responsible: Responsible,
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const { error } = await supabase
    .from('transactions')
    .update({ responsible })
    .in('id', txIds)
    .eq('household_id', profile.household_id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/categorizar');
  revalidatePath('/dashboard');
  return { ok: true as const };
}
