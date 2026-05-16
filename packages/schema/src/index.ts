import { z } from 'zod';

// ─── Core enums ──────────────────────────────────────────────────────────────

export const Responsible = z.enum(['iremar', 'juliana', 'casal', 'i2', 'unassigned']);
export type Responsible = z.infer<typeof Responsible>;

export const AccountKind = z.enum(['credit_card', 'checking', 'company']);
export type AccountKind = z.infer<typeof AccountKind>;

export const TransactionStatus = z.enum(['pending', 'paid', 'reconciled']);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const TransactionSource = z.enum(['csv_import', 'manual_cli', 'manual_pwa']);
export type TransactionSource = z.infer<typeof TransactionSource>;

export const UserRole = z.enum(['admin', 'operator']);
export type UserRole = z.infer<typeof UserRole>;

export const ObligationStatus = z.enum(['pending', 'paid', 'skipped']);
export type ObligationStatus = z.infer<typeof ObligationStatus>;

// ─── Nubank CSV row ───────────────────────────────────────────────────────────

export const NubankCsvRow = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  title: z.string().min(1),
  amount: z.coerce.number(),
});
export type NubankCsvRow = z.infer<typeof NubankCsvRow>;

// ─── Import result ────────────────────────────────────────────────────────────

export const ImportSummary = z.object({
  filename: z.string(),
  sha256: z.string(),
  rowsTotal: z.number(),
  rowsInserted: z.number(),
  rowsSkippedDuplicate: z.number(),
  rowsFlaggedReview: z.number(),
  rowsAutoAssigned: z.number(),
});
export type ImportSummary = z.infer<typeof ImportSummary>;

// ─── Transaction (domain) ─────────────────────────────────────────────────────

export const Transaction = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  accountId: z.string().uuid(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string(),
  amount: z.number(),
  responsible: Responsible,
  categoryId: z.string().uuid().nullable(),
  status: TransactionStatus,
  source: TransactionSource,
  fingerprint: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Transaction = z.infer<typeof Transaction>;

// ─── Categorization rule ──────────────────────────────────────────────────────

export const CategorizationRule = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  matchPattern: z.string(),
  responsible: Responsible,
  categoryId: z.string().uuid().nullable(),
  confidence: z.number().min(0).max(1),
  hits: z.number(),
});
export type CategorizationRule = z.infer<typeof CategorizationRule>;

// ─── Monthly settlement ───────────────────────────────────────────────────────

export const MonthlySettlement = z.object({
  referenceMonth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  julianaPart: z.number(),
  iremarPart: z.number(),
  i2Part: z.number(),
  casalTotal: z.number(),
  totalFatura: z.number(),
  julianaCreditCarried: z.number().default(0),
  iremarCreditCarried: z.number().default(0),
});
export type MonthlySettlement = z.infer<typeof MonthlySettlement>;

// ─── Iremar personal cashflow ─────────────────────────────────────────────────

export const PersonalCashflow = z.object({
  referenceMonth: z.string(),
  proLabore: z.number(),
  i2Reimbursements: z.number(),
  julianaPaid: z.number(),
  otherIncome: z.number(),
  totalIn: z.number(),
  faturaIremar: z.number(),
  fixedCommitments: z.number(),
  totalOut: z.number(),
  balance: z.number(),
});
export type PersonalCashflow = z.infer<typeof PersonalCashflow>;

// ─── Reconciliation report ────────────────────────────────────────────────────

export const ReconciliationMatch = z.object({
  occurredOn: z.string(),
  description: z.string(),
  amount: z.number(),
  status: z.enum(['matched', 'only_in_db', 'only_in_csv', 'probable_duplicate']),
});
export type ReconciliationMatch = z.infer<typeof ReconciliationMatch>;

export const ReconciliationReport = z.object({
  matched: z.array(ReconciliationMatch),
  onlyInDb: z.array(ReconciliationMatch),
  onlyInCsv: z.array(ReconciliationMatch),
  totalCsv: z.number(),
  totalDb: z.number(),
  difference: z.number(),
});
export type ReconciliationReport = z.infer<typeof ReconciliationReport>;

// ─── Duplicate detection ──────────────────────────────────────────────────────

export const DuplicateCandidate = z.object({
  rowA: NubankCsvRow,
  rowB: NubankCsvRow,
  reason: z.enum(['iof_rename', 'date_shift', 'fx_diff']),
  confidence: z.number().min(0).max(1),
});
export type DuplicateCandidate = z.infer<typeof DuplicateCandidate>;
