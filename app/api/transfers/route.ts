import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT t.*, bo.nombre bodega_origen, bd.nombre bodega_destino,
              CONCAT(ec.nombre_empleado,' ',ec.apellido_empleado) creado_por_nombre,
              COUNT(d.iddetalle) productos, COALESCE(SUM(d.cantidad),0) unidades
       FROM transferencia_bodega t
       JOIN bodega bo ON bo.idbodega=t.idbodega_origen
       JOIN bodega bd ON bd.idbodega=t.idbodega_destino
       JOIN usuario uc ON uc.idusuario=t.creado_por JOIN empleado ec ON ec.idempleado=uc.idempleado
       LEFT JOIN transferencia_bodega_detalle d ON d.idtransferencia=t.idtransferencia
       WHERE (? = 1 OR t.idbodega_origen = ? OR t.idbodega_destino = ?)
       GROUP BY t.idtransferencia ORDER BY t.idtransferencia DESC`,
      [session.role === 1 ? 1 : 0, session.warehouseId, session.warehouseId]
    );
    return NextResponse.json(rows);
  } finally { connection.release(); }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { idbodega_origen, idbodega_destino, observacion = '', items } = await request.json();
  const origin = Number(idbodega_origen);
  const destination = Number(idbodega_destino);
  if (!origin || !destination || origin === destination || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: 'Origen, destino y productos válidos son obligatorios' }, { status: 400 });
  }
  if (session.role !== 1 && origin !== session.warehouseId) return NextResponse.json({ error: 'Solo puedes transferir desde tu bodega' }, { status: 403 });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result]: any = await connection.query(
      `INSERT INTO transferencia_bodega(idbodega_origen,idbodega_destino,observacion,creado_por)
       VALUES (?,?,?,?)`,
      [origin, destination, observacion, session.id]
    );
    const id = result.insertId;
    await connection.query('UPDATE transferencia_bodega SET numero=? WHERE idtransferencia=?', [`TR-${String(id).padStart(7,'0')}`, id]);
    for (const item of items) {
      const quantity = Number(item.cantidad);
      if (!item.idproducto || quantity <= 0) throw new Error('Todos los productos deben tener una cantidad mayor que cero');
      await connection.query('INSERT INTO transferencia_bodega_detalle(idtransferencia,idproducto,cantidad) VALUES (?,?,?)', [id, item.idproducto, quantity]);
    }
    await connection.commit();
    return NextResponse.json({ success: true, idtransferencia: id }, { status: 201 });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally { connection.release(); }
}
