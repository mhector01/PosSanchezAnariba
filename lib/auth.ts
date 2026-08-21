import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('CLAVE_SECRETA_SUPER_SEGURA_CAMBIAME');

export async function getSessionRole(): Promise<number | null> {
  const token = (await cookies()).get('session_token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return Number(payload.role);
  } catch {
    return null;
  }
}

export async function requireAdminRole() {
  return (await getSessionRole()) === 1;
}
