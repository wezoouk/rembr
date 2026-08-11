import { Item, Space, AppSettings, ItemHistoryRecord, BorrowedItem, ReminderInterval } from "../types";
import { DEMO_PHOTOS } from "./sampleImages";

const DB_NAME = "FindMyStuffDB";
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("items")) {
        const itemStore = db.createObjectStore("items", { keyPath: "id" });
        itemStore.createIndex("name", "name", { unique: false });
        itemStore.createIndex("updated_at", "updated_at", { unique: false });
      }
      if (!db.objectStoreNames.contains("spaces")) {
        const spaceStore = db.createObjectStore("spaces", { keyPath: "id" });
        spaceStore.createIndex("created_at", "created_at", { unique: false });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("borrowed")) {
        const borrowedStore = db.createObjectStore("borrowed", { keyPath: "id" });
        borrowedStore.createIndex("is_returned", "is_returned", { unique: false });
        borrowedStore.createIndex("date_borrowed", "date_borrowed", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Initial Demo Data (Available on demand)
export const DEMO_SAMPLE_ITEMS: Item[] = [
  {
    id: "item-keys-1",
    name: "Car Keys",
    description: "Nissan smart fob with red emergency tag and house key ring.",
    location_name: "Top of hallway table next to red ceramic bowl",
    image_path: DEMO_PHOTOS.carKeys,
    created_at: "2026-08-07T08:42:00.000Z",
    updated_at: "2026-08-07T08:42:00.000Z",
    tags: ["keys", "car", "fob", "hallway", "essential"],
    confidence: "High confidence",
    source_type: "remember",
    is_pinned: true,
    history: [
      {
        id: "hist-keys-1",
        item_id: "item-keys-1",
        location_name: "Kitchen counter near coffee machine",
        image_path: DEMO_PHOTOS.carKeys,
        saved_at: "2026-08-06T19:15:00.000Z",
        description: "Left after grocery shopping",
      },
    ],
  },
  {
    id: "item-passport-2",
    name: "Passport",
    description: "Dark blue official travel passport book.",
    location_name: "Top drawer of bedroom cabinet beneath blue notebook",
    image_path: DEMO_PHOTOS.passport,
    created_at: "2026-08-07T07:15:00.000Z",
    updated_at: "2026-08-07T07:15:00.000Z",
    tags: ["passport", "travel", "documents", "bedroom", "drawer", "essential"],
    confidence: "High confidence",
    source_type: "remember",
    is_pinned: true,
    history: [],
  },
];

export const DEMO_SAMPLE_SPACES: Space[] = [];

const INITIAL_ITEMS: Item[] = [];
const INITIAL_SPACES: Space[] = [];

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: true,
  retainOriginalPhotos: true,
  hasCompletedOnboarding: false,
  blurRecentlySaved: false,
  blurLocationRecentlySaved: false,
  allowDuplicateItems: false,
  hideLocationsSection: true,
  hideBorrowedSection: false,
  autoSecondScanPass: true,
};

// Compute the ISO date string for the next reminder nag, given the borrow date
// and chosen interval. Returns undefined when no reminder is wanted.
export function computeNextReminderAt(
  dateBorrowedIso: string,
  interval: ReminderInterval,
  fromIso?: string
): string | undefined {
  if (interval === "none") return undefined;
  const daysMap: Record<Exclude<ReminderInterval, "none">, number> = {
    "3days": 3,
    "1week": 7,
    "2weeks": 14,
  };
  const base = fromIso ? new Date(fromIso) : new Date(dateBorrowedIso);
  const days = daysMap[interval as Exclude<ReminderInterval, "none">];
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

// Data Store Accessors
export async function getAllItems(): Promise<Item[]> {
  try {
    // Check one-time purge of initial sample data
    if (typeof window !== "undefined" && !localStorage.getItem("fms_sample_purged_v1")) {
      await clearAllData();
      localStorage.setItem("fms_sample_purged_v1", "true");
      return [];
    }

    const db = await getDB();
    const tx = db.transaction("items", "readonly");
    const store = tx.objectStore("items");
    const items = await new Promise<Item[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (items.length === 0) {
      return [];
    }

    // Sort by updated_at descending (newest first)
    return items.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } catch (err) {
    console.warn("Falling back to localStorage for items:", err);
    const local = localStorage.getItem("fms_items");
    if (!local) {
      return [];
    }
    return JSON.parse(local);
  }
}

export async function saveItem(item: Item): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");

    // Check if item already exists to update history
    const existingReq = store.get(item.id);
    await new Promise<void>((resolve, reject) => {
      existingReq.onsuccess = () => {
        const existing = existingReq.result as Item | undefined;
        let history = item.history || [];

        if (existing && existing.location_name !== item.location_name) {
          // Push previous location into history
          const newHistoryRecord: ItemHistoryRecord = {
            id: `hist-${Date.now()}`,
            item_id: existing.id,
            location_name: existing.location_name,
            description: existing.description,
            image_path: existing.image_path,
            saved_at: existing.updated_at || existing.created_at,
          };
          history = [newHistoryRecord, ...(existing.history || [])];
        }

        const itemToSave: Item = {
          ...item,
          history,
          updated_at: new Date().toISOString(),
        };

        const putReq = store.put(itemToSave);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      existingReq.onerror = () => reject(existingReq.error);
    });
  } catch (err) {
    console.warn("LocalStorage fallback for saveItem:", err);
    try {
      const items = await getAllItems();
      const index = items.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        items[index] = { ...item, updated_at: new Date().toISOString() };
      } else {
        items.unshift(item);
      }
      localStorage.setItem("fms_items", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to persist item in fallback storage:", e);
    }
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const items = await getAllItems();
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem("fms_items", JSON.stringify(filtered));
  }
}

export async function getAllSpaces(): Promise<Space[]> {
  try {
    const db = await getDB();
    const tx = db.transaction("spaces", "readonly");
    const store = tx.objectStore("spaces");
    const spaces = await new Promise<Space[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (spaces.length === 0) {
      return [];
    }

    return spaces.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    const local = localStorage.getItem("fms_spaces");
    if (!local) {
      return [];
    }
    return JSON.parse(local);
  }
}

export async function saveSpace(space: Space): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction("spaces", "readwrite");
    const store = tx.objectStore("spaces");
    await new Promise<void>((resolve, reject) => {
      const req = store.put(space);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Also auto-create items for each detected item in the space!
    for (const det of space.detected_items) {
      const item: Item = {
        id: det.id,
        name: det.item_name,
        description: `Scanned inside ${space.name}`,
        location_name: `Inside ${space.name}`,
        image_path: space.image_path,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [...det.tags, space.name.toLowerCase()],
        confidence: det.confidence,
        source_type: "scan",
        space_id: space.id,
        space_name: space.name,
        bbox: det.bounding_box,
        is_pinned: false,
      };
      await saveItem(item);
    }
  } catch (err) {
    const spaces = await getAllSpaces();
    spaces.unshift(space);
    localStorage.setItem("fms_spaces", JSON.stringify(spaces));
  }
}

export async function deleteSpace(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction("spaces", "readwrite");
    const store = tx.objectStore("spaces");
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const spaces = await getAllSpaces();
    const filtered = spaces.filter((s) => s.id !== id);
    localStorage.setItem("fms_spaces", JSON.stringify(filtered));
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await getDB();
    const tx = db.transaction("settings", "readonly");
    const store = tx.objectStore("settings");
    const settingsObj = await new Promise<any>((resolve, reject) => {
      const req = store.get("app_settings");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return settingsObj ? { ...DEFAULT_SETTINGS, ...settingsObj.value } : DEFAULT_SETTINGS;
  } catch (err) {
    const local = localStorage.getItem("fms_settings");
    return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction("settings", "readwrite");
    const store = tx.objectStore("settings");
    await new Promise<void>((resolve, reject) => {
      const req = store.put({ key: "app_settings", value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    localStorage.setItem("fms_settings", JSON.stringify(settings));
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const db = await getDB();
    const tx1 = db.transaction("items", "readwrite");
    tx1.objectStore("items").clear();
    const tx2 = db.transaction("spaces", "readwrite");
    tx2.objectStore("spaces").clear();
    const tx3 = db.transaction("borrowed", "readwrite");
    tx3.objectStore("borrowed").clear();
  } catch (err) {
    localStorage.removeItem("fms_items");
    localStorage.removeItem("fms_spaces");
    localStorage.removeItem("fms_borrowed");
  }
  // Always clear the localStorage fallback keys too, even when IndexedDB
  // succeeds — otherwise stale borrowed/item data left over from an earlier
  // fallback write can resurface (e.g. "Out on loan" items reappearing after
  // a full data reset).
  localStorage.removeItem("fms_items");
  localStorage.removeItem("fms_spaces");
  localStorage.removeItem("fms_borrowed");
}

// ---------------------------------------------------------------------------
// Borrowed Items Accessors
// ---------------------------------------------------------------------------

export async function getAllBorrowedItems(): Promise<BorrowedItem[]> {
  try {
    const db = await getDB();
    const tx = db.transaction("borrowed", "readonly");
    const store = tx.objectStore("borrowed");
    const items = await new Promise<BorrowedItem[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    return items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    console.warn("Falling back to localStorage for borrowed items:", err);
    const local = localStorage.getItem("fms_borrowed");
    if (!local) return [];
    return JSON.parse(local);
  }
}

export async function saveBorrowedItem(item: BorrowedItem): Promise<void> {
  const itemToSave: BorrowedItem = { ...item, updated_at: new Date().toISOString() };
  try {
    const db = await getDB();
    const tx = db.transaction("borrowed", "readwrite");
    const store = tx.objectStore("borrowed");
    await new Promise<void>((resolve, reject) => {
      const req = store.put(itemToSave);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("LocalStorage fallback for saveBorrowedItem:", err);
    try {
      const items = await getAllBorrowedItems();
      const index = items.findIndex((i) => i.id === itemToSave.id);
      if (index >= 0) {
        items[index] = itemToSave;
      } else {
        items.unshift(itemToSave);
      }
      localStorage.setItem("fms_borrowed", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to persist borrowed item in fallback storage:", e);
    }
  }
}

export async function deleteBorrowedItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction("borrowed", "readwrite");
    const store = tx.objectStore("borrowed");
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const items = await getAllBorrowedItems();
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem("fms_borrowed", JSON.stringify(filtered));
  }
}

export async function resetDemoData(): Promise<void> {
  await clearAllData();
  await seedInitialData();
  await seedInitialSpaces();
}

async function seedInitialData() {
  try {
    const db = await getDB();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    for (const item of DEMO_SAMPLE_ITEMS) {
      store.put(item);
    }
  } catch (err) {
    localStorage.setItem("fms_items", JSON.stringify(DEMO_SAMPLE_ITEMS));
  }
}

async function seedInitialSpaces() {
  try {
    const db = await getDB();
    const tx = db.transaction("spaces", "readwrite");
    const store = tx.objectStore("spaces");
    for (const space of DEMO_SAMPLE_SPACES) {
      store.put(space);
    }
  } catch (err) {
    localStorage.setItem("fms_spaces", JSON.stringify(DEMO_SAMPLE_SPACES));
  }
}
