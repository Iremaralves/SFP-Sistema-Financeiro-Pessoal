/**
 * Profile scope — segrega visualização entre Pessoal (PF), Empresa (PJ) e Tudo.
 *
 * Estado persiste em cookie `profile-scope` (server-readable, sobrevive a sessões).
 * Iremar (admin) pode trocar entre os 3. Juliana (operator) trava em 'pessoal'.
 */
import { cookies } from 'next/headers';

export type ProfileScope = 'pessoal' | 'empresa' | 'tudo';

export const SCOPE_COOKIE = 'profile-scope';

/** Lê o escopo atual do cookie (server-side). Default: 'tudo'. */
export async function getProfileScope(): Promise<ProfileScope> {
  const c = await cookies();
  const raw = c.get(SCOPE_COOKIE)?.value;
  if (raw === 'pessoal' || raw === 'empresa' || raw === 'tudo') return raw;
  return 'tudo';
}

/**
 * Para role=operator (Juliana), força escopo 'pessoal' — ela não vê empresa.
 * Para admin, retorna o que estiver no cookie.
 */
export async function getEffectiveScope(role: 'admin' | 'operator'): Promise<ProfileScope> {
  if (role === 'operator') return 'pessoal';
  return getProfileScope();
}

/**
 * Lista de account.kind que pertencem a cada escopo.
 * - Pessoal: cartão, conta-corrente PF, poupança/investimentos PF
 * - Empresa: conta-corrente PJ, investimentos PJ
 */
export const KINDS_PESSOAL = ['credit_card', 'checking', 'savings', 'investment'] as const;
export const KINDS_EMPRESA = ['company'] as const;

export function kindsForScope(scope: ProfileScope): readonly string[] {
  if (scope === 'pessoal') return KINDS_PESSOAL;
  if (scope === 'empresa') return KINDS_EMPRESA;
  return [...KINDS_PESSOAL, ...KINDS_EMPRESA];
}

/** Label legível pra UI */
export function scopeLabel(scope: ProfileScope): string {
  if (scope === 'pessoal') return 'Pessoal';
  if (scope === 'empresa') return 'Empresa';
  return 'Tudo';
}

/** Emoji do escopo */
export function scopeEmoji(scope: ProfileScope): string {
  if (scope === 'pessoal') return '👨‍👩‍👧';
  if (scope === 'empresa') return '🏢';
  return '🌐';
}
