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
import type { Result } from "@/core/errors/domain-error";

/**
 * Puerto de autenticación. Define el CONTRATO que debe cumplir cualquier
 * proveedor de auth (Supabase hoy, Auth0/Clerk/BetterAuth mañana).
 *
 * La lógica de negocio (core) solo conoce esta interface. NUNCA importa
 * el SDK del proveedor. Cambiar de proveedor = escribir un nuevo adaptador
 * en src/infra/auth/ y registrarlo en src/infra/container.ts.
 */
export interface AuthProvider {
  register(input: RegisterInput): Promise<Result<RegisterOutput>>;

  login(input: LoginInput): Promise<Result<LoginOutput>>;

  logout(): Promise<Result<LogoutOutput>>;

  /**
   * Devuelve la sesión actual si el usuario está logueado, o null si no.
   * No es un error "no estar logueado" — es un estado válido.
   */
  getSession(): Promise<Result<Session | null>>;

  /**
   * Solicita el envío de la clave provisoria de recuperación.
   * Siempre devuelve éxito (exista o no la cuenta).
   * La generación y el hashing de la clave se hacen en el servidor.
   */
  requestPasswordRecovery(
    input: RequestPasswordRecoveryInput
  ): Promise<Result<RequestPasswordRecoveryOutput>>;

  /**
   * Cambia la contraseña usando la clave provisoria.
   */
  resetPassword(
    input: ResetPasswordInput
  ): Promise<Result<ResetPasswordOutput>>;
}