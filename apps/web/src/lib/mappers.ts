import type { Database } from '@i2fin/db';
import type { Transaction } from '@i2fin/schema';

type TxRow = Database['public']['Tables']['transactions']['Row'];

export function toTransaction(row: TxRow): Transaction {
  return {
    id: row.id,
    householdId: row.household_id,
    accountId: row.account_id,
    occurredOn: row.occurred_on,
    description: row.description,
    amount: row.amount,
    responsible: row.responsible as Transaction['responsible'],
    categoryId: row.category_id,
    status: row.status as Transaction['status'],
    source: row.source as Transaction['source'],
    fingerprint: row.fingerprint,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTransactions(rows: TxRow[]): Transaction[] {
  return rows.map(toTransaction);
}
