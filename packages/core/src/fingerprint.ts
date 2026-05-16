import { normalize } from './normalize.js';

/**
 * Deterministic fingerprint for deduplication.
 * Same transaction from different imports → same fingerprint → INSERT ignored.
 *
 * Format: {occurredOn}|{normalizedTitle}|{amount}|{accountId}
 * Hash: SHA-256 of that string (hex, first 40 chars)
 */
export async function fingerprint(
  occurredOn: string,
  title: string,
  amount: number,
  accountId: string,
): Promise<string> {
  const normalized = normalize(title);
  // Round to 2 decimal places to avoid float drift
  const amountStr = amount.toFixed(2);
  const raw = `${occurredOn}|${normalized}|${amountStr}|${accountId}`;

  if (typeof globalThis.crypto !== 'undefined') {
    const buf = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(raw),
    );
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex.slice(0, 40);
  }

  // Node.js fallback (no Web Crypto) — webpackIgnore: webpack never bundles this branch
  const { createHash } = await import(/* webpackIgnore: true */ 'node:crypto');
  return createHash('sha256').update(raw).digest('hex').slice(0, 40);
}

/** Synchronous version for testing / Bun (which has sync crypto) */
export function fingerprintSync(
  occurredOn: string,
  title: string,
  amount: number,
  accountId: string,
): string {
  const normalized = normalize(title);
  const amountStr = amount.toFixed(2);
  const raw = `${occurredOn}|${normalized}|${amountStr}|${accountId}`;

  // Use Node.js crypto (available in Bun too)
  // Dynamic import not available synchronously, use a simple deterministic hash
  // for tests only. Production always uses the async version.
  return deterministicHash(raw).slice(0, 40);
}

function deterministicHash(input: string): string {
  // FNV-1a 64-bit (hex) — fast, collision-resistant enough for dedup
  let h = BigInt('14695981039346656037');
  const fnvPrime = BigInt('1099511628211');
  const mod = BigInt('18446744073709551616'); // 2^64

  for (let i = 0; i < input.length; i++) {
    h = (h ^ BigInt(input.charCodeAt(i))) * fnvPrime % mod;
  }

  return h.toString(16).padStart(16, '0').repeat(3).slice(0, 40);
}
