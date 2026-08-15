'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Eyebrow, Label, FieldNote, ErrorText } from '@/components/ui';

export function SetupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [accentColor, setAccentColor] = useState('#C7952A');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!name.trim() || password.length < 4) {
      setErr('Preenche pelo menos o nome do evento e uma senha de 4+ caracteres.');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/event/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, eventDate: eventDate || null, location, accentColor, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'erro ao criar evento');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'erro ao criar evento');
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 px-5 pb-14 pt-6">
      <div className="mb-2 font-display text-xl">achei</div>
      <Eyebrow>novo evento</Eyebrow>
      <h2 className="mb-2 text-2xl">Vamos criar a galeria</h2>
      <p className="mb-4 text-white/70">
        Essas informações aparecem na página que seus convidados vão ver. Dá pra editar depois.
      </p>
      <Card className="mb-4">
        <Label>Nome do evento</Label>
        <input
          type="text"
          className="mb-3.5"
          placeholder="Casamento Isabella & João"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Label>Data</Label>
        <input type="date" className="mb-3.5" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <Label>Local</Label>
        <input
          type="text"
          className="mb-3.5"
          placeholder="Villa Vezzane, Mairiporã"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <Label>Cor de destaque</Label>
        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        <FieldNote>Isso pinta o brilho da página do evento.</FieldNote>
        <Label>Senha do organizador</Label>
        <input
          type="password"
          placeholder="só você vai usar isso pra editar depois"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldNote>Guarde essa senha — é ela que destrava o painel do organizador.</FieldNote>
      </Card>
      <Button onClick={submit} disabled={busy}>
        {busy ? 'Criando…' : 'Criar galeria'}
      </Button>
      {err && <ErrorText>{err}</ErrorText>}
    </div>
  );
}
