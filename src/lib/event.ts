import { supabaseAdmin } from './supabase';
import { getDownloadUrl } from './r2';

export type EventRow = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  cover_key: string | null;
  accent_color: string;
  color_bg: string;
  color_surface: string;
  color_text: string;
  color_accent_soft: string;
  color_ornamental: string;
  color_border: string;
  logo_key: string | null;
  admin_password_hash: string;
  public_base_url: string | null;
  created_at: string;
};

/** Este app existe pra UM evento só. Sempre pegamos a primeira (e única) linha. */
export async function getTheEvent(): Promise<EventRow | null> {
  const { data, error } = await supabaseAdmin()
    .from('event')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as EventRow | null;
}

export type PublicEventShape = {
  id: string;
  name: string;
  eventDate: string | null;
  location: string | null;
  accentColor: string;
  colorBg: string;
  colorSurface: string;
  colorText: string;
  colorAccentSoft: string;
  colorOrnamental: string;
  colorBorder: string;
  coverUrl: string | null;
  logoUrl: string | null;
  publicBaseUrl: string | null;
};

/** Monta o shape público (sem hash de senha) já com as URLs assinadas de capa/logo. */
export async function toPublicEvent(event: EventRow): Promise<PublicEventShape> {
  const [coverUrl, logoUrl] = await Promise.all([
    event.cover_key ? getDownloadUrl(event.cover_key, 3600) : Promise.resolve(null),
    event.logo_key ? getDownloadUrl(event.logo_key, 3600) : Promise.resolve(null),
  ]);
  return {
    id: event.id,
    name: event.name,
    eventDate: event.event_date,
    location: event.location,
    accentColor: event.accent_color,
    colorBg: event.color_bg,
    colorSurface: event.color_surface,
    colorText: event.color_text,
    colorAccentSoft: event.color_accent_soft,
    colorOrnamental: event.color_ornamental,
    colorBorder: event.color_border,
    coverUrl,
    logoUrl,
    publicBaseUrl: event.public_base_url,
  };
}
