"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/ui/components/primitives/button";
import { Input } from "@/ui/components/primitives/input";
import { FormField } from "@/ui/components/primitives/form-field";

export type AuthFormState = { error?: string } | null;

export type LoginFormProps = {
  action: (
    prevState: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
  initialState?: AuthFormState;
};

/**
 * Formulario de login. Recibe la server action por props.
 * Es puramente presentacional + manejo de estado del formulario.
 */
export function LoginForm({ action, initialState = null }: LoginFormProps) {
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
          required
          disabled={isPending}
        />
      </FormField>

      <FormField label="Contraseña" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isPending}
        />
      </FormField>

      <div className="flex items-center justify-end -mt-2">
        <Link
          href="/admin/recuperar"
          className="text-sm text-accent hover:underline"
        >
          Olvidé mi contraseña
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}