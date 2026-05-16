import { describe, expect, it } from 'vitest';
import { parseNubankCsv } from '../parser.js';

const FIXTURE_CSV = `date,title,amount
2026-05-12,Google One,14.99
2026-05-12,Propark,12.00
2026-05-11,Machadus Paes e Pizza,149.71
2026-05-07,Klingai.Com,517.99
2026-05-07,"IOF de ""Klingai.Com""",18.12
2026-05-06,"IOF de volta de Klingai.Com",-18.12
2026-05-02,Claude.Ai Subscription,1143.18`;

describe('parseNubankCsv', () => {
  it('parses all rows from fixture', () => {
    const result = parseNubankCsv(FIXTURE_CSV);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(7);
  });

  it('correctly parses quoted fields with escaped quotes', () => {
    const result = parseNubankCsv(FIXTURE_CSV);
    const iof = result.rows.find((r) => r.title.startsWith('IOF de'));
    expect(iof?.title).toBe('IOF de "Klingai.Com"');
  });

  it('correctly parses negative amounts (refunds)', () => {
    const result = parseNubankCsv(FIXTURE_CSV);
    const refund = result.rows.find((r) => r.amount < 0);
    expect(refund?.amount).toBe(-18.12);
  });

  it('generates sha256', () => {
    const result = parseNubankCsv(FIXTURE_CSV);
    expect(result.sha256).toHaveLength(64);
  });

  it('returns same sha256 for same content', () => {
    const r1 = parseNubankCsv(FIXTURE_CSV);
    const r2 = parseNubankCsv(FIXTURE_CSV);
    expect(r1.sha256).toBe(r2.sha256);
  });

  it('returns error for empty file', () => {
    const result = parseNubankCsv('');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.rows).toHaveLength(0);
  });

  it('returns error for wrong header', () => {
    const result = parseNubankCsv('col1,col2,col3\n1,2,3');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.error).toContain('Invalid header');
  });

  it('parses the real Nubank CSV fixture', () => {
    const real = `date,title,amount
2026-04-26,Atacadao 047 As,59.88
2026-04-26,Cinemark Brasil S.A Ec,105.60
2026-04-25,Premmia*Br,255.61
2026-04-23,IOF de compra internacional,1.76
2026-04-22,IOF de volta de Klingai.Com,-1.76`;
    const result = parseNubankCsv(real);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(5);
    expect(result.rows[2]?.title).toBe('Premmia*Br');
  });
});
