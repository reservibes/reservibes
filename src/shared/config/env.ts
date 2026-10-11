import { z } from "zod";

/**
 * Validación de variables de entorno en tiempo de ejecución.
 * Si falta alguna o tiene formato incorrecto, la app falla al arrancar
 * (mejor fallar rápido y claro que fallar silenciosamente en producción).
 *
 * IMPORTANTE: solo valida variables públicas (NEXT_PUBLIC_*). Las privadas
 * (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY) se validan en el servidor
 * cuando se usan, para no exponerlas ni requerirlas en el bundle del cliente.
 */

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

let cachedPublicEnv: z.infer<typeof PublicEnvSchema> | null = null;

export function getPublicEnv() {
  if (cachedPublicEnv) return cachedPublicEnv;

  const parsed = PublicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Variables de entorno públicas inválidas o faltantes:\n${issues}\n\nRevisá tu .env.local`
    );
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}