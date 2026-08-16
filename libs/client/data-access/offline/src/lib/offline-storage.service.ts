import { Injectable } from '@angular/core';

export interface SyncQueueItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'play' | 'drill' | 'team' | 'player' | 'event' | 'attendance';
  entityId?: string;
  tempId?: string;
  payload?: any;
  createdAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private readonly dbName = 'apex_team_offline_db';
  private readonly dbVersion = 1;
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  // In-memory fallback store for environments without IndexedDB (e.g. tests / SSR)
  private readonly memoryStore = new Map<string, Map<string, any>>();
  private memoryQueue: SyncQueueItem[] = [];
  private memoryQueueId = 1;

  // Stores
  readonly STORES = {
    PLAYS: 'plays',
    DRILLS: 'drills',
    TEAMS: 'teams',
    PLAYERS: 'players',
    EVENTS: 'events',
    SYNC_QUEUE: 'sync_queue',
    KEY_VALUE: 'key_value',
  } as const;

  constructor() {
    this.initDb();
  }

  private hasIndexedDb(): boolean {
    return typeof window !== 'undefined' && !!window.indexedDB;
  }

  private initDb(): Promise<IDBDatabase | null> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (!this.hasIndexedDb()) {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const request = window.indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(this.STORES.PLAYS)) {
            const playStore = db.createObjectStore(this.STORES.PLAYS, { keyPath: 'id' });
            playStore.createIndex('sport', 'sport', { unique: false });
            playStore.createIndex('category', 'category', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.STORES.DRILLS)) {
            db.createObjectStore(this.STORES.DRILLS, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(this.STORES.TEAMS)) {
            db.createObjectStore(this.STORES.TEAMS, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(this.STORES.PLAYERS)) {
            const playerStore = db.createObjectStore(this.STORES.PLAYERS, { keyPath: 'id' });
            playerStore.createIndex('teamId', 'teamId', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.STORES.EVENTS)) {
            const eventStore = db.createObjectStore(this.STORES.EVENTS, { keyPath: 'id' });
            eventStore.createIndex('teamId', 'teamId', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.STORES.SYNC_QUEUE)) {
            db.createObjectStore(this.STORES.SYNC_QUEUE, {
              keyPath: 'id',
              autoIncrement: true,
            });
          }

          if (!db.objectStoreNames.contains(this.STORES.KEY_VALUE)) {
            db.createObjectStore(this.STORES.KEY_VALUE, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private getMemoryStore(storeName: string): Map<string, any> {
    if (!this.memoryStore.has(storeName)) {
      this.memoryStore.set(storeName, new Map<string, any>());
    }
    return this.memoryStore.get(storeName)!;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.initDb();
      if (!db) {
        return Array.from(this.getMemoryStore(storeName).values()) as T[];
      }

      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => resolve(Array.from(this.getMemoryStore(storeName).values()) as T[]);
      });
    } catch {
      return Array.from(this.getMemoryStore(storeName).values()) as T[];
    }
  }

  async getById<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const db = await this.initDb();
      if (!db) {
        return (this.getMemoryStore(storeName).get(id) as T) || null;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);

        req.onsuccess = () => resolve((req.result as T) || null);
        req.onerror = () => resolve((this.getMemoryStore(storeName).get(id) as T) || null);
      });
    } catch {
      return (this.getMemoryStore(storeName).get(id) as T) || null;
    }
  }

  async save<T extends { id: string }>(storeName: string, item: T): Promise<T> {
    this.getMemoryStore(storeName).set(item.id, item);
    try {
      const db = await this.initDb();
      if (!db) {
        return item;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);

        req.onsuccess = () => resolve(item);
        req.onerror = () => resolve(item);
      });
    } catch {
      return item;
    }
  }

  async saveAll<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    const memStore = this.getMemoryStore(storeName);
    for (const item of items) {
      memStore.set(item.id, item);
    }

    try {
      const db = await this.initDb();
      if (!db) return;

      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        for (const item of items) {
          store.put(item);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // fallback to memory complete
    }
  }

  async remove(storeName: string, id: string): Promise<void> {
    this.getMemoryStore(storeName).delete(id);
    try {
      const db = await this.initDb();
      if (!db) return;

      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  async clear(storeName: string): Promise<void> {
    this.getMemoryStore(storeName).clear();
    try {
      const db = await this.initDb();
      if (!db) return;

      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  // --- Sync Queue Operations ---
  async enqueueSync(
    item: Omit<SyncQueueItem, 'id' | 'createdAt'>
  ): Promise<number> {
    const record: SyncQueueItem = {
      ...item,
      id: this.memoryQueueId++,
      createdAt: Date.now(),
    };
    this.memoryQueue.push(record);

    try {
      const db = await this.initDb();
      if (!db) return record.id!;

      return new Promise((resolve) => {
        const tx = db.transaction(this.STORES.SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(this.STORES.SYNC_QUEUE);
        const req = store.add(record);

        req.onsuccess = () => resolve(req.result as number);
        req.onerror = () => resolve(record.id!);
      });
    } catch {
      return record.id!;
    }
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const db = await this.initDb();
      if (!db) return [...this.memoryQueue];

      return new Promise((resolve) => {
        const tx = db.transaction(this.STORES.SYNC_QUEUE, 'readonly');
        const store = tx.objectStore(this.STORES.SYNC_QUEUE);
        const req = store.getAll();

        req.onsuccess = () => resolve((req.result as SyncQueueItem[]) || []);
        req.onerror = () => resolve([...this.memoryQueue]);
      });
    } catch {
      return [...this.memoryQueue];
    }
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    this.memoryQueue = this.memoryQueue.filter((q) => q.id !== id);
    try {
      const db = await this.initDb();
      if (!db) return;

      return new Promise((resolve) => {
        const tx = db.transaction(this.STORES.SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(this.STORES.SYNC_QUEUE);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  async clearSyncQueue(): Promise<void> {
    this.memoryQueue = [];
    return this.clear(this.STORES.SYNC_QUEUE);
  }
}
