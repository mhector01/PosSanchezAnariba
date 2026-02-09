import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const connection = await pool.getConnection();
  const [rows] = await connection.query('SELECT * FROM categoria WHERE estado = 1');
  connection.release();
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const { nombre_categoria } = await request.json();
    const connection = await pool.getConnection();
    const [result]: any = await connection.query('INSERT INTO categoria (nombre_categoria, estado) VALUES (?, 1)', [nombre_categoria]);
    connection.release();
    // AQUI EL CAMBIO: Devolvemos el ID
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}