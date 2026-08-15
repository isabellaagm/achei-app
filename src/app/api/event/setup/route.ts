import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { getTheEvent } from '@/lib/event';
import { createAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const existing = await getTheEvent();
    if (existing) {
      return NextResponse.json(
        { error: 'Este app já tem um evento configurado. Use a tela de login do organizador.' },
        { status: 409 }
      );
    }

    const body = await req.json();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    const eventDate = body.eventDate ? String(body.eventDate) : null;
    const location = body.location ? String(body.location).trim() : null;
    const accentColor = body.accentColor ? String(body.accentColor) : '#C7952A';

    if (!name || password.length < 4) {
      return NextResponse.json(
        { error: 'Nome do evento e uma senha de pelo menos 4 caracteres são obrigatórios.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin()
      .from('event')
      .insert({
        name,
        event_date: eventDate,
        location,
        accent_color: accentColor,
        admin_password_hash: passwordHash,
      })
      .select('*')
      .single();

    if (error) throw error;

    await createAdminSession(data.id);

    return NextResponse.json({ ok: true, eventId: data.id });
  } catch (err) {
    console.error('POST /api/event/setup', err);
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
