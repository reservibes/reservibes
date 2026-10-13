import { render } from "@react-email/components";
import { PasswordRecoveryEmail } from "./templates/password-recovery";

/**
 * Renderiza la plantilla de recuperación a HTML.
 * Se la pasamos al caso de uso como callback, así la capa core
 * no conoce React Email.
 */
export async function renderRecoveryEmail(params: {
  fullName: string;
  provisionalKey: string;
  expiresInMinutes: number;
  appUrl: string;
}): Promise<string> {
  return render(
    PasswordRecoveryEmail({
      fullName: params.fullName,
      provisionalKey: params.provisionalKey,
      expiresInMinutes: params.expiresInMinutes,
      appUrl: params.appUrl,
    })
  );
}