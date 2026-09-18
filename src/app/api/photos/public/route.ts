import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTheEvent } from '@/lib/event';
import { getDownloadUrl } from '@/lib/r2';

/** Público: galeria completa do evento, paginada — pra aba "todas as fotos" do convidado. */
export async function GET(req: Request) {
  try {
    const event = await getTheEvent();
    if (!event) return NextResponse.json({ photos: [], total: 0 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 30), 60);
    const offset = Number(searchParams.get('offset') || 0);

    const db = supabaseAdmin();
    const { data, error, count } = await db
      .from('photos')
      .select('id, thumb_key, original_key', { count: 'exact' })
      .eq('event_id', event.id)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const photos = await Promise.all(
      (data || []).map(async (p) => ({
        id: p.id,
        thumbUrl: await getDownloadUrl(p.thumb_key, 3600),
        downloadUrl: await getDownloadUrl(p.original_key, 3600, `foto-${p.id}.jpg`),
      }))
    );

    return NextResponse.json({ photos, total: count ?? photos.length });
  } catch (err) {
    console.error('GET /api/photos/public', err);
    return NextResponse.json({ error: 'erro ao carregar galeria' }, { status: 500 });
  }
}
