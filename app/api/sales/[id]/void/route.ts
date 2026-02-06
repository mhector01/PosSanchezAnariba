import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Obtener los productos de esa venta para devolver el stock
        // (OJO: Si ya instalaste los TRIGGERS de arriba, NO necesitas hacer cálculos manuales,
        // solo necesitas BORRAR los detalles y los triggers harán el trabajo).

        // Opción A: Borrar físicamente los detalles (El trigger 'tr_devolver_stock_venta' devolverá el stock)
        await connection.query('DELETE FROM detalleventa WHERE idventa = ?', [id]);

        // 2. Marcar la cabecera como anulada (y poner total en 0 para que no sume en reportes)
        await connection.query('UPDATE venta SET estado = "ANULADA", total = 0 WHERE idventa = ?', [id]);
        
        await connection.commit();
        connection.release();
        return NextResponse.json({ success: true });

    } catch (e: any) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}