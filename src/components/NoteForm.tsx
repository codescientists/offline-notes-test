import React, { useState, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface NoteFormProps {
  onNoteSubmit: (noteTitle: string, tags: string[]) => Promise<void>;
}

const NoteForm: React.FC<NoteFormProps> = ({ onNoteSubmit }) => {
  const [isSyncing, setSyncing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleNoteTitleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteTitle(e.target.value);
  };

  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (noteTitle.trim() === '') return;
    setSyncing(true);
    await onNoteSubmit(noteTitle, tags);
    setNoteTitle('');
    setTags([]);
    setTagInput('');
    setSyncing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full max-w-2xl mx-auto">
      <textarea
        rows={3}
        value={noteTitle}
        onChange={handleNoteTitleChange}
        placeholder="Enter your note..."
        className="w-full p-3 border rounded-md resize-vertical text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-600 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <input
          type="text"
          value={tagInput}
          onChange={handleTagInputChange}
          onKeyDown={handleTagKeyDown}
          placeholder="Add a tag and press Enter"
          className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <button
        type="submit"
        className="self-end bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
        disabled={isSyncing}
      >
        {isSyncing ? <LoadingSpinner /> : 'Add Note'}
      </button>
    </form>
  );
};

export default NoteForm;
