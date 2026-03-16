import { useQuery } from '@tanstack/react-query';
import { fetchUserSettings, DEFAULT_USER_SETTINGS } from '@/lib/userSettings';
import type { UserSettings } from '@/lib/userSettings';

export function useUserSettings(): (UserSettings & { isLoading: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: fetchUserSettings,
    staleTime: 5 * 60_000,
  });

  return {
    user_id: data?.user_id ?? '',
    daily_note_template_id: data?.daily_note_template_id ?? DEFAULT_USER_SETTINGS.daily_note_template_id,
    template_date_format: data?.template_date_format ?? DEFAULT_USER_SETTINGS.template_date_format,
    template_time_format: data?.template_time_format ?? DEFAULT_USER_SETTINGS.template_time_format,
    updated_at: data?.updated_at ?? '',
    isLoading,
  };
}
