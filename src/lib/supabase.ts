import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Este arquivo só deve ser importado dentro de API routes (server-side).
// A service role key tem acesso total ao banco — nunca deve chegar no browser.
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltam as variáveis de ambiente SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. ' +
      'Confira o .env.local (dev) ou as Environment Variables do projeto na Vercel (produção).'
    );
  }

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}
