import { useCallback, useEffect, useMemo, useState } from 'react';
import { SpinnerContainer } from './LoadingSpinner';
import {
  Note,
  createNote, submitNote, deleteNote, editNote, refreshNotes, getNotes,
} from '../utils/notes';

import NoteItem from './NoteItem';
import OfflineIndicator from './OfflineIndicator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import NoteFormModal from './NoteFormModal';

export default function NoteList() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    return Array.from(new Set(allNotes.flatMap(note => note.tags || [])));
  }, [allNotes]);

  const filteredNotes = useMemo(() => {
    if (selectedTags.length === 0) return allNotes;
    return allNotes.filter(note => note.tags?.some(tag => selectedTags.includes(tag)));
  }, [allNotes, selectedTags]);

  const handleNoteSubmit = useCallback(async (noteTitle: string, tags: string[]) => {
    const note: Note = createNote(noteTitle, tags);
    await submitNote(note);
    setAllNotes(await getNotes());
  }, []);

  const handleNoteDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
    setAllNotes(await getNotes());
  }, []);

  const handleEditNote = useCallback(async (noteId: string, updatedTitle: string, updatedTags: string[]) => {
    await editNote(noteId, updatedTitle, updatedTags);
    setAllNotes(await getNotes());
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      await refreshNotes();
      setAllNotes(await getNotes());
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { type: 'module' })
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          window.addEventListener('online', async () => {
            await registration.sync.register('sync-notes');
            console.log('Sync event registered');
          });
        })
        .catch((error) => console.error('Service Worker registration failed:', error));
    }

    window.addEventListener('online', fetchNotes);
    return () => window.removeEventListener('online', fetchNotes);
  }, [fetchNotes]);

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-6xl xl:max-w-7xl mx-auto">
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-3xl font-bold">📓 iNotes</h2>
        <button
          onClick={() => {
            setEditingNote(undefined);
            setModalOpen(true);
          }}
          className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Add Note
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5 justify-center">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() =>
              setSelectedTags(prev =>
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
              )
            }
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedTags.includes(tag)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
          >
            #{tag}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="ml-2 text-sm text-red-500 underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {loading ? (
        <SpinnerContainer />
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map((note, index) => (
            <NoteItem
              key={note._id ?? index}
              note={note}
              onDeleteNote={handleNoteDelete}
              onEditNote={handleEditNote}
              setEditingNote={setEditingNote}
              setModalOpen={setModalOpen}
            />
          ))}
        </div>
      )}

      <NoteFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleNoteSubmit}
        onEditSave={handleEditNote}
        initialData={editingNote}
      />

      <OfflineIndicator />
    </div>
  );
}
