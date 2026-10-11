import { z } from "zod";

/**
 * Contratos de autenticación. Son la "frontera" entre la UI y la lógica.
 * La UI valida con estos schemas antes de mandar; la lógica también valida
 * antes de llamar al adaptador. Validación en ambos lados = defensa en profundidad.
 */

// -----------------------------------------------------------------------------
// Registro
// -----------------------------------------------------------------------------

export const RegisterInputSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio.")
    .email("El formato del email no es válido.")
    .max(254, "El email es demasiado largo.")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña es demasiado larga.")
    .regex(/[a-zA-Z]/, "La contraseña debe incluir al menos una letra.")
    .regex(/[0-9]/, "La contraseña debe incluir al menos un número."),
  fullName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre es demasiado largo.")
    .trim(),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export type RegisterOutput = {
  userId: string;
  email: string;
};

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

export const LoginInputSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio.")
    .email("El formato del email no es válido.")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export type LoginOutput = {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
};

// -----------------------------------------------------------------------------
// Sesión actual
// -----------------------------------------------------------------------------

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
};

export type Session = {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

// -----------------------------------------------------------------------------
// Logout
// -----------------------------------------------------------------------------

export type LogoutOutput = { success: true };

// -----------------------------------------------------------------------------
// Recuperación de contraseña (sub-fase 7.4)
// -----------------------------------------------------------------------------

export const RequestPasswordRecoveryInputSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio.")
    .email("El formato del email no es válido.")
    .toLowerCase()
    .trim(),
});

export type RequestPasswordRecoveryInput = z.infer<
  typeof RequestPasswordRecoveryInputSchema
>;

export type RequestPasswordRecoveryOutput = {
  /**
   * Siempre devolvemos el mismo resultado (true) exista o no el email,
   * para no filtrar qué cuentas están registradas.
   */
  requested: true;
};

export const ResetPasswordInputSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  provisionalKey: z
    .string()
    .min(6, "La clave provisoria debe tener al menos 6 caracteres.")
    .max(64, "La clave provisoria es demasiado larga."),
  newPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña es demasiado larga.")
    .regex(/[a-zA-Z]/, "La contraseña debe incluir al menos una letra.")
    .regex(/[0-9]/, "La contraseña debe incluir al menos un número."),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export type ResetPasswordOutput = { success: true };