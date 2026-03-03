import { createContext, useContext, useEffect, useState } from 'react';
import type { RxDatabase } from 'rxdb';
import type { DatabaseCollections } from '@/lib/db';
import { getDatabase } from '@/lib/db';
import { setupSync } from '@/lib/sync';

type DatabaseContextValue = {
  db: RxDatabase<DatabaseCollections> | null;
  isReady: boolean;
};

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<RxDatabase<DatabaseCollections> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const database = await getDatabase();
      if (!mounted) return;
      setDb(database);
      setIsReady(true);
      setupSync(database).catch(console.error);
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  return useContext(DatabaseContext);
}
