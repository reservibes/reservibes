import { config } from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasCredentials = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SERVICE_ROLE_KEY
);

function assertCredentials() {
  if (!hasCredentials) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}

/**
 * Cliente con service_role: ignora RLS. Solo para setup/teardown y auth.admin.
 * NUNCA se debe llamar a signInWithPassword en este cliente, porque
 * sobrescribiría el JWT de service_role.
 */
export function serviceClient(): SupabaseClient {
  assertCredentials();
  return createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente anónimo: respeta RLS como un visitante sin login.
 */
export function anonClient(): SupabaseClient {
  assertCredentials();
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Hace login con email/contraseña usando un cliente anon efímero,
 * y devuelve un cliente ya autenticado como ese usuario.
 *
 * Importante: es async y espera a que la sesión esté completamente activa.
 */
export async function loginAs(
  email: string,
  password: string
): Promise<SupabaseClient> {
  assertCredentials();

  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(`Login falló para ${email}: ${error?.message ?? "sin sesión"}`);
  }

  // Esperamos a que la sesión quede activa antes de devolver el cliente.
  await client.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return client;
}