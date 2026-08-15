import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';
import { deleteObject } from '@/lib/r2';

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { id } = await context.params;
    const db = supabaseAdmin();

    const { data: photo, error: fetchErr } = await db
      .from('photos')
      .select('id, original_key, thumb_key, event_id')
      .eq('id', id)
      .single();
    if (fetchErr || !photo) return NextResponse.json({ error: 'foto não encontrada' }, { status: 404 });
    if (photo.event_id !== session.eventId) return NextResponse.json({ error: 'não autorizado' }, { status: 403 });

    await Promise.allSettled([deleteObject(photo.original_key), deleteObject(photo.thumb_key)]);

    const { error: delErr } = await db.from('photos').delete().eq('id', id);
    if (delErr) throw delErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/photos/[id]', err);
    return NextResponse.json({ error: 'erro ao apagar' }, { status: 500 });
  }
}
