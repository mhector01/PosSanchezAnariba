import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { 
      idproveedor, 
      numero_comprobante, 
      fecha_comprobante, 
      tipo_pago, // 'Contado' o 'Credito'
      cart, 
      total 
    } = body;

    if (!cart || cart.length === 0) return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });

    await connection.beginTransaction();

    // 1. INSERTAR ENCABEZADO DE COMPRA
    const [resCompra] = await connection.query<ResultSetHeader>(
      `INSERT INTO compra (
        fecha_compra, idproveedor, tipo_pago, numero_comprobante, 
        tipo_comprobante, fecha_comprobante, sumas, iva, exento, retenido, 
        total, sonletras, estado
      ) VALUES (NOW(), ?, ?, ?, 'FACTURA', ?, ?, 0, 0, 0, ?, '', 1)`,
      [
        idproveedor, 
        tipo_pago, 
        numero_comprobante, 
        fecha_comprobante, 
        Number(total), // Asumimos todo a sumas por simplicidad, o calcula IVA si aplica
        Number(total)
      ]
    );

    const idCompra = resCompra.insertId;

    // 2. PROCESAR CADA PRODUCTO
    for (const item of cart) {
        const costo = Number(item.precio_compra); // Costo nuevo
        const cantidad = Number(item.cantidad);
        const importe = costo * cantidad;
        const vence = item.fecha_vencimiento || null;

        // A. Insertar Detalle
        await connection.query(
            `INSERT INTO detallecompra (idcompra, idproducto, fecha_vence, cantidad, precio_unitario, exento, importe)
             VALUES (?, ?, ?, ?, ?, 0, ?)`,
            [idCompra, item.idproducto, vence, cantidad, costo, importe]
        );

        // B. Actualizar Producto (Stock y Nuevo Costo)
        await connection.query(
            `UPDATE producto SET 
                stock = stock + ?, 
                precio_compra = ? 
             WHERE idproducto = ?`,
            [cantidad, costo, item.idproducto]
        );

        // C. Registrar en Historial de Entradas (Kardex)
        await connection.query(
            `INSERT INTO entrada (mes_inventario, fecha_entrada, descripcion_entrada, cantidad_entrada, precio_unitario_entrada, costo_total_entrada, idproducto, idcompra)
             VALUES (DATE_FORMAT(NOW(),'%Y-%m'), NOW(), ?, ?, ?, ?, ?, ?)`,
            [`COMPRA FACT #${numero_comprobante}`, cantidad, costo, importe, item.idproducto, idCompra]
        );

        // D. Manejar Perecederos (Fechas de Vencimiento)
        if (vence) {
            // Verificar si ya existe un lote con esa fecha para ese producto
            const [existBatch]: any = await connection.query(
                `SELECT cantidad_perecedero FROM perecedero WHERE idproducto = ? AND fecha_vencimiento = ?`,
                [item.idproducto, vence]
            );

            if (existBatch.length > 0) {
                // Sumar al lote existente
                await connection.query(
                    `UPDATE perecedero SET cantidad_perecedero = cantidad_perecedero + ? 
                     WHERE idproducto = ? AND fecha_vencimiento = ?`,
                    [cantidad, item.idproducto, vence]
                );
            } else {
                // Crear nuevo lote
                await connection.query(
                    `INSERT INTO perecedero (fecha_vencimiento, cantidad_perecedero, idproducto, estado)
                     VALUES (?, ?, ?, 1)`,
                    [vence, cantidad, item.idproducto]
                );
            }
        }
    }

    await connection.commit();
    connection.release();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}