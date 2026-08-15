'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EventHero, PublicEvent } from '@/components/EventHero';
import { Button, Card, Eyebrow, ErrorText } from '@/components/ui';

export function LoginForm({ event }: { event: PublicEvent }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'senha incorreta');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'senha incorreta');
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <EventHero event={event} compact />
      <div className="flex-1 px-5 pb-14 pt-5">
        <Eyebrow>acesso do organizador</Eyebrow>
        <h2 className="mb-3 text-2xl">Digite a senha</h2>
        <Card className="mb-4">
          <input
            type="password"
            placeholder="senha do organizador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Card>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
        <Link href="/" className="mt-2.5 block">
          <Button variant="ghost">← voltar</Button>
        </Link>
        {err && <ErrorText>{err}</ErrorText>}
      </div>
    </div>
  );
}
