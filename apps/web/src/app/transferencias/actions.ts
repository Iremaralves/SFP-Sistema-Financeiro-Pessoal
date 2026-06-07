'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function actionCriarTransferencia(payload: {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  description?: string;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  if (payload.from_account_id === payload.to_account_id) {
    return { ok: false as const, error: 'Conta de origem e destino devem ser diferentes.' };
  }
  if (!payload.amount || payload.amount <= 0) {
    return { ok: false as const, error: 'Valor deve ser maior que zero.' };
  }

  // Buscar nomes das contas para descrição
  const { data: accs } = await supabase
    .from('accounts').select('id, name, entity_id')
    .in('id', [payload.from_account_id, payload.to_account_id])
    .eq('household_id', profile.household_id);

  const fromAcc = (accs ?? []).find(a => a.id === payload.from_account_id);
  const toAcc = (accs ?? []).find(a => a.id === payload.to_account_id);
  if (!fromAcc || !toAcc) {
    return { ok: false as const, error: 'Conta(s) não encontrada(s).' };
  }

  const desc = payload.description?.trim() ||
    `Transferência: ${fromAcc.name} → ${toAcc.name}`;

  // 1. Criar registro do transfer (sem transactions ainda)
  const { data: transfer, error: trErr } = await supabase
    .from('transfers')
    .insert({
      household_id: profile.household_id,
      from_account_id: payload.from_account_id,
      to_account_id: payload.to_account_id,
      amount: payload.amount,
      occurred_on: payload.occurred_on,
      description: desc,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (trErr || !transfer) {
    return { ok: false as const, error: trErr?.message ?? 'Erro ao criar transferência.' };
  }

  // 2. Criar 2 transactions (saída + entrada)
  const ts = Date.now();
  const { data: txs, error: txErr } = await supabase.from('transactions').insert([
    {
      household_id: profile.household_id,
      account_id: payload.from_account_id,
      occurred_on: payload.occurred_on,
      description: `${desc} (saída)`,
      amount: -Math.abs(payload.amount),
      responsible: 'iremar',
      status: 'paid',
      source: 'manual_pwa',
      fingerprint: `transfer-out-${transfer.id}-${ts}`,
      entity_id: fromAcc.entity_id,
      is_transfer: true,
      transfer_id: transfer.id,
    },
    {
      household_id: profile.household_id,
      account_id: payload.to_account_id,
      occurred_on: payload.occurred_on,
      description: `${desc} (entrada)`,
      amount: Math.abs(payload.amount),
      responsible: 'iremar',
      status: 'paid',
      source: 'manual_pwa',
      fingerprint: `transfer-in-${transfer.id}-${ts}`,
      entity_id: toAcc.entity_id,
      is_transfer: true,
      transfer_id: transfer.id,
    },
  ]).select('id, amount');

  if (txErr || !txs || txs.length !== 2) {
    // rollback do transfer
    await supabase.from('transfers').delete().eq('id', transfer.id);
    return { ok: false as const, error: txErr?.message ?? 'Erro ao criar transações.' };
  }

  // 3. Atualizar transfer com IDs das transactions
  const outTx = txs.find(t => Number(t.amount) < 0);
  const inTx = txs.find(t => Number(t.amount) > 0);
  await supabase.from('transfers').update({
    from_transaction_id: outTx?.id,
    to_transaction_id: inTx?.id,
  }).eq('id', transfer.id);

  revalidatePath('/contas');
  revalidatePath('/transferencias');
  return { ok: true as const, id: transfer.id };
}

export async function actionExcluirTransferencia(id: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  // Buscar transactions vinculadas
  const { data: transfer } = await supabase
    .from('transfers').select('from_transaction_id, to_transaction_id')
    .eq('id', id).eq('household_id', profile.household_id).maybeSingle();

  if (transfer) {
    // Excluir as transactions
    const txIds = [transfer.from_transaction_id, transfer.to_transaction_id].filter(Boolean) as string[];
    if (txIds.length > 0) {
      await supabase.from('transactions').delete().in('id', txIds).eq('household_id', profile.household_id);
    }
  }

  const { error } = await supabase.from('transfers').delete()
    .eq('id', id).eq('household_id', profile.household_id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/contas');
  revalidatePath('/transferencias');
  return { ok: true as const };
}
