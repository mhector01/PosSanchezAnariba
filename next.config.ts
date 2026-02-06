import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <--- ESTO ES VITAL
  // Si usas imágenes de dominios externos, agrégalos aquí también
};

export default nextConfig;