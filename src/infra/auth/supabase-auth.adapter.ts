import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthProvider } from "@/core/ports/auth-provider.port";
import type {
  LoginInput,
  LoginOutput,
  LogoutOutput,
  RegisterInput,
  RegisterOutput,
  RequestPasswordRecoveryInput,
  RequestPasswordRecoveryOutput,
  ResetPasswordInput,
  ResetPasswordOutput,
  Session,
} from "@/core/contracts/auth.contract";
import {
  DomainError,
  err,
  ok,
  type DomainErrorCode,
  type Result,
} from "@/core/errors/domain-error";

/**
 * Adaptador de Supabase que implementa el puerto AuthProvider.
 *
 * Traduce errores de Supabase a DomainError, así la capa core nunca
 * depende de strings específicos del SDK.
 */
export class SupabaseAuthAdapter implements AuthProvider {
  constructor(private readonly supabase: SupabaseClient) {}

  async register(input: RegisterInput): Promise<Result<RegisterOutput>> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName },
        },
      });

      if (error) {
        return err(mapAuthError(error));
      }
      if (!data.user || !data.user.email) {
        return err(
          new DomainError(
            "UNKNOWN_ERROR",
            "No se pudo crear la cuenta. Intentá de nuevo."
          )
        );
      }

      return ok({ userId: data.user.id, email: data.user.email });
    } catch {
      return err(
        new DomainError("UNKNOWN_ERROR", "Error inesperado al crear la cuenta.")
      );
    }
  }

  async login(input: LoginInput): Promise<Result<LoginOutput>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) return err(mapAuthError(error));
      if (!data.user || !data.session) {
        return err(
          new DomainError("INVALID_CREDENTIALS", "Email o contraseña incorrectos.")
        );
      }

      return ok({
        userId: data.user.id,
        email: data.user.email ?? input.email,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    } catch {
      return err(
        new DomainError("UNKNOWN_ERROR", "Error inesperado al iniciar sesión.")
      );
    }
  }

  async logout(): Promise<Result<LogoutOutput>> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) return err(mapAuthError(error));
      return ok({ success: true });
    } catch {
      return err(
        new DomainError("UNKNOWN_ERROR", "Error inesperado al cerrar sesión.")
      );
    }
  }

  async getSession(): Promise<Result<Session | null>> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error || !data.user) {
        // No estar logueado no es un error: es un estado válido.
        return ok(null);
      }

      const { data: sessionData } = await this.supabase.auth.getSession();
      if (!sessionData.session) return ok(null);

      return ok({
        user: {
          id: data.user.id,
          email: data.user.email ?? "",
          fullName:
            (data.user.user_metadata?.full_name as string | undefined) ?? "",
        },
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
        expiresAt: sessionData.session.expires_at ?? 0,
      });
    } catch {
      return ok(null);
    }
  }

  async requestPasswordRecovery(
    _input: RequestPasswordRecoveryInput
  ): Promise<Result<RequestPasswordRecoveryOutput>> {
    // Se implementa en la sub-fase 7.4 con servicio propio en el servidor
    // (genera clave provisoria, la hashea, la guarda y la envía por email).
    return err(
      new DomainError(
        "UNKNOWN_ERROR",
        "La recuperación de contraseña todavía no está disponible."
      )
    );
  }

  async resetPassword(
    _input: ResetPasswordInput
  ): Promise<Result<ResetPasswordOutput>> {
    // Se implementa en la sub-fase 7.4.
    return err(
      new DomainError(
        "UNKNOWN_ERROR",
        "La recuperación de contraseña todavía no está disponible."
      )
    );
  }
}

/**
 * Mapea errores del SDK de Supabase a DomainError.
 * Los códigos de error de Supabase Auth están documentados en:
 * https://supabase.com/docs/guides/auth/debugging/error-codes
 */
function mapAuthError(error: { message?: string; code?: string }): DomainError {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";

  let domainCode: DomainErrorCode = "UNKNOWN_ERROR";
  let userMessage = "Ocurrió un error. Intentá de nuevo.";

  if (
    code === "user_already_exists" ||
    msg.includes("already registered") ||
    msg.includes("already exists")
  ) {
    domainCode = "EMAIL_ALREADY_EXISTS";
    userMessage = "Ya existe una cuenta con ese email.";
  } else if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials")
  ) {
    domainCode = "INVALID_CREDENTIALS";
    userMessage = "Email o contraseña incorrectos.";
  } else if (code === "weak_password" || msg.includes("weak password")) {
    domainCode = "WEAK_PASSWORD";
    userMessage = "La contraseña es demasiado débil.";
  } else if (code === "over_email_send_rate_limit") {
    domainCode = "RATE_LIMITED";
    userMessage = "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  } else if (msg.includes("email not confirmed")) {
    domainCode = "UNAUTHORIZED";
    userMessage = "Tenés que confirmar tu email antes de iniciar sesión.";
  }

  return new DomainError(domainCode, userMessage);
}