import Link from "next/link";
import { AuthLayout } from "@/ui/components/auth/auth-layout";
import { ResetPasswordForm } from "@/ui/components/auth/reset-password-form";
import { resetPasswordAction } from "../actions";

export const metadata = {
  title: "Nueva contraseña — Reservibes",
};

// Esta página usa searchParams para precargar el email. Marcarla como blocking
// evita que Next.js intente prerenderizarla.
export const instant = false;

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const defaultEmail = params.email ?? "";

  return (
    <AuthLayout
      title="Nueva contraseña."
      subtitle="Ingresá la clave que te llegó por email."
      footer={
        <>
          ¿No te llegó?{" "}
          <Link href="/admin/recuperar" className="text-accent hover:underline">
            Pedí otra
          </Link>
        </>
      }
    >
      <ResetPasswordForm
        action={resetPasswordAction}
        defaultEmail={defaultEmail}
      />
    </AuthLayout>
  );
}