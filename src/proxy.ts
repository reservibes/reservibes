import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/infra/supabase/middleware";

/**
 * Rutas de /admin que NO requieren estar logueado.
 * El resto de /admin/* sí requiere sesión.
 */
const PUBLIC_ADMIN_ROUTES = new Set([
  "/admin",
  "/admin/registro",
  "/admin/recuperar",
  "/admin/reset",
]);

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Proteger rutas de /admin excepto las públicas
  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_ROUTES.has(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};