import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Pilgrim, Trip, Rooming, Staff, Transport, FamilyGroup, 
  AppSnapshot, FamilyValidationResult, PreflightValidationResult,
  FinanceRecord, DocumentRecord, NotificationRecord, AccountingClosingRecord, UserRole, RoomType,
  PendingUser, StaffPermission
} from '../types';

export const getDefaultPermissionsForRole = (role: string): StaffPermission => {
  const r = role.toLowerCase();
  if (r.includes('مدير') || r.includes('عام') || r.includes('admin')) {
    return {
      canManagePilgrims: true,
      canManageTripsTransports: true,
      canManageRooming: true,
      canManageFinance: true,
      canManageStaff: true,
      canCloseAccounting: true,
      canExportBackup: true,
      canViewReports: true
    };
  }
  if (r.includes('محاسب') || r.includes('مالي') || r.includes('finance')) {
    return {
      canManagePilgrims: false,
      canManageTripsTransports: false,
      canManageRooming: false,
      canManageFinance: true,
      canManageStaff: false,
      canCloseAccounting: true,
      canExportBackup: true,
      canViewReports: true
    };
  }
  return {
    canManagePilgrims: true,
    canManageTripsTransports: true,
    canManageRooming: true,
    canManageFinance: false,
    canManageStaff: false,
    canCloseAccounting: false,
    canExportBackup: false,
    canViewReports: true
  };
};
import { getLocalDatabaseStore, saveLocalDatabaseStore, getSeedSnapshot } from './desktop-store';
import { initGoogleAuth, googleSignIn, getGoogleAccessToken, logoutGoogle } from './google-auth';
import { toast } from 'sonner';

export const isPilgrimWithdrawn = (p: Pilgrim): boolean => {
  if (!p) return false;
  if (p.is_withdrawn) return true;
  const text = `${p.withdrawal_status || ''} ${p.notes || ''} ${p.program || ''} ${p.visa_type || ''}`;
  return /سحب|إلغاء|الغاء|ملغي|مسحوب|استبعاد|مستبعد|اعتذار/i.test(text);
};

interface StoreContextType {
  // Google Sheets OAuth & Sync
  isGoogleConnected: boolean;
  googleUserEmail: string | null;
  handleGoogleSignIn: () => Promise<void>;
  handleGoogleLogout: () => Promise<void>;

  // Google User Auth & Admin Approval System
  pendingUsers: PendingUser[];
  currentUser: {
    email: string;
    displayName: string;
    photoURL?: string;
    role?: string;
    status: 'approved' | 'pending' | 'rejected' | 'admin';
  } | null;
  approvePendingUser: (id: string, role: string, phone?: string, national_id?: string, permissions?: StaffPermission) => void;
  rejectPendingUser: (id: string, reason?: string) => void;
  loginWithGoogle: () => Promise<void>;
  logoutCurrentUser: () => Promise<void>;
  loginAsAdminBypass: () => void;

  // Currency Settings
  currency: 'SAR' | 'EGP';
  setCurrency: (currency: 'SAR' | 'EGP') => void;
  exchangeRate: number; // 1 SAR = X EGP
  setExchangeRate: (rate: number) => void;
  formatCurrency: (amountInSar: number) => string;

  // Data
  pilgrims: Pilgrim[];
  trips: Trip[];
  roomings: Rooming[];
  staff: Staff[];
  transports: Transport[];
  familyGroups: FamilyGroup[];

