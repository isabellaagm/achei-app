import { getTheEvent, toPublicEvent } from '@/lib/event';
import { getAdminSession } from '@/lib/auth';
import { AdminApp } from '@/components/admin/AdminApp';

export const dynamic = 'force-dynamic';

export default async function OrganizadorPage() {
  const event = await getTheEvent();
  const session = await getAdminSession();
  const isAdmin = !!session && !!event && session.eventId === event.id;

  return <AdminApp isAdmin={isAdmin} event={event ? await toPublicEvent(event) : null} />;
}
