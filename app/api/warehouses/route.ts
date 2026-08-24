import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const connection = await pool.getConnection();
  try {
    const admin = session.role === 1;
    const [rows] = await connection.query(
      `SELECT b.idbodega, b.nombre, b.descripcion, b.principal, b.estado,
              COUNT(DISTINCT u.idusuario) usuarios,
              COALESCE(SUM(bp.stock), 0) unidades
       FROM bodega b
       LEFT JOIN usuario u ON u.idbodega = b.idbodega AND u.estado = 1
       LEFT JOIN bodega_producto bp ON bp.idbodega = b.idbodega
       WHERE b.estado = 1 AND (? = 1 OR b.idbodega = ?)
       GROUP BY b.idbodega ORDER BY b.principal DESC, b.nombre`,
      [admin ? 1 : 0, session.warehouseId]
    );
    return NextResponse.json(rows);
  } finally { connection.release(); }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 1) return NextResponse.json({ error: 'Solo el administrador puede crear bodegas' }, { status: 403 });
  const { nombre, descripcion = '' } = await request.json();
  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  const connection = await pool.getConnection();
  try {
    const [result]: any = await connection.query('INSERT INTO bodega(nombre, descripcion) VALUES (?, ?)', [nombre.trim(), descripcion.trim()]);
    await connection.query(
      `INSERT INTO bodega_producto(idbodega, idproducto, stock)
       SELECT ?, idproducto, 0 FROM producto`, [result.insertId]
    );
    return NextResponse.json({ success: true, idbodega: result.insertId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.code === 'ER_DUP_ENTRY' ? 'Ya existe una bodega con ese nombre' : error.message }, { status: 400 });
  } finally { connection.release(); }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 1) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { idbodega, nombre, descripcion = '', estado = 1 } = await request.json();
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'UPDATE bodega SET nombre = ?, descripcion = ?, estado = ? WHERE idbodega = ? AND principal = 0',
      [nombre?.trim(), descripcion.trim(), estado ? 1 : 0, idbodega]
    );
    return NextResponse.json({ success: true });
  } finally { connection.release(); }
}
