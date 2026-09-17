import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTheEvent, toPublicEvent } from '@/lib/event';
import { getAdminSession } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

type EventUpdate = Database['public']['Tables']['event']['Update'];

export async function GET() {
  try {
    const event = await getTheEvent();
    if (!event) return NextResponse.json({ event: null });
    return NextResponse.json({ event: await toPublicEvent(event) });
  } catch (err) {
    console.error('GET /api/event', err);
    return NextResponse.json({ error: 'erro ao carregar evento' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const body = await req.json();
    const patch: EventUpdate = {};
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if (typeof body.eventDate === 'string' || body.eventDate === null) patch.event_date = body.eventDate;
    if (typeof body.location === 'string') patch.location = body.location.trim();
    if (typeof body.accentColor === 'string') patch.accent_color = body.accentColor;
    if (typeof body.colorBg === 'string') patch.color_bg = body.colorBg;
    if (typeof body.colorSurface === 'string') patch.color_surface = body.colorSurface;
    if (typeof body.colorText === 'string') patch.color_text = body.colorText;
    if (typeof body.colorAccentSoft === 'string') patch.color_accent_soft = body.colorAccentSoft;
    if (typeof body.colorOrnamental === 'string') patch.color_ornamental = body.colorOrnamental;
    if (typeof body.colorBorder === 'string') patch.color_border = body.colorBorder;
    if (typeof body.coverKey === 'string') patch.cover_key = body.coverKey;
    if (typeof body.logoKey === 'string') patch.logo_key = body.logoKey;
    if (typeof body.publicBaseUrl === 'string') patch.public_base_url = body.publicBaseUrl.trim();

    const { error } = await supabaseAdmin().from('event').update(patch).eq('id', session.eventId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/event', err);
    return NextResponse.json({ error: 'erro ao salvar' }, { status: 500 });
  }
}
