/**
 * Normalize a transaction title for fingerprinting and matching.
 * Deterministic — same input always produces same output.
 */
export function normalize(title: string): string {
  let s = title.toLowerCase().trim();

  // IOF normalization FIRST — before any char removal (Pattern 1)
  if (/iof de compra internacional/.test(s)) return 'iof:intl:pos';
  if (/iof de volta de/.test(s)) return 'iof:intl:neg';
  // "iof de "X"" (renamed IOF after settlement) — strip quotes then check
  const noQuotes = s.replace(/['"]/g, '');
  if (/^iof de /.test(noQuotes)) return 'iof:intl:pos';

  // Premmia variants — BEFORE removing * to catch "Premmia*Br"
  s = s.replace(/premmia\*?br\b/g, 'premmia');
  s = s.replace(/petrobras\s+premmia/, 'premmia');

  // Remove special chars that Nubank injects
  s = s.replace(/[*"']/g, '');

  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ').trim();

  // Remove trailing numeric branch codes (e.g. "Atacadao 047 As" → "atacadao")
  s = s.replace(/\s+\d{3,}\s*\w{0,3}$/, '');

  return s.trim();
}

/**
 * Extract a clean merchant name from a normalized title.
 * Used for creating categorization rules from manual assignments.
 */
export function extractMerchantName(normalized: string): string {
  // For IOF, keep the group key
  if (normalized.startsWith('iof:')) return 'iof';

  // Take first two meaningful words
  const words = normalized.split(' ').slice(0, 2);
  return words.join(' ');
}
