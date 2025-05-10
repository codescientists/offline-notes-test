# Offline Notes App - Interview Task

## Description

This is a take home assignment for interview candidates.
Read this file carefully and implement the [tasks](#your-tasks) mentioned below.
Check the [Deliverables](#Deliverables) section for what to submit.

## How to Run the App

This application is built using Next.js.

1.  **Clone/Fork:**
    ```bash
    git clone https://github.com/interview177/offline-notes-test
    cd offline-notes-test
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Current Architecture

This is a note-taking application designed to work offline first.

**Key Components:**

- **Frontend:** Built with [Next.js](https://nextjs.org/), [React](https://reactjs.org/), and [TypeScript](https://www.typescriptlang.org/).
- **Offline Storage:** Uses the browser's **IndexedDB** to store notes locally. This allows the core functionality (create, read, update, delete notes) to work even when offline.
- **Synchronization:**
  - The app detects online/offline status using `navigator.onLine`.
  - A **Service Worker** (`public/sw.js`, registered in `src/components/NoteList.tsx`) is set up to handle background sync events when the application comes online.
  - The `refreshNotes` function in `src/utils/notes.ts` attempts to fetch data from the server API and reconcile local (IndexedDB) and server states.
- **Backend API:** Next.js API routes are defined in `src/pages/api/`. These are intended to interact with a persistent data store.
- **UI:** Basic React components located in `src/components`.

**What Works:**

- Creating, viewing, editing, and deleting notes while offline. Changes are saved to IndexedDB.
- Basic detection of online/offline status.
- The framework for triggering synchronization exists (Service Worker, `refreshNotes` function).

**What's Missing:**

- **Backend Data Store Implementation:** The API routes (`src/pages/api/notes.js`, `save-note.js`, `edit-note.js`, `delete-note.js`) currently contain **placeholder comments** (`// TODO: Implement logic...`). **There is no actual database or persistent storage connected on the backend.** These API routes need to be implemented to interact with a data store of your choice.

**Architecture Diagram:**

```mermaid
graph LR
    subgraph Browser
        Client[Next.js Client]
        SW[Service Worker]
        IDB[(IndexedDB)]
    end

    subgraph Server
        ServerAPI[Next.js Server API]
    end

    subgraph Data Store
        DS[(? Your Data Store ?)]
    end

    Client -- Uses/Stores --> IDB
    Client -- Registers/Listens --> SW
    Client -- API Calls --> ServerAPI
    SW -- Sync Events --> Client
    ServerAPI -- Needs Implementation --> DS
```

## Your Tasks

Your goal is to enhance this application by implementing the backend data store and adding new features. Create a fork of this repository and implement the following tasks on your fork.

**Requirements:**

0. **Implement the Backend Data Store:**

   - **This is the foundational task.** Choose a data store for the backend (e.g., MongoDB, PostgreSQL, SQLite, or even a simple JSON file if you want).
   - Implement the logic within the placeholder comments in the API routes (`src/pages/api/notes.js`, `save-note.js`, `edit-note.js`, `delete-note.js`) to perform the necessary CRUD operations (Create, Read, Update, Delete) using your chosen data store.
   - Ensure the API routes correctly interact with the client-side expectations (e.g., `save-note.js` should return the ID assigned by your data store).

1. **Tag Implementation:**

   - Allow users to add/remove simple string tags to individual notes. You can choose the UI for adding/displaying tags (e.g., input field, predefined list).
   - Store the tag data associated with each note (this should work with both your backend data store and the local IndexedDB storage).

2. **Filtering Implementation:**

   - Provide a UI mechanism (e.g., dropdown, checkboxes) to allow users to select one or more tags to filter the main note list.
   - The filtering logic must operate purely on the **client-side** based on the notes currently loaded/available locally in IndexedDB.

3. **State Management Constraint:**

   - Implement all required state management for the tagging and filtering features using **native React hooks** (`useState`, `useEffect`, `useCallback`, `useContext` etc.). Do **not** use external state management libraries like Redux, Zustand, etc.

4. **Conflict Detection:**

   - Implement logic within `src/utils/notes.ts` (likely in `refreshNotes` or related functions) to detect potential conflicts. A conflict occurs when a note has been modified locally while offline _and_ the same note has also been modified on the server (in the data store you implemented) since the last sync.
   - Define what constitutes a "conflict" (e.g., different titles, different content/tags).
   - **For this task, simply detecting and logging the conflict is sufficient.** You do _not_ need to implement a full conflict resolution UI, but you should think about how you _would_ resolve it (see Deliverables).

5. **UI Cleanup:**
   - The current UI is very basic. Improve the visual presentation and user experience. You are encouraged to use **Tailwind CSS** (it's already installed) for styling, but you can also continue using styled-components if preferred. Make it look more polished.

## Deliverables:

1.  A link to your Git repository (your fork) containing your completed implementation.
2.  **Crucially:** Update _this_ `README.md` file in your repository to include:
    - Details on the backend data store you chose and why. Add any necessary updates to the "How to Run" section based on your data store choice (e.g., specific environment variables).
    - An explanation of how you managed the state for tagging and filtering.
    - Details on how you integrated tag storage with both the backend and the existing offline IndexedDB mechanism. How did you structure the notes data with the tag data. What are the pros and cons for that structure.
    - An explanation of your conflict detection logic (how you identify conflicting notes).
    - A brief description of your proposed conflict _resolution_ strategy (even though you don't need to implement the UI for it).
3.  Feel free to update this codebase as you choose. If you want to update something or fix something, you can do that. Just document what you did.

Good luck!

## Updates:

## Data Store

### Chosen Store: **MongoDB**

- **Why MongoDB?**
  - Schema flexibility allowed easy integration of `tags` into each note.
  - Native support for JSON-like documents simplifies working with the frontend data structure.
- **How to Run (with MongoDB):**

  ```bash
   # Clone and install
   git clone https://github.com/codescientists/offline-notes-test.git
   cd offline-notes-test
   npm install

   # Set up environment variables (.env file)
   MONGODB_URI=your-mongo-uri-here

   # Start the app
   npm run dev
  ```

---

## Tagging and Filtering State Management

- Used `useState` to track selected tags in the main `NoteList` component.
- Used `useMemo` to derive all unique tags from `allNotes`.
- When user selects one or more tags, the notes list is filtered to only show notes that include all selected tags.
- The tag selection UI uses modern, accessible, multi-select dropdowns.

---

## Tag Storage Integration

### Backend Integration:

- Notes are stored in MongoDB with the structure:
  ```ts
  interface Note {
    _id: string;
    title: string;
    tags: string[];
    createdAt: Date;
    ...
  }
  ```
- Each note's tags are directly embedded as an array.

### Offline (IndexedDB) Integration:

- Structured notes with `tags: string[]` when storing them locally.
- IndexedDB syncs data using the Service Worker and Sync API.
- This structure allows consistent schema between online and offline storage.

### Pros:

- Easy filtering without the need to join/normalize tag collections.
- Simpler sync logic between IndexedDB and MongoDB.

### Cons:

- Tag duplication (e.g., "work" might be stored in many notes).
- Harder to manage global tag operations (like renaming or deleting tags app-wide).

---

## Conflict Detection Logic

When the app syncs offline changes:

- A conflict is flagged if a note with the same `_id` exists on the server **and**:
  - The `title` or `tags` were modified offline and online before sync.
  - Detected using `updatedAt` timestamp comparison or hash diff of note content.

---

## Conflict Resolution Strategy (Proposed)

Although not implemented, the strategy is:

- Display a UI that compares:
  - Local (offline) version
  - Server (latest) version
- Let user:
  - Keep local version
  - Accept server version
  - Merge manually
- Conflict metadata would be stored in local IndexedDB with a `hasConflict: true` flag and resolved later.

---

## Extra Updates & Fixes

- Added multi-tag filtering with beautiful modern UI using TailwindCSS.
- Added single TaskFormModal to add/edit the note.
- Automatically closes the modal on outside click.
- Date formatting uses `toLocaleDateString()` for better user readability.
- Removed duplicate tags using `Set`.
- Added Website title in nextjs `head` tag.

---
