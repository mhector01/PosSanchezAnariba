import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// --- LISTAR USUARIOS (Usando tu vista view_usuarios) ---
export async function GET() {
  try {
    const connection = await pool.getConnection();
    // Tu vista 'view_usuarios' ya trae todo lo necesario
    const [rows] = await connection.query(`
      SELECT * FROM view_usuarios 
      WHERE estado = 1 
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
        usuario, password, tipo_usuario // Datos Usuario
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

        // 3. Insertar Usuario vinculado al Empleado
        await connection.query(
            `INSERT INTO usuario (usuario, contrasena, tipo_usuario, estado, idempleado) 
             VALUES (?, ?, ?, 1, ?)`,
            [usuario, password, tipo_usuario, idEmpleado] // Nota: En producción usa bcrypt para password
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
        usuario, password, tipo_usuario 
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
        let queryUsuario = `UPDATE usuario SET usuario = ?, tipo_usuario = ?`;
        let paramsUsuario = [usuario, tipo_usuario];

        // Solo actualizamos contraseña si enviaron una nueva
        if (password && password.trim() !== "") {
            queryUsuario += `, contrasena = ?`;
            paramsUsuario.push(password);
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