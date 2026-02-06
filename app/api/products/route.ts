import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. GET: Buscar Productos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    let query = 'SELECT * FROM producto';
    let countQuery = 'SELECT COUNT(*) as total FROM producto';
    let params: any[] = [];

    if (q) {
      const term = `%${q}%`;
      const where = ' WHERE nombre_producto LIKE ? OR codigo_barra LIKE ? OR codigo_interno LIKE ?';
      query += where;
      countQuery += where;
      params = [term, term, term];
    }

    query += ' ORDER BY idproducto DESC LIMIT ? OFFSET ?';
    
    const [countRows] = await connection.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

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

// 2. POST: Crear Nuevo Producto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      codigo_barra, 
      nombre_producto, 
      precio_compra, 
      precio_venta, 
      precio_venta_mayoreo,
      precio_venta_3, // <--- NUEVO CAMPO
      stock, 
      stock_min,
      idcategoria,
      idmarca,
      idpresentacion,
      perecedero
    } = body;

    const connection = await pool.getConnection();
    
    // Validación de duplicados
    if (codigo_barra) {
      const [exist] = await connection.query<RowDataPacket[]>('SELECT idproducto FROM producto WHERE codigo_barra = ?', [codigo_barra]);
      if (exist.length > 0) {
        connection.release();
        return NextResponse.json({ error: 'El código de barra ya existe' }, { status: 400 });
      }
    }

    // Insertar usando el SP (si lo actualizaste) o INSERT directo
    // NOTA: Si ya actualizaste sp_insert_producto en la DB, usa CALL sp_insert_producto(...)
    // Si no, usa este INSERT directo actualizado:
    
    const [res] = await connection.query<ResultSetHeader>(
      `INSERT INTO producto (
        codigo_barra, 
        nombre_producto, 
        precio_compra, 
        precio_venta, 
        precio_venta_mayoreo, 
        precio_venta_3,  -- <--- COLUMNA NUEVA
        stock, 
        stock_min, 
        idcategoria, 
        idmarca, 
        idpresentacion, 
        estado, 
        perecedero,
        inventariable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
      [
        codigo_barra || null,
        nombre_producto,
        precio_compra,
        precio_venta,
        precio_venta_mayoreo,
        precio_venta_3 || 0, // <--- VALOR NUEVO (Default 0)
        stock || 0,
        stock_min || 1,
        idcategoria || 1,
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

// 3. PUT: Actualizar Producto
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      idproducto, 
      codigo_barra, 
      nombre_producto, 
      precio_compra,
      precio_venta, 
      precio_venta_mayoreo,
      precio_venta_3, // <--- NUEVO CAMPO
      stock_min,
      idcategoria,
      idmarca,
      idpresentacion,
      perecedero
    } = body;

    const connection = await pool.getConnection();
    
    await connection.query(
      `UPDATE producto SET 
        codigo_barra=?, 
        nombre_producto=?, 
        precio_compra=?,
        precio_venta=?, 
        precio_venta_mayoreo=?,
        precio_venta_3=?, -- <--- COLUMNA NUEVA
        stock_min=?,
        idcategoria=?,
        idmarca=?,
        idpresentacion=?,
        perecedero=?
       WHERE idproducto=?`,
      [
        codigo_barra, 
        nombre_producto, 
        precio_compra,
        precio_venta, 
        precio_venta_mayoreo,
        precio_venta_3 || 0, // <--- VALOR NUEVO
        stock_min,
        idcategoria,
        idmarca,
        idpresentacion,
        perecedero,
        idproducto
      ]
    );

    connection.release();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}