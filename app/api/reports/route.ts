import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const connection = await pool.getConnection();
    
    // Inicializamos como 'any' para evitar el error de asignación de tipos estrictos
    let data: any = [];

    // 1. REPORTE DE INVENTARIO VALORIZADO
    if (type === 'inventory') {
      const [rows] = await connection.query<RowDataPacket[]>(`
        SELECT 
          p.codigo_barra,
          p.nombre_producto,
          c.nombre_categoria,
          sc.nombre_subcategoria,
          m.nombre_marca,
          p.stock,
          p.precio_compra,
          p.precio_venta,
          (p.stock * p.precio_compra) as total_costo,
          (p.stock * p.precio_venta) as total_venta_estimada
        FROM producto p
        LEFT JOIN categoria c ON p.idcategoria = c.idcategoria
        LEFT JOIN subcategoria sc ON p.idsubcategoria = sc.idsubcategoria
        LEFT JOIN marca m ON p.idmarca = m.idmarca
        WHERE p.stock > 0 AND p.estado = 1
        ORDER BY p.nombre_producto ASC
      `);
      data = rows;
    } 
    
    // 2. REPORTE POR CATEGORÍA Y SUBCATEGORÍA
    else if (type === 'categories') {
      const [rows] = await connection.query<RowDataPacket[]>(`
        SELECT 
          c.nombre_categoria,
          sc.nombre_subcategoria,
          COUNT(p.idproducto) as cantidad_productos,
          SUM(p.stock) as unidades_totales,
          SUM(p.stock * p.precio_compra) as valor_inversion
        FROM categoria c
        LEFT JOIN subcategoria sc ON c.idcategoria = sc.idcategoria
        LEFT JOIN producto p ON (p.idcategoria = c.idcategoria AND (p.idsubcategoria = sc.idsubcategoria OR (sc.idsubcategoria IS NULL AND p.idsubcategoria = 0)))
        WHERE c.estado = 1
        GROUP BY c.idcategoria, sc.idsubcategoria
        ORDER BY c.nombre_categoria, sc.nombre_subcategoria
      `);
      data = rows;
    }

    // 3. REPORTE DE BAJO STOCK (Reposición)
    else if (type === 'low_stock') {
      const [rows] = await connection.query<RowDataPacket[]>(`
        SELECT 
          p.codigo_barra,
          p.nombre_producto,
          p.stock,
          p.stock_min,
          pr.nombre_proveedor,
          pr.telefono_contacto
        FROM producto p
        LEFT JOIN producto_proveedor pp ON p.idproducto = pp.idproducto
        LEFT JOIN proveedor pr ON pp.idproveedor = pr.idproveedor
        WHERE p.stock <= p.stock_min AND p.estado = 1
        ORDER BY p.stock ASC
      `);
      data = rows;
    }

    connection.release();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error Reportes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}