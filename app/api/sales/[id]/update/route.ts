import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // 1. Desempaquetar la promesa de params (Requerido en Next.js 15)
  const { id } = await params;
  const body = await request.json();
  
  const { 
    cart, 
    total, 
    tipo_pago,
    pago_efectivo,
    id_cliente,
    notas,
    fecha_venta 
  } = body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ---------------------------------------------------------
    // PASO 1: REVERTIR (Devolver productos al stock y limpiar detalle)
    // ---------------------------------------------------------
    // Este SP ya lo creaste y funciona bien: devuelve lo que había antes.
    await connection.query('CALL sp_revertir_venta(?)', [id]);

    // ---------------------------------------------------------
    // PASO 2: ACTUALIZAR CABECERA DE VENTA
    // ---------------------------------------------------------
    await connection.query(
      `UPDATE venta SET 
        idcliente = ?, 
        fecha_venta = ?, 
        tipo_pago = ?, 
        total = ?, 
        sumas = ?, 
        pago_efectivo = ?, 
        cambio = ?, 
        notas = ?
       WHERE idventa = ?`,
      [
        id_cliente,
        fecha_venta, 
        tipo_pago,
        total,
        total, 
        pago_efectivo,
        (pago_efectivo - total), // Recálculo del cambio
        notas,
        id // Aseguramos que editamos ESTA venta
      ]
    );

    // ---------------------------------------------------------
    // PASO 3: INSERTAR LOS NUEVOS PRODUCTOS (MANUALMENTE)
    // ---------------------------------------------------------
    // No usamos CALL sp_insert_detalleventa porque ese busca el MAX(id), 
    // y nosotros queremos un ID específico.
    
    for (const item of cart) {
       const fechaVencimiento = item.fecha_vencimiento ? item.fecha_vencimiento : null;
       const importe = item.cantidad * item.precio_numerico;

       // A. Insertar en la tabla detalleventa
       await connection.query(
         `INSERT INTO detalleventa (idventa, idproducto, cantidad, precio_unitario, exento, descuento, fecha_vence, importe)
          VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
         [
            id, // El ID que estamos editando
            item.idproducto, 
            item.cantidad, 
            item.precio_numerico, 
            fechaVencimiento, 
            importe
         ]
       );

       // B. Descontar Stock General (Tabla producto)
       await connection.query(
         `UPDATE producto SET stock = stock - ? WHERE idproducto = ?`,
         [item.cantidad, item.idproducto]
       );

       // C. Descontar Stock Perecedero (Tabla perecedero, si aplica)
       if (fechaVencimiento) {
         await connection.query(
           `UPDATE perecedero SET cantidad_perecedero = cantidad_perecedero - ? 
            WHERE idproducto = ? AND fecha_vencimiento = ?`,
           [item.cantidad, item.idproducto, fechaVencimiento]
         );
       }
    }

    await connection.commit();
    return NextResponse.json({ success: true, message: 'Venta actualizada correctamente' });

  } catch (error) {
    await connection.rollback();
    console.error("Error actualizando venta:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    connection.release();
  }
}