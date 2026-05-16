import { getSupabaseClient } from '@i2fin/db';
import pc from 'picocolors';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.i2fin');
const CREDS_FILE = join(CONFIG_DIR, 'credentials.json');

interface Credentials {
  accessToken: string;
  refreshToken: string;
  householdId: string;
  role: 'admin' | 'operator';
  email: string;
}

export function loadCredentials(): Credentials | null {
  if (!existsSync(CREDS_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CREDS_FILE, 'utf8')) as Credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
}

export function clearCredentials(): void {
  if (existsSync(CREDS_FILE)) {
    writeFileSync(CREDS_FILE, '{}');
  }
}

export async function requireAuth(): Promise<Credentials> {
  const creds = loadCredentials();
  if (!creds?.accessToken) {
    console.error(pc.red('✗ Não autenticado. Execute: i2fin login'));
    process.exit(1);
  }

  // Restore session in supabase client
  const db = getSupabaseClient();
  const { error } = await db.auth.setSession({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
  });

  if (error) {
    console.error(pc.red('✗ Sessão expirada. Execute: i2fin login'));
    process.exit(1);
  }

  return creds;
}

export async function cmdLogin(email?: string): Promise<void> {
  const db = getSupabaseClient();
  const userEmail = email ?? (await promptEmail());

  console.log(pc.cyan(`\nEnviando magic link para ${userEmail}...`));

  const { error } = await db.auth.signInWithOtp({
    email: userEmail,
    options: { shouldCreateUser: false },
  });

  if (error) {
    console.error(pc.red(`✗ Erro: ${error.message}`));
    process.exit(1);
  }

  console.log(pc.green('✓ Magic link enviado! Verifique seu e-mail.'));
  console.log(pc.dim('Após clicar no link, execute: i2fin login --token <TOKEN_DA_URL>'));
}

async function promptEmail(): Promise<string> {
  process.stdout.write('E-mail: ');
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
}
