import { useDatabaseContext } from '@/components/providers/DatabaseProvider';

export function useDatabase() {
  return useDatabaseContext();
}
