#!/usr/bin/env bun
/**
 * Aplica os responsáveis da FATURA OFICIAL ABR/MAI 2026 ao banco.
 * Matching por data + valor; descrição usada como desempate.
 * Execute: bun scripts/seed-responsaveis.ts
 */
import { createClient } from '../packages/db/node_modules/@supabase/supabase-js/dist/module/index.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

// ─── Fatura oficial ──────────────────────────────────────────────────────────
// Responsible: iremar | juliana | casal | i2
const FATURA: { date: string; desc: string; amount: number; responsible: string }[] = [
  { date: '2026-04-13', desc: 'Airbnb * Hmpnazbzpq', amount: 189.81, responsible: 'iremar' },
  { date: '2026-04-13', desc: 'Airbnb * Hmt5nrjpkh', amount: 143.15, responsible: 'juliana' },
  { date: '2026-04-13', desc: 'Certificador*000810341', amount: 31.34, responsible: 'i2' },
  { date: '2026-04-13', desc: 'Certisign', amount: 24.33, responsible: 'i2' },
  { date: '2026-04-13', desc: 'Ebn*Canva04809', amount: 24.15, responsible: 'i2' },
  { date: '2026-04-13', desc: 'Gilberto Luiz da Silva', amount: 550.00, responsible: 'casal' },
  { date: '2026-04-13', desc: 'Real Tech', amount: 83.33, responsible: 'juliana' },
  { date: '2026-04-13', desc: 'Thomas Auto Pecas', amount: 116.66, responsible: 'casal' },
  { date: '2026-04-14', desc: 'Apple.Com/Bill.', amount: 99.90, responsible: 'i2' },
  { date: '2026-04-14', desc: 'Atacadao 047 As', amount: 1119.65, responsible: 'juliana' },
  { date: '2026-04-14', desc: 'Netflix.Com', amount: 59.90, responsible: 'casal' },
  { date: '2026-04-14', desc: 'Rvl Viagens e Turismo', amount: 312.00, responsible: 'casal' },
  { date: '2026-04-15', desc: 'Adiqplu*Inovepark Esta', amount: 10.00, responsible: 'iremar' },
  { date: '2026-04-15', desc: 'Amazon Prime', amount: 13.90, responsible: 'casal' },
  { date: '2026-04-15', desc: 'Andre Luiz D*Multichat', amount: 297.00, responsible: 'i2' },
  { date: '2026-04-16', desc: 'Mundo da Agua Comercio', amount: 170.00, responsible: 'casal' },
  { date: '2026-04-16', desc: 'Shopee *Barataomix', amount: 70.02, responsible: 'casal' },
  { date: '2026-04-16', desc: 'Shopee *Tgafashion', amount: 107.23, responsible: 'juliana' },
  { date: '2026-04-16', desc: 'Shopee*Webfones Comerc', amount: 46.90, responsible: 'iremar' },
  { date: '2026-04-17', desc: 'Shopee*59594178 Guilhe', amount: 102.89, responsible: 'juliana' },
  { date: '2026-04-18', desc: 'Brotfabrik', amount: 48.70, responsible: 'casal' },
  { date: '2026-04-18', desc: 'Zae Recife', amount: 3.00, responsible: 'iremar' },
  { date: '2026-04-18', desc: 'la Ursa Refeicoes e Ev', amount: 63.00, responsible: 'iremar' },
  { date: '2026-04-19', desc: 'Ifd*Ifood Club', amount: 12.90, responsible: 'juliana' },
  { date: '2026-04-19', desc: 'Ifd*Pizzaria Matuta', amount: 126.80, responsible: 'casal' },
  { date: '2026-04-19', desc: 'Suave Depil Beleza e', amount: 35.00, responsible: 'iremar' },
  { date: '2026-04-19', desc: 'Supermercado Alvorada', amount: 10.79, responsible: 'casal' },
  { date: '2026-04-20', desc: 'Atacadao 047 As', amount: 49.25, responsible: 'casal' },
  { date: '2026-04-20', desc: 'Atacadao 047 As', amount: 49.90, responsible: 'iremar' },
  // IOF Freepik (volta = negative)
  { date: '2026-04-20', desc: 'IOF de volta de Fc*', amount: -6.52, responsible: 'i2' },
  { date: '2026-04-21', desc: 'Dl *Uberrides', amount: 17.93, responsible: 'juliana' },
  { date: '2026-04-21', desc: 'Fc* Freepik Premium+ M', amount: 186.44, responsible: 'i2' },
  // IOF Freepik (positivo)
  { date: '2026-04-21', desc: 'IOF de compra internacional', amount: 6.52, responsible: 'i2' },
  // IOF Klingai (volta)
  { date: '2026-04-22', desc: 'IOF de volta de Klingai', amount: -1.76, responsible: 'i2' },
  { date: '2026-04-23', desc: 'Atacadao 047 As', amount: 205.44, responsible: 'juliana' },
  // IOF Klingai (positivo)
  { date: '2026-04-23', desc: 'IOF de compra internacional', amount: 1.76, responsible: 'i2' },
  { date: '2026-04-23', desc: 'Klingai.Com', amount: 50.36, responsible: 'i2' },
  { date: '2026-04-23', desc: 'Loja Feirao do Mar', amount: 70.00, responsible: 'juliana' },
  { date: '2026-04-23', desc: 'Machadus Paes e Pizza', amount: 78.94, responsible: 'juliana' },
  { date: '2026-04-24', desc: 'A Boleria', amount: 28.00, responsible: 'casal' },
  { date: '2026-04-24', desc: 'Acto Academia - Cordei', amount: 114.90, responsible: 'juliana' },
  { date: '2026-04-24', desc: 'Caxanga Construcoes', amount: 6.80, responsible: 'casal' },
  { date: '2026-04-24', desc: 'Cr Estacionamento', amount: 24.00, responsible: 'iremar' },
  { date: '2026-04-25', desc: 'Andrefelipevila', amount: 90.00, responsible: 'casal' },
  { date: '2026-04-25', desc: 'Atacadao 047 As', amount: 156.04, responsible: 'juliana' },
  { date: '2026-04-25', desc: 'Casa dos Doces', amount: 99.84, responsible: 'juliana' },
  { date: '2026-04-26', desc: 'Cinemark Brasil S.A Ec', amount: 105.60, responsible: 'juliana' },
  { date: '2026-04-26', desc: 'Lasa', amount: 171.55, responsible: 'juliana' },
  { date: '2026-04-26', desc: 'NuTag*PDP2H55', amount: 15.50, responsible: 'iremar' },
  { date: '2026-04-26', desc: 'Pac Academia de Atleta', amount: 159.70, responsible: 'iremar' },
  { date: '2026-04-26', desc: 'Plastiforte', amount: 39.64, responsible: 'casal' },
  { date: '2026-04-27', desc: 'Amazon', amount: 49.51, responsible: 'juliana' },
  { date: '2026-04-27', desc: 'Atacadao 047 As', amount: 59.88, responsible: 'iremar' },
  { date: '2026-04-27', desc: 'Atacadao 047 As', amount: 57.70, responsible: 'juliana' },
  { date: '2026-04-27', desc: 'Atacadao 047 As', amount: 54.49, responsible: 'juliana' },
  { date: '2026-04-27', desc: 'Premmia*Br', amount: 255.61, responsible: 'juliana' },
  { date: '2026-04-28', desc: 'Drogasil', amount: 327.73, responsible: 'casal' },
  { date: '2026-04-28', desc: 'Drogasil', amount: 15.39, responsible: 'juliana' },
  { date: '2026-04-30', desc: 'Asaas *Devzapp', amount: 197.00, responsible: 'i2' },
  // Maio
  { date: '2026-05-01', desc: 'Atacadao 047 As', amount: 64.11, responsible: 'casal' },
  { date: '2026-05-01', desc: 'Atacadao 047 As', amount: 144.63, responsible: 'juliana' },
  { date: '2026-05-01', desc: 'IOF de volta de Claude.Ai', amount: -40.01, responsible: 'i2' },
  { date: '2026-05-02', desc: 'Claude.Ai Subscription', amount: 1143.18, responsible: 'i2' },
  { date: '2026-05-02', desc: 'Dl*Uberrides', amount: 27.98, responsible: 'juliana' },
  { date: '2026-05-02', desc: 'Drogasil', amount: 42.43, responsible: 'casal' },
  { date: '2026-05-02', desc: 'Google Workspace_i2sol', amount: 98.00, responsible: 'i2' },
  { date: '2026-05-02', desc: 'IOF de compra internacional', amount: 40.01, responsible: 'i2' },
  { date: '2026-05-02', desc: 'Padaria Eldorado', amount: 27.19, responsible: 'casal' },
  { date: '2026-05-03', desc: 'Atacadao 047 As', amount: 166.40, responsible: 'casal' },
  { date: '2026-05-03', desc: 'Vivo Easy*Vivo Easy', amount: 35.00, responsible: 'iremar' },
  { date: '2026-05-06', desc: 'IOF de volta de Klingai', amount: -18.12, responsible: 'i2' },
  { date: '2026-05-07', desc: 'Dl *Uber*Rides', amount: 12.98, responsible: 'iremar' },
  { date: '2026-05-07', desc: 'IOF de compra internacional', amount: 18.12, responsible: 'i2' },
  { date: '2026-05-07', desc: 'Klingai.Com', amount: 517.99, responsible: 'i2' },
  { date: '2026-05-07', desc: 'Mp *Lwcafeebistro', amount: 71.00, responsible: 'juliana' },
  { date: '2026-05-07', desc: 'Petrobras Premmia', amount: 263.04, responsible: 'casal' },
  { date: '2026-05-08', desc: 'Dl*Uberrides', amount: 21.95, responsible: 'juliana' },
  { date: '2026-05-09', desc: 'Registrobr', amount: 40.00, responsible: 'i2' },
  { date: '2026-05-10', desc: 'Adrianacarlalira', amount: 68.37, responsible: 'casal' },
  { date: '2026-05-10', desc: 'Atacadao 047 As', amount: 284.45, responsible: 'casal' },
  { date: '2026-05-10', desc: 'Gdrestaurante', amount: 72.80, responsible: 'casal' },
  { date: '2026-05-11', desc: 'Dl *Uberrides', amount: 25.98, responsible: 'juliana' },
  { date: '2026-05-11', desc: 'Machadus Paes e Pizza', amount: 149.71, responsible: 'casal' },
  { date: '2026-05-12', desc: 'Google One', amount: 14.99, responsible: 'iremar' },
  { date: '2026-05-12', desc: 'Propark', amount: 12.00, responsible: 'iremar' },
];

