'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Eyebrow, Label, FieldNote, ErrorText } from '@/components/ui';

export function SetupForm() {
  const router = useRouter();
  const [name, setName] = useState('Bell & Gui');
  const [eventDate, setEventDate] = useState('2027-04-10');
  const [location, setLocation] = useState('Villa Vezzane, Mairiporã');
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
        body: JSON.stringify({ name, eventDate: eventDate || null, location, password }),
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/bg-monograma.png" alt="" className="mb-3 h-12 w-auto object-contain" />
      <Eyebrow>novo evento</Eyebrow>
      <h2 className="mb-2 text-2xl">Vamos criar a galeria</h2>
      <p className="mb-4 font-body text-ink/70">
        A identidade visual de Bell &amp; Gui (cores, fontes e o monograma) já vem pronta — dá pra ajustar depois
        na aba Identidade. Essas informações abaixo aparecem na página que os convidados vão ver.
      </p>
      <Card className="mb-4">
        <Label>Nome do evento</Label>
        <input type="text" className="mb-3.5" value={name} onChange={(e) => setName(e.target.value)} />
        <Label>Data</Label>
        <input type="date" className="mb-3.5" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <Label>Local</Label>
        <input type="text" className="mb-3.5" value={location} onChange={(e) => setLocation(e.target.value)} />
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
