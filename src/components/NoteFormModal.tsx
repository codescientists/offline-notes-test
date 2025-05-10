import React, { useState, ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { Note } from '../utils/notes';
import { LoadingSpinner } from './LoadingSpinner';

interface NoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, tags: string[]) => void;
    onEditSave: (noteId: string, updatedTitle: string, updatedTags: string[]) => void;
    initialData?: Note;
}

const NoteFormModal: React.FC<NoteFormModalProps> = ({ isOpen, onClose, onSave, onEditSave, initialData }) => {
    const [isSyncing, setSyncing] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [onClose]);


    useEffect(() => {
        if (initialData) {
            setNoteTitle(initialData.title);
            setTags(initialData.tags || []);
        } else {
            setNoteTitle('');
            setTags([]);
        }
    }, [initialData, isOpen]);

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
        if (initialData?.localId) {
            await onEditSave(initialData.localId, noteTitle, tags)
        } else {
            await onSave(noteTitle, tags);
        }
        setNoteTitle('');
        setTags([]);
        setTagInput('');
        setSyncing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div ref={modalRef}
                className="bg-white p-6 rounded shadow-md w-[90%] max-w-md"
            >
                <h2 className="text-lg font-semibold mb-4">{initialData ? 'Edit Task' : 'Create Task'}</h2>
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
                            <input
                                type="text"
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Add a tag and press Enter"
                                className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />

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

                    </div>


                    <div className="flex items-center justify-end gap-2">
                        <button
                            className="self-end bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="self-end bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                            disabled={isSyncing}
                        >
                            {isSyncing ? <LoadingSpinner /> : initialData ? 'Save Note' : 'Add Note'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NoteFormModal;
