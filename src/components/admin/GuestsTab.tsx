'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Empty, Label, StatusLine } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { GuestPhotosModal } from './GuestPhotosModal';

type Guest = { id: string; name: string; matchedCount: number; registeredAt: string };

export function GuestsTab() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkText, setBulkText] = useState('');
  const [singleName, setSingleName] = useState('');
  const [adding, setAdding] = useState(false);
  const [openGuest, setOpenGuest] = useState<{ id: string; name: string } | null>(null);
  const toast = useToast();

  async function loadGuests() {
    setLoading(true);
    try {
      const res = await fetch('/api/guests');
      const data = await res.json();
      setGuests(data.guests || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Busca inicial da lista de convidados ao montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGuests();
  }, []);

  async function addNames(names: string[]) {
    if (!names.length) return;
    setAdding(true);
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`${data.added} adicionado${data.added !== 1 ? 's' : ''}${data.skipped ? `, ${data.skipped} já existia(m)` : ''}`);
      await loadGuests();
    } catch {
      toast('Erro ao adicionar');
    } finally {
      setAdding(false);
    }
  }

  async function addBulk() {
    const names = bulkText.split('\n').map((n) => n.trim()).filter(Boolean);
    await addNames(names);
    setBulkText('');
  }

  async function addSingle() {
    if (!singleName.trim()) return;
    await addNames([singleName.trim()]);
    setSingleName('');
  }

  async function removeGuest(id: string) {
    if (!confirm('Remover este nome da lista?')) return;
    const res = await fetch(`/api/guests/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
      toast('Removido');
    } else {
      toast('Erro ao remover');
    }
  }

  return (
    <div>
      <Card className="mb-4">
        <Label>Colar lista de nomes</Label>
        <textarea
          rows={4}
          placeholder={'Um nome por linha, ex:\nAna Souza\nBruno Lima\nCarla Mendes'}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="mb-3"
        />
        <Button onClick={addBulk} disabled={adding || !bulkText.trim()}>
          {adding ? 'Adicionando…' : 'Adicionar lista'}
        </Button>
      </Card>

      <Card className="mb-4">
        <Label>Adicionar um nome</Label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome do convidado"
            value={singleName}
            onChange={(e) => setSingleName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSingle()}
          />
          <Button onClick={addSingle} disabled={adding || !singleName.trim()} className="w-auto px-5">
            +
          </Button>
        </div>
      </Card>

      {loading ? (
        <StatusLine>Carregando…</StatusLine>
      ) : (
        <>
          <p className="mb-3 text-ink/70">
            {guests.length} convidado{guests.length !== 1 ? 's' : ''} na lista
          </p>
          {!guests.length ? (
            <Empty>Ninguém na lista ainda. Cole os nomes acima.</Empty>
          ) : (
            <Card className="overflow-hidden p-0">
              {guests.map((g, i) => (
                <div
                  key={g.id}
                  className={`flex items-center justify-between gap-2 px-4 py-3 ${i !== guests.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <button
                    onClick={() => setOpenGuest({ id: g.id, name: g.name })}
                    className="flex-1 text-left font-body text-sm hover:text-azul"
                  >
                    {g.name}
                    <span className="ml-2 font-body text-xs text-ink/45">
                      {g.matchedCount} foto{g.matchedCount !== 1 ? 's' : ''}
                    </span>
                  </button>
                  <button
                    onClick={() => removeGuest(g.id)}
                    className="shrink-0 font-body text-xs text-danger/70 hover:text-danger"
                    title="remover"
                  >
                    remover
                  </button>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {openGuest && (
        <GuestPhotosModal guestId={openGuest.id} guestName={openGuest.name} onClose={() => setOpenGuest(null)} />
      )}
    </div>
  );
}
