import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTheEvent } from '@/lib/event';
import { getAdminSession } from '@/lib/auth';
import { getDownloadUrl } from '@/lib/r2';
import type { Database } from '@/lib/database.types';

type EventUpdate = Database['public']['Tables']['event']['Update'];

export async function GET() {
  try {
    const event = await getTheEvent();
    if (!event) return NextResponse.json({ event: null });

    const coverUrl = event.cover_key ? await getDownloadUrl(event.cover_key, 3600) : null;

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        eventDate: event.event_date,
        location: event.location,
        accentColor: event.accent_color,
        coverUrl,
        publicBaseUrl: event.public_base_url,
        customCss: event.custom_css,
      },
    });
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
    if (typeof body.coverKey === 'string') patch.cover_key = body.coverKey;
    if (typeof body.publicBaseUrl === 'string') patch.public_base_url = body.publicBaseUrl.trim();
    if (typeof body.customCss === 'string' || body.customCss === null) patch.custom_css = body.customCss;

    const { error } = await supabaseAdmin().from('event').update(patch).eq('id', session.eventId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/event', err);
    return NextResponse.json({ error: 'erro ao salvar' }, { status: 500 });
  }
}
