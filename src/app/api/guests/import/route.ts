import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';
import { normalizePhone } from '@/lib/phone';

type ImportRow = { name: string; phone: string };

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  try {
    const { rows } = (await req.json()) as { rows: ImportRow[] };
    if (!Array.isArray(rows) || !rows.length) {
      return NextResponse.json({ error: 'nenhuma linha pra importar' }, { status: 400 });
    }

    const db = supabaseAdmin();
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = String(row.name || '').trim();
      const phone = normalizePhone(String(row.phone || ''));
      if (!name || phone.length < 12) {
        skipped++;
        continue;
      }

      const { data: existing } = await db
        .from('guests')
        .select('id')
        .eq('event_id', session.eventId)
        .eq('phone', phone)
        .maybeSingle();

      if (existing) {
        await db.from('guests').update({ name }).eq('id', existing.id);
        updated++;
      } else {
        await db.from('guests').insert({ event_id: session.eventId, name, phone });
        imported++;
      }
    }

    return NextResponse.json({ imported, updated, skipped });
  } catch (err) {
    console.error('POST /api/guests/import', err);
    return NextResponse.json({ error: 'erro ao importar' }, { status: 500 });
  }
}
