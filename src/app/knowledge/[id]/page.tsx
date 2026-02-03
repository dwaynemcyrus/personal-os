'use client';

import { useParams, useRouter } from 'next/navigation';
import { NoteEditor } from '@/features/notes/NoteEditor/NoteEditor';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const noteId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  if (!noteId) {
    return (
      <section>
        <p>Note not found.</p>
      </section>
    );
  }

  return (
    <NoteEditor
      noteId={noteId}
      variant="page"
      onClose={() => router.push('/knowledge')}
    />
  );
}
