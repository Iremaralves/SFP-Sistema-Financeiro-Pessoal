import type { MonthlySettlement, Transaction } from '@i2fin/schema';

/**
 * Calculate the monthly settlement split from a list of transactions.
 *
 * Rules:
 *   iremar  → 100% Iremar
 *   juliana → 100% Juliana
 *   casal   → 50% Iremar + 50% Juliana (each pays their own half)
 *   i2      → empresa (excluded from personal calculation)
 *
 * No "Mesada" — each person pays their own share directly.
 */
export function calculateSettlement(
  transactions: Transaction[],
  referenceMonth: string,
  julianaCreditCarried = 0,
  iremarCreditCarried = 0,
): MonthlySettlement {
  const month = referenceMonth.slice(0, 7); // "2026-05"

  const inMonth = transactions.filter((t) => t.occurredOn.startsWith(month));

  let iremarTotal = 0;
  let julianaTotal = 0;
  let casalTotal = 0;
  let i2Total = 0;

  for (const t of inMonth) {
    const amt = Math.abs(t.amount); // amounts are positive = expense
    switch (t.responsible) {
      case 'iremar': iremarTotal += amt; break;
      case 'juliana': julianaTotal += amt; break;
      case 'casal': casalTotal += amt; break;
      case 'i2': i2Total += amt; break;
    }
  }

  const casalHalf = casalTotal / 2;

  // What each person owes on the credit card
  const iremarPart = round(iremarTotal + casalHalf);
  const julianaPart = round(julianaTotal + casalHalf);
  const totalFatura = round(iremarPart + julianaPart + i2Total);

  return {
    referenceMonth: `${referenceMonth.slice(0, 7)}-01`,
    julianaPart,
    iremarPart,
    i2Part: round(i2Total),
    casalTotal: round(casalTotal),
    totalFatura,
    julianaCreditCarried: round(julianaCreditCarried),
    iremarCreditCarried: round(iremarCreditCarried),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate Iremar's personal monthly cashflow.
 * Shows full financial picture: income vs expenses.
 */
export function calculatePersonalCashflow(params: {
  settlement: MonthlySettlement;
  proLabore: number;
  i2Reimbursements: number;
  julianaPaid: number;
  otherIncome: number;
  fixedCommitmentsTotal: number;
}) {
  const {
    settlement,
    proLabore,
    i2Reimbursements,
    julianaPaid,
    otherIncome,
    fixedCommitmentsTotal,
  } = params;

  const totalIn = round(proLabore + i2Reimbursements + julianaPaid + otherIncome);
  const totalOut = round(
    settlement.iremarPart +     // Iremar's credit card share
    settlement.julianaPart +    // Iremar pays the full card then Juliana reimburses
    settlement.i2Part +         // i2 expenses (paid by Iremar, reimbursed by i2)
    fixedCommitmentsTotal,      // school, condo, IPTU, etc.
  );

  return {
    referenceMonth: settlement.referenceMonth,
    proLabore,
    i2Reimbursements,
    julianaPaid,
    otherIncome,
    totalIn,
    faturaIremar: settlement.iremarPart,
    fixedCommitments: fixedCommitmentsTotal,
    totalOut,
    balance: round(totalIn - totalOut),
  };
}
