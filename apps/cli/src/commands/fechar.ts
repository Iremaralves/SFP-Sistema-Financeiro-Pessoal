import { calculatePersonalCashflow, calculateSettlement } from '@i2fin/core';
import {
  getActiveRecurringCommitments,
  getIncomeByMonth,
  getSupabaseClient,
  getTransactionsByMonth,
} from '@i2fin/db';
import type { Transaction } from '@i2fin/schema';
import pc from 'picocolors';
import type { Credentials } from '../types.js';

function fmt(n: number): string {
  return `R$ ${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function fmtLine(label: string, value: number, status?: string): string {
  const col = value < 0 ? pc.red : pc.white;
  const statusIcon = status ?? '';
  const padding = ' '.repeat(Math.max(0, 42 - label.length));
  return `  ${label}${padding}${col(fmt(value))} ${statusIcon}`;
}

export async function cmdFechar(month: string, creds: Credentials): Promise<void> {
  const db = getSupabaseClient();
  const { householdId } = creds;

  // Validate month format
  if (!/^\d{4}-\d{2}$/.test(month)) {
    console.error(pc.red('✗ Formato inválido. Use: i2fin fechar 2026-05'));
    process.exit(1);
  }

  const monthLabel = new Date(`${month}-01`).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  console.log(pc.cyan(`\nFechamento ${monthLabel.toUpperCase()}\n`));

  // Fetch data
  const [txRows, commitments, incomeRows] = await Promise.all([
    getTransactionsByMonth(db, householdId, month),
    getActiveRecurringCommitments(db, householdId),
    getIncomeByMonth(db, householdId, month),
  ]);

  const transactions = txRows as Transaction[];

  // Check for unassigned
  const unassigned = transactions.filter((t) => t.responsible === 'unassigned');
  if (unassigned.length > 0) {
    console.log(pc.yellow(`⚠ ${unassigned.length} lançamento(s) ainda sem responsável.`));
    console.log(pc.dim('  Execute i2fin categorizar antes de fechar.\n'));
  }

  const settlement = calculateSettlement(transactions, month);

  // Income breakdown
  const proLabore = incomeRows.filter((r) => r.kind === 'pro_labore').reduce((s, r) => s + r.amount, 0);
  const i2Reimb = incomeRows.filter((r) => r.kind === 'i2_reimbursement').reduce((s, r) => s + r.amount, 0);
  const julianaTransf = incomeRows.filter((r) => r.kind === 'juliana_transfer').reduce((s, r) => s + r.amount, 0);
  const otherIncome = incomeRows.filter((r) => r.kind === 'other').reduce((s, r) => s + r.amount, 0);

  // Fixed commitments total (personal Iremar)
  const fixedTotal = commitments
    .filter((c) => c.responsible === 'iremar' && c.account_id !== (commitments.find((x) => x.responsible === 'i2')?.account_id))
    .reduce((s, c) => s + c.amount, 0);

  const cashflow = calculatePersonalCashflow({
    settlement,
    proLabore,
    i2Reimbursements: i2Reimb,
    julianaPaid: julianaTransf,
    otherIncome,
    fixedCommitmentsTotal: fixedTotal,
  });

  // ─── Bloco A: Divisão da fatura ──────────────────────────────────────────
  console.log(pc.bold(pc.blue('═══ A) DIVISÃO DA FATURA DO CARTÃO ═══')));
  console.log(fmtLine('Total da fatura', settlement.totalFatura));
  console.log('');
  console.log(fmtLine('Parte Iremar', settlement.iremarPart));
  console.log(fmtLine('Parte Juliana', settlement.julianaPart));
  console.log(fmtLine('Parte i2 Soluções', settlement.i2Part));
  console.log(fmtLine('Total casal (antes de dividir)', settlement.casalTotal));
  console.log('');
  console.log(pc.dim('  Juliana deve transferir: ' + pc.bold(fmt(settlement.julianaPart))));

  // ─── Bloco B: i2 Desembolsos ──────────────────────────────────────────────
  const i2Commitments = commitments.filter((c) => c.responsible === 'i2');
  const i2CommitmentsTotal = i2Commitments.reduce((s, c) => s + c.amount, 0);

  console.log('');
  console.log(pc.bold(pc.magenta('═══ B) i2 SOLUÇÕES — DESEMBOLSOS ═══')));
  for (const c of i2Commitments) {
    console.log(fmtLine(c.description, c.amount, '⏳'));
  }
  console.log(fmtLine('Fatura cartão (parte i2)', settlement.i2Part, '⏳'));
  console.log('');
  console.log(fmtLine('TOTAL i2', i2CommitmentsTotal + settlement.i2Part));

  // ─── Bloco C: Fluxo pessoal Iremar ───────────────────────────────────────
  console.log('');
  console.log(pc.bold(pc.green('═══ C) IREMAR — FLUXO PESSOAL ═══')));
  console.log(pc.dim('  ENTRADAS:'));
  if (proLabore > 0) console.log(fmtLine('Pró-labore i2', proLabore, '✅'));
  if (i2Reimb > 0) console.log(fmtLine('Reembolsos i2', i2Reimb, '✅'));
  if (julianaTransf > 0) console.log(fmtLine('Recebido de Juliana', julianaTransf, '✅'));
  if (otherIncome > 0) console.log(fmtLine('Outras receitas', otherIncome, '✅'));
  console.log(fmtLine('TOTAL ENTRADAS', cashflow.totalIn));
  console.log('');
  console.log(pc.dim('  SAÍDAS:'));
  console.log(fmtLine('Fatura (parte Iremar)', settlement.iremarPart));
  console.log(fmtLine('Fatura (parte Juliana)', settlement.julianaPart, pc.dim('Juliana reembolsa')));
  console.log(fmtLine('Fatura (parte i2)', settlement.i2Part, pc.dim('i2 reembolsa')));
  if (fixedTotal > 0) console.log(fmtLine('Compromissos pessoais fixos', fixedTotal));
  console.log(fmtLine('TOTAL SAÍDAS', cashflow.totalOut));
  console.log('');

  const balance = cashflow.balance;
  const balanceColor = balance >= 0 ? pc.green : pc.red;
  const balanceIcon = balance >= 0 ? '✅' : '⚠️';
  console.log(`  ${pc.bold('SALDO DO MÊS')}${' '.repeat(28)}${balanceColor(pc.bold(fmt(balance)))} ${balanceIcon}`);
  console.log('');

  if (unassigned.length === 0) {
    console.log(pc.green('✓ Todos os lançamentos categorizados. Pronto para fechar.'));
    console.log(pc.dim('  Para registrar o fechamento: i2fin fechar ' + month + ' --confirmar'));
  } else {
    console.log(pc.yellow(`⚠ Feche após categorizar os ${unassigned.length} pendentes.`));
  }
}
