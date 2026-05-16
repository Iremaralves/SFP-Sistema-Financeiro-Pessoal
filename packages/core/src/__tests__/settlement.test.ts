import { describe, expect, it } from 'vitest';
import { calculateSettlement } from '../settlement.js';
import type { Transaction } from '@i2fin/schema';

function tx(overrides: Partial<Transaction> & Pick<Transaction, 'responsible' | 'amount'>): Transaction {
  return {
    id: crypto.randomUUID(),
    householdId: 'hh-1',
    accountId: 'acc-1',
    occurredOn: '2026-05-12',
    description: 'Test',
    status: 'pending',
    source: 'csv_import',
    fingerprint: 'fp-test',
    categoryId: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('calculateSettlement', () => {
  it('correctly splits casal 50/50 between Iremar and Juliana', () => {
    const transactions: Transaction[] = [
      tx({ responsible: 'casal', amount: 200 }),
    ];
    const result = calculateSettlement(transactions, '2026-05');
    expect(result.iremarPart).toBe(100);
    expect(result.julianaPart).toBe(100);
    expect(result.i2Part).toBe(0);
  });

  it('assigns iremar expenses 100% to Iremar', () => {
    const transactions: Transaction[] = [
      tx({ responsible: 'iremar', amount: 500 }),
    ];
    const result = calculateSettlement(transactions, '2026-05');
    expect(result.iremarPart).toBe(500);
    expect(result.julianaPart).toBe(0);
  });

  it('assigns juliana expenses 100% to Juliana', () => {
    const transactions: Transaction[] = [
      tx({ responsible: 'juliana', amount: 300 }),
    ];
    const result = calculateSettlement(transactions, '2026-05');
    expect(result.julianaPart).toBe(300);
    expect(result.iremarPart).toBe(0);
  });

  it('excludes i2 expenses from personal totals', () => {
    const transactions: Transaction[] = [
      tx({ responsible: 'i2', amount: 1000 }),
      tx({ responsible: 'iremar', amount: 200 }),
    ];
    const result = calculateSettlement(transactions, '2026-05');
    expect(result.i2Part).toBe(1000);
    expect(result.iremarPart).toBe(200);
    expect(result.julianaPart).toBe(0);
    expect(result.totalFatura).toBe(1200);
  });

  it('calculates total fatura correctly', () => {
    const transactions: Transaction[] = [
      tx({ responsible: 'iremar', amount: 500 }),
      tx({ responsible: 'juliana', amount: 300 }),
      tx({ responsible: 'casal', amount: 200 }),
      tx({ responsible: 'i2', amount: 100 }),
    ];
    // iremar: 500 + 100 = 600
    // juliana: 300 + 100 = 400
    // i2: 100
    // total: 1100
    const result = calculateSettlement(transactions, '2026-05');
    expect(result.iremarPart).toBe(600);
    expect(result.julianaPart).toBe(400);
    expect(result.i2Part).toBe(100);
    expect(result.totalFatura).toBe(1100);
  });

  it('filters to correct month only', () => {
    const transactions: Transaction[] = [
      tx({ responsible: 'iremar', amount: 500, occurredOn: '2026-05-15' }),
      tx({ responsible: 'iremar', amount: 999, occurredOn: '2026-04-15' }), // different month
    ];
    const result = calculateSettlement(transactions, '2026-05');
    expect(result.iremarPart).toBe(500);
  });

  it('carries Juliana credit correctly', () => {
    const transactions: Transaction[] = [
      tx({ responsible: 'juliana', amount: 400 }),
    ];
    const result = calculateSettlement(transactions, '2026-05', 50, 0);
    expect(result.julianaCreditCarried).toBe(50);
    expect(result.julianaPart).toBe(400); // still 400 — credit is separate
  });
});
