import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    // ACTUALIZACIÓN: Ahora traemos todos los campos necesarios para la tabla y la edición
    const [rows] = await connection.query(
        `SELECT idcliente, nombre_cliente, numero_nit, direccion_cliente, numero_telefono, email, giro 
         FROM cliente 
         WHERE estado = 1 
         ORDER BY nombre_cliente ASC`
    );
    connection.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre_cliente, numero_nit, direccion_cliente, numero_telefono, email, giro } = body;

    if (!nombre_cliente) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    
    // 1. Verificamos si el cliente ya existe (forzando la collation correcta para evitar el error)
    const [exist]: any = await connection.query(
        'SELECT idcliente FROM cliente WHERE nombre_cliente = ? COLLATE utf8mb4_general_ci LIMIT 1', 
        [nombre_cliente]
    );

    let clienteId;

    if (exist.length > 0) {
        // Si ya existe, simplemente devolvemos el ID de ese cliente
        clienteId = exist[0].idcliente;
    } else {
        // 2. Si no existe, hacemos el INSERT directo a la tabla (saltándonos el SP problemático)
        const [result]: any = await connection.query(
            `INSERT INTO cliente 
            (nombre_cliente, numero_nit, numero_nrc, direccion_cliente, numero_telefono, email, giro, limite_credito, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                nombre_cliente, 
                numero_nit || '', 
                '', // numero_nrc
                direccion_cliente || '', 
                numero_telefono || '', 
                email || '', 
                giro || '', 
                0 // limite_credito
            ]
        );
        clienteId = result.insertId;
    }
    
    connection.release();

    if (clienteId) {
        return NextResponse.json({ success: true, id: clienteId });
    } else {
        throw new Error("No se pudo obtener el ID del cliente creado");
    }

  } catch (error: any) {
    console.error("Error guardando cliente:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}