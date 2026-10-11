import type { AuthProvider } from "@/core/ports/auth-provider.port";
import { SupabaseAuthAdapter } from "@/infra/auth/supabase-auth.adapter";
import { createBrowserSupabaseClient } from "@/infra/supabase/browser";
import { createServerSupabaseClient } from "@/infra/supabase/server";

/**
 * Contenedor de dependencias. Es el ÚNICO archivo que sabe qué adaptador
 * concreto está activo. Si mañana cambiamos de Supabase Auth a Auth0,
 * solo se toca este archivo.
 *
 * La capa core y la capa UI nunca importan directamente de src/infra/auth/*.
 */

// -----------------------------------------------------------------------------
// Cliente (browser)
// -----------------------------------------------------------------------------

let cachedBrowserAuthProvider: AuthProvider | null = null;

/**
 * Devuelve el AuthProvider para usar en client components.
 * Es un singleton por pestaña.
 */
export function getBrowserAuthProvider(): AuthProvider {
  if (!cachedBrowserAuthProvider) {
    const supabase = createBrowserSupabaseClient();
    cachedBrowserAuthProvider = new SupabaseAuthAdapter(supabase);
  }
  return cachedBrowserAuthProvider;
}

// -----------------------------------------------------------------------------
// Cliente (server)
// -----------------------------------------------------------------------------

/**
 * Devuelve el AuthProvider para usar en Server Components, Route Handlers
 * y Server Actions. NO se cachea porque cada request tiene sus propias cookies.
 */
export async function getServerAuthProvider(): Promise<AuthProvider> {
  const supabase = await createServerSupabaseClient();
  return new SupabaseAuthAdapter(supabase);
}