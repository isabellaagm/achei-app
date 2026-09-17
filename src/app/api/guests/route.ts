import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTheEvent } from '@/lib/event';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, phone } = await req.json();
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();
    if (!cleanName || !cleanPhone) {
      return NextResponse.json({ error: 'nome e whatsapp são obrigatórios' }, { status: 400 });
    }

    const event = await getTheEvent();
    if (!event) return NextResponse.json({ error: 'evento não encontrado' }, { status: 404 });

    const { data, error } = await supabaseAdmin()
      .from('guests')
      .insert({ event_id: event.id, name: cleanName, phone: cleanPhone })
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({ guestId: data.id });
  } catch (err) {
    console.error('POST /api/guests', err);
    return NextResponse.json({ error: 'erro ao cadastrar' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin()
      .from('guests')
      .select('id, name, phone, matched_photo_ids, registered_at')
      .eq('event_id', session.eventId)
      .order('registered_at', { ascending: false });
    if (error) throw error;

    const guests = (data || []).map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
      matchedCount: (g.matched_photo_ids || []).length,
      registeredAt: g.registered_at,
    }));

    return NextResponse.json({ guests });
  } catch (err) {
    console.error('GET /api/guests', err);
    return NextResponse.json({ error: 'erro ao listar convidados' }, { status: 500 });
  }
}
