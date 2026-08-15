import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';
import { getDownloadUrl } from '@/lib/r2';

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const body = await req.json();
    const { photoId, originalKey, thumbKey, width, height, descriptors } = body as {
      photoId: string;
      originalKey: string;
      thumbKey: string;
      width?: number;
      height?: number;
      descriptors: number[][];
    };

    if (!photoId || !originalKey || !thumbKey || !Array.isArray(descriptors)) {
      return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { error: photoErr } = await db.from('photos').insert({
      id: photoId,
      event_id: session.eventId,
      original_key: originalKey,
      thumb_key: thumbKey,
      width: width ?? null,
      height: height ?? null,
      face_count: descriptors.length,
    });
    if (photoErr) throw photoErr;

    if (descriptors.length) {
      const rows = descriptors.map((embedding) => ({ photo_id: photoId, embedding }));
      const { error: descErr } = await db.from('face_descriptors').insert(rows);
      if (descErr) throw descErr;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/photos', err);
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 60), 200);
    const offset = Number(searchParams.get('offset') || 0);

    const db = supabaseAdmin();
    const { data, error, count } = await db
      .from('photos')
      .select('id, thumb_key, face_count, uploaded_at', { count: 'exact' })
      .eq('event_id', session.eventId)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const photos = await Promise.all(
      (data || []).map(async (p) => ({
        id: p.id,
        faceCount: p.face_count,
        uploadedAt: p.uploaded_at,
        thumbUrl: await getDownloadUrl(p.thumb_key as string, 3600),
      }))
    );

    return NextResponse.json({ photos, total: count ?? photos.length });
  } catch (err) {
    console.error('GET /api/photos', err);
    return NextResponse.json({ error: 'erro ao listar fotos' }, { status: 500 });
  }
}
