'use client';

import { useEffect, useState } from 'react';
import { Empty, StatusLine } from '@/components/ui';
import { shareOrDownloadImage } from '@/lib/image-utils';

type GuestPhoto = { photoId: string; thumbUrl: string; downloadUrl: string };

export function GuestPhotosModal({
  guestId,
  guestName,
  onClose,
}: {
  guestId: string;
  guestName: string;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<GuestPhoto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/guests/${guestId}/photos`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPhotos(d.photos || []);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [guestId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[20px] border border-border bg-surface-raised p-5 sm:max-w-lg sm:rounded-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg">{guestName}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border font-body text-sm hover:border-azul hover:text-azul"
            aria-label="fechar"
          >
            ✕
          </button>
        </div>

        {photos === null && <StatusLine>Carregando fotos…</StatusLine>}
        {photos !== null && photos.length === 0 && <Empty>Nenhuma foto encontrada pra esse convidado ainda.</Empty>}
        {photos !== null && photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            {photos.map((p) => (
              <div key={p.photoId} className="relative overflow-hidden rounded-[10px] border border-border bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                <button
                  onClick={() => shareOrDownloadImage(p.downloadUrl, `foto-${p.photoId}.jpg`)}
                  className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-sm text-surface-raised"
                  title="salvar"
                >
                  ⬇
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
