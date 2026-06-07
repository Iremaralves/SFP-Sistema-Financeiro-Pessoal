'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { SCOPE_COOKIE, type ProfileScope } from '@/lib/profile-scope';

export async function setProfileScope(scope: ProfileScope) {
  const c = await cookies();
  c.set(SCOPE_COOKIE, scope, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 ano
    sameSite: 'lax',
  });
  // Revalida páginas principais — todas leem o cookie pra filtrar
  revalidatePath('/dashboard');
  revalidatePath('/lancamentos');
  revalidatePath('/compromissos');
  revalidatePath('/contas');
  revalidatePath('/empresa');
  revalidatePath('/categorizar');
}
