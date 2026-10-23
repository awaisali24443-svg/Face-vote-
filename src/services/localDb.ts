// ============================================================
// On-device database (IndexedDB) for Device Mode.
//
// Stores the full election locally: config, candidates, voters
// (including face embeddings + photos) and ballots. When
// IndexedDB is unavailable (tests, SSR), falls back to memory.
// ============================================================

export type LocalStoreName = 'meta' | 'voters' | 'candidates' | 'ballots';

const DB_NAME = 'facevote-device-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        if (!db.objectStoreNames.contains('voters'))
          db.createObjectStore('voters', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('candidates'))
          db.createObjectStore('candidates', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ballots'))
          db.createObjectStore('ballots', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function idbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

function tx<T>(
  store: LocalStoreName,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
      })
  );
}

// ---------- In-memory fallback (no IndexedDB, e.g. Node tests) ----------
const memoryStores: Record<LocalStoreName, Map<any, any>> = {
  meta: new Map(),
  voters: new Map(),
  candidates: new Map(),
  ballots: new Map(),
};
const memoryCounters: Record<string, number> = { voters: 0, ballots: 0 };

export async function localGetAll<T = any>(store: LocalStoreName): Promise<T[]> {
  if (!idbAvailable()) return Array.from(memoryStores[store].values()) as T[];
  return tx<T[]>(store, 'readonly', (os) => os.getAll() as IDBRequest<T[]>);
}

export async function localGet<T = any>(store: LocalStoreName, key: IDBValidKey): Promise<T | undefined> {
  if (!idbAvailable()) return memoryStores[store].get(key) as T | undefined;
  return tx<T | undefined>(store, 'readonly', (os) => os.get(key) as IDBRequest<T | undefined>);
}

export async function localPut(store: LocalStoreName, value: any, key?: IDBValidKey): Promise<any> {
  if (!idbAvailable()) {
    let k = key;
    if (k === undefined) {
      if (value && value.id !== undefined) {
        k = value.id;
      } else if (store === 'voters' || store === 'ballots') {
        k = ++memoryCounters[store];
        value = { ...value, id: k };
      }
    }
    if ((store === 'voters' || store === 'ballots') && typeof k === 'number') {
      memoryCounters[store] = Math.max(memoryCounters[store], k);
    }
    memoryStores[store].set(k, value);
    return k;
  }
  return tx(store, 'readwrite', (os) => (key === undefined ? os.put(value) : os.put(value, key)));
}

export async function localAdd(store: LocalStoreName, value: any): Promise<number> {
  if (!idbAvailable()) {
    const k = ++memoryCounters[store];
    memoryStores[store].set(k, { ...value, id: k });
    return k;
  }
  const key = await tx(store, 'readwrite', (os) => os.add(value));
  return Number(key);
}

export async function localDelete(store: LocalStoreName, key: IDBValidKey): Promise<void> {
  if (!idbAvailable()) {
    memoryStores[store].delete(key);
    return;
  }
  await tx(store, 'readwrite', (os) => os.delete(key));
}

export async function localClear(store: LocalStoreName): Promise<void> {
  if (!idbAvailable()) {
    memoryStores[store].clear();
    return;
  }
  await tx(store, 'readwrite', (os) => os.clear());
}

export async function localMetaGet(key: string): Promise<any> {
  const row = await localGet<any>('meta', key);
  return row && typeof row === 'object' && 'value' in row ? row.value : undefined;
}

export async function localMetaSet(key: string, value: any): Promise<void> {
  await localPut('meta', { key, value }, key);
}
