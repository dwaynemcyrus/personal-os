import { useEffect } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { psDb, connector } from '@/lib/powersync';
import { useAuth } from './AuthProvider';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      psDb.connect(connector).catch(console.error);
    } else {
      psDb.disconnect().catch(console.error);
    }
  }, [session]);

  return (
    <PowerSyncContext.Provider value={psDb}>
      {children}
    </PowerSyncContext.Provider>
  );
}
