import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

function csvEscape(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from('guests')
    .select('name, phone, matched_photo_ids, registered_at')
    .eq('event_id', session.eventId)
    .order('registered_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'erro ao exportar' }, { status: 500 });

  const rows = [
    ['nome', 'whatsapp', 'fotos_encontradas', 'cadastrado_em'],
    ...(data || []).map((g) => [g.name, g.phone, String((g.matched_photo_ids || []).length), g.registered_at]),
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="convidados.csv"',
    },
  });
}