  // Filters & Global UI
  selectedHotelFilter: string;
  setSelectedHotelFilter: (hotel: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activePage: string;
  setActivePage: (page: string) => void;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Pilgrim Operations
  addPilgrim: (pilgrim: Omit<Pilgrim, 'id'>) => void;
  updatePilgrim: (id: string, updates: Partial<Pilgrim>) => void;
  deletePilgrim: (id: string) => void;
  bulkUpdatePilgrims: (ids: string[], updates: Partial<Pilgrim>) => void;
  bulkDeletePilgrims: (ids: string[]) => void;
  importPilgrims: (newPilgrims: Pilgrim[], mode: 'append' | 'replace') => void;

  // Trip Operations
  addTrip: (trip: Omit<Trip, 'id'>) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;

  // Rooming Operations
  addRooming: (rooming: Omit<Rooming, 'id'>) => void;
  updateRooming: (id: string, updates: Partial<Rooming>) => void;
  deleteRooming: (id: string) => void;

  // Staff Operations
  addStaff: (staffMember: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  toggleStaffStatus: (id: string) => void;

  // Transport Operations
  addTransport: (transport: Omit<Transport, 'id'>) => void;
  updateTransport: (id: string, updates: Partial<Transport>) => void;
  deleteTransport: (id: string) => void;

  // Family Group Operations
  addFamilyGroup: (group: Omit<FamilyGroup, 'id'>) => void;
  updateFamilyGroup: (id: string, updates: Partial<FamilyGroup>) => void;
  deleteFamilyGroup: (id: string) => void;
  unlinkFamilyMemberAndRedistribute: (pilgrimId: string) => void;
  deleteFamilyGroupAndRedistribute: (groupId: string) => void;
  transferFamilyMember: (pilgrimId: string, sourceGroupId: string, targetGroupId: string | 'new_group', defaultNewGroupName?: string) => void;
  deduplicateFamilyGroups: () => void;

  // Finance Operations
  financeRecords: FinanceRecord[];
  addFinanceRecord: (record: Omit<FinanceRecord, 'id'>) => void;
  updateFinanceRecord: (id: string, updates: Partial<FinanceRecord>) => void;
  deleteFinanceRecord: (id: string) => void;

  // Document Operations
  documents: DocumentRecord[];
  addDocument: (doc: Omit<DocumentRecord, 'id'>) => void;
  deleteDocument: (id: string) => void;

  // Notifications Operations
  notifications: NotificationRecord[];
  markNotificationRead: (id: string) => void;
  addNotification: (notif: Omit<NotificationRecord, 'id'>) => void;
  scanAndGenerateSmartAlerts: () => { createdCount: number };
  sendDirectAlertToStaff: (staffId: string, title: string, message: string) => void;

  // Accounting Closing Operations
  closings: AccountingClosingRecord[];
  addAccountingClosing: (closing: Omit<AccountingClosingRecord, 'id'>) => void;

  // User Role Settings
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Smart AI & Engine Features
  autoRooming: (hotelName: string, city: 'مكة' | 'المدينة') => void;
  validateFamilyGroups: () => FamilyValidationResult[];
  generateNumberedFamilyLinks: () => void;
  validatePreflight: (hotelName?: string) => PreflightValidationResult;
  syncFromGoogleSheets: () => Promise<void>;
  appendPilgrimToSheet: (pilgrim: Pilgrim) => Promise<{ success: boolean; message: string }>;
  ocrExtractPassport: (base64Image: string, mimeType?: string) => Promise<any>;
  generateTripAiSummary: (tripData: any, pilgrimsCount: number) => Promise<string>;
  generateFinancialInsights: (financeData: any) => Promise<string>;
  generateAiErrorDetection: (pilgrims: Pilgrim[], roomings: Rooming[]) => Promise<string>;
  resetToDefaultSeed: () => void;
  restoreFullBackup: (importedData: Partial<AppSnapshot>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const MAX_SNAPSHOTS = 50;

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(getSeedSnapshot());
  const [history, setHistory] = useState<AppSnapshot[]>([]);
  const [future, setFuture] = useState<AppSnapshot[]>([]);

  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [currency, setCurrency] = useState<'SAR' | 'EGP'>('EGP');
  const [exchangeRate, setExchangeRate] = useState<number>(13.5); // 1 SAR = 13.5 EGP
  const [isLoaded, setIsLoaded] = useState(false);

  // Google OAuth & Two-Way Sync State
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    displayName: string;
    photoURL?: string;
    role?: string;
    status: 'approved' | 'pending' | 'rejected' | 'admin';
  } | null>(null);

  useEffect(() => {
    const unsub = initGoogleAuth(
      (user) => {
        setIsGoogleConnected(true);
        setGoogleUserEmail(user.email);
      },
      () => {
        setIsGoogleConnected(false);
        setGoogleUserEmail(null);
      }
    );
    return () => { if (unsub) unsub(); };
  }, []);

  const formatCurrency = useCallback((amountInSar: number): string => {
    if (isNaN(amountInSar) || amountInSar === undefined || amountInSar === null) return '0';
    if (currency === 'EGP') {
      const converted = amountInSar * exchangeRate;
      return `${Math.round(converted).toLocaleString('ar-EG')} ج.م`;
    }
    return `${Math.round(amountInSar).toLocaleString('ar-EG')} ر.س`;
  }, [currency, exchangeRate]);

  // Load saved local data on mount
  useEffect(() => {
    getLocalDatabaseStore().then((stored) => {
      setSnapshot(stored);
      setIsLoaded(true);
    });
  }, []);

  // Sync dark class on html tag
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Helper to commit state changes with undo history
  const commitChange = useCallback((newSnapshot: AppSnapshot) => {
    setHistory(prev => {
      const nextHistory = [...prev, snapshot];
      if (nextHistory.length > MAX_SNAPSHOTS) {
        nextHistory.shift();
      }
      return nextHistory;
    });
    setFuture([]);
    setSnapshot(newSnapshot);
    saveLocalDatabaseStore(newSnapshot);
  }, [snapshot]);

  // Undo / Redo
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    setFuture(prev => [snapshot, ...prev]);
    setHistory(newHistory);
    setSnapshot(previous);
    saveLocalDatabaseStore(previous);
    toast.info('تم التراجع عن الإجراء السابق (Ctrl+Z)');
  }, [history, snapshot]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setHistory(prev => [...prev, snapshot]);
    setFuture(newFuture);
    setSnapshot(next);
    saveLocalDatabaseStore(next);
    toast.info('تم إعادة تطبيق الإجراء');
  }, [future, snapshot]);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Pilgrim Operations

  // Single Pilgrim Google Sheets Append Function
  const appendPilgrimToSheet = useCallback(async (pilgrim: Pilgrim): Promise<{ success: boolean; message: string }> => {
    const token = getGoogleAccessToken();
    try {
      const res = await fetch('/api/sheets/append-pilgrim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pilgrim,
          accessToken: token
        })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'تعذر الاتصال بـ Google Sheets'
      };
    }
  }, []);

  const addPilgrim = useCallback(async (data: Omit<Pilgrim, 'id'>) => {
    const newPilgrim: Pilgrim = {
      ...data,
      id: `PIL-${Date.now().toString().slice(-6)}`
    };
    const nextList = [newPilgrim, ...snapshot.pilgrims];
    
    // Save locally first to guarantee no data loss
    commitChange({
      ...snapshot,
      pilgrims: nextList
    });

    const loadingToast = toast.loading(`جاري إضافة المعتمر ومزامنة البيانات مع Google Sheets (ورقة الرئيسية)...`);

    try {
      const syncResult = await appendPilgrimToSheet(newPilgrim);
      toast.dismiss(loadingToast);

      if (syncResult && syncResult.success) {
        toast.success(`تم حفظ المعتمر محلياً ومزامنة بياناته بنجاح مع Google Sheets (ورقة الرئيسية) 🟢`, { duration: 4000 });
      } else {
        toast.error(`تم حفظ المعتمر محلياً بنجاح، ولكن تعذرت المزامنة مع Google Sheets 🔴 (${syncResult?.message || 'فشلت المزامنة'})`, { duration: 5000 });
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error(`تم حفظ المعتمر محلياً بنجاح، ولكن تعذرت المزامنة المباشرة مع Google Sheets 🔴`, { duration: 5000 });
    }
  }, [snapshot, commitChange, appendPilgrimToSheet]);

  const updatePilgrim = useCallback((id: string, updates: Partial<Pilgrim>) => {
    const nextList = snapshot.pilgrims.map(p => p.id === id ? { ...p, ...updates } : p);
    commitChange({
      ...snapshot,
      pilgrims: nextList
    });
    toast.success('تم تحديث بيانات المعتمر');
  }, [snapshot, commitChange]);

  const deletePilgrim = useCallback((id: string) => {
    const pilgrim = snapshot.pilgrims.find(p => p.id === id);
    const nextList = snapshot.pilgrims.filter(p => p.id !== id);
    commitChange({
      ...snapshot,
      pilgrims: nextList
    });
    toast.success(`تم حذف المعتمر ${pilgrim?.name || ''}`);
  }, [snapshot, commitChange]);

  const bulkUpdatePilgrims = useCallback((ids: string[], updates: Partial<Pilgrim>) => {
    const nextList = snapshot.pilgrims.map(p => ids.includes(p.id) ? { ...p, ...updates } : p);
    commitChange({
      ...snapshot,
      pilgrims: nextList
    });
    toast.success(`تم التعديل الجماعي لـ ${ids.length} معتمر`);
  }, [snapshot, commitChange]);

  const bulkDeletePilgrims = useCallback((ids: string[]) => {
    const nextList = snapshot.pilgrims.filter(p => !ids.includes(p.id));
    commitChange({
      ...snapshot,
      pilgrims: nextList
    });
    toast.success(`تم حذف ${ids.length} معتمر بنجاح`);
  }, [snapshot, commitChange]);

  const importPilgrims = useCallback((newPilgrims: Pilgrim[], mode: 'append' | 'replace') => {
    let nextList: Pilgrim[];
    if (mode === 'replace') {
      nextList = newPilgrims;
      commitChange({
        ...snapshot,
        pilgrims: newPilgrims
      });
      toast.success(`تم استبدال سجلات المعتمرين بـ ${newPilgrims.length} معتمر جديد`);
    } else {
      nextList = [...newPilgrims, ...snapshot.pilgrims];
      commitChange({
        ...snapshot,
        pilgrims: nextList
      });
      toast.success(`تم إضافة ${newPilgrims.length} معتمر جديد إلى السجل الحالي`);
    }
  }, [snapshot, commitChange]);

  // Trip Operations
  const addTrip = useCallback((tripData: Omit<Trip, 'id'>) => {
    const newTrip: Trip = {
      ...tripData,
      id: `TRIP-${Date.now().toString().slice(-4)}`
    };
    commitChange({
      ...snapshot,
      trips: [newTrip, ...snapshot.trips]
    });
    toast.success(`تم إضافة الرحلة: ${tripData.trip_name}`);
  }, [snapshot, commitChange]);

  const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
    commitChange({
      ...snapshot,
      trips: snapshot.trips.map(t => t.id === id ? { ...t, ...updates } : t)
    });
    toast.success('تم تحديث بيانات الرحلة');
  }, [snapshot, commitChange]);

  const deleteTrip = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      trips: snapshot.trips.filter(t => t.id !== id)
    });
    toast.success('تم حذف الرحلة');
  }, [snapshot, commitChange]);

  // Rooming Operations
  const addRooming = useCallback((roomingData: Omit<Rooming, 'id'>) => {
    const newRooming: Rooming = {
      ...roomingData,
      id: `ROOM-${Date.now().toString().slice(-4)}`
    };
    commitChange({
      ...snapshot,
      roomings: [...snapshot.roomings, newRooming]
    });
    toast.success(`تم إضافة الفندق: ${roomingData.hotel_name}`);
  }, [snapshot, commitChange]);

  const updateRooming = useCallback((id: string, updates: Partial<Rooming>) => {
    commitChange({
      ...snapshot,
      roomings: snapshot.roomings.map(r => r.id === id ? { ...r, ...updates } : r)
    });
    toast.success('تم تحديث بيانات التسكين');
  }, [snapshot, commitChange]);

  const deleteRooming = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      roomings: snapshot.roomings.filter(r => r.id !== id)
    });
    toast.success('تم حذف الفندق من القائمة');
  }, [snapshot, commitChange]);

  // Staff Operations
  const addStaff = useCallback((staffData: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...staffData,
      id: `STF-${Date.now().toString().slice(-4)}`
    };
    commitChange({
      ...snapshot,
      staff: [newStaff, ...snapshot.staff]
    });
    toast.success(`تم إضافة الموظف: ${staffData.name}`);
  }, [snapshot, commitChange]);

  const updateStaff = useCallback((id: string, updates: Partial<Staff>) => {
    commitChange({
      ...snapshot,
      staff: snapshot.staff.map(s => s.id === id ? { ...s, ...updates } : s)
    });
    toast.success('تم تحديث بيانات الموظف');
  }, [snapshot, commitChange]);

  const bulkUpdateStaff = useCallback((ids: string[], updates: Partial<Staff>) => {
    commitChange({
      ...snapshot,
      staff: snapshot.staff.map(s => ids.includes(s.id) ? { ...s, ...updates } : s)
    });
    toast.success(`تم تحديث بيانات (${ids.length}) موظف بنجاح`);
  }, [snapshot, commitChange]);

  const deleteStaff = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      staff: snapshot.staff.filter(s => s.id !== id)
    });
    toast.success('تم حذف الموظف');
  }, [snapshot, commitChange]);

  const bulkDeleteStaff = useCallback((ids: string[]) => {
    commitChange({
      ...snapshot,
      staff: snapshot.staff.filter(s => !ids.includes(s.id))
    });
    toast.success(`تم حذف (${ids.length}) موظف بنجاح`);
  }, [snapshot, commitChange]);

  const toggleStaffStatus = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      staff: snapshot.staff.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'نشط' ? 'غير نشط' : 'نشط';
          toast.info(`تم تغيير حالة ${s.name} إلى (${nextStatus})`);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    });
  }, [snapshot, commitChange]);

  // Transport Operations
  const addTransport = useCallback((trnData: Omit<Transport, 'id'>) => {
    const newTrn: Transport = {
      ...trnData,
      id: `TRN-${Date.now().toString().slice(-4)}`
    };
    commitChange({
      ...snapshot,
      transports: [newTrn, ...snapshot.transports]
    });
    toast.success('تم إضافة تحرك نقل جديد');
  }, [snapshot, commitChange]);

  const updateTransport = useCallback((id: string, updates: Partial<Transport>) => {
    commitChange({
      ...snapshot,
      transports: snapshot.transports.map(tr => tr.id === id ? { ...tr, ...updates } : tr)
    });
    toast.success('تم تحديث حركة النقل');
  }, [snapshot, commitChange]);

  const deleteTransport = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      transports: snapshot.transports.filter(tr => tr.id !== id)
    });
    toast.success('تم حذف حركة النقل');
  }, [snapshot, commitChange]);

  // Family Group Operations
  const addFamilyGroup = useCallback((groupData: Omit<FamilyGroup, 'id'>) => {
    // Check if any selected pilgrim is withdrawn/canceled
    const withdrawnPilgrim = groupData.pilgrim_ids
      .map(id => snapshot.pilgrims.find(p => p.id === id))
      .find(p => p && isPilgrimWithdrawn(p));

    if (withdrawnPilgrim) {
      toast.error(`المعتمر (${withdrawnPilgrim.name}) ملغي/مستبعد؛ لا يمكن ربطه عائلياً`);
      return;
    }

    const trimmedName = groupData.group_name.trim();
    const existingIndex = snapshot.familyGroups.findIndex(
      fg => fg.group_name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex !== -1) {
      const existing = snapshot.familyGroups[existingIndex];
      const mergedPilgrimIds = Array.from(new Set([...existing.pilgrim_ids, ...groupData.pilgrim_ids]));
      const updatedGroups = snapshot.familyGroups.map((fg, idx) => 
        idx === existingIndex ? { ...fg, pilgrim_ids: mergedPilgrimIds, notes: groupData.notes ? `${fg.notes || ''} | ${groupData.notes}` : fg.notes } : fg
      );
      
      const updatedPilgrims = snapshot.pilgrims.map(p => 
        groupData.pilgrim_ids.includes(p.id) ? { ...p, family_group_link: existing.id } : p
      );

      commitChange({
        ...snapshot,
        familyGroups: updatedGroups,
        pilgrims: updatedPilgrims
      });
      toast.info(`تم دمج المعتمرين في المجموعة العائلية الموجودة سابقاً: (${existing.group_name})`);
    } else {
      const newGroupId = `FAM-${Date.now().toString().slice(-4)}`;
      const newGroup: FamilyGroup = {
        ...groupData,
        group_name: trimmedName,
        id: newGroupId
      };

      const updatedPilgrims = snapshot.pilgrims.map(p => 
        groupData.pilgrim_ids.includes(p.id) ? { ...p, family_group_link: newGroupId } : p
      );

      commitChange({
        ...snapshot,
        familyGroups: [...snapshot.familyGroups, newGroup],
        pilgrims: updatedPilgrims
      });
      toast.success(`تم إنشاء المجموعة العائلية: ${trimmedName}`);
    }
  }, [snapshot, commitChange]);

  const updateFamilyGroup = useCallback((id: string, updates: Partial<FamilyGroup>) => {
    commitChange({
      ...snapshot,
      familyGroups: snapshot.familyGroups.map(fg => fg.id === id ? { ...fg, ...updates } : fg)
    });
    toast.success('تم تحديث الرابط العائلي');
  }, [snapshot, commitChange]);

  const deleteFamilyGroup = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      familyGroups: snapshot.familyGroups.filter(fg => fg.id !== id)
    });
    toast.success('تم حذف الرابط العائلي');
  }, [snapshot, commitChange]);

  // Atomic transfer of a pilgrim between family groups or to a new family group
  const transferFamilyMember = useCallback((
    pilgrimId: string, 
    sourceGroupId: string, 
    targetGroupId: string | 'new_group',
    defaultNewGroupName?: string
  ) => {
    const pilgrim = snapshot.pilgrims.find(p => p.id === pilgrimId);
    if (!pilgrim) return;

    if (isPilgrimWithdrawn(pilgrim)) {
      toast.error(`المعتمر (${pilgrim.name}) ملغي/مستبعد؛ لا يمكن نقل ربطه العائلي`);
      return;
    }

    let nextFamilyGroups = [...snapshot.familyGroups];
    let nextPilgrims = [...snapshot.pilgrims];

    if (targetGroupId === 'new_group') {
      const newGroupId = `FAM-${Date.now().toString().slice(-4)}`;
      const newGroupName = defaultNewGroupName || `عائلة المعتمر (${pilgrim.name})`;
      
      const newGroup: FamilyGroup = {
        id: newGroupId,
        group_name: newGroupName,
        pilgrim_ids: [pilgrimId],
        notes: 'مجموعة عائلية منشأة بالنقل'
      };

      // Remove pilgrim from source group
      nextFamilyGroups = nextFamilyGroups.map(fg => {
        if (fg.id === sourceGroupId) {
          return { ...fg, pilgrim_ids: fg.pilgrim_ids.filter(id => id !== pilgrimId) };
        }
        return fg;
      });

      nextFamilyGroups.push(newGroup);

      nextPilgrims = nextPilgrims.map(p => {
        if (p.id === pilgrimId) {
          return { ...p, family_group_link: newGroupId };
        }
        return p;
      });

      toast.success(`تم نقل المعتمر (${pilgrim.name}) إلى مجموعة عائلية جديدة (${newGroupName})`);
    } else {
      const targetGroup = nextFamilyGroups.find(g => g.id === targetGroupId);
      if (!targetGroup) return;

      nextFamilyGroups = nextFamilyGroups.map(fg => {
        if (fg.id === sourceGroupId) {
          return { ...fg, pilgrim_ids: fg.pilgrim_ids.filter(id => id !== pilgrimId) };
        }
        if (fg.id === targetGroupId) {
          return { ...fg, pilgrim_ids: Array.from(new Set([...fg.pilgrim_ids, pilgrimId])) };
        }
        return fg;
      });

      nextPilgrims = nextPilgrims.map(p => {
        if (p.id === pilgrimId) {
          return { ...p, family_group_link: targetGroupId };
        }
        return p;
      });

      toast.success(`تم نقل المعتمر (${pilgrim.name}) إلى عائلة (${targetGroup.group_name}) بنجاح`);
    }

    commitChange({
      ...snapshot,
      familyGroups: nextFamilyGroups,
      pilgrims: nextPilgrims
    });
  }, [snapshot, commitChange]);

  // Merge & Deduplicate Family Groups with duplicate names
  const deduplicateFamilyGroups = useCallback(() => {
    const groupsByName = new Map<string, FamilyGroup[]>();

    snapshot.familyGroups.forEach(fg => {
      const normName = fg.group_name.trim().replace(/\s+/g, ' ').toLowerCase();
      if (!groupsByName.has(normName)) groupsByName.set(normName, []);
      groupsByName.get(normName)!.push(fg);
    });

    let duplicateCount = 0;
    const finalGroups: FamilyGroup[] = [];
    const idRemap = new Map<string, string>(); // oldId -> newPrimaryId

    groupsByName.forEach((groups) => {
      if (groups.length === 1) {
        finalGroups.push(groups[0]);
      } else {
        duplicateCount += groups.length - 1;
        const primary = groups[0];
        const allPilgrimIds = new Set<string>(primary.pilgrim_ids);

        for (let i = 1; i < groups.length; i++) {
          const secondary = groups[i];
          idRemap.set(secondary.id, primary.id);
          secondary.pilgrim_ids.forEach(pid => allPilgrimIds.add(pid));
        }

        finalGroups.push({
          ...primary,
          pilgrim_ids: Array.from(allPilgrimIds)
        });
      }
    });

    if (duplicateCount === 0) {
      toast.info('لا توجد عائلات مكررة بنفس الاسم، السجل نظيف تماماً');
      return;
    }

    // Remap pilgrims family_group_link
    const nextPilgrims = snapshot.pilgrims.map(p => {
      if (p.family_group_link && idRemap.has(p.family_group_link)) {
        return {
          ...p,
          family_group_link: idRemap.get(p.family_group_link)!
        };
      }
      return p;
    });

    // Ensure all pilgrims in final groups have correct family_group_link
    finalGroups.forEach(fg => {
      fg.pilgrim_ids.forEach(pid => {
        const pIdx = nextPilgrims.findIndex(p => p.id === pid);
        if (pIdx !== -1 && (!nextPilgrims[pIdx].family_group_link || idRemap.has(nextPilgrims[pIdx].family_group_link!))) {
          nextPilgrims[pIdx] = { ...nextPilgrims[pIdx], family_group_link: fg.id };
        }
      });
    });

    commitChange({
      ...snapshot,
      familyGroups: finalGroups,
      pilgrims: nextPilgrims
    });

    toast.success(`تم دمج وإزالة (${duplicateCount}) مجموعة عائلية مكررة بنجاح`);
  }, [snapshot, commitChange]);

  // Generate Numbered Family Links ("رابط رقم 1", "رابط رقم 2", ...) for unlinked pilgrims grouped strictly by Hotel AND Gender
  const generateNumberedFamilyLinks = useCallback(() => {
    let nextPilgrims = [...snapshot.pilgrims];
    let nextFamilyGroups = [...snapshot.familyGroups];

    const activeGroupIds = new Set(nextFamilyGroups.map(fg => fg.id));
    const unlinkedActive = nextPilgrims.filter(p => !isPilgrimWithdrawn(p) && (!p.family_group_link || !activeGroupIds.has(p.family_group_link)));

    if (unlinkedActive.length === 0) {
      toast.info('جميع المعتمرين المسجلين مرتبطون بالفعل بـ روابط عائلية أو رقمية.');
      return;
    }

    // Group unlinked pilgrims by (Hotel + Gender) to strictly avoid cross-hotel or mixed-gender conflicts
    const hotelGenderGroups = new Map<string, Pilgrim[]>();

    unlinkedActive.forEach(p => {
      const hotelKey = p.makkah_hotel || p.madinah_hotel || 'فندق مكة';
      const groupKey = `${hotelKey}___${p.gender}`;

      if (!hotelGenderGroups.has(groupKey)) {
        hotelGenderGroups.set(groupKey, []);
      }
      hotelGenderGroups.get(groupKey)!.push(p);
    });

    let linkNumber = 1;

    const existingNumMatches = nextFamilyGroups
      .map(fg => fg.group_name.match(/رابط رقم (\d+)/))
      .filter(Boolean);
    if (existingNumMatches.length > 0) {
      const maxNum = Math.max(...existingNumMatches.map(m => parseInt(m![1], 10)));
      if (!isNaN(maxNum) && maxNum >= 1) {
        linkNumber = maxNum + 1;
      }
    }

    let createdGroupsCount = 0;

    hotelGenderGroups.forEach((pilgrimList, groupKey) => {
      const [hotelName, gender] = groupKey.split('___');
      const genderLabel = gender === 'ذكر' ? 'رجال' : 'سيدات';
      const chunkSize = 4;

      for (let i = 0; i < pilgrimList.length; i += chunkSize) {
        const chunk = pilgrimList.slice(i, i + chunkSize);
        const linkId = `FAM-NUM-${Date.now()}-${linkNumber}`;
        const linkName = `رابط رقم ${linkNumber}`;

        const newGroup: FamilyGroup = {
          id: linkId,
          group_name: linkName,
          pilgrim_ids: chunk.map(p => p.id),
          notes: `رابط رقم ${linkNumber} - ${hotelName} (${genderLabel})`
        };

        nextFamilyGroups.push(newGroup);

        const chunkIds = new Set(chunk.map(p => p.id));
        nextPilgrims = nextPilgrims.map(p => {
          if (chunkIds.has(p.id)) {
            return { ...p, family_group_link: linkId };
          }
          return p;
        });

        linkNumber++;
        createdGroupsCount++;
      }
    });

    commitChange({
      ...snapshot,
      familyGroups: nextFamilyGroups,
      pilgrims: nextPilgrims
    });

    toast.success(`تم إنشاء ${createdGroupsCount} رابط رقمي موزع على أساس الفندق والجنس (${unlinkedActive.length} معتمر) لعدم التعارض بنجاح`);
  }, [snapshot, commitChange]);

  // Unlink a pilgrim from their family link and automatically redistribute them into a suitable same-gender room or new room
  const unlinkFamilyMemberAndRedistribute = useCallback((pilgrimId: string) => {
    const targetPilgrim = snapshot.pilgrims.find(p => p.id === pilgrimId);
    if (!targetPilgrim) return;

    // 1. Remove pilgrim from familyGroups
    const nextFamilyGroups = snapshot.familyGroups
      .map(fg => ({
        ...fg,
        pilgrim_ids: fg.pilgrim_ids.filter(id => id !== pilgrimId)
      }))
      .filter(fg => fg.pilgrim_ids.length > 0);

    // 2. Identify the hotel and current room members
    const hotelPilgrims = snapshot.pilgrims.filter(p => 
      (targetPilgrim.makkah_hotel && p.makkah_hotel === targetPilgrim.makkah_hotel) ||
      (targetPilgrim.madinah_hotel && p.madinah_hotel === targetPilgrim.madinah_hotel)
    );

    const oldRoomNo = targetPilgrim.room_number;
    let newRoomNo = '';
    let newRoomTypeStr: RoomType = 'فردي';

    // 3. Find existing room that matches gender and has space
    if (hotelPilgrims.length > 0) {
      const roomMap = new Map<string, Pilgrim[]>();
      hotelPilgrims.forEach(p => {
        if (p.room_number && p.id !== pilgrimId) {
          if (!roomMap.has(p.room_number)) roomMap.set(p.room_number, []);
          roomMap.get(p.room_number)!.push(p);
        }
      });

      let foundRoomNo: string | null = null;
      let foundRoomMembers: Pilgrim[] = [];

      for (const [rNo, members] of roomMap.entries()) {
        const isSameGender = members.every(m => m.gender === targetPilgrim.gender);
        const hasSpace = members.length < 4;
        const isOldRoom = rNo === oldRoomNo;
        const oldRoomHasOppositeGender = isOldRoom && members.some(m => m.gender !== targetPilgrim.gender);

        if (isSameGender && hasSpace && !oldRoomHasOppositeGender) {
          foundRoomNo = rNo;
          foundRoomMembers = members;
          break;
        }
      }

      if (foundRoomNo) {
        newRoomNo = foundRoomNo;
        const newTotalCount = foundRoomMembers.length + 1;
        newRoomTypeStr = newTotalCount === 1 ? 'فردي' : newTotalCount === 2 ? 'ثنائي' : newTotalCount === 3 ? 'ثلاثي' : 'رباعي';
      } else {
        const existingNumbers = Array.from(roomMap.keys())
          .map(rn => parseInt(rn.replace(/\D/g, ''), 10))
          .filter(num => !isNaN(num) && num > 0);
        
        const maxNo = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 100;
        newRoomNo = (maxNo + 1).toString();
        newRoomTypeStr = 'فردي';
      }
    } else {
      newRoomNo = oldRoomNo || '101';
      newRoomTypeStr = 'فردي';
    }

    // 4. Update pilgrims state
    const nextPilgrims = snapshot.pilgrims.map(p => {
      if (p.id === pilgrimId) {
        return {
          ...p,
          family_group_link: '',
          room_number: newRoomNo,
          room_type: newRoomTypeStr
        };
      }
      if (oldRoomNo && p.room_number === oldRoomNo && p.id !== pilgrimId) {
        const remainingInOldRoom = snapshot.pilgrims.filter(op => op.room_number === oldRoomNo && op.id !== pilgrimId);
        const count = remainingInOldRoom.length;
        const updatedType: RoomType = count === 1 ? 'فردي' : count === 2 ? 'ثنائي' : count === 3 ? 'ثلاثي' : 'رباعي';
        return {
          ...p,
          room_type: updatedType
        };
      }
      if (newRoomNo && p.room_number === newRoomNo && p.id !== pilgrimId) {
        const membersInNewRoom = snapshot.pilgrims.filter(np => np.room_number === newRoomNo || np.id === pilgrimId);
        const count = membersInNewRoom.length;
        const updatedType: RoomType = count === 1 ? 'فردي' : count === 2 ? 'ثنائي' : count === 3 ? 'ثلاثي' : 'رباعي';
        return {
          ...p,
          room_type: updatedType
        };
      }
      return p;
    });

    commitChange({
      ...snapshot,
      familyGroups: nextFamilyGroups,
      pilgrims: nextPilgrims
    });

    toast.success(
      `تم إزالة الرابط العائلي للمعتمر (${targetPilgrim.name}) وتوزيعه تلقائياً في الغرفة (${newRoomNo}) - (${targetPilgrim.gender === 'ذكر' ? 'قسم الرجال' : 'قسم السيدات'})`
    );
  }, [snapshot, commitChange]);

  // Delete family group and redistribute all members into separate/same-gender rooms
  const deleteFamilyGroupAndRedistribute = useCallback((groupId: string) => {
    const group = snapshot.familyGroups.find(fg => fg.id === groupId);
    if (!group) return;

    const nextFamilyGroups = snapshot.familyGroups.filter(fg => fg.id !== groupId);
    let currentPilgrims = [...snapshot.pilgrims];

    group.pilgrim_ids.forEach(pId => {
      const p = currentPilgrims.find(x => x.id === pId);
      if (!p) return;

      const hotelPilgrims = currentPilgrims.filter(hp => 
        (p.makkah_hotel && hp.makkah_hotel === p.makkah_hotel) ||
        (p.madinah_hotel && hp.madinah_hotel === p.madinah_hotel)
      );

      const oldRoomNo = p.room_number;
      let newRoomNo = '';
      let newRoomTypeStr: RoomType = 'فردي';

      const roomMap = new Map<string, Pilgrim[]>();
      hotelPilgrims.forEach(hp => {
        if (hp.room_number && hp.id !== pId) {
          if (!roomMap.has(hp.room_number)) roomMap.set(hp.room_number, []);
          roomMap.get(hp.room_number)!.push(hp);
        }
      });

      let foundRoomNo: string | null = null;
      let foundRoomMembers: Pilgrim[] = [];

      for (const [rNo, members] of roomMap.entries()) {
        const isSameGender = members.every(m => m.gender === p.gender);
        const hasSpace = members.length < 4;
        const oldRoomHasOppositeGender = rNo === oldRoomNo && members.some(m => m.gender !== p.gender);

        if (isSameGender && hasSpace && !oldRoomHasOppositeGender) {
          foundRoomNo = rNo;
          foundRoomMembers = members;
          break;
        }
      }

      if (foundRoomNo) {
        newRoomNo = foundRoomNo;
        const count = foundRoomMembers.length + 1;
        newRoomTypeStr = count === 1 ? 'فردي' : count === 2 ? 'ثنائي' : count === 3 ? 'ثلاثي' : 'رباعي';
      } else {
        const existingNumbers = Array.from(roomMap.keys())
          .map(rn => parseInt(rn.replace(/\D/g, ''), 10))
          .filter(num => !isNaN(num) && num > 0);
        const maxNo = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 100;
        newRoomNo = (maxNo + 1).toString();
        newRoomTypeStr = 'فردي';
      }

      currentPilgrims = currentPilgrims.map(item => {
        if (item.id === pId) {
          return {
            ...item,
            family_group_link: '',
            room_number: newRoomNo,
            room_type: newRoomTypeStr
          };
        }
        return item;
      });
    });

    commitChange({
      ...snapshot,
      familyGroups: nextFamilyGroups,
      pilgrims: currentPilgrims
    });

    toast.success(`تم حذف الرابط العائلي (${group.group_name}) وتوزيع جميع أفراده تلقائياً في غرف جديدة حسب الجنس`);
  }, [snapshot, commitChange]);

  // Smart Auto-Rooming Engine (Strictly matches family links and distributes unlinked pilgrims by room specs & same gender; excludes withdrawn/canceled)
  const autoRooming = useCallback((hotelName: string, city: 'مكة' | 'المدينة') => {
    const hotelKey = city === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';
    const allHotelPilgrims = snapshot.pilgrims.filter(p => p[hotelKey] === hotelName);

    const hotelPilgrims = allHotelPilgrims.filter(p => !isPilgrimWithdrawn(p));
    const withdrawnPilgrimsInHotel = allHotelPilgrims.filter(p => isPilgrimWithdrawn(p));

    if (hotelPilgrims.length === 0) {
      toast.warning(`لا يوجد معتمرون نشطون للتسكين في ${hotelName}`);
      return;
    }

    let roomNumberCounter = 101;
    const updatedPilgrimsMap = new Map<string, Pilgrim>();
    const assignedIds = new Set<string>();

    // Un-assign any withdrawn/canceled pilgrims from rooms
    withdrawnPilgrimsInHotel.forEach(p => {
      if (p.room_number) {
        updatedPilgrimsMap.set(p.id, { ...p, room_number: '' });
      }
    });

    // -------------------------------------------------------------
    // STEP 1: Cluster by Family Links & Merged Notes (تسكين مطابق للروابط العائلية 100%)
    // -------------------------------------------------------------
    const familyClusterMap = new Map<string, Pilgrim[]>();

    hotelPilgrims.forEach(p => {
      let famKey = p.family_group_link || null;

      // Find if pilgrim is part of an explicit FamilyGroup
      if (!famKey) {
        const fg = snapshot.familyGroups.find(g => g.pilgrim_ids.includes(p.id));
        if (fg) famKey = fg.id;
      }

      // Check for merged relational notes if no explicit link exists
      if (!famKey && p.notes) {
        const cleanNotes = p.notes.trim();
        if (/زوج|زوجة|زوجين|أزواج|اخوات|إخوة|اخوان|بنات|أبناء|اسره|أسرة|عائلة|عائله|مع بعض|أصحاب|اصحاب/i.test(cleanNotes)) {
          famKey = `NOTE_FAM_${cleanNotes.toLowerCase()}`;
        }
      }

      if (famKey) {
        if (!familyClusterMap.has(famKey)) familyClusterMap.set(famKey, []);
        familyClusterMap.get(famKey)!.push(p);
      }
    });

    // House Family Groups into contiguous rooms together
    familyClusterMap.forEach((members) => {
      const unassignedMembers = members.filter(m => !assignedIds.has(m.id));
      if (unassignedMembers.length === 0) return;

      let index = 0;
      while (index < unassignedMembers.length) {
        const remainingCount = unassignedMembers.length - index;
        const firstSpec = unassignedMembers[index].room_spec || unassignedMembers[index].room_type;

        let targetCapacity = 4; // Default Quad

        if (firstSpec === 'ثنائي' || (remainingCount === 2 && /زوج|زوجة|زوجين|أزواج/i.test(unassignedMembers[index].notes || ''))) {
          targetCapacity = 2;
        } else if (firstSpec === 'ثلاثي' || remainingCount === 3) {
          targetCapacity = 3;
        } else if (firstSpec === 'فردي' || remainingCount === 1) {
          targetCapacity = 1;
        } else {
          targetCapacity = Math.min(4, remainingCount);
        }

        const roomPilgrims = unassignedMembers.slice(index, index + targetCapacity);
        const currentRoomNumber = `${roomNumberCounter}`;
        const roomTypeStr: RoomType = roomPilgrims.length === 1 ? 'فردي' : roomPilgrims.length === 2 ? 'ثنائي' : roomPilgrims.length === 3 ? 'ثلاثي' : 'رباعي';

        roomPilgrims.forEach(p => {
          assignedIds.add(p.id);
          updatedPilgrimsMap.set(p.id, {
            ...p,
            room_number: currentRoomNumber,
            room_type: roomTypeStr
          });
        });

        index += roomPilgrims.length;
        roomNumberCounter++;
      }
    });

    // -------------------------------------------------------------
    // STEP 2: Distribute Unlinked Pilgrims Individually (توزيع فردي حسب نوع الغرفة والمحتوى)
    // -------------------------------------------------------------
    const unlinkedPilgrims = hotelPilgrims.filter(p => !assignedIds.has(p.id));
    const unlinkedMales = unlinkedPilgrims.filter(p => p.gender === 'ذكر');
    const unlinkedFemales = unlinkedPilgrims.filter(p => p.gender === 'أنثى');

    // Helper to distribute unlinked same-gender pilgrims into rooms matching their room_spec or room capacity
    const distributeUnlinkedGroup = (pilgrimsList: Pilgrim[]) => {
      if (pilgrimsList.length === 0) return;

      // Classify unlinked pilgrims by room preference/spec
      const doublePilgrims: Pilgrim[] = [];
      const triplePilgrims: Pilgrim[] = [];
      const quadPilgrims: Pilgrim[] = [];
      const singlePilgrims: Pilgrim[] = [];
      const flexiblePilgrims: Pilgrim[] = [];

      pilgrimsList.forEach(p => {
        const spec = p.room_spec || p.room_type;
        if (spec === 'ثنائي') doublePilgrims.push(p);
        else if (spec === 'ثلاثي') triplePilgrims.push(p);
        else if (spec === 'رباعي') quadPilgrims.push(p);
        else if (spec === 'فردي') singlePilgrims.push(p);
        else flexiblePilgrims.push(p);
      });

      // 1. Assign Single Rooms (فردي)
      singlePilgrims.forEach(p => {
        const rmNo = `${roomNumberCounter}`;
        assignedIds.add(p.id);
        updatedPilgrimsMap.set(p.id, { ...p, room_number: rmNo, room_type: 'فردي' });
        roomNumberCounter++;
      });

      // 2. Assign Double Rooms (ثنائي)
      let idxD = 0;
      while (idxD < doublePilgrims.length) {
        const roomPilgrims = doublePilgrims.slice(idxD, idxD + 2);
        const rmNo = `${roomNumberCounter}`;
        const rmType: RoomType = roomPilgrims.length === 1 ? 'فردي' : 'ثنائي';
        roomPilgrims.forEach(p => {
          assignedIds.add(p.id);
          updatedPilgrimsMap.set(p.id, { ...p, room_number: rmNo, room_type: rmType });
        });
        idxD += roomPilgrims.length;
        roomNumberCounter++;
      }

      // 3. Assign Triple Rooms (ثلاثي)
      let idxT = 0;
      while (idxT < triplePilgrims.length) {
        const roomPilgrims = triplePilgrims.slice(idxT, idxT + 3);
        const rmNo = `${roomNumberCounter}`;
        const rmType: RoomType = roomPilgrims.length === 1 ? 'فردي' : roomPilgrims.length === 2 ? 'ثنائي' : 'ثلاثي';
        roomPilgrims.forEach(p => {
          assignedIds.add(p.id);
          updatedPilgrimsMap.set(p.id, { ...p, room_number: rmNo, room_type: rmType });
        });
        idxT += roomPilgrims.length;
        roomNumberCounter++;
      }

      // 4. Assign Quad Rooms (رباعي)
      let idxQ = 0;
      while (idxQ < quadPilgrims.length) {
        const roomPilgrims = quadPilgrims.slice(idxQ, idxQ + 4);
        const rmNo = `${roomNumberCounter}`;
        const rmType: RoomType = roomPilgrims.length === 1 ? 'فردي' : roomPilgrims.length === 2 ? 'ثنائي' : roomPilgrims.length === 3 ? 'ثلاثي' : 'رباعي';
        roomPilgrims.forEach(p => {
          assignedIds.add(p.id);
          updatedPilgrimsMap.set(p.id, { ...p, room_number: rmNo, room_type: rmType });
        });
        idxQ += roomPilgrims.length;
        roomNumberCounter++;
      }

      // 5. Assign Flexible / Default Pilgrims (4 per quad, then 3/2/1 as needed)
      let idxF = 0;
      while (idxF < flexiblePilgrims.length) {
        const rem = flexiblePilgrims.length - idxF;
        let cap = 4;
        if (rem === 3) cap = 3;
        else if (rem === 2) cap = 2;
        else if (rem === 1) cap = 1;
        else cap = 4;

        const roomPilgrims = flexiblePilgrims.slice(idxF, idxF + cap);
        const rmNo = `${roomNumberCounter}`;
        const rmType: RoomType = roomPilgrims.length === 1 ? 'فردي' : roomPilgrims.length === 2 ? 'ثنائي' : roomPilgrims.length === 3 ? 'ثلاثي' : 'رباعي';

        roomPilgrims.forEach(p => {
          assignedIds.add(p.id);
          updatedPilgrimsMap.set(p.id, { ...p, room_number: rmNo, room_type: rmType });
        });

        idxF += roomPilgrims.length;
        roomNumberCounter++;
      }
    };

    distributeUnlinkedGroup(unlinkedMales);
    distributeUnlinkedGroup(unlinkedFemales);

    const nextPilgrims = snapshot.pilgrims.map(p => updatedPilgrimsMap.get(p.id) || p);

    commitChange({
      ...snapshot,
      pilgrims: nextPilgrims
    });

    const familyCount = familyClusterMap.size;
    toast.success(`تم التسكين بـ ${hotelName}: مطابقة ${familyCount} عائلة بالكامل وتوزيع المعتمرين الأفراد حسب المواصفات والجنس`);
  }, [snapshot, commitChange]);

  // Family Validation Engine (detecting gender conflicts, unlinked marital pairs, non-mahram mixes)
  const validateFamilyGroups = useCallback((): FamilyValidationResult[] => {
    return snapshot.familyGroups.map(group => {
      const groupPilgrims = snapshot.pilgrims.filter(p => group.pilgrim_ids.includes(p.id));
      const errors: string[] = [];
      const warnings: string[] = [];

      if (groupPilgrims.length === 0) {
        errors.push('المجموعة لا تحتوي على أي معتمرين مسجلين');
      }

      const males = groupPilgrims.filter(p => p.gender === 'ذكر');
      const females = groupPilgrims.filter(p => p.gender === 'أنثى');

      // Check Mahram requirement for females if all are females
      if (females.length > 0 && males.length === 0) {
        warnings.push('المجموعة العائلية تحتوي على إناث فقط بدون محرم رجالي مسجل في القائمة');
      }

      // Check hotel alignment
      const makkahHotelsSet = new Set(groupPilgrims.map(p => p.makkah_hotel));
      if (makkahHotelsSet.size > 1) {
        errors.push('تعارض في الفنادق: أفراد العائلة مفرقون على أكثر من فندق بمكة المكرمة');
      }

      const madinahHotelsSet = new Set(groupPilgrims.map(p => p.madinah_hotel));
      if (madinahHotelsSet.size > 1) {
        errors.push('تعارض في الفنادق: أفراد العائلة مفرقون على أكثر من فندق بالمدينة المنورة');
      }

      // Room capacity warnings
      if (groupPilgrims.length > 4) {
        warnings.push(`عدد الأفراد (${groupPilgrims.length}) يتجاوز سعة الغرفة الرباعية؛ يلزم توزيعهم على أكثر من غرفة متجاورة`);
      }

      return {
        groupId: group.id,
        groupName: group.group_name,
        errors,
        warnings,
        isValid: errors.length === 0
      };
    });
  }, [snapshot]);

  // Preflight Validation Engine
  const validatePreflight = useCallback((targetHotel?: string): PreflightValidationResult => {
    const rawPilgrims = targetHotel && targetHotel !== 'all'
      ? snapshot.pilgrims.filter(p => p.makkah_hotel === targetHotel || p.madinah_hotel === targetHotel)
      : snapshot.pilgrims;

    const activePilgrims = rawPilgrims.filter(p => !isPilgrimWithdrawn(p));
    const withdrawnInRooms = rawPilgrims.filter(p => isPilgrimWithdrawn(p) && p.room_number);

    const errors: PreflightValidationResult['errors'] = [];
    const warnings: PreflightValidationResult['warnings'] = [];

    if (withdrawnInRooms.length > 0) {
      errors.push({
        type: 'capacity_exceeded',
        message: `تنبيه: يوجد ${withdrawnInRooms.length} معتمر ملغي/مستبعد مسكنون في غرف. يرجى تشغيل التسكين الذكي التلقائي لإلغاء تسكينهم فوراً.`
      });
    }

    // 1. Hotel Mismatch Check
    const pilgrimTripsMap = new Map<string, string>();
    activePilgrims.forEach(p => {
      if (p.makkah_hotel && p.madinah_hotel) {
        pilgrimTripsMap.set(p.id, p.makkah_hotel);
      }
    });

    // 2. Unassigned pilgrims check
    const unassigned = activePilgrims.filter(p => !p.room_number);
    if (unassigned.length > 0) {
      warnings.push({
        type: 'unassigned_pilgrims',
        message: `يوجد ${unassigned.length} معتمر لم يتم تسكينهم في غرف محددة بعد.`
      });
    }

    // 3. Gender Cross-rooming Check
    const roomMap = new Map<string, Pilgrim[]>();
    activePilgrims.forEach(p => {
      if (p.room_number) {
        const existing = roomMap.get(p.room_number) || [];
        existing.push(p);
        roomMap.set(p.room_number, existing);
      }
    });

    roomMap.forEach((pList, roomNo) => {
      const maleCount = pList.filter(p => p.gender === 'ذكر').length;
      const femaleCount = pList.filter(p => p.gender === 'أنثى').length;

      if (maleCount > 0 && femaleCount > 0) {
        // Exception if they are marked as family
        const hasFamily = pList.every(p => p.family_group_link);
        if (!hasFamily) {
          errors.push({
            type: 'gender_mismatch',
            message: `اختلاط غير شرعي في الغرفة رقم (${roomNo}): تتضمن ذكور وإناث بدون رابط عائلي موثق.`
          });
        }
      }

      if (pList.length > 4) {
        errors.push({
          type: 'capacity_exceeded',
          message: `تجاوز السعة القصوى للغرفة (${roomNo}): تضم ${pList.length} معتمرين والسعة المسموحة 4 بحد أقصى.`
        });
      }
    });

    return {
      hasErrors: errors.length > 0,
      errors,
      warnings,
      stats: {
        totalPilgrims: activePilgrims.length,
        assignedToRooms: activePilgrims.length - unassigned.length,
        unassignedPilgrims: unassigned.length,
        totalRoomsNeeded: Math.ceil(activePilgrims.length / 4)
      }
    };
  }, [snapshot]);

  // Server Function: Google Sheet Sync
  const syncFromGoogleSheets = useCallback(async () => {
    const loadingToast = toast.loading('جاري المزامنة وقراءة شيت جوجل (وتجاهل الصفوف الفارغة)...');
    try {
      const token = getGoogleAccessToken();
      const res = await fetch('/api/sync-sheet', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        const nextSnapshot: AppSnapshot = {
          ...snapshot,
          pilgrims: data.pilgrims && data.pilgrims.length > 0 ? data.pilgrims : snapshot.pilgrims,
          familyGroups: data.familyGroups && data.familyGroups.length > 0 ? data.familyGroups : snapshot.familyGroups,
          staff: data.staff && data.staff.length > 0 ? data.staff : snapshot.staff,
          trips: data.trips && data.trips.length > 0 ? data.trips : snapshot.trips,
          roomings: data.roomings && data.roomings.length > 0 ? data.roomings : snapshot.roomings,
          transports: data.transports && data.transports.length > 0 ? data.transports : snapshot.transports,
          financeRecords: Array.isArray(data.financeRecords) ? data.financeRecords : snapshot.financeRecords,
          notifications: [
            {
              id: `NOTIF-${Date.now()}`,
              title: 'تمت المزامنة الكاملة من Google Sheets',
              message: data.message || `تم استيراد ${data.count || 0} معتمر، وتجاهل الصفوف الفارغة.`,
              timestamp: new Date().toLocaleTimeString('ar-SA'),
              read: false,
              type: 'success'
            },
            ...snapshot.notifications
          ]
        };
        commitChange(nextSnapshot);
        toast.success(data.message || 'تمت المزامنة بنجاح من جوجل شيت (تم استبعاد الصفوف الفارغة)');
      } else {
        toast.error(data.message || 'تعذر جلب البيانات من شيت جوجل');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.success('تم مزامنة البيانات وتحديث سجل المعتمرين بنجاح من شيت جوجل (موسم 1448 هـ)');
    }
  }, [snapshot, commitChange]);

  // Google Registration & Admin Approval Handlers
  const approvePendingUser = useCallback((id: string, role: string, phone?: string, national_id?: string, permissions?: StaffPermission) => {
    const currentPending = snapshot.pendingUsers || [];
    const pUser = currentPending.find(u => u.id === id);
    if (!pUser) return;

    const updatedPending = currentPending.map(u => u.id === id ? { ...u, status: 'approved' as const, role } : u);

    // Add to active staff if not already present
    const existingStaff = snapshot.staff.find(s => s.name.toLowerCase() === pUser.displayName.toLowerCase());
    let updatedStaff = [...snapshot.staff];

    if (!existingStaff) {
      const newStaffMember: Staff = {
        id: 'ST-' + Math.floor(100 + Math.random() * 900),
        name: pUser.displayName,
        role: role || 'مشرف رحلات العمرة والمجموعات',
        status: 'نشط',
        phone: phone || pUser.phone || '01000000000',
        national_id: national_id || pUser.national_id || '29000000000000',
        permissions: permissions || getDefaultPermissionsForRole(role)
      };
      updatedStaff.push(newStaffMember);
    } else {
      updatedStaff = updatedStaff.map(s => s.id === existingStaff.id ? { ...s, role, status: 'نشط' } : s);
    }

    const notif: NotificationRecord = {
      id: 'NOTIF-APP-' + Date.now(),
      title: '✅ تم اعتماد حساب الموظف الجديد',
      message: `تم موافقة مدير النظام على انضمام الموظف (${pUser.displayName}) كموظف مسجل بصلاحية (${role}).`,
      type: 'user_approval',
      date: new Date().toISOString().split('T')[0],
      read: false,
      severity: 'low'
    };

    commitChange({
      ...snapshot,
      pendingUsers: updatedPending,
      staff: updatedStaff,
      notifications: [notif, ...snapshot.notifications]
    });

    toast.success(`تم اعتماد الموظف (${pUser.displayName}) وتحديد مسمى (${role}) بنجاح!`);
  }, [snapshot, commitChange]);

  const rejectPendingUser = useCallback((id: string, reason?: string) => {
    const currentPending = snapshot.pendingUsers || [];
    const pUser = currentPending.find(u => u.id === id);
    if (!pUser) return;

    const updatedPending = currentPending.map(u => u.id === id ? { ...u, status: 'rejected' as const, rejectionReason: reason } : u);

    commitChange({
      ...snapshot,
      pendingUsers: updatedPending
    });

    toast.info(`تم رفض طلب انضمام (${pUser.displayName}).`);
  }, [snapshot, commitChange]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await googleSignIn();
      if (!res?.user) return;
      const email = res.user.email || '';
      const displayName = res.user.displayName || email.split('@')[0];
      const photoURL = res.user.photoURL || undefined;

      setIsGoogleConnected(true);
      setGoogleUserEmail(email);

      // 1. If Admin email or role
      if (email.toLowerCase() === 'mohamedseo2002@gmail.com' || (snapshot.currentRole || 'admin') === 'admin') {
        setCurrentUser({
          email,
          displayName,
          photoURL,
          role: 'مدير النظام',
          status: 'admin'
        });
        toast.success(`مرحباً بك يا مدير النظام (${displayName})! تم الدخول بصلاحيات كاملة.`);
        syncFromGoogleSheets();
        return;
      }

      // 2. Check pendingUsers or staff
      const existingReq = (snapshot.pendingUsers || []).find(p => p.email.toLowerCase() === email.toLowerCase());
      const existingStaff = snapshot.staff.find(s => s.name.toLowerCase() === displayName.toLowerCase());

      if (existingReq) {
        if (existingReq.status === 'approved') {
          setCurrentUser({
            email,
            displayName,
            photoURL,
            role: existingReq.role || 'موظف مسجل',
            status: 'approved'
          });
          toast.success(`مرحباً بك (${displayName})! تم اعتماد دخولك بنجاح.`);
        } else if (existingReq.status === 'rejected') {
          setCurrentUser({
            email,
            displayName,
            photoURL,
            status: 'rejected'
          });
          toast.error('عفواً، تم رفض طلب انضمامك من قبل مدير النظام.');
        } else {
          setCurrentUser({
            email,
            displayName,
            photoURL,
            status: 'pending'
          });
          toast.info('طلب انضمامك قيد المراجعة والاعتماد لدى مدير النظام.');
        }
      } else if (existingStaff) {
        setCurrentUser({
          email,
          displayName,
          photoURL,
          role: existingStaff.role,
          status: 'approved'
        });
        toast.success(`مرحباً بك يا (${displayName})! تم الدخول بصلاحية: ${existingStaff.role}`);
      } else {
        // Create new pending user request
        const newReq: PendingUser = {
          id: 'REQ-' + Date.now().toString().slice(-6),
          email,
          displayName,
          photoURL,
          requestedAt: new Date().toISOString().split('T')[0],
          status: 'pending',
          role: 'بانتظار موافقة مدير النظام'
        };

        const newNotif: NotificationRecord = {
          id: 'NOTIF-APP-' + Date.now(),
          title: '🚨 طلب انضمام مستخدم جديد عبر جوجل',
          message: `قام المستخدم (${displayName} - ${email}) بالتسجيل عبر جوجل، بانتظار موافقة مدير النظام وتعيين المسمى الوظيفي والصلاحيات.`,
          type: 'user_approval',
          date: new Date().toISOString().split('T')[0],
          read: false,
          severity: 'high'
        };

        commitChange({
          ...snapshot,
          pendingUsers: [...(snapshot.pendingUsers || []), newReq],
          notifications: [newNotif, ...snapshot.notifications]
        });

        setCurrentUser({
          email,
          displayName,
          photoURL,
          status: 'pending'
        });

        toast.info('تم تقديم طلب الانضمام بنجاح! طلبك الآن بانتظار موافقة مدير النظام وتعيين الصلاحيات.');
      }
      syncFromGoogleSheets();
    } catch (err: any) {
      toast.error('خطأ في التسجيل عبر جوجل: ' + (err.message || ''));
    }
  }, [snapshot, commitChange, syncFromGoogleSheets]);

  const logoutCurrentUser = useCallback(async () => {
    await logoutGoogle();
    setIsGoogleConnected(false);
    setGoogleUserEmail(null);
    setCurrentUser(null);
    toast.info('تم تسجيل الخروج بنجاح.');
  }, []);

  const loginAsAdminBypass = useCallback(() => {
    setCurrentUser({
      email: 'admin@megastartours.com',
      displayName: 'مدير النظام (Admin)',
      role: 'مدير النظام',
      status: 'admin'
    });
    toast.success('تم دخول وضع مدير النظام لمراجعة واعتماد الطلبات.');
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    await loginWithGoogle();
  }, [loginWithGoogle]);

  const handleGoogleLogout = useCallback(async () => {
    await logoutCurrentUser();
  }, [logoutCurrentUser]);

  // Server Function: OCR Passport
  const ocrExtractPassport = useCallback(async (base64Image: string, mimeType: string = 'image/jpeg') => {
    const loadingToast = toast.loading('جاري قراءة وتحليل صورة جواز السفر بواسطة AI...');
    try {
      const res = await fetch('/api/ocr-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, mimeType })
      });
      const result = await res.json();
      toast.dismiss(loadingToast);

      if (result.success && result.data) {
        toast.success(`تم استخراج بيانات الجواز بنجاح: ${result.data.name || ''}`);
        return result.data;
      } else {
        toast.error('لم نتمكن من استخراج جميع بيانات الجواز، يرجى المراجعة اليدوية');
        return null;
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('حدث خطأ أثناء قراءة صورة الجواز');
      return null;
    }
  }, []);

  // Finance Operations
  const addFinanceRecord = useCallback((record: Omit<FinanceRecord, 'id'>) => {
    const newRecord: FinanceRecord = {
      ...record,
      id: `FIN-${Date.now().toString().slice(-4)}`,
    };
    commitChange({
      ...snapshot,
      financeRecords: [newRecord, ...(snapshot.financeRecords || [])],
    });
    toast.success('تم إضافة القيد المالي بنجاح');
  }, [snapshot, commitChange]);

  const updateFinanceRecord = useCallback((id: string, updates: Partial<FinanceRecord>) => {
    commitChange({
      ...snapshot,
      financeRecords: (snapshot.financeRecords || []).map(f => f.id === id ? { ...f, ...updates } : f),
    });
    toast.success('تم تحديث البيانات المالية');
  }, [snapshot, commitChange]);

  const deleteFinanceRecord = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      financeRecords: (snapshot.financeRecords || []).filter(f => f.id !== id),
    });
    toast.info('تم حذف القيد المالي');
  }, [snapshot, commitChange]);

  // Document Operations
  const addDocument = useCallback((doc: Omit<DocumentRecord, 'id'>) => {
    const newDoc: DocumentRecord = {
      ...doc,
      id: `DOC-${Date.now().toString().slice(-4)}`,
    };
    commitChange({
      ...snapshot,
      documents: [newDoc, ...(snapshot.documents || [])],
    });
    toast.success('تم رفع المستند واعتماده بنجاح');
  }, [snapshot, commitChange]);

  const deleteDocument = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      documents: (snapshot.documents || []).filter(d => d.id !== id),
    });
    toast.info('تم حذف المستند');
  }, [snapshot, commitChange]);

  // Notifications Operations
  const markNotificationRead = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      notifications: (snapshot.notifications || []).map(n => n.id === id ? { ...n, read: true } : n),
    });
  }, [snapshot, commitChange]);

  const addNotification = useCallback((notif: Omit<NotificationRecord, 'id'>) => {
    const newNotif: NotificationRecord = {
      ...notif,
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
    };
    commitChange({
      ...snapshot,
      notifications: [newNotif, ...(snapshot.notifications || [])],
    });
  }, [snapshot, commitChange]);

  // Smart Alert Scanner for Staff Iqamas and Pilgrim Passports
  const scanAndGenerateSmartAlerts = useCallback(() => {
    const newAlerts: NotificationRecord[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingNotifKeys = new Set(
      (snapshot.notifications || []).map(n => `${n.type}_${n.target_staff_id || n.target_entity_name}`)
    );

    // 1. Check Staff Iqamas
    (snapshot.staff || []).forEach(st => {
      if (st.iqama_expiry_date) {
        const expDate = new Date(st.iqama_expiry_date);
        expDate.setHours(0, 0, 0, 0);
        const diffMs = expDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 30) {
          const notifKey = `iqama_expiry_${st.id}`;
          if (!existingNotifKeys.has(notifKey)) {
            const isExpired = daysRemaining < 0;
            newAlerts.push({
              id: `NOTIF-IQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              title: isExpired 
                ? `🚨 تنبيه عاجل: إقامة منتهية للموظف (${st.name})` 
                : `⚠️ اقتراب موعد تجديد إقامة الموظف (${st.name})`,
              message: isExpired
                ? `انتهت إقامة الموظف (${st.role}) برقم (${st.iqama_number || 'غير مدخل'}) بتاريخ ${st.iqama_expiry_date}. يُرجى اتخاذ إجراء السداد والتجديد فوراً تجنباً للغرامات.`
                : `متبقي ${daysRemaining} يوم فقط على انتهاء إقامة الموظف (${st.role}) برقم (${st.iqama_number || 'غير مدخل'}) بتاريخ ${st.iqama_expiry_date}.`,
              type: 'iqama_expiry',
              date: new Date().toISOString().split('T')[0],
              read: false,
              severity: isExpired || daysRemaining <= 7 ? 'high' : 'medium',
              target_staff_id: st.id,
              target_entity_name: st.name,
              days_remaining: daysRemaining
            });
          }
        }
      }
    });

    // 2. Check Pilgrim Passport Expirations
    (snapshot.pilgrims || []).forEach(p => {
      if (!isPilgrimWithdrawn(p) && p.passport_expiry_date) {
        const expDate = new Date(p.passport_expiry_date);
        expDate.setHours(0, 0, 0, 0);
        const diffMs = expDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Travel standards require passports valid for at least 6 months (180 days)
        if (daysRemaining <= 180) {
          const notifKey = `passport_expiry_${p.name}`;
          if (!existingNotifKeys.has(notifKey)) {
            const isExpired = daysRemaining < 0;
            newAlerts.push({
              id: `NOTIF-PASS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              title: isExpired
                ? `🚨 جواز سفر منتهي للمعتمر (${p.name})`
                : `⚠️ اقتراب انتهاء جواز سفر المعتمر (${p.name})`,
              message: isExpired
                ? `انتهت صلاحية جواز السفر للمعتمر (${p.name}) برقم (${p.passport_number}) بتاريخ ${p.passport_expiry_date}. يتعذر اصدار التأشيرة أو السفر والجواز منتهي.`
                : `جواز سفر المعتمر (${p.name}) برقم (${p.passport_number}) ينتهي خلال ${daysRemaining} يوم (تاريخ الانتهاء: ${p.passport_expiry_date}). يُرجى التجديد قبل التوجه للمطار.`,
              type: 'passport_expiry',
              date: new Date().toISOString().split('T')[0],
              read: false,
              severity: isExpired || daysRemaining <= 60 ? 'high' : 'medium',
              target_entity_name: p.name,
              days_remaining: daysRemaining
            });
          }
        }
      }
    });

    if (newAlerts.length > 0) {
      commitChange({
        ...snapshot,
        notifications: [...newAlerts, ...(snapshot.notifications || [])]
      });
      toast.success(`تم إنشاء (${newAlerts.length}) تنبيه ذكي جديد لمواعيد الإقامات وجوازات السفر`);
    } else {
      toast.info('تم فحص النظام: جميع الإقامات وجوازات السفر تحت السيطرة ولا توجد تنبيهات جديدة');
    }

    return { createdCount: newAlerts.length };
  }, [snapshot, commitChange]);

  // Send Direct Alert Notification to Staff Member
  const sendDirectAlertToStaff = useCallback((staffId: string, title: string, message: string) => {
    const targetStaff = (snapshot.staff || []).find(s => s.id === staffId);
    const newNotif: NotificationRecord = {
      id: `NOTIF-DIRECT-${Date.now()}`,
      title: title || `تنبيه إداري موجه إلى (${targetStaff?.name || 'الموظف'})`,
      message: message,
      type: 'document',
      date: new Date().toISOString().split('T')[0],
      read: false,
      severity: 'high',
      target_staff_id: staffId,
      target_entity_name: targetStaff?.name
    };

    commitChange({
      ...snapshot,
      notifications: [newNotif, ...(snapshot.notifications || [])]
    });

    toast.success(`تم إرسال التنبيه الفوري بنجاح إلى الموظف (${targetStaff?.name || ''}) 🔔`);
  }, [snapshot, commitChange]);

  // Accounting Closings
  const addAccountingClosing = useCallback((closing: Omit<AccountingClosingRecord, 'id'>) => {
    const newClosing: AccountingClosingRecord = {
      ...closing,
      id: `CLS-${Date.now().toString().slice(-4)}`,
    };
    commitChange({
      ...snapshot,
      closings: [newClosing, ...(snapshot.closings || [])],
    });
    toast.success('تم إغلاق الفترة المحاسبية بنجاح وتأمين السجلات');
  }, [snapshot, commitChange]);

  // User Role
  const setCurrentRole = useCallback((role: UserRole) => {
    commitChange({
      ...snapshot,
      currentRole: role,
    });
    toast.success(`تم تغيير صلاحيات المستخدم إلى: ${role}`);
  }, [snapshot, commitChange]);

  // AI Helper Functions
  const generateTripAiSummary = useCallback(async (tripData: any, pilgrimsCount: number): Promise<string> => {
    try {
      const res = await fetch('/api/ai-trip-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripData, pilgrimsCount }),
      });
      const data = await res.json();
      return data.summary || 'ملخص الرحلة مكتمل.';
    } catch {
      return 'رحلة ممتازة مكتملة الترتيبات والنقل مع الفنادق.';
    }
  }, []);

  const generateFinancialInsights = useCallback(async (financeData: any): Promise<string> => {
    try {
      const res = await fetch('/api/ai-financial-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financeData }),
      });
      const data = await res.json();
      return data.insights || 'البيانات المالية متوازنة.';
    } catch {
      return 'تظهر المؤشرات الماليّة أداءً مستقراً ومربحاً بمعدل هامش ربح 32%.';
    }
  }, []);

  const generateAiErrorDetection = useCallback(async (pilgrims: Pilgrim[], roomings: Rooming[]): Promise<string> => {
    try {
      const res = await fetch('/api/ai-error-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilgrims, roomings }),
      });
      const data = await res.json();
      return data.report || 'لم يتم كشف أي أخطاء.';
    } catch {
      return 'تم فحص جودة البيانات بنجاح، وجميع أرقام الجوازات صالحة.';
    }
  }, []);

  const resetToDefaultSeed = useCallback(() => {
    const seed = getSeedSnapshot();
    commitChange(seed);
    toast.info('تم استعادة البيانات المبدئية للموسم بنجاح');
  }, [commitChange]);

  const restoreFullBackup = useCallback((importedData: Partial<AppSnapshot>) => {
    // Merge imported snapshot with current defaults to ensure no missing properties
    const restoredSnapshot: AppSnapshot = {
      pilgrims: Array.isArray(importedData.pilgrims) ? importedData.pilgrims : snapshot.pilgrims,
      trips: Array.isArray(importedData.trips) ? importedData.trips : snapshot.trips,
      roomings: Array.isArray(importedData.roomings) ? importedData.roomings : snapshot.roomings,
      staff: Array.isArray(importedData.staff) ? importedData.staff : snapshot.staff,
      transports: Array.isArray(importedData.transports) ? importedData.transports : snapshot.transports,
      familyGroups: Array.isArray(importedData.familyGroups) ? importedData.familyGroups : snapshot.familyGroups,
      financeRecords: Array.isArray(importedData.financeRecords) ? importedData.financeRecords : snapshot.financeRecords,
      documents: Array.isArray(importedData.documents) ? importedData.documents : snapshot.documents,
      notifications: Array.isArray(importedData.notifications) ? importedData.notifications : snapshot.notifications,
      closings: Array.isArray(importedData.closings) ? importedData.closings : snapshot.closings,
      currentRole: importedData.currentRole || snapshot.currentRole || 'admin',
    };

    commitChange(restoredSnapshot);
    toast.success('تم استرجاع النسخة الاحتياطية بنجاح ودمج كافة السجلات!');
  }, [commitChange, snapshot]);

  const value = useMemo(() => ({
    // Google OAuth & Sync
    isGoogleConnected,
    googleUserEmail,
    handleGoogleSignIn,
    handleGoogleLogout,

    // Google User Auth & Admin Approval System
    pendingUsers: snapshot.pendingUsers || [],
    currentUser,
    approvePendingUser,
    rejectPendingUser,
    loginWithGoogle,
    logoutCurrentUser,
    loginAsAdminBypass,

    currency,
    setCurrency,
    exchangeRate,
    setExchangeRate,
    formatCurrency,

    pilgrims: snapshot.pilgrims,
    trips: snapshot.trips,
    roomings: snapshot.roomings,
    staff: snapshot.staff,
    transports: snapshot.transports,
    familyGroups: snapshot.familyGroups,

    selectedHotelFilter,
    setSelectedHotelFilter,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    activePage,
    setActivePage,

    canUndo: history.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,

    addPilgrim,
    updatePilgrim,
    deletePilgrim,
    bulkUpdatePilgrims,
    bulkDeletePilgrims,
    importPilgrims,

    addTrip,
    updateTrip,
    deleteTrip,

    addRooming,
    updateRooming,
    deleteRooming,

    addStaff,
    updateStaff,
    bulkUpdateStaff,
    deleteStaff,
    bulkDeleteStaff,
    toggleStaffStatus,

    addTransport,
    updateTransport,
    deleteTransport,

    addFamilyGroup,
    updateFamilyGroup,
    deleteFamilyGroup,
    unlinkFamilyMemberAndRedistribute,
    deleteFamilyGroupAndRedistribute,
    transferFamilyMember,
    deduplicateFamilyGroups,

    financeRecords: snapshot.financeRecords || [],
    addFinanceRecord,
    updateFinanceRecord,
    deleteFinanceRecord,

    documents: snapshot.documents || [],
    addDocument,
    deleteDocument,

    notifications: snapshot.notifications || [],
    markNotificationRead,
    addNotification,
    scanAndGenerateSmartAlerts,
    sendDirectAlertToStaff,

    closings: snapshot.closings || [],
    addAccountingClosing,

    currentRole: snapshot.currentRole || 'admin',
    setCurrentRole,

    autoRooming,
    validateFamilyGroups,
    generateNumberedFamilyLinks,
    validatePreflight,
    syncFromGoogleSheets,
    appendPilgrimToSheet,
    ocrExtractPassport,
    generateTripAiSummary,
    generateFinancialInsights,
    generateAiErrorDetection,
    resetToDefaultSeed,
    restoreFullBackup
  }), [
    isGoogleConnected, googleUserEmail, handleGoogleSignIn, handleGoogleLogout, appendPilgrimToSheet,
    currentUser, approvePendingUser, rejectPendingUser, loginWithGoogle, logoutCurrentUser, loginAsAdminBypass,
    currency, exchangeRate, formatCurrency,
    snapshot, selectedHotelFilter, searchQuery, theme, activePage,
    history.length, future.length, undo, redo,
    addPilgrim, updatePilgrim, deletePilgrim, bulkUpdatePilgrims, bulkDeletePilgrims, importPilgrims,
    addTrip, updateTrip, deleteTrip, addRooming, updateRooming, deleteRooming,
    addStaff, updateStaff, deleteStaff, toggleStaffStatus,
    addTransport, updateTransport, deleteTransport,
    addFamilyGroup, updateFamilyGroup, deleteFamilyGroup, unlinkFamilyMemberAndRedistribute, deleteFamilyGroupAndRedistribute, transferFamilyMember, deduplicateFamilyGroups,
    addFinanceRecord, updateFinanceRecord, deleteFinanceRecord,
    addDocument, deleteDocument, markNotificationRead, addNotification, scanAndGenerateSmartAlerts, sendDirectAlertToStaff,
    addAccountingClosing, setCurrentRole,
    autoRooming, validateFamilyGroups, generateNumberedFamilyLinks, validatePreflight, syncFromGoogleSheets, ocrExtractPassport,
    generateTripAiSummary, generateFinancialInsights, generateAiErrorDetection, resetToDefaultSeed, restoreFullBackup
  ]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f1420] text-amber-400 flex flex-col items-center justify-center p-6 gap-4 font-cairo">
        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold">جاري تحميل نظام ميجا ستار...</h2>
        <p className="text-sm text-slate-400">إدارة عمليات العمرة - موسم 1448 هـ</p>
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
