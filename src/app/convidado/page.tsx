import Link from 'next/link';
import { getTheEvent, toPublicEvent } from '@/lib/event';
import { GuestApp } from '@/components/guest/GuestApp';
import { Button } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ConvidadoPage() {
  const event = await getTheEvent();

  if (!event) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-ink/60">
        <p className="mb-4">Este evento ainda não foi configurado.</p>
        <Link href="/" className="w-full max-w-xs">
          <Button variant="ghost">← voltar</Button>
        </Link>
      </div>
    );
  }

  return <GuestApp event={await toPublicEvent(event)} />;
}
