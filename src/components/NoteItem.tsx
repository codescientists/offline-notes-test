import React, { useEffect, useRef, useState } from 'react';
import SyncIndicator from './SyncIndicator';
import { Note } from '../utils/notes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faTrash, faPen } from '@fortawesome/free-solid-svg-icons';

interface NoteItemProps {
  note: Note;
  onDeleteNote: (noteId: string) => Promise<void>;
  onEditNote: (noteId: string, updatedTitle: string, updatedTags: string[]) => Promise<void>;
  setEditingNote: any;
  setModalOpen: any;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDeleteNote, onEditNote, setEditingNote, setModalOpen }) => {
  const [isSyncing, setSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDelete = async () => {
    setSyncing(true);
    try {
      if (note.localId !== undefined) {
        await onDeleteNote(note.localId);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = () => {
    setEditingNote(note);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (note.localId !== undefined) {
      setSyncing(true);
      await onEditNote(note.localId, title, note.tags || []);
      setSyncing(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(note.title);
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.value = note.title;
    }
  }, [isEditing, title]);

  return (
    <div className="w-full transition-shadow hover:shadow-md rounded-xl border overflow-hidden">
      <div
        className={`relative flex flex-col p-3 overflow-hidden transition-all duration-300 ${note._id === undefined ? 'bg-gray-100' : 'bg-white'
          }`}
      >
        {isSyncing && <SyncIndicator />}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 w-1/2">
            {new Date(note.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}

          </p>

          <div className="flex items-center justify-end w-full gap-2">
            <button
              onClick={handleEdit}
              className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-sm text-gray-500 hover:text-blue-600 transition"
            >
              <FontAwesomeIcon icon={faPen} className="" />
            </button>
            <button
              onClick={handleDelete}
              className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>

        <div className="note-content w-full overflow-y-auto mb-4 pr-2">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full border border-gray-300 rounded p-2 resize-none focus:outline-blue-400"
            />
          ) : (
            <div className="text-gray-800 text-base leading-relaxed">{note.title}</div>
          )}
        </div>

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-self-end">
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* {isEditing ? (
          <div className="flex gap-2 mt-auto self-end">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end w-full gap-2">
            <button
              onClick={handleEdit}
              className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-sm text-gray-500 hover:text-blue-600 transition"
            >
              <FontAwesomeIcon icon={faPen} className="" />
            </button>
            <button
              onClick={handleDelete}
              className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )} */}
      </div>

      {(note.localDeleteSynced === false ||
        note.localEditSynced === false ||
        note._id === undefined) && (
          <div className="flex flex-col items-start justify-end mt-1 text-sm text-red-600">
            {note.localDeleteSynced === false && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                Note deletion not synced
              </div>
            )}
            {note.localEditSynced === false && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                Note edit not synced
              </div>
            )}
            {note._id === undefined && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                Note submission not synced
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default NoteItem;
