'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label, FieldNote } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { PublicEvent } from '@/components/EventHero';
import { fileToImage, resizeToCanvas, canvasToBlob, uploadToSignedUrl } from '@/lib/image-utils';

function ColorField({
  label,
  value,
  onChange,
  note,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  note?: string;
}) {
  return (
    <div className="mb-3.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="font-body text-xs text-ink/50">{value}</span>
      </div>
      {note && <p className="mt-1 font-body text-xs text-ink/45">{note}</p>}
    </div>
  );
}

export function IdentityTab({ event }: { event: PublicEvent }) {
  const router = useRouter();
  const toast = useToast();

  const [colorBg, setColorBg] = useState(event.colorBg);
  const [colorSurface, setColorSurface] = useState(event.colorSurface);
  const [colorText, setColorText] = useState(event.colorText);
  const [accentColor, setAccentColor] = useState(event.accentColor);
  const [colorAccentSoft, setColorAccentSoft] = useState(event.colorAccentSoft);
  const [colorOrnamental, setColorOrnamental] = useState(event.colorOrnamental);
  const [colorBorder, setColorBorder] = useState(event.colorBorder);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  async function saveTheme() {
    setSaving(true);
    try {
      const res = await fetch('/api/event', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorBg,
          colorSurface,
          colorText,
          accentColor,
          colorAccentSoft,
          colorOrnamental,
          colorBorder,
        }),
      });
      if (!res.ok) throw new Error();
      toast('Identidade visual salva!');
      router.refresh();
    } catch {
      toast('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function resetToOfficial() {
    setColorBg('#F5F2EC');
    setColorSurface('#FFFDF9');
    setColorText('#050D73');
    setAccentColor('#344B9B');
    setColorAccentSoft('#7185B2');
    setColorOrnamental('#C99A5B');
    setColorBorder('#DFE2EE');
  }

  async function uploadImage(file: File, kind: 'logo' | 'cover') {
    const setBusy = kind === 'logo' ? setUploadingLogo : setUploadingCover;
    setBusy(true);
    try {
      const img = await fileToImage(file);
      const canvas = resizeToCanvas(img, kind === 'logo' ? 500 : 1400);
      const type = kind === 'logo' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(canvas, type, 0.9);

      const urlRes = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || 'falha ao pedir URL');

      await uploadToSignedUrl(urlData.uploadUrl, blob, type);

      const patchBody = kind === 'logo' ? { logoKey: urlData.key } : { coverKey: urlData.key };
      const patchRes = await fetch('/api/event', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!patchRes.ok) throw new Error();

      toast(kind === 'logo' ? 'Logo atualizada!' : 'Capa atualizada!');
      router.refresh();
    } catch {
      toast('Erro no upload');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Card className="mb-4">
        <p className="mb-1 font-body text-sm text-ink/60">
          Essa é a paleta oficial do design system de vocês — os nomes e valores batem exatamente com o{' '}
          <code className="rounded bg-surface px-1 py-0.5 text-xs">tokens.json</code> da identidade Bell &amp;
          Gui. Ajustes aqui refletem em todas as telas, inclusive as dos convidados.
        </p>
        <button onClick={resetToOfficial} className="mb-4 font-body text-xs text-azul underline">
          restaurar paleta oficial
        </button>

        <div className="mb-1 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-ink/70">
          Base
        </div>
        <ColorField label="Fundo (surface)" value={colorBg} onChange={setColorBg} />
        <ColorField label="Cartões e painéis (surface-raised)" value={colorSurface} onChange={setColorSurface} />
        <ColorField label="Texto (ink)" value={colorText} onChange={setColorText} />
        <ColorField label="Borda" value={colorBorder} onChange={setColorBorder} />

        <div className="mb-1 mt-4 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-ink/70">
          Destaque
        </div>
        <ColorField
          label="Azul (botões, links)"
          value={accentColor}
          onChange={setAccentColor}
          note="A cor funcional — usada em qualquer texto ou botão que precise de contraste seguro."
        />
        <ColorField
          label="Azul-claro"
          value={colorAccentSoft}
          onChange={setColorAccentSoft}
          note="Só pra texto grande, ícones de linha e bordas — não sustenta texto pequeno."
        />
        <ColorField
          label="Dourado"
          value={colorOrnamental}
          onChange={setColorOrnamental}
          note="Puramente ornamental — o cordão, divisores finos. Nunca usado como cor de texto."
        />

        <Button onClick={saveTheme} disabled={saving} className="mt-2">
          {saving ? 'Salvando…' : 'Salvar cores'}
        </Button>
      </Card>

      {/* pré-visualização ao vivo, com as cores ainda não salvas */}
      <div
        className="mb-4 overflow-hidden rounded-[18px] border text-center"
        style={{ background: colorBg, borderColor: colorBorder }}
      >
        <div className="p-6">
          <div
            className="mb-2 font-display text-[13px] font-bold uppercase tracking-[0.15em]"
            style={{ color: accentColor }}
          >
            pré-visualização
          </div>
          <div className="font-display text-[26px] uppercase tracking-wide" style={{ color: colorText }}>
            {event.name || 'Bell & Gui'}
          </div>
          <div className="mt-2 font-body" style={{ color: colorText, opacity: 0.75 }}>
            É assim que o título e o texto vão aparecer pros convidados.
          </div>
          <div
            className="mt-3 inline-block rounded-full px-4 py-2 font-body text-sm font-semibold"
            style={{ background: accentColor, color: colorSurface }}
          >
            Botão de exemplo
          </div>
        </div>
      </div>

      <Card className="mb-4">
        <div className="mb-1 font-display text-[13px] font-bold uppercase tracking-[0.1em] text-ink/70">
          Tipografia
        </div>
        <p className="mb-1 font-body text-sm text-ink/60">
          Fixa nos arquivos reais da papelaria de vocês — não precisa escolher, já está certo:
        </p>
        <ul className="ml-4 list-disc font-body text-sm text-ink/60">
          <li>
            <span className="font-display uppercase tracking-wide">Cinzel</span> — títulos e nomes do casal
          </li>
          <li>
            <span style={{ fontFamily: "'New Icon Script', cursive" }}>New Icon Script</span> — o &quot;&amp;&quot;
            e assinaturas
          </li>
          <li>Montserrat — corpo de texto</li>
        </ul>
      </Card>

      <Card className="mb-4">
        <Label>Logo / monograma</Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')}
        />
        <FieldNote>
          Por padrão já usa o monograma &quot;BG&quot; e o wordmark oficiais. Suba um arquivo aqui só se quiser
          substituir por outra versão.
        </FieldNote>
        {uploadingLogo && <p className="font-body text-xs text-ink/50">Enviando…</p>}
        {event.logoUrl && (
          <div className="mt-2 rounded-[10px] bg-surface p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.logoUrl} alt="logo customizada" className="h-12 w-auto object-contain" />
          </div>
        )}
      </Card>

      <Card>
        <Label>Foto de capa</Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover')}
        />
        <FieldNote>
          Aparece grande na página inicial. Sem uma foto sua, usamos a ilustração do altar como capa provisória.
        </FieldNote>
        {uploadingCover && <p className="font-body text-xs text-ink/50">Enviando…</p>}
      </Card>
    </div>
  );
}
