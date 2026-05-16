#!/usr/bin/env bun
import { Command } from 'commander';
import pc from 'picocolors';
import { requireAuth, cmdLogin } from './auth.js';
import { cmdImportar } from './commands/importar.js';
import { cmdListar } from './commands/listar.js';
import { cmdCategorizar } from './commands/categorizar.js';
import { cmdFechar } from './commands/fechar.js';

const program = new Command();

program
  .name('i2fin')
  .description(pc.bold('i2 Finance') + pc.dim(' — Gestão financeira familiar'))
  .version('0.1.0');

// ─── login ─────────────────────────────────────────────────────────────────
program
  .command('login')
  .description('Autenticar via magic link')
  .option('-e, --email <email>', 'E-mail da conta')
  .action(async (opts) => {
    await cmdLogin(opts.email);
  });

// ─── importar ─────────────────────────────────────────────────────────────
program
  .command('importar <arquivo>')
  .description('Importar fatura CSV do cartão')
  .option('--force', 'Reimportar mesmo se já foi importado')
  .action(async (arquivo) => {
    const creds = await requireAuth();
    await cmdImportar(arquivo, creds);
  });

// ─── listar ─────────────────────────────────────────────────────────────
program
  .command('listar [mes]')
  .description('Listar lançamentos do mês (ex: 2026-05)')
  .option('-r, --responsavel <r>', 'Filtrar por responsável (iremar|juliana|casal|i2|unassigned)')
  .option('-n, --limit <n>', 'Limitar número de resultados', '100')
  .action(async (mes, opts) => {
    const creds = await requireAuth();
    const month = mes ?? new Date().toISOString().slice(0, 7);
    await cmdListar(month, creds, {
      responsible: opts.responsavel,
      limit: opts.limit ? parseInt(opts.limit) : undefined,
    });
  });

// ─── categorizar ─────────────────────────────────────────────────────────
program
  .command('categorizar')
  .description('Categorizar lançamentos sem responsável (modo interativo)')
  .action(async () => {
    const creds = await requireAuth();
    await cmdCategorizar(creds);
  });

// ─── fechar ───────────────────────────────────────────────────────────────
program
  .command('fechar [mes]')
  .description('Gerar relatório de fechamento do mês')
  .option('--confirmar', 'Registrar fechamento no banco')
  .action(async (mes, opts) => {
    const creds = await requireAuth();
    if (creds.role !== 'admin') {
      console.error(pc.red('✗ Apenas o admin pode fechar o mês.'));
      process.exit(1);
    }
    const month = mes ?? new Date().toISOString().slice(0, 7);
    await cmdFechar(month, creds);
  });

// ─── receita ─────────────────────────────────────────────────────────────
program
  .command('receita <tipo> <valor> [descricao]')
  .description('Registrar receita (pro-labore|i2-reembolso|juliana|outro)')
  .option('-m, --mes <mes>', 'Mês de referência (ex: 2026-05)')
  .action(async (tipo, valor, descricao, opts) => {
    const creds = await requireAuth();
    if (creds.role !== 'admin') {
      console.error(pc.red('✗ Apenas admin pode registrar receitas.'));
      process.exit(1);
    }

    const kindMap: Record<string, string> = {
      'pro-labore': 'pro_labore',
      'i2-reembolso': 'i2_reimbursement',
      'juliana': 'juliana_transfer',
      'outro': 'other',
    };
    const kind = kindMap[tipo];
    if (!kind) {
      console.error(pc.red(`✗ Tipo inválido: ${tipo}. Use: pro-labore, i2-reembolso, juliana, outro`));
      process.exit(1);
    }

    const { getSupabaseClient } = await import('@i2fin/db');
    const db = getSupabaseClient();
    const month = opts.mes ?? new Date().toISOString().slice(0, 7);

    await db.from('income_records').insert({
      household_id: creds.householdId,
      occurred_on: new Date().toISOString().split('T')[0]!,
      description: descricao ?? tipo,
      amount: parseFloat(valor),
      kind,
      reference_month: `${month}-01`,
      created_by: creds.userId,
    });

    console.log(pc.green(`✓ Receita registrada: ${descricao ?? tipo} R$ ${parseFloat(valor).toFixed(2)}`));
  });

program.parse();
