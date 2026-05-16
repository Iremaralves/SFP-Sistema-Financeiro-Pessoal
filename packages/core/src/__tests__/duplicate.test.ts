import { describe, expect, it } from 'vitest';
import { detectDuplicates } from '../duplicate.js';
import type { NubankCsvRow } from '@i2fin/schema';

describe('detectDuplicates', () => {
  // ─── Pattern 1: IOF rename ─────────────────────────────────────────────────
  describe('[Pattern 1] IOF rename', () => {
    it('detects IOF de compra internacional vs IOF de "X"', () => {
      const rows: NubankCsvRow[] = [
        { date: '2026-04-21', title: 'IOF de compra internacional', amount: 6.52 },
        { date: '2026-04-21', title: 'IOF de "Fc* Freepik Premium+ M"', amount: 6.52 },
      ];
      const dupes = detectDuplicates(rows);
      expect(dupes).toHaveLength(1);
      expect(dupes[0]?.reason).toBe('iof_rename');
      expect(dupes[0]?.confidence).toBe(1.0);
    });

    it('detects IOF de volta (negative refund) as separate — no false positive', () => {
      const rows: NubankCsvRow[] = [
        { date: '2026-04-23', title: 'IOF de compra internacional', amount: 1.76 },
        { date: '2026-04-22', title: 'IOF de volta de Klingai.Com', amount: -1.76 },
      ];
      // volta = neg, compra = pos — different keys — NOT a duplicate
      const dupes = detectDuplicates(rows);
      expect(dupes).toHaveLength(0);
    });

    it('detects real CSV data from Abr 2026 — Klingai IOF', () => {
      const rows: NubankCsvRow[] = [
        { date: '2026-04-21', title: 'IOF de compra internacional', amount: 6.52 },
        { date: '2026-04-20', title: 'IOF de volta de Fc* Freepik Premium+ M', amount: -6.52 },
        { date: '2026-04-23', title: 'IOF de compra internacional', amount: 1.76 },
        { date: '2026-04-22', title: 'IOF de volta de Klingai.Com', amount: -1.76 },
      ];
      // None of these are duplicates — each is a distinct positive charge or refund
      const dupes = detectDuplicates(rows);
      expect(dupes).toHaveLength(0);
    });
  });

  // ─── Pattern 2: Date shift ─────────────────────────────────────────────────
  describe('[Pattern 2] Date shift (authorization vs settlement)', () => {
    it('detects same title+amount with date ≤2 days apart', () => {
      const rows: NubankCsvRow[] = [
        { date: '2026-05-06', title: 'Petrobras Premmia', amount: 263.04 },
        { date: '2026-05-07', title: 'Petrobras Premmia', amount: 263.04 },
      ];
      const dupes = detectDuplicates(rows);
      expect(dupes).toHaveLength(1);
      expect(dupes[0]?.reason).toBe('date_shift');
      expect(dupes[0]?.confidence).toBeGreaterThan(0.9);
    });

    it('does NOT flag same merchant on different weeks', () => {
      const rows: NubankCsvRow[] = [
        { date: '2026-05-01', title: 'Petrobras Premmia', amount: 263.04 },
        { date: '2026-05-15', title: 'Petrobras Premmia', amount: 263.04 },
      ];
      const dupes = detectDuplicates(rows);
      expect(dupes).toHaveLength(0);
    });
  });

  // ─── Pattern 3: FX difference ─────────────────────────────────────────────
  describe('[Pattern 3] FX currency difference', () => {
    it('detects same merchant with tiny amount diff ≤ 1%', () => {
      const rows: NubankCsvRow[] = [
        { date: '2026-05-06', title: 'Klingai.Com', amount: 519.97 },
        { date: '2026-05-07', title: 'Klingai.Com', amount: 517.99 },
      ];
      const dupes = detectDuplicates(rows);
      expect(dupes).toHaveLength(1);
      expect(dupes[0]?.reason).toBe('fx_diff');
      expect(dupes[0]?.confidence).toBeGreaterThan(0.8);
    });

    it('does NOT flag purchases of different amounts from same merchant', () => {
      const rows: NubankCsvRow[] = [
        { date: '2026-05-06', title: 'Klingai.Com', amount: 50.36 },
        { date: '2026-05-07', title: 'Klingai.Com', amount: 519.97 },
      ];
      const dupes = detectDuplicates(rows);
      expect(dupes).toHaveLength(0);
    });
  });

  it('handles empty array', () => {
    expect(detectDuplicates([])).toHaveLength(0);
  });

  it('handles single row', () => {
    const rows: NubankCsvRow[] = [
      { date: '2026-05-12', title: 'Google One', amount: 14.99 },
    ];
    expect(detectDuplicates(rows)).toHaveLength(0);
  });
});
