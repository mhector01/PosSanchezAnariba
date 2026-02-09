import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET: Obtener configuración actual
export async function GET() {
  try {
    const connection = await pool.getConnection();
    // Obtenemos el único registro de configuración
    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM parametro LIMIT 1');
    connection.release();
    return NextResponse.json(rows[0] || {});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar configuración
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const connection = await pool.getConnection();

    // Usamos el SP de tu base de datos
    await connection.query(
      `CALL sp_update_parametro(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.idparametro,
        body.nombre_empresa,
        body.propietario,
        body.numero_nit,
        body.numero_nrc,
        body.porcentaje_iva,
        body.porcentaje_retencion || 0,
        body.monto_retencion || 0,
        body.direccion_empresa,
        body.idcurrency || 1 // Por defecto 1 (Lempiras)
      ]
    );

    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}