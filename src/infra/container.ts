import type { AuthProvider } from "@/core/ports/auth-provider.port";
import type { EmailProvider } from "@/core/ports/email-provider.port";
import { SupabaseAuthAdapter } from "@/infra/auth/supabase-auth.adapter";
import { ResendEmailAdapter } from "@/infra/email/resend.adapter";
import { createBrowserSupabaseClient } from "@/infra/supabase/browser";
import { createServerSupabaseClient } from "@/infra/supabase/server";

/**
 * Contenedor de dependencias. Es el ÚNICO archivo que sabe qué adaptador
 * concreto está activo. Si mañana cambiamos de proveedor, solo se toca este
 * archivo.
 */

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

let cachedBrowserAuthProvider: AuthProvider | null = null;

export function getBrowserAuthProvider(): AuthProvider {
  if (!cachedBrowserAuthProvider) {
    const supabase = createBrowserSupabaseClient();
    cachedBrowserAuthProvider = new SupabaseAuthAdapter(supabase);
  }
  return cachedBrowserAuthProvider;
}

export async function getServerAuthProvider(): Promise<AuthProvider> {
  const supabase = await createServerSupabaseClient();
  return new SupabaseAuthAdapter(supabase);
}

// -----------------------------------------------------------------------------
// Email
// -----------------------------------------------------------------------------

/**
 * Devuelve el EmailProvider para usar en el servidor.
 * Falla rápido si falta configuración, para no arrancar con email roto.
 */
export function getServerEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error(
      "Falta RESEND_API_KEY. Configurala en .env.local para enviar emails."
    );
  }
  if (!from) {
    throw new Error(
      "Falta EMAIL_FROM. Configurala en .env.local (por ejemplo, onboarding@resend.dev)."
    );
  }

  return new ResendEmailAdapter(apiKey, from);
}