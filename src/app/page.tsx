import Link from 'next/link';
import { getTheEvent, toPublicEvent } from '@/lib/event';
import { EventHero } from '@/components/EventHero';
import { Button, Card } from '@/components/ui';

// Os dados do evento mudam o tempo todo (fotos, convidados) — nunca gerar
// estaticamente em build time, sempre buscar fresco a cada visita.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const event = await getTheEvent();

  if (!event) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/bg-monograma.png" alt="Bell & Gui" className="mx-auto mb-3 h-14 w-auto object-contain" />
        <p className="mb-5 text-ink/60">Nenhum evento configurado ainda.</p>
        <Link href="/organizador" className="w-full max-w-xs">
          <Button>Criar evento</Button>
        </Link>
      </div>
    );
  }

  const publicEvent = await toPublicEvent(event);

  return (
    <div className="flex flex-1 flex-col">
      <EventHero event={publicEvent} />
      <div className="flex-1 px-5 pb-14 pt-5">
        <p className="mb-4 text-ink/70">Escolha como você quer entrar:</p>
        <Link href="/convidado" className="mb-2.5 block">
          <Button>🤳 Sou convidado(a) — quero achar minhas fotos</Button>
        </Link>
        <Link href="/organizador" className="block">
          <Button variant="ghost">🛠️ Sou o organizador(a)</Button>
        </Link>
        <Card className="mt-8">
          <p className="text-sm text-ink/60">
            Convidado(a): tire uma selfie e a gente encontra suas fotos automaticamente por reconhecimento
            facial — nenhuma foto sua fica pública.
          </p>
        </Card>
      </div>
    </div>
  );
}
