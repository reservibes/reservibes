import type { Metadata } from "next";
import { ThemeProvider } from "@/ui/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reservibes — Reservas online para tu comercio",
  description:
    "La forma más simple de recibir reservas online. Para barberías, centros de estética, consultorios y más.",
};

// Script que se ejecuta ANTES de que React hidrate, para evitar el flash
// de tema incorrecto. Lee la preferencia guardada o del sistema y setea
// data-theme en <html>.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('reservibes-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}