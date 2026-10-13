import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/shared/config/env";

/**
 * Cliente de Supabase con service_role. IGNORA RLS.
 *
 * Se usa SOLO en el servidor para operaciones administrativas:
 *   - Crear/eliminar usuarios con admin API.
 *   - Modificar la contraseña de un usuario en recuperación.
 *   - Leer/escribir en tablas sin RLS (email_logs, password_recovery_tokens).
 *
 * NUNCA importar desde código que llega al navegador.
 */
let adminClient: SupabaseClient | null = null;

export function createAdminSupabaseClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const env = getPublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. Configurala en .env.local."
    );
  }

  adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}