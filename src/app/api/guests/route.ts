import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

/** Admin: lista completa de convidados (com contagem de fotos encontradas). */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin()
      .from('guests')
      .select('id, name, matched_photo_ids, registered_at')
      .eq('event_id', session.eventId)
      .order('name', { ascending: true });
    if (error) throw error;

    const guests = (data || []).map((g) => ({
      id: g.id,
      name: g.name,
      matchedCount: (g.matched_photo_ids || []).length,
      registeredAt: g.registered_at,
    }));

    return NextResponse.json({ guests });
  } catch (err) {
    console.error('GET /api/guests', err);
    return NextResponse.json({ error: 'erro ao listar convidados' }, { status: 500 });
  }
}

/** Admin: adiciona nomes à lista (um ou vários de uma vez). Ignora duplicatas por nome. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const body = await req.json();
    const rawNames: string[] = Array.isArray(body.names) ? body.names : [];
    const names = [...new Set(rawNames.map((n) => String(n || '').trim()).filter(Boolean))];
    if (!names.length) return NextResponse.json({ error: 'nenhum nome válido enviado' }, { status: 400 });

    const db = supabaseAdmin();
    const { data: existing, error: exErr } = await db
      .from('guests')
      .select('name')
      .eq('event_id', session.eventId);
    if (exErr) throw exErr;

    const existingLower = new Set((existing || []).map((g) => g.name.trim().toLowerCase()));
    const toInsert = names.filter((n) => !existingLower.has(n.toLowerCase()));
    const skipped = names.length - toInsert.length;

    if (toInsert.length) {
      const { error: insErr } = await db
        .from('guests')
        .insert(toInsert.map((name) => ({ event_id: session.eventId, name })));
      if (insErr) throw insErr;
    }

    return NextResponse.json({ added: toInsert.length, skipped });
  } catch (err) {
    console.error('POST /api/guests', err);
    return NextResponse.json({ error: 'erro ao adicionar convidados' }, { status: 500 });
  }
}
