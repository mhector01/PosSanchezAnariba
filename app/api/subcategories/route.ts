import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Obtener subcategorías (Opcional: filtrar por idcategoria)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const catId = searchParams.get('catId'); // Recibimos el ID de la categoría padre

    const connection = await pool.getConnection();
    let query = 'SELECT * FROM subcategoria WHERE estado = 1';
    const params: any[] = [];

    if (catId && catId !== '0') {
        query += ' AND idcategoria = ?';
        params.push(catId);
    }
    
    const [rows] = await connection.query(query, params);
    connection.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear subcategoría
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre_subcategoria, idcategoria } = body;

    if (!nombre_subcategoria || !idcategoria) {
      return NextResponse.json({ error: "Nombre y Categoría requeridos" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    const [result]: any = await connection.query(
      'INSERT INTO subcategoria (nombre_subcategoria, idcategoria, estado) VALUES (?, ?, 1)', 
      [nombre_subcategoria, idcategoria]
    );
    connection.release();

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}