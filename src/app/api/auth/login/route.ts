import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getTheEvent } from '@/lib/event';
import { createAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const event = await getTheEvent();
    if (!event) return NextResponse.json({ error: 'Evento ainda não foi criado.' }, { status: 404 });

    const ok = await bcrypt.compare(String(password || ''), event.admin_password_hash);
    if (!ok) return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });

    await createAdminSession(event.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/auth/login', err);
    return NextResponse.json({ error: 'erro ao entrar' }, { status: 500 });
  }
}
