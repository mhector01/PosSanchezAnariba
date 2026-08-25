import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await context.params;
  const { action } = await request.json();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [transfers]: any = await connection.query('SELECT * FROM transferencia_bodega WHERE idtransferencia=? FOR UPDATE', [id]);
    if (!transfers.length) throw new Error('Transferencia no encontrada');
    const transfer = transfers[0];
    const admin = session.role === 1;
    if (action === 'send') {
      if (transfer.estado !== 'PENDIENTE') throw new Error('Solo se pueden enviar transferencias pendientes');
      if (!admin && transfer.idbodega_origen !== session.warehouseId) throw new Error('No tienes acceso a la bodega de origen');
      const [items]: any = await connection.query('SELECT * FROM transferencia_bodega_detalle WHERE idtransferencia=?', [id]);
      for (const item of items) {
        const [result]: any = await connection.query(
          `UPDATE bodega_producto SET stock=stock-? WHERE idbodega=? AND idproducto=? AND stock>=?`,
          [item.cantidad, transfer.idbodega_origen, item.idproducto, item.cantidad]
        );
        if (!result.affectedRows) throw new Error(`Existencia insuficiente para el producto ${item.idproducto}`);
      }
      await connection.query("UPDATE transferencia_bodega SET estado='EN_TRANSITO', enviado_por=?, enviado_en=NOW() WHERE idtransferencia=?", [session.id, id]);
    } else if (action === 'receive') {
      if (transfer.estado !== 'EN_TRANSITO') throw new Error('La transferencia todavía no está en tránsito');
      if (!admin && transfer.idbodega_destino !== session.warehouseId) throw new Error('Solo la bodega destino puede recibirla');
      const [items]: any = await connection.query('SELECT * FROM transferencia_bodega_detalle WHERE idtransferencia=?', [id]);
      for (const item of items) {
        await connection.query(
          `INSERT INTO bodega_producto(idbodega,idproducto,stock) VALUES (?,?,?)
           ON DUPLICATE KEY UPDATE stock=stock+VALUES(stock)`,
          [transfer.idbodega_destino, item.idproducto, item.cantidad]
        );
      }
      await connection.query("UPDATE transferencia_bodega SET estado='RECIBIDA', recibido_por=?, recibido_en=NOW() WHERE idtransferencia=?", [session.id, id]);
    } else if (action === 'cancel') {
      if (transfer.estado !== 'PENDIENTE') throw new Error('Solo se pueden cancelar transferencias pendientes');
      if (!admin && transfer.idbodega_origen !== session.warehouseId) throw new Error('No autorizado');
      await connection.query("UPDATE transferencia_bodega SET estado='CANCELADA' WHERE idtransferencia=?", [id]);
    } else throw new Error('Acción no válida');
    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally { connection.release(); }
}
