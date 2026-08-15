import { getTheEvent } from '@/lib/event';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { getDownloadUrl } from '@/lib/r2';
import { AdminApp } from '@/components/admin/AdminApp';

export default async function OrganizadorPage() {
  const event = await getTheEvent();
  const session = await getAdminSession();
  const isAdmin = !!session && !!event && session.eventId === event.id;

  const coverUrl = event?.cover_key ? await getDownloadUrl(event.cover_key, 3600) : null;

  return (
    <AdminApp
      isAdmin={isAdmin}
      event={
        event
          ? {
              id: event.id,
              name: event.name,
              eventDate: event.event_date,
              location: event.location,
              accentColor: event.accent_color,
              coverUrl,
              publicBaseUrl: event.public_base_url,
            }
          : null
      }
    />
  );
}
