import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    // 1. Usar tu procedimiento de validación oficial
    const [rows]: any = await connection.query('CALL sp_validar_caja()');
    const cajaRows = rows[0] as RowDataPacket[];

    if (cajaRows.length === 0) {
      return NextResponse.json({ isOpen: false });
    }

    // 2. Usar tu procedimiento de cálculos oficial (sp_view_movimientos_caja)
    // Este ya suma ingresos, resta egresos y calcula el saldo esperado
    const [statsRows]: any = await connection.query('CALL sp_view_movimientos_caja()');
    const stats = statsRows[0][0];

    return NextResponse.json({
      isOpen: true,
      data: {
        idcaja: cajaRows[0].idcaja,
        monto_apertura: cajaRows[0].monto_apertura,
        fecha_apertura: cajaRows[0].fecha_apertura,
        // Datos calculados por el procedimiento SQL
        ventasEfectivo: Number(stats.p_ingresos),
        egresos: Number(stats.p_egresos),
        totalEsperado: Number(stats.p_diferencia) // p_monto_inicial + p_saldo
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function POST(request: Request) {
  const { action, amount } = await request.json();
  const connection = await pool.getConnection();

  try {
    if (action === 'open') {
      // Llama a: INSERT INTO caja(fecha_apertura, monto_apertura) VALUES (NOW(), p_monto_apertura)
      await connection.query('CALL sp_abrir_caja(?)', [amount]);
      return NextResponse.json({ success: true });
    } 
    
    if (action === 'close') {
      // Llama a: UPDATE caja SET monto_cierre = p_monto_cierre, fecha_cierre = NOW(), estado = 0
      await connection.query('CALL sp_cerrar_caja(?)', [amount]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    connection.release();
  }
}