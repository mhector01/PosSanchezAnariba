import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { idproducto, cantidad_sistema, cantidad_real, motivo, idusuario } = await request.json();
    
    // Validaciones básicas
    if (!idproducto || cantidad_real === undefined || !motivo) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const diferencia = parseFloat(cantidad_real) - parseFloat(cantidad_sistema);
    
    if (diferencia === 0) {
        return NextResponse.json({ message: "No hay diferencia que ajustar." });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const esEntrada = diferencia > 0;
        const cantidadAbsoluta = Math.abs(diferencia);
        
        // 1. Obtener precio de costo actual para valorizar el ajuste
        const [prodRows]: any = await connection.query('SELECT precio_compra, nombre_producto FROM producto WHERE idproducto = ?', [idproducto]);
        const precioCosto = prodRows[0].precio_compra;
        const costoTotal = precioCosto * cantidadAbsoluta;
        const descripcion = `AJUSTE INVENTARIO: ${motivo.toUpperCase()}`;

        // 2. Actualizar Stock Maestro
        if (esEntrada) {
            await connection.query('UPDATE producto SET stock = stock + ? WHERE idproducto = ?', [cantidadAbsoluta, idproducto]);
        } else {
            await connection.query('UPDATE producto SET stock = stock - ? WHERE idproducto = ?', [cantidadAbsoluta, idproducto]);
        }

        // 3. Registrar en Historial (Entrada o Salida) para el Kardex
        // Usamos las tablas 'entrada' o 'salida' directamente para que salga en los reportes, 
        // pero con idcompra/idventa en NULL para indicar que es un ajuste interno.
        
        if (esEntrada) {
            // AJUSTE POSITIVO (SOBRA STOCK) -> ENTRADA
            await connection.query(`
                INSERT INTO entrada (mes_inventario, fecha_entrada, descripcion_entrada, cantidad_entrada, precio_unitario_entrada, costo_total_entrada, idproducto, idcompra)
                VALUES (DATE_FORMAT(NOW(),'%Y-%m'), NOW(), ?, ?, ?, ?, ?, NULL)
            `, [descripcion, cantidadAbsoluta, precioCosto, costoTotal, idproducto]);

            // Actualizar tabla resumen de inventario mensual
            await connection.query(`
                UPDATE inventario 
                SET saldo_final = saldo_final + ?, entradas = entradas + ?
                WHERE idproducto = ? AND fecha_apertura = DATE_FORMAT(CURDATE(),'%Y-%m-01')
            `, [cantidadAbsoluta, cantidadAbsoluta, idproducto]);

        } else {
            // AJUSTE NEGATIVO (FALTA STOCK) -> SALIDA
            await connection.query(`
                INSERT INTO salida (mes_inventario, fecha_salida, descripcion_salida, cantidad_salida, precio_unitario_salida, costo_total_salida, idproducto, idventa)
                VALUES (DATE_FORMAT(NOW(),'%Y-%m'), NOW(), ?, ?, ?, ?, ?, NULL)
            `, [descripcion, cantidadAbsoluta, precioCosto, costoTotal, idproducto]);

            // Actualizar tabla resumen de inventario mensual
            await connection.query(`
                UPDATE inventario 
                SET saldo_final = saldo_final - ?, salidas = salidas + ?
                WHERE idproducto = ? AND fecha_apertura = DATE_FORMAT(CURDATE(),'%Y-%m-01')
            `, [cantidadAbsoluta, cantidadAbsoluta, idproducto]);
        }

        await connection.commit();
        connection.release();
        return NextResponse.json({ success: true, message: "Inventario ajustado correctamente" });

    } catch (error: any) {
        await connection.rollback();
        connection.release();
        throw error;
    }

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}