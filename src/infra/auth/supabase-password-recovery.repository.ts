import type { SupabaseClient } from "@supabase/supabase-js";
import type { PasswordRecoveryRepository } from "@/core/ports/password-recovery-repository.port";
import {
  DomainError,
  err,
  ok,
  type Result,
} from "@/core/errors/domain-error";

/**
 * Implementación del repositorio de recuperación usando Supabase.
 * Usa el cliente admin (service_role) que ignora RLS.
 */
export class SupabasePasswordRecoveryRepository
  implements PasswordRecoveryRepository
{
  constructor(private readonly admin: SupabaseClient) {}

  async findUserByEmail(
    email: string
  ): Promise<Result<{ userId: string; fullName: string } | null>> {
    try {
      // Buscar en profiles por email (más confiable que listar auth.users)
      const { data, error } = await this.admin
        .from("profiles")
        .select("id, full_name")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        return err(
          new DomainError("UNKNOWN_ERROR", `Error al buscar usuario: ${error.message}`)
        );
      }

      if (!data) return ok(null);

      return ok({
        userId: data.id,
        fullName: data.full_name ?? "",
      });
    } catch {
      return err(
        new DomainError("UNKNOWN_ERROR", "Error inesperado al buscar usuario.")
      );
    }
  }

  async saveToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedIp?: string | null;
  }): Promise<Result<{ tokenId: string }>> {
    try {
      // Invalidar tokens previos no usados del mismo usuario
      await this.admin
        .from("password_recovery_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("user_id", input.userId)
        .is("used_at", null);

      const { data, error } = await this.admin
        .from("password_recovery_tokens")
        .insert({
          user_id: input.userId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt.toISOString(),
          requested_ip: input.requestedIp ?? null,
        })
        .select("id")
        .single();

      if (error || !data) {
        return err(
          new DomainError(
            "UNKNOWN_ERROR",
            `Error al guardar el token: ${error?.message ?? "sin datos"}`
          )
        );
      }

      return ok({ tokenId: data.id });
    } catch {
      return err(
        new DomainError("UNKNOWN_ERROR", "Error inesperado al guardar el token.")
      );
    }
  }

  async findActiveTokenByHash(
    userId: string,
    tokenHash: string
  ): Promise<Result<{ tokenId: string } | null>> {
    try {
      const { data, error } = await this.admin
        .from("password_recovery_tokens")
        .select("id")
        .eq("user_id", userId)
        .eq("token_hash", tokenHash)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error) {
        return err(
          new DomainError(
            "UNKNOWN_ERROR",
            `Error al buscar el token: ${error.message}`
          )
        );
      }

      return ok(data ? { tokenId: data.id } : null);
    } catch {
      return err(
        new DomainError("UNKNOWN_ERROR", "Error inesperado al buscar el token.")
      );
    }
  }

  async markTokenAsUsed(tokenId: string): Promise<Result<{ success: true }>> {
    try {
      const { error } = await this.admin
        .from("password_recovery_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenId);

      if (error) {
        return err(
          new DomainError(
            "UNKNOWN_ERROR",
            `Error al marcar el token como usado: ${error.message}`
          )
        );
      }

      return ok({ success: true });
    } catch {
      return err(
        new DomainError(
          "UNKNOWN_ERROR",
          "Error inesperado al marcar el token como usado."
        )
      );
    }
  }

  async updateUserPassword(input: {
    userId: string;
    newPassword: string;
  }): Promise<Result<{ success: true }>> {
    try {
      const { error } = await this.admin.auth.admin.updateUserById(
        input.userId,
        { password: input.newPassword }
      );

      if (error) {
        return err(
          new DomainError(
            "UNKNOWN_ERROR",
            `Error al actualizar la contraseña: ${error.message}`
          )
        );
      }

      return ok({ success: true });
    } catch {
      return err(
        new DomainError(
          "UNKNOWN_ERROR",
          "Error inesperado al actualizar la contraseña."
        )
      );
    }
  }
}