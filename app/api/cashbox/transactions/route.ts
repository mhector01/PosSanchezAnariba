import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    // 1. Obtener la CAJA ACTUAL (La última creada)
    const [boxRows]: any = await connection.query(`
        SELECT * FROM caja ORDER BY idcaja DESC LIMIT 1
    `);
    const currentBox = boxRows[0] || null;

    let summary = null;
    let movements = [];

    if (currentBox) {
        // 2. Calcular Totales DESGLOSADOS
        // Tipos: 1 = Ingreso, 4 = Gasto
        // Filtramos 'POR VENTA%' para saber qué es venta pura
        const [totals]: any = await connection.query(`
            SELECT 
                COALESCE(SUM(CASE 
                    WHEN tipo_movimiento = 1 AND descripcion_movimiento LIKE 'POR VENTA%' 
                    THEN monto_movimiento ELSE 0 END), 0) as ventas_efectivo,
                
                COALESCE(SUM(CASE 
                    WHEN tipo_movimiento = 1 AND descripcion_movimiento NOT LIKE 'POR VENTA%' 
                    THEN monto_movimiento ELSE 0 END), 0) as otros_ingresos,
                
                COALESCE(SUM(CASE 
                    WHEN tipo_movimiento = 4 
                    THEN monto_movimiento ELSE 0 END), 0) as egresos
            FROM caja_movimiento 
            WHERE idcaja = ?
        `, [currentBox.idcaja]);

        const ventas = parseFloat(totals[0].ventas_efectivo);
        const otros = parseFloat(totals[0].otros_ingresos);
        const egresos = parseFloat(totals[0].egresos);
        const montoInicial = parseFloat(currentBox.monto_apertura);

        summary = {
            ...currentBox,
            p_monto_inicial: montoInicial,
            p_ventas: ventas,       // NUEVO CAMPO
            p_otros_ingresos: otros, // NUEVO CAMPO
            p_ingresos_total: ventas + otros,
            p_egresos: egresos,
            p_saldo: (ventas + otros - egresos) 
        };

        // 3. Obtener Movimientos
        const [moves]: any = await connection.query(`
            SELECT * FROM caja_movimiento 
            WHERE idcaja = ? 
            ORDER BY idcaja_movimiento DESC
        `, [currentBox.idcaja]);
        movements = moves;
    }

    // 4. Historial
    const [history]: any = await connection.query(`
        SELECT * FROM caja ORDER BY idcaja DESC LIMIT 10
    `);

    connection.release();
    return NextResponse.json({ summary, movements, history });

  } catch (error: any) {
    console.error("Error API Caja:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const connection = await pool.getConnection();

    // CIERRE
    if (body.action === 'force_close' || body.action === 'close') {
        const idParaCerrar = body.idcaja || (await getIdCajaAbierta(connection));
        if (!idParaCerrar) {
            connection.release();
            return NextResponse.json({ error: "No se encontró caja" }, { status: 400 });
        }
        await connection.query(
            'UPDATE caja SET fecha_cierre = NOW(), monto_cierre = ?, estado = 0 WHERE idcaja = ?',
            [body.amount || 0, idParaCerrar]
        );
        connection.release();
        return NextResponse.json({ success: true });
    }

    // NUEVO MOVIMIENTO
    const { tipo, monto, descripcion } = body; 
    const [boxRows]: any = await connection.query('SELECT idcaja FROM caja WHERE estado = 1 ORDER BY idcaja DESC LIMIT 1');
    
    if (boxRows.length === 0) {
        connection.release();
        return NextResponse.json({ error: "No hay caja abierta" }, { status: 400 });
    }
    
    const idCaja = boxRows[0].idcaja;

    await connection.query(
        `INSERT INTO caja_movimiento (idcaja, tipo_movimiento, monto_movimiento, descripcion_movimiento, fecha_movimiento)
         VALUES (?, ?, ?, ?, NOW())`,
        [idCaja, tipo, monto, descripcion]
    );

    connection.release();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getIdCajaAbierta(connection: any) {
    const [rows]: any = await connection.query('SELECT idcaja FROM caja WHERE estado = 1 ORDER BY idcaja DESC LIMIT 1');
    return rows.length > 0 ? rows[0].idcaja : null;
}