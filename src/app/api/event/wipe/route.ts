import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, clearAdminSession } from '@/lib/auth';
import { deleteObject } from '@/lib/r2';

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const db = supabaseAdmin();

    const { data: event } = await db.from('event').select('cover_key').eq('id', session.eventId).single();
    const { data: photos } = await db.from('photos').select('original_key, thumb_key').eq('event_id', session.eventId);

    const keys: string[] = [];
    if (event?.cover_key) keys.push(event.cover_key);
    for (const p of photos || []) {
      if (p.original_key) keys.push(p.original_key);
      if (p.thumb_key) keys.push(p.thumb_key);
    }
    await Promise.allSettled(keys.map((k) => deleteObject(k)));

    // face_descriptors, photos e guests têm "on delete cascade" a partir de event
    const { error } = await db.from('event').delete().eq('id', session.eventId);
    if (error) throw error;

    await clearAdminSession();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/event/wipe', err);
    return NextResponse.json({ error: 'erro ao apagar' }, { status: 500 });
  }
}
