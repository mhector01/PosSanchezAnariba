import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // 1. Obtener la cookie
  const token = request.cookies.get('session_token')?.value;

  // 2. Definir ruta actual
  const path = request.nextUrl.pathname;

  // 3. Rutas públicas (Login y estáticos)
  const isPublicPath = path === '/login';

  // --- LÓGICA DE PROTECCIÓN ---

  // A. Si no hay token y la ruta NO es pública -> Mandar al Login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // B. Si hay token, verificar si es válido
  if (token) {
    try {
      const secret = new TextEncoder().encode('CLAVE_SECRETA_SUPER_SEGURA_CAMBIAME');
      await jwtVerify(token, secret);

      // Si el token es válido y estamos en Login, mandar al POS (ya está logueado)
      if (isPublicPath) {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (error) {
      // Si el token es inválido (expiró o fue manipulado), borrarlo y mandar al login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas corre el middleware
export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - api (rutas API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};