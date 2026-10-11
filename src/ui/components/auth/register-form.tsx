"use client";

import { useActionState } from "react";
import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import { FormField } from "@/ui/components/primitives/form-field";
import type { AuthFormState } from "./login-form";

export type RegisterFormProps = {
  action: (
    prevState: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
  initialState?: AuthFormState;
};

export function RegisterForm({
  action,
  initialState = null,
}: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error">
          {state.error}
        </div>
      )}

      <FormField
        label="Tu nombre"
        htmlFor="fullName"
        required
        hint="Aparecerá en tu panel."
      >
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Juan Pérez"
          autoComplete="name"
          required
          disabled={isPending}
        />
      </FormField>

      <FormField label="Email" htmlFor="email" required>
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

      <FormField
        label="Contraseña"
        htmlFor="password"
        required
        hint="Mínimo 8 caracteres, con letras y números."
      >
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          disabled={isPending}
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creando cuenta..." : "Crear mi cuenta"}
      </Button>
    </form>
  );
}