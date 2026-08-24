import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const requested = Number(searchParams.get('warehouseId')) || session.warehouseId;
  if (!requested || (session.role !== 1 && requested !== session.warehouseId)) {
    return NextResponse.json({ error: 'No tienes acceso a esa bodega' }, { status: 403 });
  }
  const q = `%${searchParams.get('q') || ''}%`;
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT p.idproducto, p.codigo_barra, p.codigo_interno, p.nombre_producto,
              p.precio_venta, p.stock AS stock_total, COALESCE(bp.stock, 0) AS stock
       FROM producto p
       LEFT JOIN bodega_producto bp ON bp.idproducto = p.idproducto AND bp.idbodega = ?
       WHERE p.estado = 1 AND (p.nombre_producto LIKE ? OR p.codigo_barra LIKE ? OR p.codigo_interno LIKE ?)
       ORDER BY p.nombre_producto LIMIT 100`, [requested, q, q, q]
    );
    return NextResponse.json(rows);
  } finally { connection.release(); }
}
