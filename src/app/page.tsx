import Link from 'next/link';
import { getTheEvent } from '@/lib/event';

// Os dados do evento mudam o tempo todo (fotos, convidados) — nunca gerar
// estaticamente em build time, sempre buscar fresco a cada visita.
export const dynamic = 'force-dynamic';
import { getDownloadUrl } from '@/lib/r2';
import { EventHero } from '@/components/EventHero';
import { Button, Card } from '@/components/ui';

export default async function HomePage() {
  const event = await getTheEvent();

  if (!event) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-2 font-display text-2xl">achei</div>
        <p className="mb-5 text-white/60">Nenhum evento configurado ainda.</p>
        <Link href="/organizador" className="w-full max-w-xs">
          <Button>Criar evento</Button>
        </Link>
      </div>
    );
  }

  const coverUrl = event.cover_key ? await getDownloadUrl(event.cover_key, 3600) : null;

  return (
    <div className="flex flex-1 flex-col">
      <EventHero
        event={{
          id: event.id,
          name: event.name,
          eventDate: event.event_date,
          location: event.location,
          accentColor: event.accent_color,
          coverUrl,
          publicBaseUrl: event.public_base_url,
        }}
      />
      <div className="flex-1 px-5 pb-14 pt-5">
        <p className="mb-4 text-white/70">Escolha como você quer entrar:</p>
        <Link href="/convidado" className="mb-2.5 block">
          <Button>🤳 Sou convidado(a) — quero achar minhas fotos</Button>
        </Link>
        <Link href="/organizador" className="block">
          <Button variant="ghost">🛠️ Sou o organizador(a)</Button>
        </Link>
        <Card className="mt-8">
          <p className="text-sm text-white/60">
            Convidado(a): tire uma selfie e a gente encontra suas fotos automaticamente por reconhecimento
            facial — nenhuma foto sua fica pública.
          </p>
        </Card>
      </div>
    </div>
  );
}
