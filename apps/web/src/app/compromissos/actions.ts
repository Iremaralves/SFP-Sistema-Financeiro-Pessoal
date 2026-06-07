'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function actionDarBaixa(
  recurringId: string,
  amount: number,
  referenceMonth: string,  // ex: "2025-05"
  opts?: { paidOn?: string; paidAmount?: number },
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  const todayStr = opts?.paidOn && /^\d{4}-\d{2}-\d{2}$/.test(opts.paidOn)
    ? opts.paidOn
    : new Date().toISOString().slice(0, 10);
  const finalAmount = typeof opts?.paidAmount === 'number' && !Number.isNaN(opts.paidAmount)
    ? opts.paidAmount
    : amount;

  // reference_month no banco é tipo DATE — precisa de dia (usa dia 01)
  const referenceMonthDate = `${referenceMonth}-01`;

  // Buscar info do compromisso
  const { data: commitment, error: commitErr } = await supabase
    .from('recurring_commitments')
    .select('description, responsible, due_day')
    .eq('id', recurringId)
    .eq('household_id', profile.household_id)
    .single();

  if (commitErr || !commitment) {
    return { ok: false as const, error: 'Compromisso não encontrado.' };
  }

  const dueDateStr = `${referenceMonth}-${String(commitment.due_day).padStart(2, '0')}`;

  // Verificar se já existe entrada para este mês
  const { data: existing } = await supabase
    .from('monthly_obligations')
    .select('id, status')
    .eq('household_id', profile.household_id)
    .eq('recurring_id', recurringId)
    .eq('reference_month', referenceMonthDate)
    .maybeSingle();

  let dbError;

  if (existing) {
    const { error } = await supabase
      .from('monthly_obligations')
      .update({ status: 'paid', paid_on: todayStr, paid_amount: finalAmount })
      .eq('id', existing.id);
    dbError = error;
  } else {
    const { error } = await supabase.from('monthly_obligations').insert({
      household_id: profile.household_id,
      recurring_id: recurringId,
      reference_month: referenceMonthDate,
      due_date: dueDateStr,
      description: commitment.description,
      amount,
      responsible: commitment.responsible,
      status: 'paid',
      paid_on: todayStr,
      paid_amount: finalAmount,
    });
    dbError = error;
  }

  if (dbError) {
    return { ok: false as const, error: dbError.message };
  }

  revalidatePath('/compromissos');
  revalidatePath('/dashboard');
  revalidatePath('/contas');
  revalidatePath('/acerto');
  return { ok: true as const };
}

export async function actionDesfazerBaixa(
  recurringId: string,
  referenceMonth: string,
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id, role').eq('id', user.id).single();
  if (!profile) redirect('/login');
  // Operator (Juliana) também pode desfazer baixa — ela paga 3 contas

  const { error: desfazerErr } = await supabase
    .from('monthly_obligations')
    .update({ status: 'pending', paid_on: null, paid_amount: null })
    .eq('household_id', profile.household_id)
    .eq('recurring_id', recurringId)
    .eq('reference_month', `${referenceMonth}-01`);

  if (desfazerErr) {
    return { ok: false as const, error: desfazerErr.message };
  }

  revalidatePath('/compromissos');
  revalidatePath('/dashboard');
  revalidatePath('/contas');
  revalidatePath('/acerto');
  return { ok: true as const };
}

export async function actionExcluirCompromisso(id: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id, role').eq('id', user.id).single();
  if (!profile) redirect('/login');
  if (profile.role !== 'admin') return { ok: false as const, error: 'Apenas o administrador pode excluir compromissos.' };

  await supabase
    .from('recurring_commitments')
    .update({ active: false })
    .eq('id', id)
    .eq('household_id', profile.household_id);

  revalidatePath('/compromissos');
  revalidatePath('/dashboard');
  revalidatePath('/contas');
  revalidatePath('/acerto');
  return { ok: true as const };
}
