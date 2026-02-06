import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    // CONSULTA SIMPLIFICADA: La vista ya trae 'siguiente_numero' calculado
    const [rows]: any = await connection.query(
      `SELECT 
        idcomprobante, 
        nombre_comprobante, 
        serie, 
        siguiente_numero, -- <--- Ya viene listo de la BD
        disponibles 
       FROM view_comprobantes 
       WHERE estado = 1 AND disponibles > 0
       ORDER BY idcomprobante`
    );
    
    connection.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo tipo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre } = body;
    const connection = await pool.getConnection();
    await connection.query('CALL sp_insert_comprobante(?)', [nombre]);
    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar estado/nombre
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, estado } = body;
    const connection = await pool.getConnection();
    await connection.query('CALL sp_update_comprobante(?, ?, ?)', [id, nombre, estado]);
    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}