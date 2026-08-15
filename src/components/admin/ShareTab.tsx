'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button, Card, FieldNote, Label } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { PublicEvent } from '@/components/EventHero';

export function ShareTab({ event }: { event: PublicEvent }) {
  const [link, setLink] = useState(event.publicBaseUrl || '');
  const [qr, setQr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Preenche o link com o domínio real onde o site está publicado.
    if (!link && typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLink(window.location.origin);
    }
  }, [link]);

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(`${link}/convidado`, { width: 220, margin: 1, color: { dark: '#14100f', light: '#fff8ed' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [link]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/event', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicBaseUrl: link }),
      });
      if (!res.ok) throw new Error();
      toast('Link salvo!');
    } catch {
      toast('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function copy() {
    navigator.clipboard?.writeText(`${link}/convidado`);
    toast('Link copiado!');
  }

  return (
    <div>
      <Card className="mb-4">
        <Label>Link público do evento</Label>
        <input type="text" value={link} onChange={(e) => setLink(e.target.value)} />
        <FieldNote>
          Detectamos automaticamente o domínio onde este site está publicado. Se você configurar um domínio
          próprio depois, atualize aqui.
        </FieldNote>
        <Button variant="ghost" onClick={save} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar link'}
        </Button>
      </Card>
      {link && (
        <Card className="text-center">
          {qr && (
            <div className="inline-block rounded-[10px] bg-flash p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code do evento" width={200} height={200} />
            </div>
          )}
          <p className="mt-3.5 break-all font-mono text-xs">{link}/convidado</p>
          <Button variant="ghost" onClick={copy} className="mt-3">
            Copiar link
          </Button>
        </Card>
      )}
    </div>
  );
}
