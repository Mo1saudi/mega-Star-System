import { AppSnapshot } from '../types';
import { 
  initialPilgrims, initialTrips, initialRoomings, initialStaff, 
  initialTransports, initialFamilyGroups, initialFinanceRecords,
  initialDocuments, initialNotifications, initialClosings
} from '../mock-data';

const DB_NAME = 'MegaStarUmrahDB';
const DB_VERSION = 1;
const STORE_NAME = 'appData';
const DATA_KEY = 'latest_snapshot';

/**
 * Local Database Manager supporting IndexedDB with LocalStorage fallback
 * Automatically seeds initial mock data on first launch.
 */
export async function getLocalDatabaseStore(): Promise<AppSnapshot> {
  // Check if window object exists
  if (typeof window === 'undefined') {
    return getSeedSnapshot();
  }

  try {
    const savedLocal = localStorage.getItem(DATA_KEY);
    if (savedLocal) {
      const parsed = JSON.parse(savedLocal) as AppSnapshot;
      if (parsed.pilgrims && parsed.pilgrims.length > 0) {
        return {
          ...parsed,
          financeRecords: parsed.financeRecords || initialFinanceRecords,
          documents: parsed.documents || initialDocuments,
          notifications: parsed.notifications || initialNotifications,
          closings: parsed.closings || initialClosings,
          currentRole: parsed.currentRole || 'admin',
        };
      }
    }
  } catch (e) {
    console.warn('LocalStorage read warning:', e);
  }

  // Try IndexedDB
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(getSeedSnapshot());
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(DATA_KEY);

      getReq.onsuccess = () => {
        if (getReq.result) {
          const res = getReq.result as AppSnapshot;
          resolve({
            ...res,
            financeRecords: res.financeRecords || initialFinanceRecords,
            documents: res.documents || initialDocuments,
            notifications: res.notifications || initialNotifications,
            closings: res.closings || initialClosings,
            currentRole: res.currentRole || 'admin',
          });
        } else {
          const seed = getSeedSnapshot();
          saveLocalDatabaseStore(seed);
          resolve(seed);
        }
      };

      getReq.onerror = () => {
        resolve(getSeedSnapshot());
      };
    };

    request.onerror = () => {
      resolve(getSeedSnapshot());
    };
  });
}

export async function saveLocalDatabaseStore(data: AppSnapshot): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Save to LocalStorage first for instant synchronously guaranteed backup
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // Also save to IndexedDB
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(true);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, DATA_KEY);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    };

    request.onerror = () => resolve(false);
  });
}

export function getSeedSnapshot(): AppSnapshot {
  return {
    pilgrims: [...initialPilgrims],
    trips: [...initialTrips],
    roomings: [...initialRoomings],
    staff: [...initialStaff],
    transports: [...initialTransports],
    familyGroups: [...initialFamilyGroups],
    financeRecords: [...initialFinanceRecords],
    documents: [...initialDocuments],
    notifications: [...initialNotifications],
    closings: [...initialClosings],
    currentRole: 'admin',
  };
}
