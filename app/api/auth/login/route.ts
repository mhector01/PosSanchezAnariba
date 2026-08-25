import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET no está configurado');
const SECRET_KEY = new TextEncoder().encode(jwtSecret);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const connection = await pool.getConnection();

    // 1. Usamos 'view_usuarios' del SQL proporcionado para obtener datos completos
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT vu.*, COALESCE(u.idbodega, bp.idbodega) AS idbodega,
              COALESCE(b.nombre, bp.nombre) AS bodega_nombre
       FROM view_usuarios vu
       JOIN usuario u ON u.idusuario=vu.idusuario
       LEFT JOIN bodega b ON b.idbodega=u.idbodega
       LEFT JOIN bodega bp ON bp.principal=1
       WHERE vu.usuario = ?`,
      [username]
    );
    
    connection.release();

    if (rows.length === 0) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });

    const user = rows[0];

    // 2. Verificar Contraseña
    const isValid = await bcrypt.compare(password, user.contrasena);
    if (!isValid) return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });

    // 3. Crear Token con datos útiles para el frontend
    const token = await new SignJWT({ 
      id: user.idusuario, 
      username: user.usuario,
      name: `${user.nombre_empleado} ${user.apellido_empleado}`, // Dato de view_usuarios
      role: user.tipo_usuario,
      warehouseId: user.idbodega,
      warehouseName: user.bodega_nombre
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET_KEY);

    // 4. Guardar Cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: false, // false para localhost/http
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return NextResponse.json({ success: true, role: user.tipo_usuario });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error servidor' }, { status: 500 });
  }
}
