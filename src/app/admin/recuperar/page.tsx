import Link from "next/link";
import { AuthLayout } from "@/ui/components/auth/auth-layout";
import { RequestRecoveryForm } from "@/ui/components/auth/request-recovery-form";
import { requestRecoveryAction } from "../actions";

export const metadata = {
  title: "Recuperar contraseña — Reservibes",
};

export default function RecoverPage() {
  return (
    <AuthLayout
      title="Recuperar contraseña."
      subtitle="Te enviamos una clave provisoria por email."
      footer={
        <>
          ¿Ya tenés la clave?{" "}
          <Link href="/admin/reset" className="text-accent hover:underline">
            Usala acá
          </Link>
        </>
      }
    >
      <RequestRecoveryForm action={requestRecoveryAction} />
    </AuthLayout>
  );
}