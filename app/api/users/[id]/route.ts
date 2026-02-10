import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const idUsuario = params.id;
    const connection = await pool.getConnection();

    // 1. Obtener ID del empleado asociado
    const [rows]: any = await connection.query('SELECT idempleado FROM usuario WHERE idusuario = ?', [idUsuario]);
    
    if (rows.length > 0) {
        const idEmpleado = rows[0].idempleado;
        
        // 2. Desactivar Usuario
        await connection.query('UPDATE usuario SET estado = 0 WHERE idusuario = ?', [idUsuario]);
        
        // 3. Desactivar Empleado (Opcional, depende de tu lógica de negocio, aquí lo hacemos para ser consistentes)
        await connection.query('UPDATE empleado SET estado = 0 WHERE idempleado = ?', [idEmpleado]);
    }

    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}