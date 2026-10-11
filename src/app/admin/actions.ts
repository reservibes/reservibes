"use server";

import { redirect } from "next/navigation";
import { getServerAuthProvider } from "@/infra/container";
import { loginUseCase } from "@/core/use-cases/auth/login.use-case";
import { registerUseCase } from "@/core/use-cases/auth/register.use-case";
import { logoutUseCase } from "@/core/use-cases/auth/logout.use-case";
import type { AuthFormState } from "@/ui/components/auth/login-form";

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

export async function logoutAction(): Promise<void> {
  const auth = await getServerAuthProvider();
  await logoutUseCase(auth);
  redirect("/admin");
}