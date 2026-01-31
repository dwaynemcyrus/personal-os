'use client';

import { useEffect, useState } from 'react';
import { RxDatabase } from 'rxdb';
import { DatabaseCollections, getDatabase } from '@/lib/db';
import { setupSync } from '@/lib/sync';

export function useDatabase() {
  const [db, setDb] = useState<RxDatabase<DatabaseCollections> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const database = await getDatabase();
      
      if (!mounted) return;

      // Setup sync
      await setupSync(database);

      setDb(database);
      setIsReady(true);
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { db, isReady };
}
