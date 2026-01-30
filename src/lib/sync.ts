import { RxCollection } from 'rxdb';
import { supabase } from './supabase';
import { SyncTestDocument } from './db';

let syncInterval: NodeJS.Timeout | null = null;

export async function setupSync(collection: RxCollection<SyncTestDocument>) {
  // Pull from Supabase on load
  await pullFromSupabase(collection);

  // Push ALL local changes to Supabase on startup (catch any missed syncs)
  await pushAllToSupabase(collection);

  // Push to Supabase on local changes
  collection.$.subscribe(async (changeEvent) => {
    if (changeEvent.operation === 'INSERT' || changeEvent.operation === 'UPDATE') {
      await pushToSupabase(changeEvent.documentData);
    } else if (changeEvent.operation === 'DELETE') {
      await deleteFromSupabase(changeEvent.documentData.id);
    }
  });

  // Poll Supabase every 5 seconds for changes
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => pullFromSupabase(collection), 5000);

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
      console.log('Back online - syncing...');
      await pushAllToSupabase(collection);
      await pullFromSupabase(collection);
    });
  }
}

// Push ALL local items that might not be in Supabase yet
async function pushAllToSupabase(collection: RxCollection<SyncTestDocument>) {
  try {
    const allDocs = await collection.find().exec();
    
    for (const doc of allDocs) {
      await pushToSupabase(doc.toJSON());
    }
    
    console.log(`Synced ${allDocs.length} items to Supabase`);
  } catch (error) {
    console.error('Push all error:', error);
  }
}

async function pullFromSupabase(collection: RxCollection<SyncTestDocument>) {
  try {
    const { data, error } = await supabase
      .from('sync_test')
      .select('*')
      .eq('is_deleted', false);

    if (error) throw error;

    for (const item of data || []) {
      const exists = await collection.findOne(item.id).exec();
      
      if (!exists) {
        // Insert new
        await collection.insert(item);
      } else if (new Date(item.updated_at) > new Date(exists.updated_at)) {
        // Update if remote is newer
        await exists.patch(item);
      }
    }
  } catch (error) {
    // Only log if it's not a network error
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      console.error('Pull error:', error);
    }
  }
}

async function pushToSupabase(doc: SyncTestDocument) {
  try {
    const { error } = await supabase
      .from('sync_test')
      .upsert({
        id: doc.id,
        content: doc.content,
        updated_at: doc.updated_at,
        is_deleted: doc.is_deleted,
      });

    if (error) throw error;
    console.log('Pushed to Supabase:', doc.id);
  } catch (error) {
    // Only log if it's not a network error
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      console.error('Push error:', error);
    }
  }
}

async function deleteFromSupabase(id: string) {
  try {
    const { error } = await supabase
      .from('sync_test')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    // Only log if it's not a network error
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      console.error('Delete error:', error);
    }
  }
}