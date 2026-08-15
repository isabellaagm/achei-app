import Image from 'next/image';
import { Eyebrow } from './ui';

export type PublicEvent = {
  id: string;
  name: string;
  eventDate: string | null;
  location: string | null;
  accentColor: string;
  coverUrl: string | null;
  publicBaseUrl: string | null;
  customCss?: string | null;
};

export function EventHero({ event, compact = false }: { event: PublicEvent; compact?: boolean }) {
  const dateFmt = event.eventDate
    ? new Date(event.eventDate + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={`${compact ? 'px-5 pb-5 pt-7' : 'px-5 pb-8 pt-12'}`}
      style={{
        background: `radial-gradient(ellipse at 20% -10%, ${event.accentColor}33 0%, transparent 55%), linear-gradient(180deg, #241521 0%, #14100f 100%)`,
      }}
    >
      <Eyebrow>achei · galeria do evento</Eyebrow>
      <h1 className={compact ? 'text-[26px]' : 'text-[32px]'}>{event.name}</h1>
      <div className="mt-2.5 font-mono text-[13px] text-brass-soft">
        {dateFmt ? `📅 ${dateFmt}` : ''} {event.location ? ` · 📍 ${event.location}` : ''}
      </div>
      {!compact && event.coverUrl && (
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-[18px] border border-white/10">
          <Image src={event.coverUrl} alt="capa do evento" fill className="object-cover" unoptimized />
        </div>
      )}
    </div>
  );
}
