import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

const SECRET_KEY = new TextEncoder().encode('CLAVE_SECRETA_SUPER_SEGURA_CAMBIAME');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const connection = await pool.getConnection();

    // 1. Usamos 'view_usuarios' del SQL proporcionado para obtener datos completos
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM view_usuarios WHERE usuario = ?', 
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
      role: user.tipo_usuario // 1: Admin, 2: Gerente
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