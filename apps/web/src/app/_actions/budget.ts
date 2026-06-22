'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Teto de GASTO NO CARTÃO (parte do Iremar) — semáforo "posso usar o cartão?".
// Default R$ 2.500 (recomendação do diagnóstico: máx ~2.500/ciclo deixa folga real).
const CARD_TETO_COOKIE = 'pf-card-teto';
const DEFAULT_CARD_TETO = 2500;

export async function getBudgetTeto(): Promise<number> {
  const c = await cookies();
  const raw = c.get(CARD_TETO_COOKIE)?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CARD_TETO;
}

export async function setBudgetTeto(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false as const, error: 'Valor inválido' };
  }
  const c = await cookies();
  c.set(CARD_TETO_COOKIE, String(Math.round(value)), {
    path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax',
  });
  revalidatePath('/dashboard');
  return { ok: true as const };
}
