"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import { FormField } from "@/ui/components/primitives/form-field";
import type { AuthFormState } from "./login-form";

export type RequestRecoveryFormProps = {
  action: (
    prevState: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
  initialState?: AuthFormState;
};

export function RequestRecoveryForm({
  action,
  initialState = null,
}: RequestRecoveryFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const requested =
    state && !state.error && (state as { requested?: boolean }).requested;

  if (requested) {
    return (
      <div className="space-y-5">
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
          Si existe una cuenta con ese email, te enviamos una clave provisoria.
          Revisá tu bandeja de entrada (y la carpeta de spam).
        </div>
        <Link
          href="/admin"
          className="block w-full text-center rounded-md border-2 border-fg px-5 py-3 font-medium text-fg hover:bg-fg hover:text-fg-inverted transition-colors"
        >
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error">
          {state.error}
        </div>
      )}

      <FormField
        label="Email"
        htmlFor="email"
        required
        hint="Ingresá el email con el que te registraste."
      >
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar clave provisoria"}
      </Button>

      <div className="text-center">
        <Link href="/admin" className="text-sm text-accent hover:underline">
          Volver a ingresar
        </Link>
      </div>
    </form>
  );
}