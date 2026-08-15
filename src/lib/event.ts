import { supabaseAdmin } from './supabase';

export type EventRow = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  cover_key: string | null;
  accent_color: string;
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
