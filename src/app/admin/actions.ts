"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  getServerAuthProvider,
  getServerEmailProvider,
  getServerPasswordRecoveryRepository,
} from "@/infra/container";
import { renderRecoveryEmail } from "@/infra/email/render";
import { loginUseCase } from "@/core/use-cases/auth/login.use-case";
import { registerUseCase } from "@/core/use-cases/auth/register.use-case";
import { logoutUseCase } from "@/core/use-cases/auth/logout.use-case";
import { requestPasswordRecoveryUseCase } from "@/core/use-cases/auth/request-password-recovery.use-case";
import { resetPasswordUseCase } from "@/core/use-cases/auth/reset-password.use-case";
import type { AuthFormState } from "@/ui/components/auth/login-form";

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email");
  const password = formData.get("password");

  const auth = await getServerAuthProvider();
  const result = await loginUseCase(auth, { email, password });

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect("/admin/bienvenida");
}

// -----------------------------------------------------------------------------
// Registro
// -----------------------------------------------------------------------------

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("fullName");

  const auth = await getServerAuthProvider();
  const result = await registerUseCase(auth, { email, password, fullName });

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect("/admin/bienvenida");
}

// -----------------------------------------------------------------------------
// Logout
// -----------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  const auth = await getServerAuthProvider();
  await logoutUseCase(auth);
  redirect("/admin");
}

// -----------------------------------------------------------------------------
// Recuperación — paso 1: solicitar clave provisoria
// -----------------------------------------------------------------------------

export async function requestRecoveryAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email");

  const headersList = await headers();
  const requestedIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const emailProvider = getServerEmailProvider();
    const recoveryRepo = getServerPasswordRecoveryRepository();

    const result = await requestPasswordRecoveryUseCase(
      {
        recoveryRepo,
        emailProvider,
        renderRecoveryEmail: (params) =>
          renderRecoveryEmail({ ...params, appUrl }),
        appUrl,
        requestedIp,
      },
      { email }
    );

    if (!result.ok) {
      return { error: result.error.message };
    }

    return { requested: true } as unknown as AuthFormState;
  } catch {
    return {
      error: "No se pudo procesar la solicitud. Intentá de nuevo.",
    };
  }
}

// -----------------------------------------------------------------------------
// Recuperación — paso 2: usar clave + nueva contraseña
// -----------------------------------------------------------------------------

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email");
  const provisionalKey = formData.get("provisionalKey");
  const newPassword = formData.get("newPassword");

  const recoveryRepo = getServerPasswordRecoveryRepository();

  const result = await resetPasswordUseCase(
    { recoveryRepo },
    { email, provisionalKey, newPassword }
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect("/admin?reset=ok");
}