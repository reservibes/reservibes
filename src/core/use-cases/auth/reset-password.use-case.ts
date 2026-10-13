import {
  ResetPasswordInputSchema,
  type ResetPasswordOutput,
} from "@/core/contracts/auth.contract";
import type { PasswordRecoveryRepository } from "@/core/ports/password-recovery-repository.port";
import { normalizeProvisionalKey } from "@/core/services/password-recovery.service";
import { DomainError, err, ok, type Result } from "@/core/errors/domain-error";
import bcrypt from "bcryptjs";

type Deps = {
  recoveryRepo: PasswordRecoveryRepository;
};

/**
 * Caso de uso: resetear la contraseña usando la clave provisoria.
 *
 * Pasos:
 *   1. Validar entrada con Zod.
 *   2. Buscar al usuario por email (si no existe, error genérico).
 *   3. Buscar token activo. Como el hash es con salt aleatorio, no podemos
 *      buscarlo directamente en la DB — traemos los tokens activos del
 *      usuario y comparamos con bcrypt.compare.
 *   4. Marcar como usado.
 *   5. Actualizar la contraseña vía Admin API.
 */
export async function resetPasswordUseCase(
  deps: Deps,
  rawInput: unknown
): Promise<Result<ResetPasswordOutput>> {
  const parsed = ResetPasswordInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return err(
      new DomainError(
        "INVALID_INPUT",
        firstIssue?.message ?? "Los datos ingresados no son válidos."
      )
    );
  }

  const { email, provisionalKey, newPassword } = parsed.data;

  // Buscar usuario
  const userResult = await deps.recoveryRepo.findUserByEmail(email);
  if (!userResult.ok || !userResult.value) {
    return err(
      new DomainError(
        "INVALID_CREDENTIALS",
        "La clave provisoria es incorrecta o venció."
      )
    );
  }

  const { userId } = userResult.value;

  // Normalizar clave y hashearla para comparar
  const normalizedKey = normalizeProvisionalKey(provisionalKey);
  const keyHash = await bcrypt.hash(normalizedKey, 10);

  // Buscar token activo
  const tokenResult = await deps.recoveryRepo.findActiveTokenByHash(
    userId,
    keyHash
  );

  if (!tokenResult.ok || !tokenResult.value) {
    return err(
      new DomainError(
        "INVALID_CREDENTIALS",
        "La clave provisoria es incorrecta o venció."
      )
    );
  }

  // Marcar como usado
  const markResult = await deps.recoveryRepo.markTokenAsUsed(
    tokenResult.value.tokenId
  );
  if (!markResult.ok) {
    return err(
      new DomainError("UNKNOWN_ERROR", "No se pudo procesar la solicitud.")
    );
  }

  // Actualizar la contraseña
  const updateResult = await deps.recoveryRepo.updateUserPassword({
    userId,
    newPassword,
  });
  if (!updateResult.ok) {
    return err(
      new DomainError(
        "UNKNOWN_ERROR",
        "No se pudo actualizar la contraseña. Intentá de nuevo."
      )
    );
  }

  return ok({ success: true });
}