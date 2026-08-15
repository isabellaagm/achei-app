import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAdminSession } from '@/lib/auth';
import { getUploadUrl } from '@/lib/r2';

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { kind } = await req.json();

    if (kind === 'cover') {
      const key = `events/${session.eventId}/cover.jpg`;
      const uploadUrl = await getUploadUrl(key, 'image/jpeg');
      return NextResponse.json({ key, uploadUrl });
    }

    if (kind === 'photo') {
      const photoId = randomUUID();
      const originalKey = `events/${session.eventId}/photos/${photoId}/original.jpg`;
      const thumbKey = `events/${session.eventId}/photos/${photoId}/thumb.jpg`;
      const [originalUploadUrl, thumbUploadUrl] = await Promise.all([
        getUploadUrl(originalKey, 'image/jpeg'),
        getUploadUrl(thumbKey, 'image/jpeg'),
      ]);
      return NextResponse.json({ photoId, originalKey, originalUploadUrl, thumbKey, thumbUploadUrl });
    }

    return NextResponse.json({ error: 'kind inválido' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/upload-url', err);
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
