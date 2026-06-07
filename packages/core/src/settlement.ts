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
 * Mesma lógica de calculateSettlement, mas SEM filtrar por mês.
 * Use quando as transactions JÁ vêm filtradas pelo ciclo da fatura do cartão
 * (que não coincide com o mês calendário — ex: 13/05 a 12/06).
 */
export function calculateInvoiceSettlement(
  transactions: Transaction[],
  referenceMonth: string,
): MonthlySettlement {
  let iremarTotal = 0;
  let julianaTotal = 0;
  let casalTotal = 0;
  let i2Total = 0;

  for (const t of transactions) {
    // Apenas despesas (amount negativo). Pagamentos/quitações (amount positivo) NÃO somam na fatura.
    if (t.amount >= 0) continue;
    const amt = Math.abs(t.amount);
    switch (t.responsible) {
      case 'iremar': iremarTotal += amt; break;
      case 'juliana': julianaTotal += amt; break;
      case 'casal': casalTotal += amt; break;
      case 'i2': i2Total += amt; break;
    }
  }

  const casalHalf = casalTotal / 2;
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
    julianaCreditCarried: 0,
    iremarCreditCarried: 0,
  };
}

/**
 * Retorna o ciclo da fatura ATUAL (aberta) do cartão.
 * Se hoje > closingDay do mês, próximo fechamento é mês+1.
 * Se hoje <= closingDay, próximo fechamento é este mês.
 * Período da fatura: (último fechamento + 1) → próximo fechamento
 *
 * Exemplo: hoje 19/05, closingDay 13:
 *   - 19 > 13 → próximo fechamento 13/06
 *   - último fechamento foi 13/05
 *   - ciclo: 13/05 (inclusivo) → 12/06 (inclusivo)
 *   Obs: o Nubank inclui o dia 13 no ciclo seguinte (lançamentos do 13 entram na nova fatura)
 */
export function currentInvoiceCycle(today: Date, closingDay: number): {
  start: string; // YYYY-MM-DD (inclusivo)
  end:   string; // YYYY-MM-DD (inclusivo)
  closingDate: string; // dia que fecha
  referenceMonth: string; // mês de referência da fatura (YYYY-MM)
} {
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-indexed
  const d = today.getDate();

  let closingY: number, closingM: number; // próximo fechamento (mês 0-indexed)
  if (d > closingDay) {
    closingY = y;
    closingM = m + 1;
    if (closingM > 11) { closingM = 0; closingY = y + 1; }
  } else {
    closingY = y;
    closingM = m;
  }

  // Início do ciclo: closingDay do mês anterior ao fechamento
  let startY = closingY, startM = closingM - 1;
  if (startM < 0) { startM = 11; startY = closingY - 1; }

  const startDate = new Date(startY, startM, closingDay);
  const closingDate = new Date(closingY, closingM, closingDay);
  // End é o dia anterior ao próximo fechamento (12/06 se fechamento 13/06)
  const endDate = new Date(closingY, closingM, closingDay - 1);

  const iso = (dt: Date) => dt.toISOString().slice(0, 10);
  const yyyymm = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;

  return {
    start: iso(startDate),
    end: iso(endDate),
    closingDate: iso(closingDate),
    referenceMonth: yyyymm(closingDate),
  };
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
