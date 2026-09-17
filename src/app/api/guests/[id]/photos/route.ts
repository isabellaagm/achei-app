import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';
import { getDownloadUrl } from '@/lib/r2';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { id } = await context.params;
    const db = supabaseAdmin();

    const { data: guest, error: guestErr } = await db
      .from('guests')
      .select('id, name, matched_photo_ids, event_id')
      .eq('id', id)
      .single();
    if (guestErr || !guest) return NextResponse.json({ error: 'convidado não encontrado' }, { status: 404 });
    if (guest.event_id !== session.eventId) return NextResponse.json({ error: 'não autorizado' }, { status: 403 });

    const photoIds = guest.matched_photo_ids || [];
    if (!photoIds.length) return NextResponse.json({ name: guest.name, photos: [] });

    const { data: photos, error: photosErr } = await db
      .from('photos')
      .select('id, thumb_key, original_key')
      .in('id', photoIds);
    if (photosErr) throw photosErr;

    const shaped = await Promise.all(
      (photos || []).map(async (p) => ({
        photoId: p.id,
        thumbUrl: await getDownloadUrl(p.thumb_key, 3600),
        downloadUrl: await getDownloadUrl(p.original_key, 3600),
      }))
    );

    return NextResponse.json({ name: guest.name, photos: shaped });
  } catch (err) {
    console.error('GET /api/guests/[id]/photos', err);
    return NextResponse.json({ error: 'erro ao carregar fotos' }, { status: 500 });
  }
}
