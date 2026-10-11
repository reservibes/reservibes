import Link from "next/link";
import { AuthLayout } from "@/ui/components/auth/auth-layout";
import { RegisterForm } from "@/ui/components/auth/register-form";
import { registerAction } from "../actions";

export const metadata = {
  title: "Crear cuenta — Reservibes",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Empezá gratis."
      subtitle="15 días de prueba, sin tarjeta."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/admin" className="text-accent hover:underline">
            Ingresá
          </Link>
        </>
      }
    >
      <RegisterForm action={registerAction} />
    </AuthLayout>
  );
}