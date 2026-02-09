import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// ---------------------------------------------------------------------
// 1. GET: OBTENER HISTORIAL DE VENTAS
// ---------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const q = searchParams.get('q') || '';
    const orderBy = searchParams.get('orderBy') || 'idventa';
    const orderDir = searchParams.get('orderDir') === 'asc' ? 'ASC' : 'DESC';

    const allowedColumns = ['idventa', 'fecha_venta', 'cliente', 'nombre_cliente', 'total'];
    const sortColumn = allowedColumns.includes(orderBy) ? orderBy : 'idventa';
    // Mapeo: en la vista la columna es 'cliente'
    const finalSortColumn = sortColumn === 'nombre_cliente' ? 'cliente' : sortColumn;

    const connection = await pool.getConnection();

    let whereClause = '';
    let params: any[] = [];

    if (q) {
      const term = `%${q}%`;
      whereClause = `WHERE (cliente LIKE ? OR numero_venta LIKE ?)`;
      params = [term, term];
    }

    // Contar
    const [countRows]: any = await connection.query(
      `SELECT COUNT(DISTINCT idventa) as total FROM view_ventas ${whereClause}`, params
    );
    const totalItems = countRows[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Listar
    const queryParams = [...params, limit, offset];
    
    // Usamos TRY interno en la query por si falla la tabla historial_ediciones
    try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT 
              v.idventa, v.numero_venta, v.fecha_venta, v.tipo_pago, 
              v.cliente as nombre_cliente, v.empleado as usuario, 
              v.total, v.estado_venta,
              (SELECT COUNT(*) FROM historial_ediciones h WHERE h.idventa = v.idventa) as total_ediciones
           FROM view_ventas v
           ${whereClause} 
           GROUP BY v.idventa 
           ORDER BY ${finalSortColumn} ${orderDir} 
           LIMIT ? OFFSET ?`, 
          queryParams
        );
        connection.release();
        return NextResponse.json({ data: rows, pagination: { page, limit, totalItems, totalPages } });
    } catch (innerError) {
        // Fallback si historial falla: devolvemos ventas sin conteo de ediciones
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT v.idventa, v.numero_venta, v.fecha_venta, v.tipo_pago, v.cliente as nombre_cliente, 
             v.empleado as usuario, v.total, v.estado_venta, 0 as total_ediciones
             FROM view_ventas v ${whereClause} GROUP BY v.idventa ORDER BY ${finalSortColumn} ${orderDir} LIMIT ? OFFSET ?`, 
            queryParams
        );
        connection.release();
        return NextResponse.json({ data: rows, pagination: { page, limit, totalItems, totalPages } });
    }

  } catch (error: any) {
    return NextResponse.json({ data: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 }, error: error.message });
  }
}

// ---------------------------------------------------------------------
// 2. POST: CREAR NUEVA VENTA (USANDO PROCEDIMIENTO)
// ---------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      cart, total, tipo_pago, pago_efectivo,
      id_cliente, notas = '', id_usuario, id_comprobante 
    } = body;

    if (!cart || cart.length === 0) {
        return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Cálculos para parámetros del SP
      const subtotal = Number(total) / 1.15;
      const iva = Number(total) - subtotal;
      const cambio = Number(pago_efectivo) - Number(total);

      // --- LLAMADA AL SP (18 Parámetros exactos según tu SQL) ---
      /* Orden del SP:
         1.p_tipo_pago, 2.p_tipo_comprobante, 3.p_sumas, 4.p_iva, 5.p_exento, 
         6.p_retenido, 7.p_descuento, 8.p_total, 9.p_sonletras, 10.p_pago_efectivo, 
         11.p_pago_tarjeta, 12.p_numero_tarjeta, 13.p_tarjeta_habiente, 14.p_cambio, 
         15.p_estado, 16.p_idcliente, 17.p_idusuario, 18.p_notas
      */
      await connection.query(
        `CALL sp_insert_venta(?, ?, ?, ?, 0, 0, 0, ?, '', ?, 0, '', '', ?, 1, ?, ?, ?)`,
        [
          tipo_pago,                      // 1
          id_comprobante || 1,            // 2
          subtotal,                       // 3
          iva,                            // 4
          total,                          // 8
          pago_efectivo || total,         // 10
          cambio,                         // 14
          id_cliente || null,             // 16
          id_usuario || 1,                // 17
          notas                           // 18
        ]
      );
      
      // Obtener el ID de la venta recién creada
      const [rows]: any = await connection.query('SELECT MAX(idventa) as id FROM venta');
      const idVenta = rows[0].id;

      // Insertar Detalles
      for (const item of cart) {
         const fechaVencimiento = item.fecha_vencimiento || null; 

         // Llamada a sp_insert_detalleventa (7 Parámetros)
         /* 1.idprod, 2.cant, 3.precio, 4.exento, 5.desc, 6.fecha_vence, 7.importe */
         await connection.query(
           `CALL sp_insert_detalleventa(?, ?, ?, 0, 0, ?, ?)`,
           [
              item.idproducto, 
              item.cantidad, 
              item.precio_numerico, 
              fechaVencimiento,
              (item.cantidad * item.precio_numerico)
           ]
         );
      }

      // Finalizar venta
      await connection.query('CALL sp_finalizar_venta(?)', [idVenta]);

      await connection.commit();
      return NextResponse.json({ success: true, id_venta: idVenta });

    } catch (error) {
      await connection.rollback();
      console.error("❌ Error Transacción Venta:", error);
      throw error; 
    } finally {
      connection.release();
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}