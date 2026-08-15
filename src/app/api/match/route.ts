import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTheEvent } from '@/lib/event';
import { getDownloadUrl } from '@/lib/r2';
import { cosineSimilarity, MATCH_THRESHOLD } from '@/lib/match';

export async function POST(req: Request) {
  try {
    const { embedding, guestId } = (await req.json()) as { embedding: number[]; guestId?: string };
    if (!Array.isArray(embedding) || embedding.length < 100) {
      return NextResponse.json({ error: 'embedding inválido' }, { status: 400 });
    }

    const event = await getTheEvent();
    if (!event) return NextResponse.json({ error: 'evento não encontrado' }, { status: 404 });

    const db = supabaseAdmin();

    // Busca todos os descritores de rosto das fotos deste evento.
    const { data: rows, error } = await db
      .from('face_descriptors')
      .select('embedding, photos!inner(id, thumb_key, original_key, event_id)')
      .eq('photos.event_id', event.id);
    if (error) throw error;

    // Agrupa por foto, guardando a melhor similaridade entre os rostos daquela foto.
    const bestByPhoto = new Map<string, { score: number; thumbKey: string; originalKey: string }>();
    for (const row of rows || []) {
      const photo = (row as unknown as { photos: { id: string; thumb_key: string; original_key: string } }).photos;
      const score = cosineSimilarity(embedding, row.embedding as unknown as number[]);
      const current = bestByPhoto.get(photo.id);
      if (!current || score > current.score) {
        bestByPhoto.set(photo.id, { score, thumbKey: photo.thumb_key, originalKey: photo.original_key });
      }
    }

    const ranked = [...bestByPhoto.entries()]
      .map(([photoId, v]) => ({ photoId, ...v }))
      .sort((a, b) => b.score - a.score);

    const good = ranked.filter((r) => r.score >= MATCH_THRESHOLD);
    const shortlist = (good.length ? good : ranked.slice(0, 6)).slice(0, 60);

    const matches = await Promise.all(
      shortlist.map(async (m) => ({
        photoId: m.photoId,
        score: m.score,
        thumbUrl: await getDownloadUrl(m.thumbKey, 3600),
        downloadUrl: await getDownloadUrl(m.originalKey, 3600, `achei-${m.photoId.slice(0, 8)}.jpg`),
      }))
    );

    if (guestId) {
      await db
        .from('guests')
        .update({ matched_photo_ids: good.map((g) => g.photoId) })
        .eq('id', guestId)
        .eq('event_id', event.id);
    }

    return NextResponse.json({ matches, confident: good.length > 0 });
  } catch (err) {
    console.error('POST /api/match', err);
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
