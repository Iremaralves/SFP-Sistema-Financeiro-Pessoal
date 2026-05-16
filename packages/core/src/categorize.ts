import type { CategorizationRule, Responsible } from '@i2fin/schema';
import { normalize } from './normalize.js';

export interface CategorizationResult {
  responsible: Responsible;
  confidence: number;
  ruleId: string | null;
  autoAssigned: boolean;
}

/**
 * Apply categorization rules to a normalized title.
 * Rules are matched in order of confidence DESC, then hits DESC.
 * Returns 'unassigned' if no rule matches with confidence >= threshold.
 */
export function categorize(
  title: string,
  rules: CategorizationRule[],
  threshold = 0.8,
): CategorizationResult {
  const norm = normalize(title);

  // Sort: highest confidence first, tie-break by hits
  const sorted = [...rules].sort((a, b) =>
    b.confidence - a.confidence || b.hits - a.hits,
  );

  for (const rule of sorted) {
    if (matches(norm, rule.matchPattern)) {
      const autoAssigned = rule.confidence >= threshold;
      return {
        responsible: rule.responsible as Responsible,
        confidence: rule.confidence,
        ruleId: rule.id,
        autoAssigned,
      };
    }
  }

  return { responsible: 'unassigned', confidence: 0, ruleId: null, autoAssigned: false };
}

function matches(normalized: string, pattern: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(normalized);
  } catch {
    // Fallback to substring match if pattern is invalid regex
    return normalized.includes(pattern.toLowerCase());
  }
}

// ─── Seed rules (applied on first import if DB is empty) ─────────────────────

export const SEED_RULES: Omit<CategorizationRule, 'id' | 'householdId'>[] = [
  { matchPattern: 'klingai', responsible: 'i2', confidence: 1.0, hits: 0, categoryId: null },
  { matchPattern: 'freepik', responsible: 'i2', confidence: 1.0, hits: 0, categoryId: null },
  { matchPattern: 'claude\\.ai|claude ai', responsible: 'i2', confidence: 1.0, hits: 0, categoryId: null },
  { matchPattern: 'google workspace|google one', responsible: 'i2', confidence: 1.0, hits: 0, categoryId: null },
  { matchPattern: 'apple\\.com|apple com', responsible: 'i2', confidence: 1.0, hits: 0, categoryId: null },
  { matchPattern: 'digitalocean|github\\.com|vercel|cloudflare', responsible: 'i2', confidence: 1.0, hits: 0, categoryId: null },
  { matchPattern: 'netflix', responsible: 'casal', confidence: 1.0, hits: 0, categoryId: null },
  { matchPattern: 'amazon prime|amazon', responsible: 'casal', confidence: 0.9, hits: 0, categoryId: null },
  { matchPattern: 'iof:intl', responsible: 'i2', confidence: 0.9, hits: 0, categoryId: null },
  { matchPattern: 'premmia', responsible: 'casal', confidence: 0.9, hits: 0, categoryId: null },
  { matchPattern: 'drogasil|farmacia|droga', responsible: 'casal', confidence: 0.7, hits: 0, categoryId: null },
  { matchPattern: 'atacadao', responsible: 'juliana', confidence: 0.8, hits: 0, categoryId: null },
  { matchPattern: 'acto academia|academia', responsible: 'iremar', confidence: 0.7, hits: 0, categoryId: null },
  { matchPattern: 'cinemark|cinema', responsible: 'casal', confidence: 0.8, hits: 0, categoryId: null },
  { matchPattern: 'escola|educacao|colegio', responsible: 'iremar', confidence: 0.9, hits: 0, categoryId: null },
];
