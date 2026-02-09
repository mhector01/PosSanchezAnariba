import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();

    // 1. Datos Generales (KPIs) usando tu SP existente
    const [kpiRows]: any = await connection.query('CALL sp_panel_dashboard()');
    const kpiData = kpiRows[0][0]; // Tu SP devuelve un array dentro de un array

    // 2. Datos para la Gráfica (Ventas por mes)
    const [chartRows]: any = await connection.query('CALL sp_ventas_anual()');
    const chartData = chartRows[0]; 

    // 3. Alertas Reales (Productos por vencer y bajo stock)
    // Hacemos una UNION para traer ambos tipos de alertas en una sola lista
    const [alertsRows]: any = await connection.query(`
      (SELECT 
          concat('Producto por vencer: ', p.nombre_producto) as mensaje, 
          'warning' as tipo,
          pe.fecha_vencimiento as fecha
       FROM perecedero pe
       JOIN producto p ON pe.idproducto = p.idproducto
       WHERE pe.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       AND pe.estado = 1
       LIMIT 5)
      UNION
      (SELECT 
          concat('Stock crítico: ', nombre_producto) as mensaje, 
          'error' as tipo,
          NOW() as fecha
       FROM producto 
       WHERE stock <= stock_min AND estado = 1
       LIMIT 5)
       ORDER BY fecha ASC
       LIMIT 10
    `);

    connection.release();

    return NextResponse.json({
      kpi: {
        ventas_hoy: kpiData.ventas_dia || 0,
        stock_critico: kpiData.a_vencer || 0, // Usamos 'a_vencer' del SP o calculamos stock bajo
        clientes_total: kpiData.clientes || 0,
        dinero_caja: kpiData.dinero_caja || 0,
        creditos_pendientes: kpiData.creditos || 0
      },
      chart: chartData, // Array de meses y totales
      alerts: alertsRows
    });

  } catch (error: any) {
    console.error("Error Dashboard:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}