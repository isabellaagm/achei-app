import Image from 'next/image';
import type { PublicEventShape } from '@/lib/event';

// Vários outros arquivos importam o tipo por este caminho — mantém a
// importação antiga funcionando (@/components/EventHero) sem duplicar o tipo.
export type { PublicEventShape as PublicEvent } from '@/lib/event';

export function EventHero({ event, compact = false }: { event: PublicEventShape; compact?: boolean }) {
  const dateFmt = event.eventDate
    ? new Date(event.eventDate + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Se o casal não subiu uma logo customizada, usa os ativos reais da
  // identidade Bell & Gui: o wordmark empilhado no hero principal, o
  // monograma "BG" (mais compacto) nas telas internas.
  const logoSrc = event.logoUrl || (compact ? '/brand/bg-monograma.png' : '/brand/bell-gui-wordmark.png');

  return (
    <div>
      <div
        className={`${compact ? 'px-5 pb-5 pt-7' : 'px-5 pb-6 pt-10'} text-center`}
        style={{
          background: `radial-gradient(ellipse at 50% -20%, ${event.colorOrnamental}22 0%, transparent 60%), var(--color-surface)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt={event.name}
          className={`mx-auto ${compact ? 'h-14' : 'h-28'} w-auto object-contain`}
        />
        <div className={`mt-3 font-body ${compact ? 'text-[13px]' : 'text-sm'} text-azul`}>
          {dateFmt ? `${dateFmt}` : ''} {event.location ? ` · ${event.location}` : ''}
        </div>
        {!compact && (
          <>
            <div className="cordao-divider mx-auto mt-5 max-w-[220px]" />
            {event.coverUrl ? (
              <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-[16px] border border-border">
                <Image src={event.coverUrl} alt="capa do evento" fill className="object-cover" unoptimized />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/brand/altar-cerimonia.png"
                alt=""
                className="mt-5 h-auto w-full max-w-full"
              />
            )}
          </>
        )}
      </div>
      {compact && <div className="cordao-divider mx-auto max-w-[160px] pb-1" />}
    </div>
  );
}
