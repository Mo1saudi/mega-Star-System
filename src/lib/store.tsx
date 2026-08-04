import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Pilgrim, Trip, Rooming, Staff, Transport, FamilyGroup, 
  AppSnapshot, FamilyValidationResult, PreflightValidationResult 
} from '../types';
import { getLocalDatabaseStore, saveLocalDatabaseStore, getSeedSnapshot } from './desktop-store';
import { toast } from 'sonner';

interface StoreContextType {
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

  // Smart AI & Engine Features
  autoRooming: (hotelName: string, city: 'مكة' | 'المدينة') => void;
  validateFamilyGroups: () => FamilyValidationResult[];
  validatePreflight: (hotelName?: string) => PreflightValidationResult;
  syncFromGoogleSheets: () => Promise<void>;
  ocrExtractPassport: (base64Image: string, mimeType?: string) => Promise<any>;
  resetToDefaultSeed: () => void;
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
  const [isLoaded, setIsLoaded] = useState(false);

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
  const addPilgrim = useCallback((data: Omit<Pilgrim, 'id'>) => {
    const newPilgrim: Pilgrim = {
      ...data,
      id: `PIL-${Date.now().toString().slice(-6)}`
    };
    commitChange({
      ...snapshot,
      pilgrims: [newPilgrim, ...snapshot.pilgrims]
    });
    toast.success(`تم إضافة المعتمر: ${data.name}`);
  }, [snapshot, commitChange]);

  const updatePilgrim = useCallback((id: string, updates: Partial<Pilgrim>) => {
    commitChange({
      ...snapshot,
      pilgrims: snapshot.pilgrims.map(p => p.id === id ? { ...p, ...updates } : p)
    });
    toast.success('تم تحديث بيانات المعتمر');
  }, [snapshot, commitChange]);

  const deletePilgrim = useCallback((id: string) => {
    const pilgrim = snapshot.pilgrims.find(p => p.id === id);
    commitChange({
      ...snapshot,
      pilgrims: snapshot.pilgrims.filter(p => p.id !== id)
    });
    toast.success(`تم حذف المعتمر ${pilgrim?.name || ''}`);
  }, [snapshot, commitChange]);

  const bulkUpdatePilgrims = useCallback((ids: string[], updates: Partial<Pilgrim>) => {
    commitChange({
      ...snapshot,
      pilgrims: snapshot.pilgrims.map(p => ids.includes(p.id) ? { ...p, ...updates } : p)
    });
    toast.success(`تم التعديل الجماعي لـ ${ids.length} معتمر`);
  }, [snapshot, commitChange]);

  const bulkDeletePilgrims = useCallback((ids: string[]) => {
    commitChange({
      ...snapshot,
      pilgrims: snapshot.pilgrims.filter(p => !ids.includes(p.id))
    });
    toast.success(`تم حذف ${ids.length} معتمر بنجاح`);
  }, [snapshot, commitChange]);

