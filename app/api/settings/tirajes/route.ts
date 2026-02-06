import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Listar Tirajes (Usamos la vista para ver nombres)
export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM view_comprobantes ORDER BY idcomprobante');
    connection.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Nuevo Tiraje
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fecha_resolucion, numero_resolucion, serie, desde, hasta, idcomprobante } = body;
    
    // Calculamos disponibles iniciales
    const disponibles = Number(hasta) - Number(desde) + 1;

    const connection = await pool.getConnection();
    await connection.query(
      `CALL sp_insert_tiraje_comprobante(?, ?, ?, ?, ?, ?, ?)`,
      [fecha_resolucion, numero_resolucion, serie, desde, hasta, disponibles, idcomprobante]
    );
    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}