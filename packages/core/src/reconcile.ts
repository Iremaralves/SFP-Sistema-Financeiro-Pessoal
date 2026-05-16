import type { NubankCsvRow, ReconciliationReport } from '@i2fin/schema';
import type { Transaction } from '@i2fin/schema';
import { fingerprint } from './fingerprint.js';

interface ReconcileParams {
  csvRows: NubankCsvRow[];
  dbTransactions: Transaction[];
  accountId: string;
}

/**
 * Reconcile a CSV fatura against DB transactions.
 * Returns a report of: matched, only in DB, only in CSV.
 */
export async function reconcile({
  csvRows,
  dbTransactions,
  accountId,
}: ReconcileParams): Promise<ReconciliationReport> {
  // Build DB index by fingerprint
  const dbByFingerprint = new Map<string, Transaction>();
  for (const t of dbTransactions) {
    dbByFingerprint.set(t.fingerprint, t);
  }

  // Build CSV fingerprints
  const csvFingerprints = await Promise.all(
    csvRows.map(async (row) => ({
      row,
      fp: await fingerprint(row.date, row.title, row.amount, accountId),
    })),
  );

  const matched = [];
  const onlyInCsv = [];
  const matchedFingerprints = new Set<string>();

  for (const { row, fp } of csvFingerprints) {
    if (dbByFingerprint.has(fp)) {
      matched.push({
        occurredOn: row.date,
        description: row.title,
        amount: row.amount,
        status: 'matched' as const,
      });
      matchedFingerprints.add(fp);
    } else {
      onlyInCsv.push({
        occurredOn: row.date,
        description: row.title,
        amount: row.amount,
        status: 'only_in_csv' as const,
      });
    }
  }

  const onlyInDb = [];
  for (const [fp, t] of dbByFingerprint) {
    if (!matchedFingerprints.has(fp)) {
      onlyInDb.push({
        occurredOn: t.occurredOn,
        description: t.description,
        amount: t.amount,
        status: 'only_in_db' as const,
      });
    }
  }

  const totalCsv = csvRows.reduce((s, r) => s + r.amount, 0);
  const totalDb = dbTransactions.reduce((s, t) => s + t.amount, 0);

  return {
    matched,
    onlyInDb,
    onlyInCsv,
    totalCsv: Math.round(totalCsv * 100) / 100,
    totalDb: Math.round(totalDb * 100) / 100,
    difference: Math.round((totalCsv - totalDb) * 100) / 100,
  };
}
