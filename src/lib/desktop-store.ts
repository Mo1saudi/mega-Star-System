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
 * Migration Function: Seed & migrate initial mock-data into local SQLite / AppData database store
 */
export async function migrateMockDataToSQLite(): Promise<AppSnapshot> {
  const seedSnapshot: AppSnapshot = {
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

  if (typeof window !== 'undefined') {
    await saveLocalDatabaseStore(seedSnapshot);
  }

  return seedSnapshot;
}

/**
 * Local Database Manager supporting Desktop Persistent File/SQLite DB (AppData/Database),
 * as well as IndexedDB with LocalStorage fallback for browser environment.
 */
export async function getLocalDatabaseStore(): Promise<AppSnapshot> {
  if (typeof window === 'undefined') {
    return getSeedSnapshot();
  }

  // 1. Electron Desktop Persistent DB (AppData/Database/megastar_db.json)
  if (window.electronAPI?.dbRead) {
    try {
      const desktopData = await window.electronAPI.dbRead();
      if (desktopData && desktopData.pilgrims && desktopData.pilgrims.length > 0) {
        return {
          ...desktopData,
          financeRecords: desktopData.financeRecords || initialFinanceRecords,
          documents: desktopData.documents || initialDocuments,
          notifications: desktopData.notifications || initialNotifications,
          closings: desktopData.closings || initialClosings,
          currentRole: desktopData.currentRole || 'admin',
        };
      } else {
        // Automatic First-Run Migration from mock-data.ts to AppData DB
        return await migrateMockDataToSQLite();
      }
    } catch (e) {
      console.warn('Electron Desktop DB read warning, initiating migration:', e);
      return await migrateMockDataToSQLite();
    }
  }

  // 2. Web LocalStorage fallback
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

  // 3. Web IndexedDB fallback
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(migrateMockDataToSQLite());
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
          resolve(migrateMockDataToSQLite());
        }
      };

      getReq.onerror = () => resolve(migrateMockDataToSQLite());
    };

    request.onerror = () => resolve(migrateMockDataToSQLite());
  });
}

export async function saveLocalDatabaseStore(data: AppSnapshot): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Save to Electron Desktop Persistent File/SQLite DB
  if (window.electronAPI?.dbWrite) {
    try {
      await window.electronAPI.dbWrite(data);
    } catch (e) {
      console.warn('Electron Desktop DB write error:', e);
    }
  }

  // 2. Save to LocalStorage
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // 3. Save to IndexedDB
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