// ─── Setup ───────────────────────────────────────────────────────────────────
const credsPath = join(homedir(), '.i2fin', 'credentials.json');
const creds = JSON.parse(readFileSync(credsPath, 'utf8'));

const url = process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL'];
const key = process.env['SUPABASE_ANON_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY');

const db = createClient(url, key);
await db.auth.setSession({ access_token: creds.accessToken, refresh_token: creds.refreshToken });

// ─── Fetch all candidate transactions ────────────────────────────────────────
const { data: txRows, error: fetchErr } = await db
  .from('transactions')
  .select('id, occurred_on, description, amount, responsible')
  .eq('household_id', creds.householdId)
  .gte('occurred_on', '2026-04-13')
  .lt('occurred_on', '2026-05-13');

if (fetchErr) throw fetchErr;
const txList = txRows ?? [];

// ─── Match & update ───────────────────────────────────────────────────────────
let matched = 0;
let skipped = 0;
const unmatched: typeof FATURA = [];

for (const entry of FATURA) {
  // Find candidates by date + amount (±0.02 to handle float precision)
  const candidates = txList.filter(
    (t) => t.occurred_on === entry.date && Math.abs(t.amount - entry.amount) < 0.02,
  );

  if (candidates.length === 0) {
    unmatched.push(entry);
    continue;
  }

  // If multiple candidates on same date+amount, pick best description match
  const best =
    candidates.length === 1
      ? candidates[0]
      : candidates.reduce((best, c) => {
          const score = (s: string) =>
            entry.desc
              .toLowerCase()
              .split(' ')
              .filter((w) => s.toLowerCase().includes(w)).length;
          return score(c.description) >= score(best.description) ? c : best;
        });

  if (best.responsible === entry.responsible) {
    skipped++;
    continue; // already correct
  }

  const { error } = await db
    .from('transactions')
    .update({ responsible: entry.responsible })
    .eq('id', best.id);

  if (error) {
    console.error(`✗ Erro ao atualizar ${best.id}: ${error.message}`);
  } else {
    console.log(
      `✓ ${entry.date}  ${entry.responsible.padEnd(7)}  R$ ${entry.amount.toFixed(2).padStart(8)}  ${entry.desc.slice(0, 35)}`,
    );
    matched++;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n✓ ${matched} atualizados  ${skipped} já corretos  ${unmatched.length} não encontrados`);

if (unmatched.length > 0) {
  console.log('\n⚠ Não encontrados:');
  for (const u of unmatched) {
    console.log(`  ${u.date}  R$ ${u.amount.toFixed(2).padStart(8)}  ${u.desc}`);
  }
}
