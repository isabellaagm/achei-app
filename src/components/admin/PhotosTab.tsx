'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, Label, FieldNote, StatusLine, Empty } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { getHuman, detectFaces, type LoadStatus } from '@/lib/human-client';
import { fileToImage, resizeToCanvas, canvasToBlob, uploadToSignedUrl } from '@/lib/image-utils';

type PhotoItem = { id: string; faceCount: number; uploadedAt: string; thumbUrl: string };

const THUMB_MAX_DIM = 1000; // usado só pra galeria e pra detecção de rosto — o arquivo original NÃO é redimensionado

export function PhotosTab() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function loadPhotos() {
    setLoadingList(true);
    try {
      const res = await fetch('/api/photos?limit=60');
      const data = await res.json();
      setPhotos(data.photos || []);
      setTotal(data.total || 0);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    // Busca inicial da lista de fotos ao montar — é o padrão correto pra
    // carregar dados de servidor num componente client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPhotos();
  }, []);

  async function handleUpload() {
    const files = Array.from(fileInputRef.current?.files || []);
    if (!files.length) {
      toast('Escolha ao menos uma foto');
      return;
    }
    setBusy(true);
    setProgress({ done: 0, total: files.length });

    try {
      setBusyMsg('Carregando IA…');
      await getHuman((s: LoadStatus) => setBusyMsg(s.stage));

      for (let i = 0; i < files.length; i++) {
        setProgress({ done: i, total: files.length });
        setBusyMsg(`Processando ${i + 1}/${files.length}: ${files[i].name}`);
        try {
          await processOnePhoto(files[i]);
        } catch (e) {
          console.error('erro processando foto', files[i].name, e);
          toast(`Falha em ${files[i].name} — pulei essa e continuei`);
        }
      }
      setProgress({ done: files.length, total: files.length });
      toast('Fotos processadas!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadPhotos();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function processOnePhoto(file: File) {
    // 1) imagem original -> canvas reduzido só pra detectar rostos + preview
    const img = await fileToImage(file);
    const thumbCanvas = resizeToCanvas(img, THUMB_MAX_DIM);
    const faces = await detectFaces(thumbCanvas);
    const thumbBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.82);

    // 2) pede as URLs de upload (o arquivo original é enviado sem nenhuma alteração)
    const urlRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'photo' }),
    });
    const urlData = await urlRes.json();
    if (!urlRes.ok) throw new Error(urlData.error || 'falha ao pedir URL de upload');

    // 3) sobe original (bytes intactos) + thumb (comprimido) direto pro R2
    await Promise.all([
      uploadToSignedUrl(urlData.originalUploadUrl, file, file.type || 'image/jpeg'),
      uploadToSignedUrl(urlData.thumbUploadUrl, thumbBlob, 'image/jpeg'),
    ]);

    // 4) registra no banco: metadados + descritores faciais
    const reg = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: urlData.photoId,
        originalKey: urlData.originalKey,
        thumbKey: urlData.thumbKey,
        width: thumbCanvas.width,
        height: thumbCanvas.height,
        descriptors: faces.map((f) => f.embedding),
      }),
    });
    if (!reg.ok) {
      const d = await reg.json().catch(() => ({}));
      throw new Error(d.error || 'falha ao registrar foto');
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm('Apagar esta foto? Não tem como desfazer.')) return;
    const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast('Foto apagada');
    } else {
      toast('Erro ao apagar');
    }
  }

  const noFace = photos.filter((p) => p.faceCount === 0).length;

  return (
    <div>
      <Card className="mb-4">
        <Label>Enviar fotos do evento</Label>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="mb-1" />
        <FieldNote>
          Os arquivos originais são enviados sem nenhuma alteração de qualidade — só a miniatura da galeria é
          comprimida. Cada rosto detectado vira uma &quot;impressão digital&quot; usada pra comparar com as selfies
          dos convidados.
        </FieldNote>
        <Button onClick={handleUpload} disabled={busy}>
          {busy ? 'Processando…' : 'Processar e enviar'}
        </Button>
      </Card>

      {busy && (
        <div className="mb-4">
          <StatusLine>{busyMsg}</StatusLine>
          {progress && (
            <div className="mt-1 h-1.5 overflow-hidden rounded-full border border-border bg-surface">
              <div
                className="h-full bg-azul transition-all"
                style={{ width: `${Math.round((100 * progress.done) / Math.max(progress.total, 1))}%` }}
              />
            </div>
          )}
        </div>
      )}

      <p className="mb-3 text-ink/70">
        {total} foto{total !== 1 ? 's' : ''} na galeria
        {noFace ? ` · ${noFace} sem rosto detectado nesta página` : ''}
      </p>

      {loadingList ? (
        <StatusLine>Carregando…</StatusLine>
      ) : !photos.length ? (
        <Empty>Nenhuma foto ainda. Envie as primeiras acima.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-[10px] border border-border bg-surface-raised">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 font-body text-[10px] font-semibold text-dourado backdrop-blur">
                {p.faceCount} rosto{p.faceCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => deletePhoto(p.id)}
                className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-sm text-danger opacity-0 transition group-hover:opacity-100"
                title="apagar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {photos.length < total && (
        <p className="mt-3 text-center text-xs text-ink/40">mostrando as {photos.length} mais recentes de {total}</p>
      )}
    </div>
  );
}
