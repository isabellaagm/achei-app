'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EventHero, PublicEvent } from '@/components/EventHero';
import { Button, Card, Eyebrow, StepRail, StatusLine, ErrorText, Empty, Label } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { detectFaces, largestFace, type LoadStatus } from '@/lib/human-client';
import { fileToImage, resizeToCanvas, shareOrDownloadImage } from '@/lib/image-utils';

type Match = { photoId: string; score: number; thumbUrl: string; downloadUrl: string };
type Step = 'landing' | 'register' | 'selfie' | 'results';

export function GuestApp({ event }: { event: PublicEvent }) {
  const [step, setStep] = useState<Step>('landing');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestId, setGuestId] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [confident, setConfident] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [err, setErr] = useState('');
  const toast = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (step !== 'selfie') return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        toast('Câmera indisponível — use "enviar uma foto"');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step, toast]);

  async function registerGuest() {
    if (!name.trim() || !phone.trim()) {
      setErr('Preenche nome e WhatsApp, por favor.');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'erro ao cadastrar');
      setGuestId(data.guestId);
      setStep('selfie');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'erro ao cadastrar');
    } finally {
      setBusy(false);
    }
  }

  async function runMatch(canvas: HTMLCanvasElement) {
    setBusy(true);
    setErr('');
    try {
      const onProgress = (s: LoadStatus) => setBusyMsg(s.stage);
      const faces = await detectFaces(canvas, onProgress);
      const best = largestFace(faces);
      if (!best) {
        setErr('Não consegui achar um rosto na foto. Tenta de novo com mais luz, olhando pra câmera.');
        setBusy(false);
        return;
      }
      setEmbedding(best.embedding);
      setBusyMsg('Comparando com as fotos do evento…');
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding: best.embedding, guestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'erro ao comparar');
      setMatches(data.matches);
      setConfident(data.confident);
      setStep('results');
    } catch (e) {
      setErr(
        (e instanceof Error ? e.message : 'erro') +
          ' — se estiver testando logo após o deploy, pode ser a primeira vez baixando os modelos de IA, tenta de novo em alguns segundos.'
      );
    } finally {
      setBusy(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast('Câmera ainda não está pronta');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    runMatch(canvas);
  }

  async function onUploadSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await fileToImage(file);
    const canvas = resizeToCanvas(img, 900);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await runMatch(canvas);
  }

  async function refresh() {
    if (!embedding) {
      setStep('selfie');
      return;
    }
    setBusy(true);
    setBusyMsg('Buscando de novo…');
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding, guestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMatches(data.matches);
      setConfident(data.confident);
    } catch {
      toast('Não consegui atualizar, tenta de novo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {step === 'landing' && <EventHero event={event} />}
      <div className="flex-1 px-5 pb-14 pt-5">
        {step === 'landing' && (
          <>
            <StepRail step={1} />
            <Eyebrow>passo 1 de 3</Eyebrow>
            <h2 className="mb-2 text-2xl">Vamos achar suas fotos</h2>
            <p className="mb-5 text-white/70">
              Você vai se identificar, tirar uma selfie rápida, e a gente compara com todas as fotos do evento.
              Leva menos de um minuto.
            </p>
            <Button onClick={() => setStep('register')}>Começar</Button>
            <Link href="/" className="mt-2.5 block">
              <Button variant="ghost">← voltar</Button>
            </Link>
          </>
        )}

        {step === 'register' && (
          <>
            <StepRail step={1} />
            <Eyebrow>passo 1 de 3</Eyebrow>
            <h2 className="mb-3 text-2xl">Como podemos te chamar?</h2>
            <Card className="mb-4">
              <Label>Nome</Label>
              <input
                type="text"
                className="mb-3.5"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Label>WhatsApp</Label>
              <input
                type="tel"
                placeholder="(13) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Card>
            <Button onClick={registerGuest} disabled={busy}>
              {busy ? 'Aguarda…' : 'Continuar'}
            </Button>
            {err && <ErrorText>{err}</ErrorText>}
          </>
        )}

        {step === 'selfie' && (
          <>
            <StepRail step={2} />
            <Eyebrow>passo 2 de 3</Eyebrow>
            <h2 className="mb-2 text-2xl">Tire uma selfie</h2>
            <p className="mb-4 text-white/70">
              Olhe pra câmera, com boa luz no rosto. A foto não fica pública em lugar nenhum — só usamos pra
              comparar.
            </p>
            <Card className="p-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[3/4] w-full rounded-[14px] border border-white/10 bg-black object-cover"
              />
              <div className="mt-3">
                <Button onClick={capture} disabled={busy}>
                  📸 Capturar
                </Button>
              </div>
              <div className="mt-2.5 text-center text-xs text-white/45">
                Câmera não funciona?{' '}
                <label htmlFor="selfie-upload" className="cursor-pointer text-brass-soft underline">
                  envie uma foto
                </label>
              </div>
              <input id="selfie-upload" type="file" accept="image/*" capture="user" className="hidden" onChange={onUploadSelfie} />
            </Card>
            {busy && <StatusLine>{busyMsg}</StatusLine>}
            {err && <ErrorText>{err}</ErrorText>}
          </>
        )}

        {step === 'results' && (
          <>
            <StepRail step={3} />
            <Eyebrow>passo 3 de 3</Eyebrow>
            <h2 className="mb-3 text-2xl">
              {matches && matches.length && confident
                ? `Achamos ${matches.length} foto${matches.length > 1 ? 's' : ''} sua${matches.length > 1 ? 's' : ''} 🎉`
                : 'Ainda não achamos suas fotos'}
            </h2>
            {matches && matches.length > 0 && !confident && (
              <p className="mb-3 text-white/70">
                Não encontramos uma correspondência com boa confiança, mas aqui estão as mais próximas:
              </p>
            )}
            {(!matches || matches.length === 0) && (
              <Empty>
                Nenhuma foto no evento tem seu rosto ainda (ou o organizador ainda não enviou as fotos). Toque em
                atualizar daqui a pouco.
              </Empty>
            )}
            {matches && matches.length > 0 && (
              <div className="my-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {matches.map((m) => (
                  <div key={m.photoId} className="relative overflow-hidden rounded-[10px] border border-white/10 bg-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumbUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-ink/75 px-1.5 py-0.5 font-mono text-[10px] text-brass-soft backdrop-blur">
                      {Math.round(m.score * 100)}%
                    </span>
                    <button
                      onClick={() => shareOrDownloadImage(m.downloadUrl, `achei-${m.photoId.slice(0, 8)}.jpg`)}
                      className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-ink/75 text-sm"
                      title="salvar foto"
                    >
                      ⬇
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" onClick={refresh} disabled={busy}>
              🔄 Atualizar (buscar de novo)
            </Button>
            <Link href="/" className="mt-2.5 block">
              <Button variant="ghost">← voltar ao início</Button>
            </Link>
            {busy && <StatusLine>{busyMsg}</StatusLine>}
          </>
        )}
      </div>
    </div>
  );
}
