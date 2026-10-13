import { z } from "zod";

/**
 * Contratos de email. Define:
 *   - Prioridades (P1 crítica, P2 importante, P3 opcional).
 *   - Tipos de email soportados.
 *   - Forma del mensaje que recibe el EmailProvider.
 */

// -----------------------------------------------------------------------------
// Prioridades
// -----------------------------------------------------------------------------

export const EmailPrioritySchema = z.enum(["p1", "p2", "p3"]);
export type EmailPriority = z.infer<typeof EmailPrioritySchema>;

// -----------------------------------------------------------------------------
// Tipos de email
// -----------------------------------------------------------------------------

export const EmailTypeSchema = z.enum([
  // P1 — Crítica
  "password_recovery",
  "new_booking_to_business",
  "payment_notice",
  // P2 — Importante
  "booking_confirmation_to_customer",
  "booking_cancellation",
  "booking_rescheduled",
  "welcome_trial",
  // P3 — Opcional
  "booking_reminder_24h",
  "trial_ending_soon",
]);
export type EmailType = z.infer<typeof EmailTypeSchema>;

/**
 * Mapa de prioridad por tipo. P1 siempre se envía primero.
 * Si la cuota diaria está por agotarse, P3 se pospone o se omite.
 */
export const EMAIL_PRIORITY_BY_TYPE: Record<EmailType, EmailPriority> = {
  password_recovery: "p1",
  new_booking_to_business: "p1",
  payment_notice: "p1",
  booking_confirmation_to_customer: "p2",
  booking_cancellation: "p2",
  booking_rescheduled: "p2",
  welcome_trial: "p2",
  booking_reminder_24h: "p3",
  trial_ending_soon: "p3",
};

// -----------------------------------------------------------------------------
// Mensaje
// -----------------------------------------------------------------------------

export const SendEmailInputSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  /** Nombre visible del remitente. Ej: "Barbería El Rey vía Reservibes". */
  fromName: z.string().min(1).max(120).optional(),
  /** Dirección a la que responden los destinatarios. Ej: el email del comercio. */
  replyTo: z.string().email().optional(),
  /** HTML del cuerpo (generado por React Email). */
  html: z.string().min(1),
  /** Texto plano como fallback. */
  text: z.string().optional(),
  /** Tipo y prioridad, para logs y decisiones de cuota. */
  type: EmailTypeSchema,
  priority: EmailPrioritySchema,
  /** Opcional: para trazabilidad en email_logs. */
  businessId: z.string().uuid().optional(),
});

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export type SendEmailOutput = {
  providerMessageId: string | null;
  accepted: boolean;
};