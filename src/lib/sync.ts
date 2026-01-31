import { RxCollection } from 'rxdb';
import { supabase } from './supabase';
import { SyncTestDocument } from './db';

let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;
let syncQueue = new Set<string>();

export async function setupSync(collection: RxCollection<SyncTestDocument>) {
  // Pull from Supabase on load
  await pullFromSupabase(collection);

  // Clean up any invalid UUIDs from local database
  await cleanupInvalidUUIDs(collection);

  // Initial push of all local items (only once on startup)
  await pushAllToSupabase(collection);

  // Push to Supabase on local changes (but avoid duplicates)
  collection.$.subscribe(async (changeEvent) => {
    if (changeEvent.operation === 'INSERT' || changeEvent.operation === 'UPDATE') {
      const docId = changeEvent.documentData.id;
      
      // Skip if already in queue
      if (syncQueue.has(docId)) {
        return;
      }
      
      syncQueue.add(docId);
      await pushToSupabase(changeEvent.documentData);
      syncQueue.delete(docId);
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

// Clean up invalid UUIDs from local database
async function cleanupInvalidUUIDs(collection: RxCollection<SyncTestDocument>) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  const allDocs = await collection.find().exec();
  let cleanedCount = 0;
  
  for (const doc of allDocs) {
    const data = doc.toJSON();
    if (!uuidRegex.test(data.id)) {
      console.log('🗑️ Removing invalid UUID:', data.id);
      await doc.remove();
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`✓ Cleaned up ${cleanedCount} invalid items`);
  }
}

// Push ALL local items that might not be in Supabase yet
async function pushAllToSupabase(collection: RxCollection<SyncTestDocument>) {
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return;
  }

  isSyncing = true;
  
  try {
    const allDocs = await collection.find().exec();
    
    if (allDocs.length === 0) {
      console.log('No items to sync');
      isSyncing = false;
      return;
    }
    
    console.log(`Syncing ${allDocs.length} items to Supabase...`);
    
    for (const doc of allDocs) {
      const docData = doc.toJSON();
      syncQueue.add(docData.id);
      await pushToSupabase(docData);
      syncQueue.delete(docData.id);
    }
    
    console.log(`✓ Synced ${allDocs.length} items successfully`);
  } catch (error) {
    console.error('Push all error:', error);
  } finally {
    isSyncing = false;
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
    const payload = {
      id: doc.id,
      content: doc.content,
      updated_at: doc.updated_at,
      is_deleted: doc.is_deleted,
    };

    const { data, error } = await supabase
      .from('sync_test')
      .upsert(payload);

    if (error) {
      console.error('❌ Push FAILED:', {
        itemId: doc.id,
        itemContent: doc.content,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      throw error;
    }
    
    console.log('✓ Pushed successfully:', doc.id);
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