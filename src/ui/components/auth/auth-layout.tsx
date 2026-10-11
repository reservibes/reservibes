import Link from "next/link";
import { cn } from "@/shared/lib/cn";

export type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Layout compartido por las pantallas de autenticación.
 * Puramente visual: no sabe nada de lógica ni de proveedores.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthLayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-bg", className)}>
      {/* Header con marca */}
      <header className="px-6 py-6">
        <Link
          href="/"
          className="text-xl tracking-tight hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-display)" }}
        >
          RESERVIBES
        </Link>
      </header>

      {/* Card central */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1
              className="text-4xl mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            {subtitle && <p className="text-fg-muted">{subtitle}</p>}
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </main>
    </div>
  );
}