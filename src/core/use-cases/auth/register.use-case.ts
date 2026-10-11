import {
  RegisterInputSchema,
  type RegisterOutput,
} from "@/core/contracts/auth.contract";
import type { AuthProvider } from "@/core/ports/auth-provider.port";
import { DomainError, err, type Result } from "@/core/errors/domain-error";

/**
 * Caso de uso: registrar una cuenta nueva.
 *
 * Responsabilidades:
 *   - Validar la entrada con Zod.
 *   - Delegar al AuthProvider.
 *
 * NO conoce Supabase. Solo el puerto.
 */
export async function registerUseCase(
  auth: AuthProvider,
  rawInput: unknown
): Promise<Result<RegisterOutput>> {
  const parsed = RegisterInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return err(
      new DomainError(
        "INVALID_INPUT",
        firstIssue?.message ?? "Los datos ingresados no son válidos."
      )
    );
  }

  return auth.register(parsed.data);
}