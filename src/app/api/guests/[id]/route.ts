import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

/** Admin: remove um nome da lista (ex: corrigir um nome digitado errado). */
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { id } = await context.params;
    const { error } = await supabaseAdmin()
      .from('guests')
      .delete()
      .eq('id', id)
      .eq('event_id', session.eventId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/guests/[id]', err);
    return NextResponse.json({ error: 'erro ao remover' }, { status: 500 });
  }
}