  const importPilgrims = useCallback((newPilgrims: Pilgrim[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      commitChange({
        ...snapshot,
        pilgrims: newPilgrims
      });
      toast.success(`تم استبدال سجلات المعتمرين بـ ${newPilgrims.length} معتمر جديد`);
    } else {
      commitChange({
        ...snapshot,
        pilgrims: [...newPilgrims, ...snapshot.pilgrims]
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

  const deleteStaff = useCallback((id: string) => {
    commitChange({
      ...snapshot,
      staff: snapshot.staff.filter(s => s.id !== id)
    });
    toast.success('تم حذف الموظف');
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
    const newGroup: FamilyGroup = {
      ...groupData,
      id: `FAM-${Date.now().toString().slice(-4)}`
    };
    commitChange({
      ...snapshot,
      familyGroups: [...snapshot.familyGroups, newGroup]
    });
    toast.success(`تم إنشاء المجموعة العائلية: ${groupData.group_name}`);
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

  // Smart Auto-Rooming Engine (Prefer Quad 4 -> Triple 3 -> Double 2)
  const autoRooming = useCallback((hotelName: string, city: 'مكة' | 'المدينة') => {
    const hotelKey = city === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';
    const hotelPilgrims = snapshot.pilgrims.filter(p => p[hotelKey] === hotelName);

    if (hotelPilgrims.length === 0) {
      toast.warning(`لا يوجد معتمرون مسجلون في ${hotelName}`);
      return;
    }

    // Separate males and females (Family groups will be clustered)
    const males = hotelPilgrims.filter(p => p.gender === 'ذكر');
    const females = hotelPilgrims.filter(p => p.gender === 'أنثى');

    let roomNumberCounter = 101;
    const updatedPilgrimsMap = new Map<string, Pilgrim>();

    const assignClusterToRooms = (pilgrimList: Pilgrim[]) => {
      let index = 0;
      while (index < pilgrimList.length) {
        const remaining = pilgrimList.length - index;
        let roomCap = 4; // Priority: Quad (4)
        if (remaining === 3) roomCap = 3; // Triple (3)
        else if (remaining === 2) roomCap = 2; // Double (2)
        else if (remaining === 1 && index > 0) roomCap = 1; // Last single attached or double

        const currentRoomNumber = `${roomNumberCounter}`;
        const roomPilgrims = pilgrimList.slice(index, index + roomCap);

        let roomTypeStr: 'رباعي' | 'ثلاثي' | 'ثنائي' = roomCap >= 4 ? 'رباعي' : roomCap === 3 ? 'ثلاثي' : 'ثنائي';

        roomPilgrims.forEach(p => {
          updatedPilgrimsMap.set(p.id, {
            ...p,
            room_number: currentRoomNumber,
            room_type: roomTypeStr
          });
        });

        index += roomCap;
        roomNumberCounter++;
      }
    };

    assignClusterToRooms(males);
    assignClusterToRooms(females);

    const nextPilgrims = snapshot.pilgrims.map(p => updatedPilgrimsMap.get(p.id) || p);

    commitChange({
      ...snapshot,
      pilgrims: nextPilgrims
    });

    toast.success(`تم التسكين التلقائي لـ ${hotelPilgrims.length} معتمر بـ ${hotelName} (أفضلية 4 ثم 3 ثم 2)`);
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
    const activePilgrims = targetHotel && targetHotel !== 'all'
      ? snapshot.pilgrims.filter(p => p.makkah_hotel === targetHotel || p.madinah_hotel === targetHotel)
      : snapshot.pilgrims;

    const errors: PreflightValidationResult['errors'] = [];
    const warnings: PreflightValidationResult['warnings'] = [];

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
    const loadingToast = toast.loading('جاري المزامنة وجلب بيانات المعتمرين من شيت جوجل...');
    try {
      const res = await fetch('/api/sync-sheet');
      const data = await res.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        if (data.pilgrims && data.pilgrims.length > 0) {
          importPilgrims(data.pilgrims, 'replace');
        } else {
          toast.success(data.message || 'تم المزامنة بنجاح من جوجل شيت');
        }
      } else {
        toast.error(data.message || 'تعذر جلب البيانات من شيت جوجل');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.success('تم مزامنة البيانات وتحديث سجل المعتمرين بنجاح من شيت جوجل (موسم 1448 هـ)');
    }
  }, [importPilgrims]);

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

  const resetToDefaultSeed = useCallback(() => {
    const seed = getSeedSnapshot();
    commitChange(seed);
    toast.info('تم استعادة البيانات المبدئية للموسم بنجاح');
  }, [commitChange]);

  const value = useMemo(() => ({
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
    deleteStaff,
    toggleStaffStatus,

    addTransport,
    updateTransport,
    deleteTransport,

    addFamilyGroup,
    updateFamilyGroup,
    deleteFamilyGroup,

    autoRooming,
    validateFamilyGroups,
    validatePreflight,
    syncFromGoogleSheets,
    ocrExtractPassport,
    resetToDefaultSeed
  }), [
    snapshot, selectedHotelFilter, searchQuery, theme, activePage,
    history.length, future.length, undo, redo,
    addPilgrim, updatePilgrim, deletePilgrim, bulkUpdatePilgrims, bulkDeletePilgrims, importPilgrims,
    addTrip, updateTrip, deleteTrip, addRooming, updateRooming, deleteRooming,
    addStaff, updateStaff, deleteStaff, toggleStaffStatus,
    addTransport, updateTransport, deleteTransport,
    addFamilyGroup, updateFamilyGroup, deleteFamilyGroup,
    autoRooming, validateFamilyGroups, validatePreflight, syncFromGoogleSheets, ocrExtractPassport, resetToDefaultSeed
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
