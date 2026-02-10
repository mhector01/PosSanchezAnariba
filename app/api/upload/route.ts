import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Next.js lee automáticamente las variables del .env aquí
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No se subió archivo" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "pos_productos", // Carpeta automática en tu nube
          resource_type: "image",
          // Opcional: Redimensionar imagen para ahorrar peso
          transformation: [{ width: 500, height: 500, crop: "limit" }] 
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });

  } catch (error: any) {
    console.error("Error Cloudinary:", error);
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}