import { config } from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cargar .env.local ANTES de leer cualquier variable
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
}

/**
 * Cliente con service_role: ignora RLS. Solo para setup/teardown en tests.
 * NUNCA usar en el navegador ni en el código de producción.
 */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente anónimo: respeta RLS como un visitante sin login.
 */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente autenticado como un usuario específico.
 */
export function userClient(accessToken: string, refreshToken: string): SupabaseClient {
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  return client;
}