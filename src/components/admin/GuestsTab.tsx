'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Empty, FieldNote, StatusLine } from '@/components/ui';
import { PublicEvent } from '@/components/EventHero';

type Guest = { id: string; name: string; phone: string; matchedCount: number; registeredAt: string };

export function GuestsTab({ event }: { event: PublicEvent }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guests')
      .then((r) => r.json())
      .then((d) => setGuests(d.guests || []))
      .finally(() => setLoading(false));
  }, []);

  function sendWhatsapp(g: Guest) {
    const link = event.publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const msg = `Oi ${g.name}! Suas fotos do evento já estão prontas 📸 Acesse: ${link}/convidado`;
    const digits = g.phone.replace(/\D/g, '');
    const withCountry = digits.length <= 11 ? '55' + digits : digits;
    window.open(`https://wa.me/${withCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (loading) return <StatusLine>Carregando…</StatusLine>;

  return (
    <div>
      <p className="mb-3 text-white/70">
        {guests.length} convidado{guests.length !== 1 ? 's' : ''} cadastrado{guests.length !== 1 ? 's' : ''}
      </p>
      {!guests.length ? (
        <Empty>Ninguém se cadastrou ainda. Compartilhe o link na aba &quot;Compartilhar&quot;.</Empty>
      ) : (
        <Card className="mb-3 overflow-x-auto p-3">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-left font-mono text-[10px] uppercase tracking-wide text-white/45">
                <th className="px-2 py-1.5">Nome</th>
                <th className="px-2 py-1.5">Fotos</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-white/5">
                  <td className="px-2 py-2">{g.name}</td>
                  <td className="px-2 py-2">{g.matchedCount}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => sendWhatsapp(g)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-brass-soft hover:text-brass-soft"
                    >
                      WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <a href="/api/guests/export">
        <Button variant="ghost">⬇ Exportar lista (CSV)</Button>
      </a>
      <FieldNote>
        Disparo automático em massa pro WhatsApp precisa da API oficial da Meta + aprovação de negócio — aqui é um
        por um, mas com a mensagem já pronta.
      </FieldNote>
    </div>
  );
}
