#!/usr/bin/env bun
/**
 * Importa a fatura oficial Abr/Mai 2026 do CSV.
 * - Transações existentes no banco: atualiza o responsável
 * - Transações ausentes: insere com source='manual' e responsável correto
 */
import { createClient } from '../packages/db/node_modules/@supabase/supabase-js/dist/module/index.js';
import { fingerprint } from '../packages/core/src/fingerprint.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ACCOUNT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'; // Cartão Nubank
const CSV_PATH = join(homedir(), 'Downloads', 'Fatura_Abril_Maio_2026 - Fatura.csv');

// ─── Parse CSV ────────────────────────────────────────────────────────────────
const lines = readFileSync(CSV_PATH, 'utf8').split('\n').slice(3); // skip header rows

interface Entry {
  date: string;       // YYYY-MM-DD
  desc: string;
  amount: number;     // positive = expense, negative = credit
  responsible: string; // iremar|juliana|casal|i2
}

const respMap: Record<string, string> = {
  'Iremar': 'iremar', 'iremar': 'iremar',
  'Juliana': 'juliana', 'juliana': 'juliana',
  'Casal': 'casal', 'casal': 'casal',
  'i2': 'i2',
};

const entries: Entry[] = [];
for (const line of lines) {
  if (!line.trim() || line.startsWith(',')) continue;
  // CSV format: #,DD/MM/YYYY,Descrição,"R$ X,XX",Responsável
  const parts = line.match(/^(\d+),(\d{2}\/\d{2}\/\d{4}),"?([^"]+)"?,"(-?R\$[^"]+)","?([^",\n]+)"?/);
  if (!parts) continue;

  const [, , dateBR, desc, amountStr, resp] = parts;
  const [d, m, y] = dateBR.split('/');
  const date = `${y}-${m}-${d}`;
  const negative = amountStr.trim().startsWith('-');
  const amount = parseFloat(
    amountStr.replace('-', '').replace('R$', '').replace(/\s/g,'').replace(/\./g, '').replace(',', '.').trim()
  ) * (negative ? -1 : 1);
  const responsible = respMap[resp.trim()];
  if (!responsible) continue;

  entries.push({ date, desc: desc.trim(), amount, responsible });
}

console.log(`\n📋 ${entries.length} lançamentos na fatura oficial\n`);

// ─── Setup DB ─────────────────────────────────────────────────────────────────
const creds = JSON.parse(readFileSync(join(homedir(), '.i2fin', 'credentials.json'), 'utf8'));
const db = createClient(
  process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_ANON_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
);
await db.auth.setSession({ access_token: creds.accessToken, refresh_token: creds.refreshToken });

// ─── Fetch existing transactions ──────────────────────────────────────────────
const { data: existing } = await db
  .from('transactions')
  .select('id, occurred_on, description, amount, responsible, fingerprint')
  .eq('household_id', creds.householdId)
  .gte('occurred_on', '2026-04-13')
  .lt('occurred_on', '2026-05-13');

const txList = existing ?? [];
console.log(`🗄  ${txList.length} transações no banco (13/04–12/05)\n`);

// ─── Process each entry ────────────────────────────────────────────────────────
let updated = 0, inserted = 0, skipped = 0, errors = 0;
const notFound: Entry[] = [];

for (const entry of entries) {
  // Find match by date + amount (±0.02)
  const candidates = txList.filter(
    t => t.occurred_on === entry.date && Math.abs(t.amount - entry.amount) < 0.02
  );

  if (candidates.length > 0) {
    // Pick best description match
    const best = candidates.length === 1 ? candidates[0] : candidates.reduce((a, b) => {
      const score = (s: string) => entry.desc.toLowerCase().split(' ').filter(w => s.toLowerCase().includes(w)).length;
      return score(a.description) >= score(b.description) ? a : b;
    });

    if (best.responsible === entry.responsible) {
      skipped++;
    } else {
      const { error } = await db.from('transactions').update({ responsible: entry.responsible }).eq('id', best.id);
      if (error) { console.error(`✗ update ${best.id}: ${error.message}`); errors++; }
      else { console.log(`✏️  ${entry.date}  [${entry.responsible.padEnd(7)}]  R$ ${entry.amount.toFixed(2).padStart(8)}  ${entry.desc.slice(0,35)}`); updated++; }
    }
  } else {
    notFound.push(entry);
  }
}

// ─── Insert missing transactions ──────────────────────────────────────────────
if (notFound.length > 0) {
  console.log(`\n➕ Inserindo ${notFound.length} lançamentos ausentes...\n`);

  for (const entry of notFound) {
    const fp = await fingerprint(entry.date, entry.desc, entry.amount, ACCOUNT_ID);

    const { error } = await db.from('transactions').insert({
      household_id: creds.householdId,
      account_id: ACCOUNT_ID,
      occurred_on: entry.date,
      description: entry.desc,
      amount: entry.amount,
      responsible: entry.responsible,
      fingerprint: fp,
      source: 'manual_cli',
      status: 'pending',
      created_by: creds.userId,
    });

    if (error && error.code === '23505') {
      console.log(`⚠️  já existe  ${entry.date}  ${entry.desc.slice(0,30)}`);
      skipped++;
    } else if (error) {
      console.error(`✗ insert ${entry.date} ${entry.desc}: ${error.message}`);
      errors++;
    } else {
      console.log(`✅  ${entry.date}  [${entry.responsible.padEnd(7)}]  R$ ${entry.amount.toFixed(2).padStart(8)}  ${entry.desc.slice(0,35)}`);
      inserted++;
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`✏️  ${updated} responsáveis atualizados`);
console.log(`✅  ${inserted} lançamentos inseridos`);
console.log(`⏭️  ${skipped} já corretos / já existiam`);
if (errors > 0) console.log(`✗   ${errors} erros`);
