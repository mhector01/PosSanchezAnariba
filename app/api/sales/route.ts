import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ---------------------------------------------------------------------
// 1. GET: OBTENER HISTORIAL DE VENTAS (Con filtros, orden y ediciones)
// ---------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Parámetros de Filtro y Orden
    const q = searchParams.get('q') || '';
    const orderBy = searchParams.get('orderBy') || 'idventa';
    const orderDir = searchParams.get('orderDir') === 'asc' ? 'ASC' : 'DESC';

    // Validación de seguridad para columnas de ordenamiento (Evitar inyección SQL)
    const allowedColumns = ['idventa', 'fecha_venta', 'cliente', 'nombre_cliente', 'total'];
    const sortColumn = allowedColumns.includes(orderBy) ? orderBy : 'idventa';
    // Mapeo especial: si el front pide 'nombre_cliente', en la vista es 'cliente'
    const finalSortColumn = sortColumn === 'nombre_cliente' ? 'cliente' : sortColumn;

    const connection = await pool.getConnection();

    // Construcción del WHERE
    let whereClause = '';
    let params: any[] = [];

    if (q) {
      const term = `%${q}%`;
      // Buscamos por nombre de cliente o por número de ID/Ticket
      whereClause = `WHERE (cliente LIKE ? OR idventa LIKE ? OR numero_venta LIKE ?)`;
      params = [term, term, term];
    }

    // 1. Contar Total de Registros (Para paginación)
    // Usamos COUNT(DISTINCT idventa) porque la vista puede traer detalles duplicados
    const [countRows] = await connection.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT idventa) as total FROM view_ventas ${whereClause}`, 
      params
    );
    
    const totalItems = countRows.length > 0 ? countRows[0].total : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Obtener Datos (Con conteo de ediciones)
    // Agregamos limit y offset a los parámetros
    const queryParams = [...params, limit, offset];
    
    /* EXPLICACIÓN DE LA CONSULTA:
       - Seleccionamos los datos principales de la venta.
       - Usamos una SUB-CONSULTA para contar cuántas veces aparece el ID en 'historial_ediciones'.
       - Agrupamos por idventa para no traer una fila por cada producto vendido.
    */
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT 
          idventa, 
          numero_venta, 
          fecha_venta, 
          tipo_pago, 
          cliente as nombre_cliente, 
          empleado as usuario,
          total,
          estado_venta,
          -- Subconsulta para saber si fue editada
          (SELECT COUNT(*) FROM historial_ediciones h WHERE h.idventa = view_ventas.idventa) as total_ediciones
       FROM view_ventas 
       ${whereClause} 
       GROUP BY idventa 
       ORDER BY ${finalSortColumn} ${orderDir} 
       LIMIT ? OFFSET ?`, 
      queryParams
    );

    connection.release();

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });

  } catch (error: any) {
    console.error("❌ ERROR GET SALES:", error);
    return NextResponse.json({ error: 'Error interno: ' + error.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------
// 2. POST: CREAR NUEVA VENTA
// ---------------------------------------------------------------------
// ... (GET se mantiene igual) ...

// ---------------------------------------------------------------------
// 2. POST: CREAR NUEVA VENTA (CORREGIDO)
// ---------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      cart, 
      total, 
      tipo_pago, 
      pago_efectivo,
      id_cliente,
      notas = '',
      id_usuario,
      id_comprobante // <--- 1. RECIBIMOS EL ID DEL COMPROBANTE
    } = body;

    if (!cart || cart.length === 0) {
        return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 2. Insertar Cabecera de Venta
      // CORRECCIÓN: Cambiamos el '1' fijo por un '?' y pasamos la variable
      await connection.query(
        `CALL sp_insert_venta(?, ?, ?, 0, 0, 0, 0, ?, '', ?, 0, '', '', ?, 1, ?, ?, ?)`,
        [
          tipo_pago,                      
          id_comprobante || 1,            // <--- 2. AQUÍ ESTABA EL ERROR (Antes decía '1' fijo)
          total,                          
          total,                          
          pago_efectivo || total,         
          (pago_efectivo || total) - total, 
          id_cliente || 0,                
          id_usuario || 1,                
          notas                           
        ]
      );

      // ... (El resto sigue igual: obtener ID, insertar detalles, finalizar) ...
      
      const [rows]: any = await connection.query('SELECT MAX(idventa) as id FROM venta');
      const idVenta = rows[0].id;

      for (const item of cart) {
         const fechaVencimiento = item.fecha_vencimiento && item.fecha_vencimiento !== '' 
            ? item.fecha_vencimiento 
            : '2000-01-01'; 

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