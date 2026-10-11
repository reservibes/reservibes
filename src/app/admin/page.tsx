import Link from "next/link";
import { AuthLayout } from "@/ui/components/auth/auth-layout";
import { LoginForm } from "@/ui/components/auth/login-form";
import { loginAction } from "./actions";

export const metadata = {
  title: "Ingresar — Reservibes",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Hola de nuevo."
      subtitle="Ingresá para gestionar tus reservas."
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link href="/admin/registro" className="text-accent hover:underline">
            Creá una gratis
          </Link>
        </>
      }
    >
      <LoginForm action={loginAction} />
    </AuthLayout>
  );
}