import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Listar todos los rangos históricos
export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT t.*, c.nombre_comprobante 
      FROM tiraje_comprobante t
      JOIN comprobante c ON t.idcomprobante = c.idcomprobante
      ORDER BY t.estado DESC, t.fecha_resolucion DESC
    `);
    connection.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo rango (Cuando se vence el anterior)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const connection = await pool.getConnection();

    // 1. Desactivar el rango anterior de este mismo tipo (Opcional, pero recomendado)
    await connection.query(
      'UPDATE tiraje_comprobante SET estado = 0 WHERE idcomprobante = ?', 
      [body.idcomprobante]
    );

    // 2. Insertar el nuevo rango
    await connection.query(
      `CALL sp_insert_tiraje_comprobante(?, ?, ?, ?, ?, ?, ?)`,
      [
        body.fecha_resolucion,
        body.numero_resolucion,
        body.serie,
        body.desde,
        body.hasta,
        body.disponibles, // Al inicio, disponibles = (hasta - desde + 1)
        body.idcomprobante
      ]
    );

    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}