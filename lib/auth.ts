import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

function getSecretKey() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET no está configurado');
  return new TextEncoder().encode(jwtSecret);
}

export async function getSessionRole(): Promise<number | null> {
  const token = (await cookies()).get('session_token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return Number(payload.role);
  } catch {
    return null;
  }
}

export interface AppSession {
  id: number;
  role: number;
  warehouseId: number | null;
}

export async function getSession(): Promise<AppSession | null> {
  const token = (await cookies()).get('session_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: Number(payload.id),
      role: Number(payload.role),
      warehouseId: payload.warehouseId ? Number(payload.warehouseId) : null,
    };
  } catch {
    return null;
  }
}

export async function requireAdminRole() {
  return (await getSessionRole()) === 1;
}
