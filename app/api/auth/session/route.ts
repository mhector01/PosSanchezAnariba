import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// ASEGÚRATE DE QUE ESTA CLAVE SEA LA MISMA QUE EN TU LOGIN
const SECRET_KEY = new TextEncoder().encode('CLAVE_SECRETA_SUPER_SEGURA_CAMBIAME');

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token');

  if (!token) {
    // Si no hay token, devolvemos null
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token.value, SECRET_KEY);
    
    // Devolvemos el rol al frontend
    return NextResponse.json({
      user: {
        id: payload.id,
        username: payload.username,
        name: payload.name,
        tipo_usuario: payload.role // <--- ESTO ACTIVA LA EDICIÓN DE PRECIOS
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}