'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function actionRegistrarFaturamento(
  amount: number,
  description: string,
  referenceMonth: string, // "YYYY-MM"
) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const { data: i2Entity } = await supabase
    .from('entities').select('id')
    .eq('household_id', profile.household_id)
    .eq('type', 'business')
    .single();

  const occurredOn = `${referenceMonth}-01`;

  // Upsert: se já existe faturamento do mês, atualiza
  const { data: existing } = await supabase
    .from('income_records')
    .select('id')
    .eq('household_id', profile.household_id)
    .eq('kind', 'faturamento_i2')
    .eq('reference_month', occurredOn)
    .maybeSingle();

  if (existing) {
    await supabase.from('income_records')
      .update({ amount, description })
      .eq('id', existing.id);
  } else {
    await supabase.from('income_records').insert({
      household_id: profile.household_id,
      occurred_on: occurredOn,
      description,
      amount,
      kind: 'faturamento_i2',
      reference_month: occurredOn,
      created_by: user.id,
      entity_id: i2Entity?.id ?? null,
    });
  }

  revalidatePath('/empresa');
  return { ok: true as const };
}

export async function actionExcluirFaturamento(id: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('household_id, role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  await supabase.from('income_records').delete().eq('id', id)
    .eq('household_id', profile.household_id);

  revalidatePath('/empresa');
  return { ok: true as const };
}
