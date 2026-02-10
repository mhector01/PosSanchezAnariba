import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// En Next.js reciente, 'params' es una Promesa
export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    // 1. Esperamos a que se resuelvan los parámetros
    const { id } = await params;
    const idUsuario = id;

    const connection = await pool.getConnection();

    // 2. Obtener ID del empleado asociado
    const [rows]: any = await connection.query('SELECT idempleado FROM usuario WHERE idusuario = ?', [idUsuario]);
    
    if (rows.length > 0) {
        const idEmpleado = rows[0].idempleado;
        
        // 3. Desactivar Usuario
        await connection.query('UPDATE usuario SET estado = 0 WHERE idusuario = ?', [idUsuario]);
        
        // 4. Desactivar Empleado
        await connection.query('UPDATE empleado SET estado = 0 WHERE idempleado = ?', [idEmpleado]);
    }

    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}