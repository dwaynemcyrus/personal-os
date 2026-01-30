import { RxCollection } from 'rxdb';
import { supabase } from './supabase';
import { SyncTestDocument } from './db';

export async function setupSync(collection: RxCollection<SyncTestDocument>) {
  // Pull from Supabase on load
  await pullFromSupabase(collection);

  // Push to Supabase on local changes
  collection.$.subscribe(async (changeEvent) => {
    if (changeEvent.operation === 'INSERT' || changeEvent.operation === 'UPDATE') {
      await pushToSupabase(changeEvent.documentData);
    } else if (changeEvent.operation === 'DELETE') {
      await deleteFromSupabase(changeEvent.documentData.id);
    }
  });

  // Poll Supabase every 5 seconds for changes
  setInterval(() => pullFromSupabase(collection), 5000);
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
    console.error('Pull error:', error);
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
  } catch (error) {
    console.error('Push error:', error);
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
    console.error('Delete error:', error);
  }
}