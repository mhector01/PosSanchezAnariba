import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows]: any = await connection.query('SELECT * FROM parametro LIMIT 1');
    connection.release();
    return NextResponse.json(rows[0] || {});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}