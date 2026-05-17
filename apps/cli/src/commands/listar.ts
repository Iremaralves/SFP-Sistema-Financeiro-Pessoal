import { getSupabaseClient, getTransactionsByMonth } from '@i2fin/db';
import pc from 'picocolors';
import type { Credentials } from '../types.js';

const RESPONSIBLE_COLORS: Record<string, (s: string) => string> = {
  iremar: pc.blue,
  juliana: pc.magenta,
  casal: pc.cyan,
  i2: pc.yellow,
  unassigned: pc.red,
};

export async function cmdListar(month: string, creds: Credentials, opts: {
  responsible?: string;
  limit?: number;
}): Promise<void> {
  const db = getSupabaseClient();
  const rows = await getTransactionsByMonth(db, creds.householdId, month);

  let filtered = rows;
  if (opts.responsible) {
    filtered = rows.filter((r) => r.responsible === opts.responsible);
  }
  if (opts.limit) {
    filtered = filtered.slice(0, opts.limit);
  }

  if (filtered.length === 0) {
    console.log(pc.dim('Nenhum lançamento encontrado.'));
    return;
  }

  const [ml_y, ml_m] = month.split('-').map(Number);
  const monthLabel = new Date(ml_y, ml_m - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  console.log(pc.cyan(`\nLançamentos — ${monthLabel} (${filtered.length} registros)\n`));

  let total = 0;
  for (const tx of filtered) {
    const color = RESPONSIBLE_COLORS[tx.responsible] ?? pc.white;
    const badge = color(`[${tx.responsible.padEnd(10)}]`);
    const amount = tx.amount >= 0 ? pc.white(`R$ ${tx.amount.toFixed(2)}`) : pc.green(`-R$ ${Math.abs(tx.amount).toFixed(2)}`);
    const desc = tx.description.padEnd(36).slice(0, 36);
    console.log(`  ${tx.occurred_on}  ${badge}  ${desc}  ${amount}`);
    total += tx.amount;
  }

  console.log(pc.dim(`${'─'.repeat(72)}`));
  console.log(`  ${'TOTAL'.padEnd(49)}  ${pc.bold(`R$ ${total.toFixed(2)}`)}\n`);
}
