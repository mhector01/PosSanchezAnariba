import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    /* LÓGICA UNIFICADA: 
       Buscamos el MAX(numero_comprobante) en la tabla VENTA para cada tipo.
       Si no hay ventas, usamos el 'desde'.
       Si hay ventas, usamos 'ultimo + 1' (siempre que esté dentro del rango).
    */
    const [rows]: any = await connection.query(`
      SELECT 
        c.idcomprobante, 
        c.nombre_comprobante, 
        tc.serie,
        tc.desde,
        tc.hasta,
        
        -- Subconsulta para saber el último número REAL usado
        (SELECT MAX(numero_comprobante) 
         FROM venta v 
         WHERE v.tipo_comprobante = c.idcomprobante) as ultimo_usado
         
      FROM comprobante c
      -- Unimos solo con el rango activo (estado = 1)
      LEFT JOIN tiraje_comprobante tc ON c.idcomprobante = tc.idcomprobante AND tc.estado = 1
      WHERE c.estado = 1
      ORDER BY c.idcomprobante ASC
    `);
    
    // Procesamos en JS para calcular el 'siguiente' limpio
    const processedRows = rows.map((row: any) => {
        let siguiente = row.desde || 1; // Default
        
        if (row.ultimo_usado) {
            // Si el último usado es mayor o igual al inicio del rango, el siguiente es +1
            // Si el último usado es menor (ej: rango viejo), saltamos al 'desde' del nuevo rango.
            if (row.ultimo_usado >= row.desde) {
                siguiente = row.ultimo_usado + 1;
            } else {
                siguiente = row.desde;
            }
        }
        
        // Calcular disponibles
        const disponibles = row.hasta ? (row.hasta - siguiente + 1) : 0;

        return {
            idcomprobante: row.idcomprobante,
            nombre_comprobante: row.nombre_comprobante,
            serie: row.serie || '',
            siguiente_numero: siguiente, 
            disponibles: disponibles < 0 ? 0 : disponibles
        };
    });
    
    connection.release();
    return NextResponse.json(processedRows);

  } catch (error: any) {
    console.error("Error en GET comprobantes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST y PUT se quedan igual...
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const connection = await pool.getConnection();
    await connection.query('CALL sp_insert_comprobante(?)', [body.nombre]);
    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const connection = await pool.getConnection();
    await connection.query('CALL sp_update_comprobante(?, ?, ?)', [body.id, body.nombre, body.estado]);
    connection.release();
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}