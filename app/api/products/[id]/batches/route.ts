import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const connection = await pool.getConnection();

    // Consultamos la tabla 'perecedero' para ver qué lotes tienen stock
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT 
         fecha_vencimiento, 
         cantidad_perecedero 
       FROM perecedero 
       WHERE idproducto = ? 
       AND cantidad_perecedero > 0 
       AND estado = 1
       ORDER BY fecha_vencimiento ASC`, // Ordenar por fecha más próxima (FEFO)
      [id]
    );

    connection.release();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Error cargando lotes' }, { status: 500 });
  }
}