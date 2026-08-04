import React, { useState, useRef } from 'react';
import { useStore } from '../lib/store';
import { Pilgrim, RoomType, VisaStatus, BarcodeStatus, Gender } from '../types';
import { 
  X, Camera, Upload, Plus, Trash2, Edit3, User, CreditCard, 
  Hotel, Plane, UserCheck, Shield, Sparkles, Check, AlertCircle, Link2, Users
} from 'lucide-react';
import { toast } from 'sonner';

interface AddPilgrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPassportData?: Partial<Pilgrim> | null;
}

interface PassportFormItem {
  id: string;
  name: string;
  passport_number: string;
  gender: Gender;
  nationality?: string;
  birth_date?: string;
  expiry_date?: string;
  makkah_hotel?: string;
  madinah_hotel?: string;
  room_type?: RoomType;
  agent_main?: string;
  agent_sub?: string;
  visa_status: VisaStatus;
  visa_type?: string;
  barcode_status: BarcodeStatus;
  travel_permit_required: boolean;
  notes?: string;
  ocr_extracted?: boolean;
  ocr_loading?: boolean;
}

export const AddPilgrimModal: React.FC<AddPilgrimModalProps> = ({
  isOpen,
  onClose,
  initialPassportData
}) => {
  const { 
    trips, staff, roomings, familyGroups,
    importPilgrims, ocrExtractPassport, addPilgrim 
  } = useStore();

  // Top Shared Selection Controls (تظهر من فوق: اسم المندوب، الرحلة، تحديد التسكين، والربط العائلي)
  const [agentMain, setAgentMain] = useState<string>('شركة ميجا ستار للسياحة');
  const [agentSub, setAgentSub] = useState<string>('فرع المبيعات المباشرة');
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || 'TRIP-101');
  const [tripNumber, setTripNumber] = useState<string>('2525147');
  const [groupNumber, setGroupNumber] = useState<string>('101');
  
  // Accommodation Selections
  const [makkahHotel, setMakkahHotel] = useState<string>('فندق أنجم مكة');
  const [madinahHotel, setMadinahHotel] = useState<string>('فندق دار الهجرة المدينة');
  const [roomType, setRoomType] = useState<RoomType>('رباعي');
  const [roomSpec, setRoomSpec] = useState<string>('');
  
  // Family Linking Selections
  const [enableFamilyLink, setEnableFamilyLink] = useState<boolean>(false);
  const [selectedFamilyGroupId, setSelectedFamilyGroupId] = useState<string>('');
  const [newFamilyGroupName, setNewFamilyGroupName] = useState<string>('');

  // Passports List State (Single or Multiple)
  const [passportsList, setPassportsList] = useState<PassportFormItem[]>([
    {
      id: `ITEM-1`,
      name: initialPassportData?.name || '',
      passport_number: initialPassportData?.passport_number || '',
      gender: initialPassportData?.gender || 'ذكر',
      nationality: 'مصري',
      visa_status: 'مكتملة',
      visa_type: 'عمرة إلكترونية',
      barcode_status: 'مكتمل',
      travel_permit_required: false,
      notes: ''
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialPassportData when modal opens or scanned data arrives
  React.useEffect(() => {
    if (isOpen && initialPassportData && (initialPassportData.name || initialPassportData.passport_number)) {
      if (initialPassportData.agent_main) setAgentMain(initialPassportData.agent_main);
      if (initialPassportData.agent_sub) setAgentSub(initialPassportData.agent_sub);
      if (initialPassportData.makkah_hotel) setMakkahHotel(initialPassportData.makkah_hotel);
      if (initialPassportData.madinah_hotel) setMadinahHotel(initialPassportData.madinah_hotel);
      if (initialPassportData.room_type) setRoomType(initialPassportData.room_type);

      const genderVal = initialPassportData.gender || 'ذكر';
      const birthDate = (initialPassportData as any).birth_date || '';
      const autoPermit = initialPassportData.travel_permit_required ?? (genderVal === 'ذكر');

      setPassportsList([
        {
          id: `INIT-${Date.now()}`,
          name: initialPassportData.name || '',
          passport_number: initialPassportData.passport_number || '',
          gender: genderVal,
          nationality: 'مصري',
          birth_date: birthDate,
          makkah_hotel: initialPassportData.makkah_hotel,
          madinah_hotel: initialPassportData.madinah_hotel,
          room_type: initialPassportData.room_type,
          agent_main: initialPassportData.agent_main,
          visa_status: initialPassportData.visa_status || 'مكتملة',
          visa_type: initialPassportData.visa_type || 'عمرة إلكترونية',
          barcode_status: initialPassportData.barcode_status || 'مكتمل',
          travel_permit_required: autoPermit,
          notes: initialPassportData.notes || 'مسح الجواز الذكي AI - يرجى مراجعة وتعديل التسكين والمندوب قبل الحفظ',
          ocr_extracted: true
        }
      ]);
    }
  }, [isOpen, initialPassportData]);

  if (!isOpen) return null;

  // Add blank passport card to the batch
  const handleAddBlankPassport = () => {
    const nextIdx = passportsList.length + 1;
    setPassportsList(prev => [
      ...prev,
      {
        id: `ITEM-${Date.now()}-${nextIdx}`,
        name: '',
        passport_number: '',
        gender: 'ذكر',
        nationality: 'مصري',
        visa_status: 'مكتملة',
        visa_type: 'عمرة إلكترونية',
        barcode_status: 'مكتمل',
        travel_permit_required: false,
        notes: ''
      }
    ]);
  };

  // Remove passport card from batch
  const handleRemovePassport = (id: string) => {
    if (passportsList.length === 1) {
      toast.warning('يجب وجود جواز سفر واحد على الأقل في النموذج');
      return;
    }
    setPassportsList(prev => prev.filter(p => p.id !== id));
  };

  // Helper to calculate if military travel permit is required (Males aged 18-45)
  const isMilitaryPermitRequired = (gender: Gender | string, birthDateStr?: string): boolean => {
    if (gender === 'أنثى') return false;
    if (!birthDateStr) return false;
    const match = birthDateStr.match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      const birthYear = parseInt(match[1], 10);
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      return age >= 18 && age <= 45;
    }
    return false;
  };

  // Update specific field in a passport item
  const handleUpdateItem = (id: string, updates: Partial<PassportFormItem>) => {
    setPassportsList(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updatedGender = updates.gender !== undefined ? updates.gender : item.gender;
      const updatedBirthDate = updates.birth_date !== undefined ? updates.birth_date : item.birth_date;

      let permitRequired = item.travel_permit_required;
      if (updatedGender === 'أنثى') {
        permitRequired = false;
      } else if (updates.gender !== undefined || updates.birth_date !== undefined) {
        if (updatedBirthDate) {
          permitRequired = isMilitaryPermitRequired(updatedGender, updatedBirthDate);
        }
      }

      return {
        ...item,
        ...updates,
        travel_permit_required: updates.travel_permit_required !== undefined ? updates.travel_permit_required : permitRequired
      };
    }));
  };

  // Single OCR File Selection
  const handleSingleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetId = itemId || passportsList[0]?.id;
    if (targetId) {
      handleUpdateItem(targetId, { ocr_loading: true });
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const extracted = await ocrExtractPassport(base64, file.type);
      
      if (extracted) {
        if (targetId) {
          const genderVal: Gender = extracted.gender?.includes('أنثى') ? 'أنثى' : 'ذكر';
          const birthDate = extracted.birth_date || '';
          const autoPermit = isMilitaryPermitRequired(genderVal, birthDate);

          handleUpdateItem(targetId, {
            name: extracted.name || '',
            passport_number: extracted.passport_number || '',
            gender: genderVal,
            nationality: extracted.nationality || 'مصري',
            birth_date: birthDate,
            expiry_date: extracted.expiry_date || '',
            travel_permit_required: autoPermit,
            ocr_extracted: true,
            ocr_loading: false
          });
        }
      } else {
        if (targetId) handleUpdateItem(targetId, { ocr_loading: false });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Multiple / Batch OCR File Upload
  const handleBatchOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;
    const files: File[] = Array.from(filesList);

    const loadingToast = toast.loading(`جاري تحليل وشفرة ${files.length} جواز سفر باستخدام الذكاء الاصطناعي (Gemini)...`);

    const newItems: PassportFormItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file: File = files[i];
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const extracted = await ocrExtractPassport(base64, file.type);
        const genderVal: Gender = extracted?.gender?.includes('أنثى') ? 'أنثى' : 'ذكر';
        const birthDate = extracted?.birth_date || '';
        const autoPermit = isMilitaryPermitRequired(genderVal, birthDate);

        newItems.push({
          id: `BATCH-${Date.now()}-${i}`,
          name: extracted?.name || `معتمر ${i + 1}`,
          passport_number: extracted?.passport_number || '',
          gender: genderVal,
          nationality: extracted?.nationality || 'مصري',
          birth_date: birthDate,
          expiry_date: extracted?.expiry_date || '',
          visa_status: 'مكتملة',
          visa_type: 'عمرة إلكترونية',
          barcode_status: 'مكتمل',
          travel_permit_required: autoPermit,
          notes: 'مستخرج آلياً بالـ OCR',
          ocr_extracted: true
        });
      } catch (err) {
        console.error('Error processing passport:', err);
      }
    }

    toast.dismiss(loadingToast);

    if (newItems.length > 0) {
      // If current list only has 1 empty item, replace it
      if (passportsList.length === 1 && !passportsList[0].name && !passportsList[0].passport_number) {
        setPassportsList(newItems);
      } else {
        setPassportsList(prev => [...prev, ...newItems]);
      }
      toast.success(`تم استخراج وقراءة بيانات ${newItems.length} جواز بنجاح. يمكنك المراجعة والتعديل الآن قبل التأكيد!`);
    }

    e.target.value = '';
  };

  // Submit and Confirm All Pilgrims
  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all items have name & passport number
    const invalidItem = passportsList.find(p => !p.name.trim() || !p.passport_number.trim());
    if (invalidItem) {
      toast.error('يرجى التأكد من كتابة الاسم ورقم الجواز لكل معتمر قبل التأكيد');
      return;
    }

    // Determine family group link
    let familyLinkId: string | undefined = undefined;
    if (enableFamilyLink) {
      if (selectedFamilyGroupId) {
        familyLinkId = selectedFamilyGroupId;
      } else if (newFamilyGroupName.trim()) {
        familyLinkId = `FAM-NEW-${Date.now().toString().slice(-4)}`;
      } else {
        familyLinkId = `FAM-GROUP-${Date.now().toString().slice(-4)}`;
      }
    }

    // Selected Trip Info
    const selectedTripObj = trips.find(t => t.id === selectedTripId);

    // Build Pilgrim objects
    const newPilgrims: Pilgrim[] = passportsList.map((item, idx) => ({
      id: `PIL-ADD-${Date.now().toString().slice(-4)}-${idx}`,
      name: item.name.trim(),
      passport_number: item.passport_number.trim(),
      gender: item.gender,
      agent_main: item.agent_main || agentMain || 'شركة ميجا ستار للسياحة',
      agent_sub: item.agent_sub || agentSub || 'فرع المبيعات المباشرة',
      visa_status: item.visa_status,
      visa_type: item.visa_type || 'عمرة إلكترونية',
      barcode_status: item.barcode_status,
      travel_permit_required: item.travel_permit_required,
      makkah_hotel: item.makkah_hotel || makkahHotel,
      madinah_hotel: item.madinah_hotel || madinahHotel,
      room_type: item.room_type || roomType,
      room_spec: roomSpec || undefined,
      trip_id: selectedTripId,
      trip_number: tripNumber || selectedTripObj?.pnr || '2525147',
      group_number: groupNumber,
      family_group_link: familyLinkId,
      needs_bed: true,
      notes: [
        item.notes,
        item.birth_date ? `تاريخ الميلاد: ${item.birth_date}` : '',
        item.expiry_date ? `انقضاء الجواز: ${item.expiry_date}` : '',
        enableFamilyLink ? `ربط عائلي: ${newFamilyGroupName || 'مجموعة عائلية'}` : ''
      ].filter(Boolean).join(' | ')
    }));

    importPilgrims(newPilgrims, 'append');
    toast.success(`تم إضافة ${newPilgrims.length} معتمر بنجاح في شركة ميجا ستار للسياحة`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#151c2d] w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-scale-in">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/30">
              M
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <span>شركة ميجا ستار للسياحة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                  إضافة معتمر / جوازات
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إدخال يدوي أو مسح ذكي بالجوازات (OCR) مع ربط المندوب، الرحلة، والتسكين العائلي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmAdd} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* SECTION 1: TOP CONTEXT HEADER (اسم المندوب + الرحلة + تحديد التسكين + الربط) */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-300 font-cairo flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>بيانات المندوب، الرحلة، والتسكين الموحد (يُطبق على كافة الجوازات)</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                ميجا ستار للسياحة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
              
              {/* 1. Agent / Delegate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>اسم المندوب الرئيسي</span>
                </label>
                <select
                  value={agentMain}
                  onChange={(e) => setAgentMain(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
                >
                  <option value="شركة ميجا ستار للسياحة">شركة ميجا ستار للسياحة</option>
                  <option value="شركة الطليعة للسياحة">شركة الطليعة للسياحة</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              {/* 2. Sub Agent */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  المندوب الفرعي / الفرع
                </label>
                <input
                  type="text"
                  value={agentSub}
                  onChange={(e) => setAgentSub(e.target.value)}
                  placeholder="اسم الفرع أو الوكيل الفرعي"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* 3. Trip Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5 text-amber-500" />
                  <span>الرحلة المحددة</span>
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.trip_name} ({t.airline || 'الخطوط'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Group Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  رقم المجموعة / الرحلة
                </label>
                <input
                  type="text"
                  value={groupNumber}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  placeholder="مثال: 101"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Accommodation & Family Link Header row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-right pt-2 border-t border-amber-500/10">
              
              {/* Hotel Makkah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5 text-amber-500" />
                  <span>فندق مكة المكرمة</span>
                </label>
                <input
                  type="text"
                  value={makkahHotel}
                  onChange={(e) => setMakkahHotel(e.target.value)}
                  placeholder="اسم فندق مكة"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Hotel Madinah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  فندق المدينة المنورة
                </label>
                <input
                  type="text"
                  value={madinahHotel}
                  onChange={(e) => setMadinahHotel(e.target.value)}
                  placeholder="اسم فندق المدينة"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  تحديد نوع الغرفة
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as RoomType)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
                >
                  <option value="رباعي">غرفة رباعية (4 أسرّة)</option>
                  <option value="ثلاثي">غرفة ثلاثية (3 أسرّة)</option>
                  <option value="ثنائي">غرفة ثنائية (2 أسرّة)</option>
                  <option value="فردي">غرفة فردية (1 سرير)</option>
                </select>
              </div>

              {/* Family Linking */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>تحديد الربط العائلي</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableFamily"
                    checked={enableFamilyLink}
                    onChange={(e) => setEnableFamilyLink(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="enableFamily" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer">
                    تفعيل الربط العائلي/أزواج
                  </label>
                </div>
              </div>
            </div>

            {/* Extra Row for Family Group Name if enabled */}
            {enableFamilyLink && (
              <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0">
                  اسم أو رمز الربط العائلي:
                </span>
                <input
                  type="text"
                  value={newFamilyGroupName}
                  onChange={(e) => setNewFamilyGroupName(e.target.value)}
                  placeholder="مثال: عائلة أحمد العتيبي / زوج سوزان حافظ"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: INPUT MODE & BATCH OCR UPLOAD CONTROLS */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>بيانات جوازات السفر (يمكن الإدخال يدوي أو بالمسح الذكي)</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                تأكد من مراجعة البيانات وتعديلها قبل التأكيد النهائي
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={batchFileInputRef}
                onChange={handleBatchOcrUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSingleOcrUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => batchFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                title="مسح واستخراج مجموعة جوازات بمرة واحدة عن طريق AI"
              >
                <Sparkles className="w-4 h-4" />
                <span>رفع مجموعة جوازات (OCR)</span>
              </button>

              <button
                type="button"
                onClick={handleAddBlankPassport}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة جواز يدوي</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: EDITABLE PASSPORT CARDS LIST (قابل للتعديل الفوري) */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            {passportsList.map((item, index) => (
              <div 
                key={item.id} 
                className={`p-5 rounded-2xl border transition-all ${
                  item.ocr_extracted 
                    ? 'bg-purple-500/5 border-purple-500/30 dark:bg-purple-500/10' 
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm'
                }`}
              >
                {/* Passport Item Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-white font-cairo">
                      جواز سفر رقم #{index + 1}
                    </h5>

                    {item.ocr_extracted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>مستخرج بـ AI OCR</span>
                      </span>
                    )}

                    {item.ocr_loading && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold animate-pulse">
                        جاري المسح الضوئي...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.dataset.targetId = item.id;
                          fileInputRef.current.click();
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1"
                      title="مسح صورة للجواز لهذا السطر"
                    >
                      <Camera className="w-3.5 h-3.5 text-purple-500" />
                      <span>مسح صورة الجواز</span>
                    </button>

                    {passportsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePassport(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="حذف هذا الجواز من القائمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Editable Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
                  
                  {/* Name */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      الاسم الكامل (كما في الجواز) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                      placeholder="اسم المعتمر الثلاثي أو الرباعي"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
                    />
                  </div>

                  {/* Passport Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      رقم الجواز <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.passport_number}
                      onChange={(e) => handleUpdateItem(item.id, { passport_number: e.target.value })}
                      placeholder="مثال: A12345678"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-mono font-bold uppercase"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      الجنس
                    </label>
                    <select
                      value={item.gender}
                      onChange={(e) => handleUpdateItem(item.id, { gender: e.target.value as Gender })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
                    >
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      الجنسية
                    </label>
                    <input
                      type="text"
                      value={item.nationality || 'مصري'}
                      onChange={(e) => handleUpdateItem(item.id, { nationality: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Visa Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      حالة التأشيرة
                    </label>
                    <select
                      value={item.visa_status}
                      onChange={(e) => handleUpdateItem(item.id, { visa_status: e.target.value as VisaStatus })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="مكتملة">مكتملة</option>
                      <option value="قيد الإجراء">قيد الإجراء</option>
                      <option value="لم تبدأ">لم تبدأ</option>
                    </select>
                  </div>

                  {/* Barcode Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      حالة الباركود
                    </label>
                    <select
                      value={item.barcode_status}
                      onChange={(e) => handleUpdateItem(item.id, { barcode_status: e.target.value as BarcodeStatus })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="مكتمل">مكتمل</option>
                      <option value="مرفوع">مرفوع</option>
                      <option value="غير مرفوع">غير مرفوع</option>
                    </select>
                  </div>

                  {/* Makkah Hotel Overrides */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      فندق مكة المكرمة
                    </label>
                    <input
                      type="text"
                      value={item.makkah_hotel || makkahHotel}
                      onChange={(e) => handleUpdateItem(item.id, { makkah_hotel: e.target.value })}
                      placeholder="اسم فندق مكة"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Madinah Hotel Overrides */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      فندق المدينة المنورة
                    </label>
                    <input
                      type="text"
                      value={item.madinah_hotel || madinahHotel}
                      onChange={(e) => handleUpdateItem(item.id, { madinah_hotel: e.target.value })}
                      placeholder="اسم فندق المدينة"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Room Type Overrides */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      تسكين الغرفة
                    </label>
                    <select
                      value={item.room_type || roomType}
                      onChange={(e) => handleUpdateItem(item.id, { room_type: e.target.value as RoomType })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
                    >
                      <option value="رباعي">رباعي (4 أسرّة)</option>
                      <option value="ثلاثي">ثلاثي (3 أسرّة)</option>
                      <option value="ثنائي">ثنائي (2 أسرّة)</option>
                      <option value="فردي">فردي (1 سرير)</option>
                    </select>
                  </div>

                  {/* Agent Main Overrides */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      المندوب / الوكيل
                    </label>
                    <input
                      type="text"
                      value={item.agent_main || agentMain}
                      onChange={(e) => handleUpdateItem(item.id, { agent_main: e.target.value })}
                      placeholder="اسم المندوب"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Travel Permit & Notes */}
                  <div className="flex items-start gap-2 pt-3 col-span-1 md:col-span-2 lg:col-span-1">
                    <input
                      type="checkbox"
                      id={`permit-${item.id}`}
                      disabled={item.gender === 'أنثى'}
                      checked={item.gender === 'أنثى' ? false : item.travel_permit_required}
                      onChange={(e) => handleUpdateItem(item.id, { travel_permit_required: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-amber-500 focus:ring-amber-500 disabled:opacity-40 cursor-pointer"
                    />
                    <div>
                      <label htmlFor={`permit-${item.id}`} className={`text-xs font-bold ${item.gender === 'أنثى' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'} cursor-pointer block`}>
                        تصريح سفر الجيش / التجنيد
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {item.gender === 'أنثى' 
                          ? 'غير مطلوب للإناث (للذكور فقط 18-45 سنة)' 
                          : 'مطلوب للذكور والشباب من 18 إلى 45 سنة'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Extra Notes Row */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                    placeholder="ملاحظات المعتمر أو تفاصيل إضافية عن الجواز..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM ACTIONS BAR */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              إجمالي الجوازات الجاهزة للإضافة: <strong className="text-amber-500 font-extrabold">{passportsList.length} معتمر</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all font-cairo cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد واعتماد الإضافة ({passportsList.length})</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
