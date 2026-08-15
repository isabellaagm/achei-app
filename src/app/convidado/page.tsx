import Link from 'next/link';
import { getTheEvent } from '@/lib/event';

export const dynamic = 'force-dynamic';
import { getDownloadUrl } from '@/lib/r2';
import { GuestApp } from '@/components/guest/GuestApp';
import { Button } from '@/components/ui';

export default async function ConvidadoPage() {
  const event = await getTheEvent();

  if (!event) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-white/60">
        <p className="mb-4">Este evento ainda não foi configurado.</p>
        <Link href="/" className="w-full max-w-xs">
          <Button variant="ghost">← voltar</Button>
        </Link>
      </div>
    );
  }

  const coverUrl = event.cover_key ? await getDownloadUrl(event.cover_key, 3600) : null;

  return (
    <GuestApp
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
  );
}
