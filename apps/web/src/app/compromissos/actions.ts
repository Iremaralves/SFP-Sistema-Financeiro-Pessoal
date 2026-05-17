'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function actionDarBaixa(recurringId: string, amount: number) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const today = new Date();
  const month = today.toISOString().slice(0, 7);
  const todayStr = today.toISOString().slice(0, 10);

  // Buscar info do compromisso
  const { data: commitment } = await supabase
    .from('recurring_commitments')
    .select('description, responsible, due_day')
    .eq('id', recurringId)
    .single();

  if (!commitment) return { ok: false as const, error: 'Compromisso não encontrado.' };

  const dueDateStr = `${month}-${String(commitment.due_day).padStart(2, '0')}`;

  // Verificar se já existe para este mês
  const { data: existing } = await supabase
    .from('monthly_obligations')
    .select('id, status')
    .eq('household_id', profile.household_id)
    .eq('recurring_id', recurringId)
    .eq('reference_month', month)
    .single();

  if (existing) {
    await supabase
      .from('monthly_obligations')
      .update({ status: 'paid', paid_on: todayStr, paid_amount: amount })
      .eq('id', existing.id);
  } else {
    await supabase.from('monthly_obligations').insert({
      household_id: profile.household_id,
      recurring_id: recurringId,
      reference_month: month,
      due_date: dueDateStr,
      description: commitment.description,
      amount,
      responsible: commitment.responsible,
      status: 'paid',
      paid_on: todayStr,
      paid_amount: amount,
    });
  }

  revalidatePath('/compromissos');
  return { ok: true as const };
}

export async function actionExcluirCompromisso(id: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  await supabase
    .from('recurring_commitments')
    .update({ active: false })
    .eq('id', id)
    .eq('household_id', profile.household_id);

  revalidatePath('/compromissos');
  return { ok: true as const };
}
