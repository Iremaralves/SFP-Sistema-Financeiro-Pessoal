import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient(url?: string, key?: string) {
  if (_client) return _client;

  const supabaseUrl = url ?? process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseKey = key ?? process.env['SUPABASE_ANON_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL and key required. Set SUPABASE_URL and SUPABASE_ANON_KEY env vars.',
    );
  }

  _client = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return _client;
}

export function getSupabaseServiceClient(url?: string, serviceKey?: string) {
  const supabaseUrl = url ?? process.env['SUPABASE_URL'];
  const supabaseServiceKey = serviceKey ?? process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Service role key required for service client.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
