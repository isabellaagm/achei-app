import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDownloadUrl } from '@/lib/r2';

/**
 * Público, mas só útil pra quem já tem o próprio id (guardado no navegador
 * depois da primeira busca) — não expõe nada de outros convidados. Não
 * exige selfie nova: usa o resultado que já ficou salvo da última vez.
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = supabaseAdmin();

    const { data: guest, error: guestErr } = await db
      .from('guests')
      .select('id, name, matched_photo_ids')
      .eq('id', id)
      .maybeSingle();
    if (guestErr) throw guestErr;
    if (!guest) return NextResponse.json({ error: 'convidado não encontrado' }, { status: 404 });

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
        downloadUrl: await getDownloadUrl(p.original_key, 3600, `foto-${p.id}.jpg`),
      }))
    );

    return NextResponse.json({ name: guest.name, photos: shaped });
  } catch (err) {
    console.error('GET /api/guests/[id]/my-photos', err);
    return NextResponse.json({ error: 'erro ao carregar fotos' }, { status: 500 });
  }
}
