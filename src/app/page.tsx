'use client';

import { useDatabase } from '@/hooks/useDatabase';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SyncTestDocument } from '@/lib/db';

export default function Home() {
  const { db, isReady } = useDatabase();
  const [items, setItems] = useState<SyncTestDocument[]>([]);
  const [newContent, setNewContent] = useState('');

  // Subscribe to items
  useEffect(() => {
    if (!isReady || !db) return;

    const subscription = db.sync_test
      .find({
        selector: { is_deleted: false },
        sort: [{ updated_at: 'desc' }],
      })
      .$.subscribe((docs) => {
        setItems(docs.map((doc) => doc.toJSON()));
      });

    return () => subscription.unsubscribe();
  }, [db, isReady]);

  const addItem = async () => {
    if (!db || !newContent.trim()) return;

    await db.sync_test.insert({
      id: uuidv4(),
      content: newContent,
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    setNewContent('');
  };

  const deleteItem = async (id: string) => {
    if (!db) return;

    const doc = await db.sync_test.findOne(id).exec();
    if (doc) {
      await doc.patch({ is_deleted: true });
    }
  };

  if (!isReady) {
    return <div style={{ padding: 20 }}>Loading database...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Sync Test</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Enter something..."
          style={{ padding: 8, marginRight: 8, width: 300 }}
        />
        <button onClick={addItem} style={{ padding: 8 }}>
          Add Item
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              padding: 10,
              marginBottom: 8,
              border: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{item.content}</span>
            <button onClick={() => deleteItem(item.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {items.length === 0 && <p>No items yet. Add one above!</p>}
    </div>
  );
}