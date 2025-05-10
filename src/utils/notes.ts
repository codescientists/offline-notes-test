import axios from 'axios';
import {
  storeOfflineNote,
  getOfflineNote,
  getOfflineNotes,
  deleteOfflineNote,
  editOfflineNote
} from '../../public/indexeddb';

export interface Note {
  _id?: number | string;
  localId?: string;

  localDeleteSynced?: boolean;
  localEditSynced?: boolean;

  title: string;
  createdAt: Date;
  tags?: string[]; // For tags
}

function createServerNote(note: Note) {
  const serverNote: Note = {
    title: note.title,
    localId: note.localId,
    tags: note.tags || [], 
    createdAt: note.createdAt
  }
  return serverNote
}

export function createNote(noteTitle: string, tags: string[]) {
  const note: Note = {
    title: noteTitle,
    localId: crypto.randomUUID(),
    tags: tags || [], 
    createdAt: new Date() // Add the current timestamp
  };
  return note;
}

export async function submitNote(note: Note) {
  await storeOfflineNote(note); 

  if (navigator.onLine) {
    try {
      const response = await fetch('/api/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createServerNote(note)),
      });

      if (response.ok) {
        const data = await response.json();
        note._id = data.insertedId; 
        await editOfflineNote(note); 
      } else {
        console.error('Failed to submit note');
      }
    } catch (error) {
      console.error('Failed to submit note:', error);
    }
  }
}


export async function deleteNote(noteId: string) {
  try {
    const note = await getOfflineNote(noteId);
    if (!note) return;

    if (note._id === undefined) {
      await deleteOfflineNote(noteId); // Not synced, delete locally
    } else if (navigator.onLine) {
      await deleteOfflineNote(noteId); // Remove local
      await axios.delete(`/api/delete-note?id=${note._id}`); // Delete remote
    } else {
      note.localDeleteSynced = false; // Mark unsynced deletion
      await editOfflineNote(note);
    }
  } catch (error) {
    console.error('Failed to delete note:', error);
  }
}


export async function editNote(noteId: string, updatedTitle: string, updatedTags?: string[]) {
  try {
    const note = await getOfflineNote(noteId);
    if (note) {
      if (note._id === undefined) {
        note.title = updatedTitle;
        if (updatedTags !== undefined) note.tags = updatedTags; 
        await editOfflineNote(note);
      } else {
        note.localEditSynced = false;
        if (navigator.onLine) {
          try {
            await axios.put(`/api/edit-note?id=${note._id}`, {
              title: updatedTitle,
              tags: updatedTags ?? note.tags, 
            });
            note.title = updatedTitle;
            if (updatedTags !== undefined) note.tags = updatedTags;
            note.localEditSynced = undefined;
            await editOfflineNote(note);
          } catch (error) {
            console.error('Error editing note:', error);
          }
        } else {
          note.title = updatedTitle;
          if (updatedTags !== undefined) note.tags = updatedTags;
          await editOfflineNote(note);
        }
      }
    }
  } catch (error) {
    console.error('Failed to edit note:', error);
  }
}



export async function updateSavedNote(serverNote: Note, localNotes: Note[]) {
  const matchingSyncedLocalNote = localNotes.find((n) => n._id === serverNote._id);

  if (!matchingSyncedLocalNote) {
    const matchingUnsyncedLocalNote = localNotes.find((n) => n.localId === serverNote.localId);
    if (matchingUnsyncedLocalNote) {
      matchingUnsyncedLocalNote._id = serverNote._id;
      matchingUnsyncedLocalNote.tags = serverNote.tags || []; // Syncing tags
      await editOfflineNote(matchingUnsyncedLocalNote);
    } else {
      serverNote.localId = crypto.randomUUID();
      await storeOfflineNote(serverNote);
    }
  }
}


export async function updateEditedNote(serverNote: Note, localNotes: Note[]) {
  const matchingLocalNote = localNotes.find((n) => n._id === serverNote._id);
  if (matchingLocalNote) {
    if (matchingLocalNote.localEditSynced === false) {
      await axios.put(`/api/edit-note?id=${matchingLocalNote._id}`, {
        title: matchingLocalNote.title,
        tags: matchingLocalNote.tags,
      });
      matchingLocalNote.localEditSynced = undefined;
      await editOfflineNote(matchingLocalNote);
    } else if (matchingLocalNote.localEditSynced === undefined) {
      matchingLocalNote.title = serverNote.title;
      matchingLocalNote.tags = serverNote.tags || [];
      await editOfflineNote(matchingLocalNote);
    }
  }
}

export async function updateDeletedNote(serverId: number, localNotes: Note[]) {
  const matchingLocalNote = localNotes.find((localNote: Note) => localNote._id === serverId);
  if (matchingLocalNote !== undefined) {
    await deleteOfflineNote(matchingLocalNote.localId);
  }
}

function notesAreDifferent(noteA: any, noteB: any): boolean {
  return (
    noteA.title !== noteB.title ||
    JSON.stringify(noteA.tags) !== JSON.stringify(noteB.tags)
  );
}

export async function refreshNotes() {
  if (!navigator.onLine) return;

  try {
    const localNotes = await getOfflineNotes();
    const { data: serverNotes } = await axios.get('/api/notes');
    
    // First Pass: Handle local operations
    for (const localNote of localNotes) {
      const serverMatch = serverNotes.find((s: any) => s._id === localNote._id);

      // Handle offline deletion
      if (localNote.localDeleteSynced === false) {
        if (serverMatch) {
          await deleteOfflineNote(localNote.localId);
          await axios.delete(`/api/delete-note?id=${localNote._id}`);
        }
      }

      // Handle newly created local notes (no _id yet)
      else if (!localNote._id) {
        try {
          const response = await fetch('/api/save-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createServerNote(localNote)),
          });

          if (response.ok) {
            const data = await response.json();
            localNote._id = data.insertedId;
            await editOfflineNote(localNote);
          }
        } catch (error) {
          console.error(`Error syncing note ${localNote.localId}:`, error);
        }
      }

      // Conflict Detection
      else if (serverMatch && !localNote.localEditSynced) {
        // Compare local note with server version
        if (notesAreDifferent(localNote, serverMatch)) {
          console.warn('Conflict detected for note:', {
            id: localNote._id,
            local: localNote,
            server: serverMatch,
          });

          // In future: resolve or queue for resolution
        }
      }
    }

    // Second Pass: Update local state with any new server changes
    const updatedLocalNotes = await getOfflineNotes();
    const { data: updatedServerNotes } = await axios.get('/api/notes');

    for (const serverNote of updatedServerNotes) {
      await updateSavedNote(serverNote, updatedLocalNotes);
      await updateEditedNote(serverNote, updatedLocalNotes);
    }
  } catch (error) {
    console.error('Error refreshing notes:', error);
  }
}


export async function getNotes() {
  const notes = await getOfflineNotes();
  notes.sort(function(a: Note, b: Note) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return notes;
}