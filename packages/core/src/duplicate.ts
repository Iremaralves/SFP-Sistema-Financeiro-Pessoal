import type { DuplicateCandidate, NubankCsvRow } from '@i2fin/schema';
import { normalize } from './normalize.js';

/**
 * Detect probable duplicates within a set of CSV rows.
 * Returns pairs of (rowA, rowB) with reason and confidence.
 *
 * Three patterns (from real conciliation 12/05/2026):
 *   Pattern 1 — IOF rename:    handled entirely in normalize() → same fingerprint
 *   Pattern 2 — Date shift:    same title+amount, date differs ≤2 days
 *   Pattern 3 — FX difference: same title, date ≤2 days, |amount| < max(2.00, 1%)
 */
export function detectDuplicates(rows: NubankCsvRow[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  const used = new Set<number>();

  for (let i = 0; i < rows.length; i++) {
    if (used.has(i)) continue;
    const a = rows[i];
    if (!a) continue;

    for (let j = i + 1; j < rows.length; j++) {
      if (used.has(j)) continue;
      const b = rows[j];
      if (!b) continue;

      const candidate = checkPair(a, b);
      if (candidate) {
        candidates.push(candidate);
        used.add(i);
        used.add(j);
        break;
      }
    }
  }

  return candidates;
}

function daysDiff(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const bb = new Date(dateB).getTime();
  return Math.abs((a - bb) / 86_400_000);
}

function checkPair(a: NubankCsvRow, b: NubankCsvRow): DuplicateCandidate | null {
  const normA = normalize(a.title);
  const normB = normalize(b.title);
  const days = daysDiff(a.date, b.date);

  // Pattern 1: IOF rename — same iof: key AND same amount (different IOFs on same card have diff amounts)
  if (normA.startsWith('iof:') && normB.startsWith('iof:') && normA === normB && days <= 5) {
    if (Math.abs(a.amount - b.amount) < 0.001) {
      return { rowA: a, rowB: b, reason: 'iof_rename', confidence: 1.0 };
    }
  }

  // Only compare close dates for patterns 2 & 3
  if (days > 2) return null;

  // Pattern 2: Date shift — exact same normalized title and amount
  if (normA === normB && Math.abs(a.amount - b.amount) < 0.001) {
    return { rowA: a, rowB: b, reason: 'date_shift', confidence: 0.95 };
  }

  // Pattern 3: FX difference — same title, amount differs by small %
  if (normA === normB) {
    const larger = Math.max(Math.abs(a.amount), Math.abs(b.amount));
    const diff = Math.abs(a.amount - b.amount);
    const threshold = Math.max(2.0, larger * 0.01);
    if (diff <= threshold && diff > 0.001) {
      return { rowA: a, rowB: b, reason: 'fx_diff', confidence: 0.85 };
    }
  }

  return null;
}
