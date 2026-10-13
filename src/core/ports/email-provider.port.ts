import type {
  SendEmailInput,
  SendEmailOutput,
} from "@/core/contracts/email.contract";
import type { Result } from "@/core/errors/domain-error";

/**
 * Puerto del proveedor de email. La lógica de negocio solo conoce esta
 * interface. Cambiar Resend por Brevo/SES/SMTP = nuevo adaptador en
 * src/infra/email/ y ajuste en src/infra/container.ts.
 */
export interface EmailProvider {
  send(input: SendEmailInput): Promise<Result<SendEmailOutput>>;
}