"use client";

import { useTheme } from "@/ui/theme/theme-provider";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            RESERVIBES
          </span>
          <button
            onClick={toggleTheme}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2 transition-colors"
          >
            {theme === "light" ? "Modo oscuro" : "Modo claro"}
          </button>
        </div>
      </header>

      {/* Hero demo */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-accent mb-4">
          Sistema de diseño
        </p>
        <h1
          className="text-5xl md:text-6xl font-black leading-tight mb-6 max-w-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tu comercio, con reservas online en minutos.
        </h1>
        <p className="text-lg text-fg-muted max-w-2xl mb-8">
          Esta es una página de prueba del sistema de diseño. Los colores, la
          tipografía y los componentes que ves acá son los que usaremos en toda
          la plataforma.
        </p>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground shadow-accent hover:bg-accent-hover transition-colors">
            Crear mi cuenta
          </button>
          <button className="rounded-md border-2 border-fg px-5 py-3 font-medium hover:bg-fg hover:text-fg-inverted transition-colors">
            Ver demo
          </button>
        </div>
      </section>

      {/* Paleta de muestra */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Paleta
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Swatch label="Acento" className="bg-accent" />
          <Swatch label="Fondo" className="bg-bg border border-border" />
          <Swatch label="Superficie" className="bg-surface border border-border" />
          <Swatch label="Superficie 2" className="bg-surface-2" />
          <Swatch label="Texto" className="bg-fg" />
          <Swatch label="Texto muted" className="bg-fg-muted" />
          <Swatch label="Éxito" className="bg-success" />
          <Swatch label="Error" className="bg-error" />
        </div>
      </section>

      {/* Tipografía de muestra */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Tipografía
        </h2>
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <p style={{ fontFamily: "var(--font-display)" }} className="text-4xl">
            Archivo Black — Display
          </p>
          <p className="text-lg">Inter — UI y cuerpo. Legible en mobile.</p>
          <p className="font-mono text-lg tabular">$ 12.500,00 — JetBrains Mono</p>
        </div>
      </section>
    </main>
  );
}

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div>
      <div className={`h-20 rounded-lg ${className}`} />
      <p className="mt-2 text-sm text-fg-muted">{label}</p>
    </div>
  );
}