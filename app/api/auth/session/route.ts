import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// ASEGÚRATE DE QUE ESTA CLAVE SEA LA MISMA QUE EN TU LOGIN
function getSecretKey() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET no está configurado');
  return new TextEncoder().encode(jwtSecret);
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token');

  if (!token) {
    // Si no hay token, devolvemos null
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token.value, getSecretKey());
    
    // Devolvemos el rol al frontend
    return NextResponse.json({
      user: {
        id: payload.id,
        username: payload.username,
        name: payload.name,
        tipo_usuario: payload.role,
        idbodega: payload.warehouseId || null,
        bodega_nombre: payload.warehouseName || null
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
