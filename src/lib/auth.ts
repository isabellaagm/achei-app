import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'achei_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'SESSION_SECRET não configurado (ou curto demais). Defina uma string aleatória de pelo menos 32 caracteres nas variáveis de ambiente.'
    );
  }
  return new TextEncoder().encode(s);
}

export async function createAdminSession(eventId: string) {
  const token = await new SignJWT({ eventId, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getAdminSession(): Promise<{ eventId: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== 'admin' || typeof payload.eventId !== 'string') return null;
    return { eventId: payload.eventId };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
