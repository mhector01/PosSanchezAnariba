import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    // Buscamos en ENTRADAS (Sobrantes ajustados)
    // Y en SALIDAS (Faltantes ajustados)
    // Filtramos por la descripción que pusimos en la API de ajuste
    const [rows]: any = await connection.query(`
        (SELECT 
            e.fecha_entrada as fecha,
            p.nombre_producto,
            p.codigo_barra,
            e.cantidad_entrada as cantidad,
            'ENTRADA' as tipo,
            e.descripcion_entrada as motivo
         FROM entrada e
         JOIN producto p ON e.idproducto = p.idproducto
         WHERE e.descripcion_entrada LIKE 'AJUSTE INVENTARIO%')
         
        UNION ALL
        
        (SELECT 
            s.fecha_salida as fecha,
            p.nombre_producto,
            p.codigo_barra,
            s.cantidad_salida as cantidad,
            'SALIDA' as tipo,
            s.descripcion_salida as motivo
         FROM salida s
         JOIN producto p ON s.idproducto = p.idproducto
         WHERE s.descripcion_salida LIKE 'AJUSTE INVENTARIO%')
         
        ORDER BY fecha DESC
        LIMIT 100
    `);

    connection.release();
    return NextResponse.json(rows);

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}