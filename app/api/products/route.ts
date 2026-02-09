import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. GET: Search Products (Updated to include subcategory)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    // Base query updated to JOIN with category, subcategory, brand, and presentation
    let query = `
      SELECT p.*, 
             c.nombre_categoria, 
             sc.nombre_subcategoria, -- <--- Nombre de Subcategoría
             m.nombre_marca, 
             pr.nombre_presentacion 
      FROM producto p
      LEFT JOIN categoria c ON p.idcategoria = c.idcategoria
      LEFT JOIN subcategoria sc ON p.idsubcategoria = sc.idsubcategoria -- <--- JOIN con Subcategoría
      LEFT JOIN marca m ON p.idmarca = m.idmarca
      LEFT JOIN presentacion pr ON p.idpresentacion = pr.idpresentacion
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM producto p';
    let params: any[] = [];

    if (q) {
      const term = `%${q}%`;
      const where = ` 
        WHERE (p.nombre_producto LIKE ? 
        OR p.codigo_barra LIKE ? 
        OR p.codigo_interno LIKE ? 
        OR p.descripcion LIKE ?) 
      `;
      query += where;
      countQuery += where;
      params = [term, term, term, term];
    }

    query += ' ORDER BY p.idproducto DESC LIMIT ? OFFSET ?';
    
    // Get total count for pagination
    const [countRows] = await connection.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Execute main query
    params.push(limit, offset);
    const [rows] = await connection.query<RowDataPacket[]>(query, params);

    connection.release();

    return NextResponse.json({
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Create New Product (Updated with subcategory)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      codigo_barra, 
      nombre_producto, 
      descripcion,
      precio_compra, 
      precio_venta, 
      precio_venta_mayoreo,
      precio_venta_3, 
      stock, 
      stock_min,
      idcategoria,
      idsubcategoria, // <--- New Field
      idmarca,        
      idpresentacion, 
      perecedero      
    } = body;

    const connection = await pool.getConnection();
    
    // Duplicate validation (Barcode)
    if (codigo_barra) {
      const [exist] = await connection.query<RowDataPacket[]>('SELECT idproducto FROM producto WHERE codigo_barra = ?', [codigo_barra]);
      if (exist.length > 0) {
        connection.release();
        return NextResponse.json({ error: 'El código de barra ya existe' }, { status: 400 });
      }
    }

    // Direct INSERT with idsubcategoria
    const [res] = await connection.query<ResultSetHeader>(
      `INSERT INTO producto (
        codigo_barra, 
        nombre_producto, 
        descripcion,       
        precio_compra, 
        precio_venta, 
        precio_venta_mayoreo, 
        precio_venta_3,    
        stock, 
        stock_min, 
        idcategoria, 
        idsubcategoria,    -- <--- New Column
        idmarca,           
        idpresentacion,    
        estado, 
        perecedero,        
        inventariable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
      [
        codigo_barra || null,
        nombre_producto,
        descripcion || '',            
        precio_compra,
        precio_venta,
        precio_venta_mayoreo || 0,
        precio_venta_3 || 0,          
        stock || 0,
        stock_min || 1,
        idcategoria || 1,
        idsubcategoria || 0,          // <--- Default 0 if undefined
        idmarca || null,              
        idpresentacion || 1,
        perecedero || 0
      ]
    );

    connection.release();
    return NextResponse.json({ success: true, id: res.insertId });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PUT: Update Product (Updated with subcategory)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      idproducto, 
      codigo_barra, 
      nombre_producto, 
      descripcion,
      precio_compra,
      precio_venta, 
      precio_venta_mayoreo,
      precio_venta_3,
      stock,          
      stock_min,
      idcategoria,
      idsubcategoria, // <--- New Field
      idmarca,        
      idpresentacion, 
      perecedero
    } = body;

    if (!idproducto) {
       return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    
    await connection.query(
      `UPDATE producto SET 
        codigo_barra=?, 
        nombre_producto=?, 
        descripcion=?,        
        precio_compra=?,
        precio_venta=?, 
        precio_venta_mayoreo=?,
        precio_venta_3=?,     
        stock=?,              
        stock_min=?,
        idcategoria=?,
        idsubcategoria=?,     -- <--- New Column
        idmarca=?,            
        idpresentacion=?,     
        perecedero=?          
       WHERE idproducto=?`,
      [
        codigo_barra, 
        nombre_producto, 
        descripcion || '',
        precio_compra,
        precio_venta, 
        precio_venta_mayoreo || 0,
        precio_venta_3 || 0,
        stock,
        stock_min,
        idcategoria,
        idsubcategoria || 0,  // <--- Update value
        idmarca || null,
        idpresentacion,
        perecedero || 0,
        idproducto
      ]
    );

    connection.release();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}