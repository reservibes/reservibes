import type { Result } from "@/core/errors/domain-error";

/**
 * Puerto del repositorio de tokens de recuperación de contraseña.
 * La capa core no conoce la base de datos: solo este contrato.
 */
export interface PasswordRecoveryRepository {
  /**
   * Busca el usuario por email. Devuelve null si no existe (no es error).
   */
  findUserByEmail(
    email: string
  ): Promise<Result<{ userId: string; fullName: string } | null>>;

  /**
   * Guarda el hash de la clave provisoria con vencimiento.
   * Invalida automáticamente cualquier token previo sin usar del mismo usuario.
   */
  saveToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedIp?: string | null;
  }): Promise<Result<{ tokenId: string }>>;

  /**
   * Busca el token activo para un usuario, dado su hash.
   * Devuelve null si no existe, ya fue usado o está vencido.
   */
  findActiveTokenByHash(
    userId: string,
    tokenHash: string
  ): Promise<Result<{ tokenId: string } | null>>;

  /**
   * Marca el token como usado (no se puede volver a usar).
   */
  markTokenAsUsed(tokenId: string): Promise<Result<{ success: true }>>;

  /**
   * Cambia la contraseña del usuario usando la Admin API.
   */
  updateUserPassword(input: {
    userId: string;
    newPassword: string;
  }): Promise<Result<{ success: true }>>;
}