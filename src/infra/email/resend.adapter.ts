import { Resend } from "resend";
import type { EmailProvider } from "@/core/ports/email-provider.port";
import type {
  SendEmailInput,
  SendEmailOutput,
} from "@/core/contracts/email.contract";
import {
  DomainError,
  err,
  ok,
  type Result,
} from "@/core/errors/domain-error";

/**
 * Adaptador de Resend que implementa EmailProvider.
 *
 * Requiere RESEND_API_KEY y EMAIL_FROM en variables de entorno.
 * EMAIL_FROM debe ser una dirección con dominio verificado en Resend,
 * o el remitente de prueba onboarding@resend.dev en desarrollo.
 */
export class ResendEmailAdapter implements EmailProvider {
  private readonly client: Resend;
  private readonly defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.client = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
  }

  async send(input: SendEmailInput): Promise<Result<SendEmailOutput>> {
    try {
      const fromHeader = input.fromName
        ? `${input.fromName} <${this.defaultFrom}>`
        : this.defaultFrom;

      const { data, error } = await this.client.emails.send({
        from: fromHeader,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
      });

      if (error) {
        return err(
          new DomainError(
            "UNKNOWN_ERROR",
            `Resend rechazó el email: ${error.message}`,
            { providerCode: error.name }
          )
        );
      }

      return ok({
        providerMessageId: data?.id ?? null,
        accepted: true,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error desconocido al enviar email.";
      return err(new DomainError("UNKNOWN_ERROR", message));
    }
  }
}