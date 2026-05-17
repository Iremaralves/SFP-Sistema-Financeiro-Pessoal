'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function registrarReceita(formData: FormData) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') throw new Error('Sem permissão');

  const kind = formData.get('kind') as string;
  const valor = parseFloat(formData.get('valor') as string);
  const descricao = formData.get('descricao') as string;
  const mes = formData.get('mes') as string; // YYYY-MM

  if (!kind || isNaN(valor) || valor <= 0 || !mes) throw new Error('Dados inválidos');

  const today = new Date().toISOString().split('T')[0]!;

  await supabase.from('income_records').insert({
    household_id: profile.household_id,
    occurred_on: today,
    description: descricao || kind,
    amount: valor,
    kind,
    reference_month: `${mes}-01`,
    created_by: user.id,
  });

  revalidatePath('/mes');
}

export async function excluirReceita(id: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') throw new Error('Sem permissão');

  await supabase.from('income_records').delete().eq('id', id);
  revalidatePath('/mes');
}
