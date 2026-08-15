'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, Empty, FieldNote, Label, StatusLine } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { PublicEvent } from '@/components/EventHero';
import { normalizePhone } from '@/lib/phone';

type Guest = { id: string; name: string; phone: string; matchedCount: number; registeredAt: string };

function parseCsv(text: string): { name: string; phone: string }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: { name: string; phone: string }[] = [];
  for (const line of lines) {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;
    const [name, phone] = cols;
    if (/^(nome|name)$/i.test(name) && /(telefone|phone|whatsapp)/i.test(phone)) continue; // pula cabeçalho
    rows.push({ name, phone });
  }
  return rows;
}

function appLink(event: PublicEvent) {
  return `${event.publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/convidado`;
}

export function GuestsTab({ event }: { event: PublicEvent }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [queueIdx, setQueueIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  function loadGuests() {
    setLoading(true);
    fetch('/api/guests')
      .then((r) => r.json())
      .then((d) => setGuests(d.guests || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGuests();
  }, []);

  function sendWhatsapp(g: Guest) {
    const link = appLink(event);
    const msg = `Oi ${g.name}! Suas fotos do evento já estão prontas 📸 Acesse: ${link}`;
    window.open(`https://wa.me/${normalizePhone(g.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function inviteMessage(g: Guest) {
    const link = appLink(event);
    return (
      `Oi ${g.name}! Você foi convidado(a) pra ver as fotos de ${event.name} 📸\n\n` +
      `Passo a passo:\n1) Abra o link: ${link}\n2) Coloque seu nome e esse WhatsApp\n` +
      `3) Tire uma selfie rapidinha — a gente acha só as fotos que têm você`
    );
  }

  async function importCsv(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        toast('Não achei nenhuma linha válida no arquivo (esperado: nome,telefone)');
        return;
      }
      const res = await fetch('/api/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'falha ao importar');
      toast(`Importado: ${data.imported} novo(s), ${data.updated} atualizado(s), ${data.skipped} pulado(s)`);
      loadGuests();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'erro ao importar');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function sendQueueCurrent() {
    if (queueIdx === null) return;
    const g = guests[queueIdx];
    if (g) window.open(`https://wa.me/${normalizePhone(g.phone)}?text=${encodeURIComponent(inviteMessage(g))}`, '_blank');
    setQueueIdx(queueIdx + 1);
  }

  if (loading) return <StatusLine>Carregando…</StatusLine>;

  const inQueue = queueIdx !== null && queueIdx < guests.length;

  return (
    <div>
      <Card className="mb-4">
        <Label>Importar lista de convidados</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importCsv(file);
          }}
        />
        <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          {importing ? 'Importando…' : '📄 Importar CSV (nome, telefone)'}
        </Button>
        <FieldNote>
          Arquivo CSV com duas colunas: nome e telefone (com DDD). No Excel ou Google Sheets, use
          &quot;Salvar como&quot; / &quot;Fazer download&quot; → CSV. Convidados que já existirem (mesmo telefone) só
          têm o nome atualizado, não duplicam.
        </FieldNote>
      </Card>

      {guests.length > 0 && !inQueue && (
        <Button variant="ghost" onClick={() => setQueueIdx(0)} className="mb-4">
          📤 Enviar convite em fila ({guests.length})
        </Button>
      )}

      {inQueue && (
        <Card className="mb-4">
          <FieldNote>
            Convidado {queueIdx! + 1} de {guests.length} — cada clique abre o WhatsApp já com a mensagem pronta,
            você só confere e manda.
          </FieldNote>
          <p className="mb-3 text-lg">{guests[queueIdx!].name}</p>
          <Button onClick={sendQueueCurrent} className="mb-2">
            Abrir WhatsApp e ir pro próximo
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setQueueIdx(queueIdx! + 1)}>
              Pular
            </Button>
            <Button variant="ghost" onClick={() => setQueueIdx(null)}>
              Fechar fila
            </Button>
          </div>
        </Card>
      )}
      {queueIdx !== null && queueIdx >= guests.length && (
        <Card className="mb-4">
          <p className="mb-3">Fila terminada! 🎉</p>
          <Button variant="ghost" onClick={() => setQueueIdx(null)}>
            Fechar
          </Button>
        </Card>
      )}

      <p className="mb-3 text-white/70">
        {guests.length} convidado{guests.length !== 1 ? 's' : ''} cadastrado{guests.length !== 1 ? 's' : ''}
      </p>
      {!guests.length ? (
        <Empty>Ninguém se cadastrou ainda. Importe uma lista acima ou compartilhe o link na aba &quot;Compartilhar&quot;.</Empty>
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
