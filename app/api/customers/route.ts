// app/api/customers/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    // Traemos ID y Nombre. Asumo que tienes un cliente "Público General" (id 1 usualmente)
    const [rows] = await connection.query('SELECT idcliente, nombre_cliente FROM cliente WHERE estado = 1 ORDER BY nombre_cliente ASC');
    connection.release();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Error cargando clientes' }, { status: 500 });
  }
}