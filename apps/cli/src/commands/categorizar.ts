import { extractMerchantName, normalize } from '@i2fin/core';
import {
  getCategorizationRules,
  getSupabaseClient,
  getUnassignedTransactions,
  updateTransactionResponsible,
} from '@i2fin/db';
import pc from 'picocolors';
import * as readline from 'node:readline';
import type { Credentials } from '../types.js';

const RESPONSIBLE_OPTIONS = [
  { key: '1', value: 'iremar', label: 'Iremar', color: pc.blue },
  { key: '2', value: 'juliana', label: 'Juliana', color: pc.magenta },
  { key: '3', value: 'casal', label: 'Casal (÷2)', color: pc.cyan },
  { key: '4', value: 'i2', label: 'i2 Soluções', color: pc.yellow },
  { key: 's', value: null, label: 'Pular', color: pc.dim },
  { key: 'q', value: null, label: 'Sair', color: pc.dim },
];

export async function cmdCategorizar(creds: Credentials): Promise<void> {
  const db = getSupabaseClient();
  const { householdId } = creds;

  const [txRows, rules] = await Promise.all([
    getUnassignedTransactions(db, householdId, 50),
    getCategorizationRules(db, householdId),
  ]);

  if (txRows.length === 0) {
    console.log(pc.green('✓ Todos os lançamentos estão categorizados!'));
    return;
  }

  console.log(pc.cyan(`\n${txRows.length} lançamento(s) sem responsável. Vamos categorizar:\n`));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (prompt: string) =>
    new Promise<string>((resolve) => rl.question(prompt, resolve));

  let done = 0;
  let skipped = 0;

  for (const tx of txRows) {
    const norm = normalize(tx.description);

    console.log(
      pc.bold(`\n${tx.occurred_on}  ${tx.description}`),
      pc.dim(`  R$ ${tx.amount.toFixed(2)}`),
    );
    console.log(pc.dim(`  Norm: ${norm}`));

    const menu = RESPONSIBLE_OPTIONS.map(
      (o) => `${pc.bold(o.key)} ${o.color(o.label)}`,
    ).join('  ');
    const answer = await question(`  ${menu}\n  > `);

    const opt = RESPONSIBLE_OPTIONS.find((o) => o.key === answer.toLowerCase().trim());

    if (!opt || opt.value === null) {
      if (answer === 'q') break;
      skipped++;
      continue;
    }

    await updateTransactionResponsible(db, tx.id, opt.value);
    done++;

    // Learn rule
    const merchant = extractMerchantName(norm);
    if (merchant.length > 2) {
      await db.from('categorization_rules').upsert(
        {
          household_id: householdId,
          match_pattern: merchant,
          responsible: opt.value,
          confidence: 0.7,
          hits: 1,
          created_from_manual: true,
        },
        { onConflict: 'household_id,match_pattern' },
      ).then(async () => {
        // Increment hits via raw SQL
        await db.rpc('increment_rule_hits' as never, {
          p_household_id: householdId,
          p_pattern: merchant,
        }).then(() => {});
      });
    }

    console.log(pc.green(`  ✓ ${opt.label}`));
  }

  rl.close();
  console.log(pc.green(`\n✓ ${done} categorizado(s), ${skipped} pulado(s).`));
}
