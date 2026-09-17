import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTheEvent } from '@/lib/event';

/**
 * Público: lista só id+nome dos convidados pré-cadastrados, pra alimentar a
 * busca que o convidado usa pra escolher o próprio nome. Sem telefone, sem
 * contagem de fotos de ninguém — isso fica só no painel do organizador.
 */
export async function GET() {
  try {
    const event = await getTheEvent();
    if (!event) return NextResponse.json({ guests: [] });

    const { data, error } = await supabaseAdmin()
      .from('guests')
      .select('id, name')
      .eq('event_id', event.id)
      .order('name', { ascending: true });
    if (error) throw error;

    return NextResponse.json({ guests: data || [] });
  } catch (err) {
    console.error('GET /api/guests/roster', err);
    return NextResponse.json({ error: 'erro ao carregar lista' }, { status: 500 });
  }
}
