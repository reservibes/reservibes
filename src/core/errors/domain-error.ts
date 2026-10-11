/**
 * Error de dominio. Lo usa la capa core para comunicar errores hacia afuera
 * sin depender de excepciones de librerías específicas (Supabase, etc.).
 *
 * Tiene un "code" que es estable y en inglés (para lógica) y un "message"
 * que puede mostrarse al usuario (o mapearse a un texto en español en la UI).
 */
export type DomainErrorCode =
  | "INVALID_INPUT"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "USER_NOT_FOUND"
  | "WEAK_PASSWORD"
  | "RATE_LIMITED"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "UNKNOWN_ERROR";

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: DomainErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Result tipado: la capa core devuelve esto en lugar de tirar excepciones
 * cuando el error es esperado (por ejemplo, credenciales inválidas).
 */
export type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}