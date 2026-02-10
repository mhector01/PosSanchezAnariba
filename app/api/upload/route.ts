import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear nombre único para evitar colisiones
    const filename = `${Date.now()}-${file.name.replaceAll(' ', '_')}`;
    
    // Ruta física donde se guardará (dentro de public/uploads)
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Asegurarse de que la carpeta exista (opcional, mejor crearla manualmente una vez)
    // await mkdir(uploadDir, { recursive: true }); 

    const filePath = path.join(uploadDir, filename);
    
    await writeFile(filePath, buffer);
    
    // Devolvemos la ruta pública relativa
    return NextResponse.json({ url: `/uploads/${filename}` });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}