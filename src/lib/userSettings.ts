import { supabase } from './supabase';

export type UserSettings = {
  user_id: string;
  daily_note_template_id: string | null;
  template_date_format: string;
  template_time_format: string;
  updated_at: string;
};

export const DEFAULT_USER_SETTINGS = {
  daily_note_template_id: null as string | null,
  template_date_format: 'YYYY-MM-DD',
  template_time_format: 'HH:mm:ss',
};

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return data as UserSettings | null;
}

export async function upsertUserSettings(
  patch: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
}
