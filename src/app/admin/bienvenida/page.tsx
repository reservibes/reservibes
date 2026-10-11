import { redirect } from "next/navigation";
import { getServerAuthProvider } from "@/infra/container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/ui/components/primitives/card";
import { Button } from "@/ui/components/primitives/button";
import { logoutAction } from "../actions";

export const metadata = {
  title: "Bienvenido — Reservibes",
};

// Esta página usa cookies para leer la sesión. Marcarla como blocking
// (no prerenderizable) evita que Next.js intente generarla en el build.
export const instant = false;

/**
 * Página temporal que se muestra después de iniciar sesión.
 * Se reemplazará en la Fase 9 por el flujo de creación de comercio
 * y el panel definitivo en /admin/[marca].
 */
export default async function WelcomePage() {
  const auth = await getServerAuthProvider();
  const result = await auth.getSession();

  if (!result.ok || !result.value) {
    redirect("/admin");
  }

  const { user } = result.value;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            RESERVIBES
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1
          className="text-4xl mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ¡Hola, {user.fullName || user.email}!
        </h1>
        <p className="text-fg-muted mb-8">
          Tu cuenta está activa. Estás logueado como{" "}
          <span className="font-mono text-fg">{user.email}</span>.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Próximo paso</CardTitle>
            <CardDescription>Todavía no creaste tu comercio.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-fg-muted">
              En la próxima fase vas a poder crear tu comercio, personalizar tu
              Booking Page y empezar a recibir reservas.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}