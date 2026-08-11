const DATABASE_NAME = "journal-viewer";
const STORE_NAME = "handles";
const HANDLE_KEY = "daily-directory";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Could not open the saved folder data."));
  });
}

/** Stores only the browser directory handle; journal content and file lists are never persisted. */
export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error("Could not save the folder data."));
    });
  } finally {
    database.close();
  }
}

/** Restores a previously selected directory handle when one exists. */
export async function loadDirectoryHandle(): Promise<
  FileSystemDirectoryHandle | null
> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME).objectStore(STORE_NAME)
        .get(HANDLE_KEY);
      request.onsuccess = () =>
        resolve(
          (request.result as FileSystemDirectoryHandle | undefined) ?? null,
        );
      request.onerror = () =>
        reject(new Error("Could not restore the saved folder data."));
    });
  } finally {
    database.close();
  }
}
