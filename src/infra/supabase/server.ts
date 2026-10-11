import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/shared/config/env";

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * Lee y escribe la sesión desde las cookies de Next.js.
 *
 * Se debe crear uno nuevo en cada request (no cachear).
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // En Server Components, `cookies().set` puede lanzar. Se ignora
            // porque el middleware es el encargado de refrescar la sesión.
          }
        },
      },
    }
  );
}