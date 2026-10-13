"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import { FormField } from "@/ui/components/primitives/form-field";
import type { AuthFormState } from "./login-form";

export type ResetPasswordFormProps = {
  action: (
    prevState: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
  initialState?: AuthFormState;
  /** Email precargado (viene por query string desde el flujo anterior). */
  defaultEmail?: string;
};

export function ResetPasswordForm({
  action,
  initialState = null,
  defaultEmail = "",
}: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error">
          {state.error}
        </div>
      )}

      <FormField label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          defaultValue={defaultEmail}
          required
          disabled={isPending}
        />
      </FormField>

      <FormField
        label="Clave provisoria"
        htmlFor="provisionalKey"
        required
        hint="La que te llegó por email. Se puede tipear en minúsculas."
      >
        <Input
          id="provisionalKey"
          name="provisionalKey"
          type="text"
          placeholder="XXXXXXXX"
          autoComplete="one-time-code"
          required
          disabled={isPending}
          className="font-mono tracking-widest text-center uppercase"
          maxLength={12}
        />
      </FormField>

      <FormField
        label="Nueva contraseña"
        htmlFor="newPassword"
        required
        hint="Mínimo 8 caracteres, con letras y números."
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Cambiando..." : "Cambiar contraseña"}
      </Button>

      <div className="text-center">
        <Link href="/admin" className="text-sm text-accent hover:underline">
          Volver a ingresar
        </Link>
      </div>
    </form>
  );
}