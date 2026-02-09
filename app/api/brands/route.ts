import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();
  const [rows] = await connection.query('SELECT * FROM marca WHERE estado = 1');
  connection.release();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const { nombre_marca } = await request.json();
    const connection = await pool.getConnection();
    const [result]: any = await connection.query('INSERT INTO marca (nombre_marca, estado) VALUES (?, 1)', [nombre_marca]);
    connection.release();
    // AQUI EL CAMBIO
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}