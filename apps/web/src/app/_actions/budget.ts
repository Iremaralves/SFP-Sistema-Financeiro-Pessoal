'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BUDGET_COOKIE = 'pf-budget-teto';
const DEFAULT_TETO = 8000;

/** Lê o teto do orçamento pessoal (cookie). Default R$ 8.000. */
export async function getBudgetTeto(): Promise<number> {
  const c = await cookies();
  const raw = c.get(BUDGET_COOKIE)?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TETO;
}

/** Define o teto do orçamento pessoal. */
export async function setBudgetTeto(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false as const, error: 'Valor inválido' };
  }
  const c = await cookies();
  c.set(BUDGET_COOKIE, String(Math.round(value)), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  revalidatePath('/dashboard');
  return { ok: true as const };
}
