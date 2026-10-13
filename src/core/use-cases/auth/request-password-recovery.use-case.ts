import {
  RequestPasswordRecoveryInputSchema,
  type RequestPasswordRecoveryOutput,
} from "@/core/contracts/auth.contract";
import type { EmailProvider } from "@/core/ports/email-provider.port";
import type { PasswordRecoveryRepository } from "@/core/ports/password-recovery-repository.port";
import {
  generateProvisionalKey,
  PROVISIONAL_KEY_TTL_MINUTES,
} from "@/core/services/password-recovery.service";
import { DomainError, err, ok, type Result } from "@/core/errors/domain-error";
import bcrypt from "bcryptjs";

type Deps = {
  recoveryRepo: PasswordRecoveryRepository;
  emailProvider: EmailProvider;
  /**
   * Función que genera el HTML del email. Es async porque la plantilla real
   * (React Email) lo es. La capa core no conoce la implementación.
   */
  renderRecoveryEmail: (params: {
    fullName: string;
    provisionalKey: string;
    expiresInMinutes: number;
  }) => Promise<string>;
  /** URL pública de la app, para el botón del email. */
  appUrl: string;
  /** IP del solicitante, para auditoría. */
  requestedIp?: string | null;
};

/**
 * Caso de uso: solicitar recuperación de contraseña.
 *
 * Devuelve siempre { requested: true } para no revelar si el email existe.
 */
export async function requestPasswordRecoveryUseCase(
  deps: Deps,
  rawInput: unknown
): Promise<Result<RequestPasswordRecoveryOutput>> {
  const parsed = RequestPasswordRecoveryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return err(
      new DomainError(
        "INVALID_INPUT",
        firstIssue?.message ?? "Los datos ingresados no son válidos."
      )
    );
  }

  const { email } = parsed.data;

  // Buscar usuario. Si no existe, devolvemos éxito igual.
  const userResult = await deps.recoveryRepo.findUserByEmail(email);
  if (!userResult.ok || !userResult.value) {
    return ok({ requested: true });
  }

  const { userId, fullName } = userResult.value;

  // Generar clave y hashearla
  const provisionalKey = generateProvisionalKey();
  const tokenHash = await bcrypt.hash(provisionalKey, 10);
  const expiresAt = new Date(
    Date.now() + PROVISIONAL_KEY_TTL_MINUTES * 60 * 1000
  );

  // Guardar hash
  const saveResult = await deps.recoveryRepo.saveToken({
    userId,
    tokenHash,
    expiresAt,
    requestedIp: deps.requestedIp ?? null,
  });
  if (!saveResult.ok) {
    return ok({ requested: true });
  }

  // Renderizar HTML y enviar email
  const html = await deps.renderRecoveryEmail({
    fullName,
    provisionalKey,
    expiresInMinutes: PROVISIONAL_KEY_TTL_MINUTES,
  });

  await deps.emailProvider.send({
    to: email,
    subject: "Tu clave provisoria para recuperar la contraseña",
    html,
    type: "password_recovery",
    priority: "p1",
  });

  // Un fallo de email no rompe la respuesta (se loguea internamente).
  return ok({ requested: true });
}