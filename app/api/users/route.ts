import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// --- LISTAR USUARIOS (Usando tu vista view_usuarios) ---
export async function GET() {
  try {
    const connection = await pool.getConnection();
    // Tu vista 'view_usuarios' ya trae todo lo necesario
    const [rows] = await connection.query(`
      SELECT vu.*, u.idbodega, b.nombre AS bodega_nombre FROM view_usuarios vu
      JOIN usuario u ON u.idusuario=vu.idusuario
      LEFT JOIN bodega b ON b.idbodega=u.idbodega
      WHERE vu.estado = 1
      ORDER BY idusuario DESC
    `);
    connection.release();
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- CREAR USUARIO (Crear Empleado + Crear Usuario) ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        nombre_empleado, apellido_empleado, telefono, email, // Datos Empleado
        usuario, password, tipo_usuario, idbodega
    } = body;

    const connection = await pool.getConnection();
    await connection.beginTransaction(); // Iniciamos transacción

    try {
        // 1. Validar si el username ya existe
        const [existUser]: any = await connection.query('SELECT idusuario FROM usuario WHERE usuario = ?', [usuario]);
        if (existUser.length > 0) {
            throw new Error("El nombre de usuario ya está ocupado");
        }

        // 2. Insertar Empleado
        // Generamos un codigo_empleado temporal o usamos tu trigger si lo tienes
        const [resEmp]: any = await connection.query(
            `INSERT INTO empleado (nombre_empleado, apellido_empleado, telefono_empleado, email_empleado, estado) 
             VALUES (?, ?, ?, ?, 1)`,
            [nombre_empleado, apellido_empleado, telefono || '', email || '']
        );
        const idEmpleado = resEmp.insertId;

        // 3. Insertar Usuario vinculado al Empleado (Encriptar contraseña)
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.query(
            `INSERT INTO usuario (usuario, contrasena, tipo_usuario, estado, idempleado, idbodega)
             VALUES (?, ?, ?, 1, ?, ?)`,
            [usuario, hashedPassword, tipo_usuario, idEmpleado, Number(tipo_usuario) === 1 ? null : idbodega]
        );

        await connection.commit();
        connection.release();
        return NextResponse.json({ success: true, message: "Usuario creado correctamente" });

    } catch (error: any) {
        await connection.rollback(); // Si falla, deshacemos todo
        connection.release();
        throw error;
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- EDITAR USUARIO (Actualizar ambos) ---
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
        idusuario, idempleado, // IDs necesarios
        nombre_empleado, apellido_empleado, telefono, email,
        usuario, password, tipo_usuario, idbodega
    } = body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Actualizar Empleado
        await connection.query(
            `UPDATE empleado SET 
             nombre_empleado = ?, apellido_empleado = ?, telefono_empleado = ?, email_empleado = ?
             WHERE idempleado = ?`,
            [nombre_empleado, apellido_empleado, telefono, email, idempleado]
        );

        // 2. Actualizar Usuario
        let queryUsuario = `UPDATE usuario SET usuario = ?, tipo_usuario = ?, idbodega = ?`;
        let paramsUsuario: any[] = [usuario, tipo_usuario, Number(tipo_usuario) === 1 ? null : idbodega];

        // Solo actualizamos contraseña si enviaron una nueva (Encriptar contraseña)
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            queryUsuario += `, contrasena = ?`;
            paramsUsuario.push(hashedPassword);
        }

        queryUsuario += ` WHERE idusuario = ?`;
        paramsUsuario.push(idusuario);

        await connection.query(queryUsuario, paramsUsuario);

        await connection.commit();
        connection.release();
        return NextResponse.json({ success: true });

    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
