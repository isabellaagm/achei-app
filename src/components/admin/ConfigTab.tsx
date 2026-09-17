'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label, ErrorText } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { PublicEvent } from '@/components/EventHero';

export function ConfigTab({ event }: { event: PublicEvent }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(event.name);
  const [eventDate, setEventDate] = useState(event.eventDate || '');
  const [location, setLocation] = useState(event.location || '');
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [wiping, setWiping] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/event', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, eventDate, location }),
      });
      if (!res.ok) throw new Error();
      toast('Salvo!');
      router.refresh();
    } catch {
      toast('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  async function wipeEverything() {
    if (confirmText !== 'APAGAR') {
      setErr('Digite APAGAR pra confirmar.');
      return;
    }
    setErr('');
    setWiping(true);
    try {
      const res = await fetch('/api/event/wipe', { method: 'POST' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setErr('Erro ao apagar. Tenta de novo.');
      setWiping(false);
    }
  }

  return (
    <div>
      <Card className="mb-4">
        <Label>Nome do evento</Label>
        <input type="text" className="mb-3.5" value={name} onChange={(e) => setName(e.target.value)} />
        <Label>Data</Label>
        <input type="date" className="mb-3.5" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <Label>Local</Label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Button onClick={save} disabled={saving} className="mt-3.5">
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </Card>

      <Button variant="ghost" onClick={logout} className="mb-4">
        Sair do painel
      </Button>

      <Card>
        <div className="mb-2.5 font-display text-[13px] font-bold uppercase tracking-[0.15em] text-danger">
          zona de risco
        </div>
        <p className="mb-3 font-body text-sm text-ink/70">
          Isso apaga o evento, todas as fotos e todos os convidados, do banco e do armazenamento. Não tem como
          desfazer.
        </p>
        <input
          type="text"
          placeholder='digite "APAGAR" para confirmar'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <Button variant="danger" onClick={wipeEverything} disabled={wiping} className="mt-3">
          {wiping ? 'Apagando…' : 'Apagar evento inteiro'}
        </Button>
        {err && <ErrorText>{err}</ErrorText>}
      </Card>
    </div>
  );
}
