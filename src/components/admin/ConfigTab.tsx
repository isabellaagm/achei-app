'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Eyebrow, Label, FieldNote, ErrorText } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { PublicEvent } from '@/components/EventHero';
import { uploadToSignedUrl } from '@/lib/image-utils';

export function ConfigTab({ event }: { event: PublicEvent }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(event.name);
  const [eventDate, setEventDate] = useState(event.eventDate || '');
  const [location, setLocation] = useState(event.location || '');
  const [accentColor, setAccentColor] = useState(event.accentColor);
  const [customCss, setCustomCss] = useState(event.customCss || '');
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [wiping, setWiping] = useState(false);
  const [err, setErr] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/event', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, eventDate, location, accentColor, customCss }),
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

  async function uploadCover(file: File) {
    setUploadingCover(true);
    try {
      const urlRes = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'cover' }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || 'falha ao pedir URL de upload');

      await uploadToSignedUrl(urlData.uploadUrl, file, file.type || 'image/jpeg');

      const res = await fetch('/api/event', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverKey: urlData.key }),
      });
      if (!res.ok) throw new Error();
      toast('Capa atualizada!');
      router.refresh();
    } catch {
      toast('Erro ao enviar a capa');
    } finally {
      setUploadingCover(false);
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
        <input type="text" className="mb-3.5" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Label>Cor de destaque</Label>
        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        <FieldNote>Pinta os botões e o brilho da página em todo o site.</FieldNote>
        <Button onClick={save} disabled={saving} className="mt-3.5">
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </Card>

      <Card className="mb-4">
        <Label>Foto de capa</Label>
        {event.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverUrl} alt="capa atual" className="mb-3 aspect-video w-full rounded-[14px] object-cover" />
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadCover(file);
          }}
        />
        <Button variant="ghost" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
          {uploadingCover ? 'Enviando…' : event.coverUrl ? 'Trocar foto de capa' : 'Enviar foto de capa'}
        </Button>
      </Card>

      <Card className="mb-4">
        <Label>CSS customizado</Label>
        <textarea
          rows={8}
          className="font-mono text-xs"
          placeholder={`.exemplo {\n  /* seu CSS aqui */\n}`}
          value={customCss}
          onChange={(e) => setCustomCss(e.target.value)}
        />
        <FieldNote>
          Pra quem sabe CSS: isso é injetado no site inteiro, depois de todo o resto — dá pra sobrescrever qualquer
          estilo. Fica salvo só depois de clicar em &quot;Salvar alterações&quot; acima.
        </FieldNote>
      </Card>

      <Button variant="ghost" onClick={logout} className="mb-4">
        Sair do painel
      </Button>

      <Card>
        <Eyebrow>zona de risco</Eyebrow>
        <p className="mb-3 text-sm text-white/70">
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
