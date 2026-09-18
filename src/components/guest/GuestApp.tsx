'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { EventHero, PublicEvent } from '@/components/EventHero';
import { Button, Card, Eyebrow, StepRail, StatusLine, ErrorText, Empty, Label } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { detectFaces, largestFace, type LoadStatus } from '@/lib/human-client';
import { fileToImage, resizeToCanvas, shareOrDownloadImage } from '@/lib/image-utils';
import { loadSavedGuest, saveGuest, clearSavedGuest, type SavedGuest } from '@/lib/guest-storage';

type Match = { photoId: string; score?: number; thumbUrl: string; downloadUrl: string };
type GalleryPhoto = { id: string; thumbUrl: string; downloadUrl: string };
type RosterGuest = { id: string; name: string };
type Step = 'landing' | 'select-name' | 'selfie' | 'results';
type ResultsTab = 'mine' | 'all';

export function GuestApp({ event }: { event: PublicEvent }) {
  const [step, setStep] = useState<Step>('landing');
  const [savedGuest, setSavedGuest] = useState<SavedGuest | null>(null);
  const [roster, setRoster] = useState<RosterGuest[] | null>(null);
  const [search, setSearch] = useState('');
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [confident, setConfident] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [err, setErr] = useState('');
  const toast = useToast();

  const [resultsTab, setResultsTab] = useState<ResultsTab>('mine');
  const [allPhotos, setAllPhotos] = useState<GalleryPhoto[]>([]);
  const [allPhotosTotal, setAllPhotosTotal] = useState(0);
  const [allPhotosLoading, setAllPhotosLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedGuest(loadSavedGuest());
  }, []);

  useEffect(() => {
    if (step !== 'select-name' || roster !== null) return;
    fetch('/api/guests/roster')
      .then((r) => r.json())
      .then((d) => setRoster(d.guests || []))
      .catch(() => setRoster([]));
  }, [step, roster]);

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
        toast('Câmera indisponível — use "escolher da galeria"');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step, toast]);

  const filteredRoster = useMemo(() => {
    if (!roster) return [];
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((g) => g.name.toLowerCase().includes(q));
  }, [roster, search]);

  function pickGuest(g: RosterGuest) {
    setGuestId(g.id);
    setGuestName(g.name);
    setStep('selfie');
  }

  function startNewSelfie(id: string, name: string) {
    setGuestId(id);
    setGuestName(name);
    setErr('');
    setStep('selfie');
  }

  async function viewMyPhotosAgain(g: SavedGuest) {
    setGuestId(g.id);
    setGuestName(g.name);
    setBusy(true);
    setBusyMsg('Carregando suas fotos…');
    try {
      const res = await fetch(`/api/guests/${g.id}/my-photos`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'erro ao carregar');
      setMatches(data.photos);
      setConfident(true);
      setResultsTab('mine');
      setStep('results');
    } catch {
      toast('Não consegui carregar suas fotos — tenta tirar uma selfie nova');
    } finally {
      setBusy(false);
    }
  }

  function forgetThisDevice() {
    clearSavedGuest();
    setSavedGuest(null);
    setStep('select-name');
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
      setResultsTab('mine');
      setStep('results');
      if (guestId) {
        const saved = { id: guestId, name: guestName };
        saveGuest(saved);
        setSavedGuest(saved);
      }
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

  async function loadAllPhotos() {
    setAllPhotosLoading(true);
    try {
      const res = await fetch(`/api/photos/public?limit=30&offset=${allPhotos.length}`);
      const data = await res.json();
      setAllPhotos((prev) => [...prev, ...(data.photos || [])]);
      setAllPhotosTotal(data.total || 0);
    } catch {
      toast('Não consegui carregar a galeria');
    } finally {
      setAllPhotosLoading(false);
    }
  }

  function openAllPhotosTab() {
    setResultsTab('all');
    if (allPhotos.length === 0) loadAllPhotos();
  }

  return (
    <div className="flex flex-1 flex-col">
      {step === 'landing' && <EventHero event={event} />}
      <div className="flex-1 px-5 pb-14 pt-5">
        {step === 'landing' && (
          <>
            <StepRail step={1} />
            <Eyebrow>passo 1 de 3</Eyebrow>
            {savedGuest ? (
              <>
                <h2 className="mb-2 text-2xl">Bem-vindo(a) de volta, {savedGuest.name.split(' ')[0]}!</h2>
                <p className="mb-5 text-ink/70">Já sabemos quem você é nesse aparelho.</p>
                <Button onClick={() => viewMyPhotosAgain(savedGuest)} disabled={busy}>
                  Ver minhas fotos
                </Button>
                <Button
                  variant="ghost"
                  className="mt-2.5"
                  onClick={() => startNewSelfie(savedGuest.id, savedGuest.name)}
                  disabled={busy}
                >
                  📸 Tirar uma selfie nova
                </Button>
                <button
                  onClick={forgetThisDevice}
                  className="mt-4 block w-full text-center font-body text-xs text-ink/45 underline"
                >
                  Não é você? Trocar de pessoa
                </button>
                {busy && <StatusLine>{busyMsg}</StatusLine>}
              </>
            ) : (
              <>
                <h2 className="mb-2 text-2xl">Vamos achar suas fotos</h2>
                <p className="mb-5 text-ink/70">
                  Você escolhe seu nome na lista, tira uma selfie rápida, e a gente compara com todas as fotos
                  do evento. Leva menos de um minuto.
                </p>
                <Button onClick={() => setStep('select-name')}>Começar</Button>
              </>
            )}
            <Link href="/" className="mt-2.5 block">
              <Button variant="ghost">← voltar</Button>
            </Link>
          </>
        )}

        {step === 'select-name' && (
          <>
            <StepRail step={1} />
            <Eyebrow>passo 1 de 3</Eyebrow>
            <h2 className="mb-3 text-2xl">Qual é o seu nome?</h2>
            <Card className="mb-4">
              <Label>Buscar</Label>
              <input
                type="text"
                placeholder="Comece a digitar seu nome…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {roster === null ? (
                <p className="mt-3 font-body text-sm text-ink/50">Carregando lista…</p>
              ) : (
                <div className="mt-3 max-h-72 overflow-y-auto rounded-[10px] border border-border">
                  {filteredRoster.length === 0 ? (
                    <p className="p-4 text-center font-body text-sm text-ink/50">Nenhum nome encontrado.</p>
                  ) : (
                    filteredRoster.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => pickGuest(g)}
                        className="block w-full border-b border-border px-4 py-3 text-left font-body text-sm last:border-b-0 hover:bg-surface"
                      >
                        {g.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </Card>
            <p className="text-center font-body text-xs text-ink/45">
              Não encontrou seu nome? Fala com a Bell ou o Gui — eles adicionam você na lista.
            </p>
          </>
        )}

        {step === 'selfie' && (
          <>
            <StepRail step={2} />
            <Eyebrow>passo 2 de 3</Eyebrow>
            <h2 className="mb-1 text-2xl">Oi, {guestName.split(' ')[0]}!</h2>
            <p className="mb-4 text-ink/70">
              Tire uma selfie olhando pra câmera, com boa luz no rosto. A foto não fica pública em lugar nenhum —
              só usamos pra comparar.
            </p>
            <Card className="p-3">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="aspect-[3/4] w-full -scale-x-100 rounded-[14px] border border-border bg-black object-cover"
                />
              </div>
              <div className="mt-3">
                <Button onClick={capture} disabled={busy}>
                  📸 Tirar foto agora
                </Button>
              </div>
              <p className="mt-1.5 text-center font-body text-xs text-ink/45">
                Recomendado — dá mais precisão na busca das suas fotos.
              </p>

              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-body text-xs text-ink/40">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button variant="ghost" onClick={() => document.getElementById('selfie-upload')?.click()} disabled={busy}>
                🖼️ Escolher da galeria
              </Button>
              <input
                id="selfie-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUploadSelfie}
              />
            </Card>
            {busy && <StatusLine>{busyMsg}</StatusLine>}
            {err && <ErrorText>{err}</ErrorText>}
          </>
        )}

        {step === 'results' && (
          <>
            <StepRail step={3} />
            <Eyebrow>passo 3 de 3</Eyebrow>

            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setResultsTab('mine')}
                className={`flex-1 rounded-full border px-3 py-2 font-body text-sm font-medium transition ${
                  resultsTab === 'mine' ? 'border-azul bg-azul text-surface-raised' : 'border-border text-ink/60'
                }`}
              >
                Minhas fotos
              </button>
              <button
                onClick={openAllPhotosTab}
                className={`flex-1 rounded-full border px-3 py-2 font-body text-sm font-medium transition ${
                  resultsTab === 'all' ? 'border-azul bg-azul text-surface-raised' : 'border-border text-ink/60'
                }`}
              >
                Todas as fotos
              </button>
            </div>

            {resultsTab === 'mine' && (
              <>
                <h2 className="mb-3 text-2xl">
                  {matches && matches.length && confident
                    ? `Achamos ${matches.length} foto${matches.length > 1 ? 's' : ''} sua${matches.length > 1 ? 's' : ''} 🎉`
                    : 'Ainda não achamos suas fotos'}
                </h2>
                {matches && matches.length > 0 && !confident && (
                  <p className="mb-3 text-ink/70">
                    Não encontramos uma correspondência com boa confiança, mas aqui estão as mais próximas:
                  </p>
                )}
                {(!matches || matches.length === 0) && (
                  <Empty>
                    Nenhuma foto no evento tem seu rosto ainda (ou o organizador ainda não enviou as fotos). Toque
                    em atualizar daqui a pouco.
                  </Empty>
                )}
                {matches && matches.length > 0 && (
                  <div className="my-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {matches.map((m) => (
                      <div key={m.photoId} className="relative overflow-hidden rounded-[10px] border border-border bg-surface-raised">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.thumbUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                        {typeof m.score === 'number' && (
                          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 font-body text-[10px] font-semibold text-dourado backdrop-blur">
                            {Math.round(m.score * 100)}%
                          </span>
                        )}
                        <button
                          onClick={() => shareOrDownloadImage(m.downloadUrl, `foto-${m.photoId}.jpg`)}
                          className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-sm text-surface-raised"
                          title="salvar"
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
              </>
            )}

            {resultsTab === 'all' && (
              <>
                <h2 className="mb-3 text-2xl">Todas as fotos do casamento</h2>
                {allPhotos.length === 0 && !allPhotosLoading && (
                  <Empty>Nenhuma foto enviada ainda.</Empty>
                )}
                {allPhotos.length > 0 && (
                  <div className="my-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {allPhotos.map((p) => (
                      <div key={p.id} className="relative overflow-hidden rounded-[10px] border border-border bg-surface-raised">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.thumbUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                        <button
                          onClick={() => shareOrDownloadImage(p.downloadUrl, `foto-${p.id}.jpg`)}
                          className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-sm text-surface-raised"
                          title="salvar"
                        >
                          ⬇
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {allPhotosLoading && <StatusLine>Carregando…</StatusLine>}
                {!allPhotosLoading && allPhotos.length < allPhotosTotal && (
                  <Button variant="ghost" onClick={loadAllPhotos}>
                    Carregar mais
                  </Button>
                )}
              </>
            )}

            <Link href="/" className="mt-2.5 block">
              <Button variant="ghost">← voltar ao início</Button>
            </Link>
            {busy && resultsTab === 'mine' && <StatusLine>{busyMsg}</StatusLine>}
          </>
        )}
      </div>
    </div>
  );
}
