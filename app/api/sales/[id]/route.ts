import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const connection = await pool.getConnection();

    // 1. Obtener Cabecera con datos Fiscales PRIORIZANDO EL ACTIVO/RECIENTE
    /* CORRECCIÓN APLICADA:
       Se cambió "ORDER BY tc.activo" por "ORDER BY tc.estado".
       Esto soluciona el error "Unknown column 'tc.activo'".
    */
    const [saleRows] = await connection.query<RowDataPacket[]>(`
      SELECT 
        v.*,
        c.nombre_comprobante,
        -- SERIE
        (SELECT serie FROM tiraje_comprobante tc 
         WHERE tc.idcomprobante = v.tipo_comprobante 
         AND v.numero_comprobante BETWEEN tc.desde AND tc.hasta 
         ORDER BY tc.estado DESC, tc.idtiraje DESC 
         LIMIT 1) as serie_autorizada,
        -- CAI
        (SELECT numero_resolucion FROM tiraje_comprobante tc 
         WHERE tc.idcomprobante = v.tipo_comprobante 
         AND v.numero_comprobante BETWEEN tc.desde AND tc.hasta 
         ORDER BY tc.estado DESC, tc.idtiraje DESC 
         LIMIT 1) as cai_rango,
        -- FECHA LIMITE
        (SELECT fecha_resolucion FROM tiraje_comprobante tc 
         WHERE tc.idcomprobante = v.tipo_comprobante 
         AND v.numero_comprobante BETWEEN tc.desde AND tc.hasta 
         ORDER BY tc.estado DESC, tc.idtiraje DESC 
         LIMIT 1) as fecha_limite,
        -- RANGO INICIAL
        (SELECT desde FROM tiraje_comprobante tc 
         WHERE tc.idcomprobante = v.tipo_comprobante 
         AND v.numero_comprobante BETWEEN tc.desde AND tc.hasta 
         ORDER BY tc.estado DESC, tc.idtiraje DESC 
         LIMIT 1) as rango_inicial,
        -- RANGO FINAL
        (SELECT hasta FROM tiraje_comprobante tc 
         WHERE tc.idcomprobante = v.tipo_comprobante 
         AND v.numero_comprobante BETWEEN tc.desde AND tc.hasta 
         ORDER BY tc.estado DESC, tc.idtiraje DESC 
         LIMIT 1) as rango_final
      FROM view_ventas v
      JOIN comprobante c ON v.tipo_comprobante = c.idcomprobante
      WHERE v.idventa = ?
    `, [id]);
    
    if (saleRows.length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // 2. Obtener Detalles
    const [itemsRows] = await connection.query<RowDataPacket[]>(
      `SELECT 
          dv.idproducto, 
          dv.fecha_vence, 
          dv.cantidad, 
          dv.precio_unitario AS precio_cobrado, 
          dv.precio_unitario AS precio_venta,    
          dv.importe as subtotal, 
          p.nombre_producto, 
          p.codigo_barra,
          p.exento as is_exento
       FROM detalleventa dv
       JOIN producto p ON dv.idproducto = p.idproducto
       WHERE dv.idventa = ?`, 
      [id]
    );

    // 3. Obtener Historial
    const [historyRows] = await connection.query<RowDataPacket[]>(
      `SELECT h.*, u.usuario 
       FROM historial_ediciones h
       JOIN usuario u ON h.idusuario = u.idusuario
       WHERE h.idventa = ?
       ORDER BY h.fecha_edicion DESC`,
      [id]
    );

    connection.release();

    const safeItems = itemsRows.map((item: any) => ({
      ...item,
      cantidad: Number(item.cantidad),
      precio_cobrado: Number(item.precio_cobrado),
      subtotal: Number(item.cantidad) * Number(item.precio_cobrado)
    }));

    return NextResponse.json({
      sale: saleRows[0],
      items: safeItems,
      history: historyRows
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener ticket' }, { status: 500 });
  }
}

// PUT: GUARDAR CAMBIOS DE LA EDICIÓN
export async function PUT(request: Request, { params }: { params: Params }) {
    const connection = await pool.getConnection();
    try {
        const { id } = await params;
        const body = await request.json();
        const { header, items, id_usuario_editor } = body; 

        await connection.beginTransaction();

        const [prevRows]: any = await connection.query('SELECT total FROM venta WHERE idventa = ?', [id]);
        const totalAnterior = prevRows[0]?.total || 0;

        await connection.query(
        `UPDATE venta SET idcliente = ?, fecha_venta = ?, tipo_pago = ?, notas = ?, total = ? WHERE idventa = ?`,
        [header.idcliente || null, header.fecha_venta, header.tipo_pago, header.notas, header.total, id]
        );

        await connection.query('DELETE FROM detalleventa WHERE idventa = ?', [id]);

        if (items && items.length > 0) {
        const values = items.map((item: any) => [
            id, item.idproducto, item.cantidad, item.precio, null, 0, 0, item.cantidad * item.precio
        ]);
        await connection.query(`INSERT INTO detalleventa (idventa, idproducto, cantidad, precio_unitario, fecha_vence, exento, descuento, importe) VALUES ?`, [values]);
        }

        if (id_usuario_editor) {
            await connection.query(
                `INSERT INTO historial_ediciones (idventa, fecha_edicion, idusuario, accion, total_anterior, total_nuevo) VALUES (?, NOW(), ?, 'EDICION', ?, ?)`,
                [id, id_usuario_editor, totalAnterior, header.total]
            );
        }

        await connection.commit();
        connection.release();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}