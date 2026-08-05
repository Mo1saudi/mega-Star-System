import React, { useState } from 'react';
import { useStore, isPilgrimWithdrawn } from '../lib/store';
import { SEO } from '../components/SEO';
import { Pilgrim, RoomType } from '../types';
import { 
  BedDouble, Hotel, Sparkles, CheckCircle2, ShieldAlert, 
  AlertTriangle, RefreshCw, Wand2, Users, Building, Lock,
  ArrowRightLeft, UserX, UserPlus, X, ChevronDown, ChevronUp, Search,
  Filter, Heart, Users2, FileText, Trash2, ArrowRight, GripVertical, Move
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export const RoomingPage: React.FC = () => {
  const { 
    roomings, pilgrims, autoRooming, validatePreflight, 
    selectedHotelFilter, updatePilgrim 
  } = useStore();

  const [activeCityTab, setActiveCityTab] = useState<'مكة' | 'المدينة'>('مكة');
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [selectedHotelForPreflight, setSelectedHotelForPreflight] = useState<string>('');

  // Drag and Drop States
  const [draggedPilgrim, setDraggedPilgrim] = useState<Pilgrim | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);

  // Advanced Search & Filtering Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'ذكر' | 'أنثى'>('all');
  const [filterRoomType, setFilterRoomType] = useState<'all' | RoomType>('all');
  const [filterFamilyOnly, setFilterFamilyOnly] = useState(false);

  // Move / Assign Pilgrim Modal State
  const [movingPilgrim, setMovingPilgrim] = useState<Pilgrim | null>(null);
  const [targetRoomNo, setTargetRoomNo] = useState<string>('');
  const [targetRoomType, setTargetRoomType] = useState<RoomType>('رباعي');
  const [targetHotelName, setTargetHotelName] = useState<string>('');

  // Expandable Unassigned Drawer per Hotel
  const [expandedUnassignedHotel, setExpandedUnassignedHotel] = useState<Record<string, boolean>>({});

  // Dynamically extract all unique hotels from pilgrims for Makkah and Madinah
  const makkahHotelsFromPilgrims = Array.from(new Set(pilgrims.map(p => p.makkah_hotel).filter(Boolean)));
  const madinahHotelsFromPilgrims = Array.from(new Set(pilgrims.map(p => p.madinah_hotel).filter(Boolean)));

  // Combine store roomings with pilgrim hotels for the active city
  const storeCityRoomings = roomings.filter(r => r.city === activeCityTab);
  const cityHotelsFromPilgrims = activeCityTab === 'مكة' ? makkahHotelsFromPilgrims : madinahHotelsFromPilgrims;

  // Unified list of hotel objects for rendering based on main sheet data
  const hotelNamesSet = new Set([
    ...storeCityRoomings.map(r => r.hotel_name),
    ...cityHotelsFromPilgrims
  ]);

  const displayHotels = Array.from(hotelNamesSet).map((hotelName, idx) => {
    const existing = storeCityRoomings.find(r => r.hotel_name === hotelName);
    if (existing) return existing;

    const hotelKey = activeCityTab === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';
    const hotelPilgrimsCount = pilgrims.filter(p => p[hotelKey] === hotelName).length;
    const estimatedRooms = Math.max(1, Math.ceil(hotelPilgrimsCount / 3));

    return {
      id: `ROOM-DYN-${activeCityTab}-${idx + 1}`,
      hotel_name: hotelName,
      city: activeCityTab,
      total_rooms: estimatedRooms,
      double_rooms: Math.floor(estimatedRooms * 0.2),
      triple_rooms: Math.floor(estimatedRooms * 0.3),
      quad_rooms: Math.ceil(estimatedRooms * 0.5)
    };
  });

  const handleRunAutoRooming = (hotelName: string) => {
    autoRooming(hotelName, activeCityTab);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleOpenPreflight = (hotelName: string) => {
    setSelectedHotelForPreflight(hotelName);
    setShowPreflightModal(true);
  };

  // Open Move/Assign modal
  const handleOpenMoveModal = (p: Pilgrim, defaultHotel: string) => {
    if (isPilgrimWithdrawn(p)) {
      toast.error(`المعتمر (${p.name}) ملغي/مستبعد؛ لا يمكن تسكينه في الغرف`);
      return;
    }
    setMovingPilgrim(p);
    setTargetRoomNo(p.room_number || '');
    setTargetRoomType(p.room_type || 'رباعي');
    setTargetHotelName(defaultHotel || (activeCityTab === 'مكة' ? p.makkah_hotel : p.madinah_hotel) || '');
  };

  // Save room assignment or move
  const handleSaveRoomMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingPilgrim) return;

    if (isPilgrimWithdrawn(movingPilgrim)) {
      toast.error(`المعتمر (${movingPilgrim.name}) ملغي/مستبعد؛ لا يمكن تسكينه`);
      setMovingPilgrim(null);
      return;
    }

    if (!targetRoomNo.trim()) {
      toast.error('يرجى إدخال رقم الغرفة المستهدفة');
      return;
    }

    const hotelKey = activeCityTab === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';

    updatePilgrim(movingPilgrim.id, {
      room_number: targetRoomNo.trim(),
      room_type: targetRoomType,
      [hotelKey]: targetHotelName || movingPilgrim[hotelKey]
    });

    toast.success(`تم نقل/تسكين المعتمر (${movingPilgrim.name}) إلى غرفة #${targetRoomNo}`);
    setMovingPilgrim(null);
  };

  // Quick remove from room
  const handleRemoveFromRoom = (p: Pilgrim) => {
    updatePilgrim(p.id, { room_number: '' });
    toast.info(`تم إزالة المعتمر (${p.name}) من الغرفة بنجاح`);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, pilgrim: Pilgrim) => {
    setDraggedPilgrim(pilgrim);
    try {
      e.dataTransfer.setData('text/plain', pilgrim.id);
      e.dataTransfer.setData('application/json', JSON.stringify({ pilgrimId: pilgrim.id, currentRoom: pilgrim.room_number || '' }));
    } catch (err) {
      console.error(err);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPilgrim(null);
    setActiveDropTarget(null);
  };

  const handleDropOnRoom = (e: React.DragEvent, roomNo: string, defaultRoomType: RoomType, hotelName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropTarget(null);

    let targetPilgrim = draggedPilgrim;
    let pilgrimId = targetPilgrim?.id;

    if (!pilgrimId) {
      try {
        const jsonStr = e.dataTransfer.getData('application/json');
        const textStr = e.dataTransfer.getData('text/plain');
        const raw = jsonStr || textStr;
        if (raw) {
          if (raw.startsWith('{')) {
            pilgrimId = JSON.parse(raw).pilgrimId;
          } else {
            pilgrimId = raw;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!targetPilgrim && pilgrimId) {
      targetPilgrim = pilgrims.find(p => p.id === pilgrimId) || null;
    }

    setDraggedPilgrim(null);

    if (!targetPilgrim) return;

    if (isPilgrimWithdrawn(targetPilgrim)) {
      toast.error(`المعتمر (${targetPilgrim.name}) ملغي/مستبعد؛ لا يمكن تسكينه في الغرف`);
      return;
    }

    if (targetPilgrim.room_number === roomNo) return; // Already in room

    const hotelKey = activeCityTab === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';
    updatePilgrim(targetPilgrim.id, {
      room_number: roomNo,
      room_type: defaultRoomType,
      [hotelKey]: hotelName
    });

    toast.success(`تم نقل المعتمر (${targetPilgrim.name}) إلى غرفة #${roomNo} بنجاح بالسحب والإفلات`);
  };

  const handleDropOnUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropTarget(null);

    let targetPilgrim = draggedPilgrim;
    let pilgrimId = targetPilgrim?.id;

    if (!pilgrimId) {
      try {
        const jsonStr = e.dataTransfer.getData('application/json');
        const textStr = e.dataTransfer.getData('text/plain');
        const raw = jsonStr || textStr;
        if (raw) {
          if (raw.startsWith('{')) {
            pilgrimId = JSON.parse(raw).pilgrimId;
          } else {
            pilgrimId = raw;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!targetPilgrim && pilgrimId) {
      targetPilgrim = pilgrims.find(p => p.id === pilgrimId) || null;
    }

    setDraggedPilgrim(null);

    if (!targetPilgrim) return;

    updatePilgrim(targetPilgrim.id, { room_number: '' });
    toast.info(`تم إلغاء تسكين المعتمر (${targetPilgrim.name}) وإعادته لقائمة الانتظار`);
  };

  const handleQuickChangeRoomType = (roomPilgrims: Pilgrim[], newType: RoomType) => {
    roomPilgrims.forEach(p => {
      updatePilgrim(p.id, { room_type: newType });
    });
    toast.success(`تم تحديث نوع الغرفة إلى (${newType}) لجميع أفرادها`);
  };

  const toggleUnassignedDrawer = (hotelName: string) => {
    setExpandedUnassignedHotel(prev => ({
      ...prev,
      [hotelName]: !prev[hotelName]
    }));
  };

  // Search Match Evaluator
  const matchesFilter = (p: Pilgrim) => {
    if (filterStatus === 'assigned' && !p.room_number) return false;
    if (filterStatus === 'unassigned' && p.room_number) return false;

    if (filterGender !== 'all' && p.gender !== filterGender) return false;

    if (filterRoomType !== 'all' && p.room_type !== filterRoomType) return false;

    if (filterFamilyOnly) {
      const hasFamily = Boolean(p.family_group_link) || Boolean(p.notes && /زوج|زوجة|زوجين|أزواج|اخوات|إخوة|اخوان|بنات|أبناء|اسره|أسرة|عائلة|عائله|مع بعض/i.test(p.notes));
      if (!hasFamily) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const passportMatch = p.passport_number?.toLowerCase().includes(q);
      const roomMatch = p.room_number?.toLowerCase().includes(q);
      const notesMatch = p.notes?.toLowerCase().includes(q);
      const familyMatch = p.family_group_link?.toLowerCase().includes(q);
      const agentMatch = (p.agent_main || p.agent_sub)?.toLowerCase().includes(q);
      if (!nameMatch && !passportMatch && !roomMatch && !notesMatch && !familyMatch && !agentMatch) {
        return false;
      }
    }

    return true;
  };

  const isAnyFilterActive = searchQuery || filterStatus !== 'all' || filterGender !== 'all' || filterRoomType !== 'all' || filterFamilyOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterGender('all');
    setFilterRoomType('all');
    setFilterFamilyOnly(false);
  };

  const preflightReport = validatePreflight(selectedHotelForPreflight);

  return (
    <div className="space-y-6 pb-24">
      <SEO title="تسكين الفنادق والتسكين الذكي" description="نظام التسكين الذكي والـ Preflight Check والبحث المتقدم لإدارة غرف الفنادق بروابط الأسر والأزواج" />

      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-amber-500" />
            <span>نظام التسكين الذكي والـ Preflight Check</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            التجميع التلقائي للغرف بنسب السعة مع قراءة ملاحظات الشيت المدمجة (الروابط العائلية/الأزواج) وإدارتها أونلاين.
          </p>
        </div>

        {/* City Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveCityTab('مكة')}
            className={`px-5 py-2 rounded-xl text-xs font-bold font-cairo transition-all ${
              activeCityTab === 'مكة' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            فنادق مكة المكرمة
          </button>
          <button
            onClick={() => setActiveCityTab('المدينة')}
            className={`px-5 py-2 rounded-xl text-xs font-bold font-cairo transition-all ${
              activeCityTab === 'المدينة' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            فنادق المدينة المنورة
          </button>
        </div>
      </div>

      {/* Advanced Search Bar & Filters Bar */}
      <div className="bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            <span>البحث المتقدم وتصفية التسكين اللحظية</span>
          </h3>

          {isAnyFilterActive && (
            <button
              onClick={resetFilters}
              className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء تصفية البحث</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Main Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الجواز، رقم الغرفة، الملاحظات..."
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
            >
              <option value="all">حالة التسكين: الكل</option>
              <option value="assigned">مسكنين بالغرف فقط</option>
              <option value="unassigned">في الانتظار (غير مسكنين)</option>
            </select>
          </div>

          {/* Filter Gender */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
            >
              <option value="all">النوع: الكل</option>
              <option value="ذكر">رجال فقط</option>
              <option value="أنثى">نساء فقط</option>
            </select>
          </div>

          {/* Filter Room Type */}
          <div>
            <select
              value={filterRoomType}
              onChange={(e) => setFilterRoomType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold"
            >
              <option value="all">نوع الغرفة: الكل</option>
              <option value="ثنائي">ثنائي (2 سرير)</option>
              <option value="ثلاثي">ثلاثي (3 أسرة)</option>
              <option value="رباعي">رباعي (4 أسرة)</option>
              <option value="فردي">فردي (1 سرير)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill: Family & Marital Links */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setFilterFamilyOnly(!filterFamilyOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filterFamilyOnly
                ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>تصفية الروابط العائلية والأزواج فقط</span>
          </button>
        </div>
      </div>

      {/* Hotel Cards & Roomings Grid */}
      <div className="space-y-6">
        {displayHotels.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Building className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-cairo">
              لا توجد فنادق مسجلة حالياً لمدينة ({activeCityTab})
            </h3>
            <p className="text-xs text-slate-500">
              تأكد من اختيار أو استيراد بيانات المعتمرين الموزعين على فنادق {activeCityTab}.
            </p>
          </div>
        ) : (
          displayHotels.map((hotel) => {
            const hotelKey = activeCityTab === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';
            const allHotelPilgrims = pilgrims.filter(p => p[hotelKey] === hotel.hotel_name && !isPilgrimWithdrawn(p));
            
            // Filter pilgrims according to active search/filter criteria
            const hotelPilgrims = allHotelPilgrims.filter(matchesFilter);

            const assignedCount = allHotelPilgrims.filter(p => p.room_number).length;
            const unassignedCount = allHotelPilgrims.length - assignedCount;

            // Group by assigned room number
            const roomsGroupMap = new Map<string, typeof hotelPilgrims>();
            hotelPilgrims.forEach(p => {
              if (p.room_number) {
                const list = roomsGroupMap.get(p.room_number) || [];
                list.push(p);
                roomsGroupMap.set(p.room_number, list);
              }
            });

            // Unassigned pilgrims for this hotel after filter
            const unassignedInHotel = hotelPilgrims.filter(p => !p.room_number);

            return (
              <div 
                key={hotel.id} 
                className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4"
              >
                {/* Hotel Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-amber-500" />
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo">
                        {hotel.hotel_name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                        محيط {hotel.city}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>إجمالي المعتمرين بالفندق: <strong className="text-slate-900 dark:text-white">{allHotelPilgrims.length}</strong></span>
                      <span>تم التسكين: <strong className="text-emerald-600">{assignedCount}</strong></span>
                      <span>في الانتظار: <strong className="text-amber-600">{unassignedCount}</strong></span>
                      {isAnyFilterActive && (
                        <span className="text-amber-500 font-bold">(نتائج التصفية الحالية: {hotelPilgrims.length})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPreflight(hotel.hotel_name)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <span>فحص Preflight</span>
                    </button>

                    <button
                      onClick={() => handleRunAutoRooming(hotel.hotel_name)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all shadow-md shadow-amber-500/20 font-cairo cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>التسكين الذكي التلقائي</span>
                    </button>
                  </div>
                </div>

                {/* Rooms Grid & Drawers */}
                <div className="p-5 space-y-5">
                  {/* Unassigned Pilgrims Drawer Button */}
                  {unassignedCount > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <UserPlus className="w-4 h-4 text-amber-500" />
                        <span>يوجد {unassignedCount} معتمر لم يتم تسكينهم في غرف لهذا الفندق</span>
                      </div>
                      <button
                        onClick={() => toggleUnassignedDrawer(hotel.hotel_name)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <span>{expandedUnassignedHotel[hotel.hotel_name] ? 'إخفاء الانتظار' : 'عرض المعتمرين لتسكينهم'}</span>
                        {expandedUnassignedHotel[hotel.hotel_name] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Unassigned Pilgrims Expandable List (Also a Drop Zone) */}
                  {expandedUnassignedHotel[hotel.hotel_name] && (
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (activeDropTarget !== `unassigned-${hotel.hotel_name}`) {
                          setActiveDropTarget(`unassigned-${hotel.hotel_name}`);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (activeDropTarget === `unassigned-${hotel.hotel_name}`) {
                          setActiveDropTarget(null);
                        }
                      }}
                      onDrop={handleDropOnUnassigned}
                      className={`p-4 rounded-2xl border transition-all animate-fade-in ${
                        activeDropTarget === `unassigned-${hotel.hotel_name}`
                          ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                          : 'bg-amber-500/5 dark:bg-amber-900/10 border-amber-500/20'
                      }`}
                    >
                      <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-300 font-cairo flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-500" />
                          <span>قائمة المعتمرين غير المسكنين ({unassignedInHotel.length}) - اسحب هنا لإلغاء تسكين أي معتمر:</span>
                        </span>
                      </h4>

                      {unassignedInHotel.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center border-2 border-dashed border-amber-500/30 rounded-xl my-2 font-medium">
                          اسحب أي معتمر وأسقطه هنا لإلغاء تسكينه وإعادته لقائمة الانتظار
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                          {unassignedInHotel.map(p => {
                            const isCoupleOrFamily = Boolean(p.family_group_link) || Boolean(p.notes && /زوج|زوجة|زوجين|أزواج|عائلة|إخوة|اسره/i.test(p.notes));
                            const isWithdrawn = isPilgrimWithdrawn(p);
                            return (
                              <div 
                                key={p.id} 
                                draggable={!isWithdrawn}
                                onDragStart={(e) => {
                                  if (isWithdrawn) {
                                    e.preventDefault();
                                    toast.error(`المعتمر (${p.name}) ملغي/مستبعد`);
                                    return;
                                  }
                                  handleDragStart(e, p);
                                }}
                                onDragEnd={handleDragEnd}
                                className={`p-3 rounded-xl border space-y-2 text-xs transition-all ${
                                  isWithdrawn 
                                    ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-500 cursor-not-allowed opacity-85'
                                    : 'bg-white dark:bg-slate-900 border-amber-500/30 cursor-grab active:cursor-grabbing hover:border-amber-500 hover:shadow-md'
                                } ${
                                  draggedPilgrim?.id === p.id ? 'opacity-40 scale-95' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    {!isWithdrawn && <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                    <div>
                                      <div className={`font-bold ${isWithdrawn ? 'text-rose-800 dark:text-rose-300 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {p.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400">{p.passport_number} ({p.gender})</div>
                                    </div>
                                  </div>
                                  {isWithdrawn ? (
                                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold shrink-0">
                                      ملغي/مستبعد
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenMoveModal(p, hotel.hotel_name)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-all shrink-0 cursor-pointer"
                                      title="تسكين المعتمر بالغرفة"
                                    >
                                      <UserPlus className="w-3 h-3" />
                                      <span>تسكين</span>
                                    </button>
                                  )}
                                </div>

                                {/* Merged Cell / Family Note Badge */}
                                {(p.notes || p.family_group_link || p.room_spec) && (
                                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                                    {isCoupleOrFamily && !isWithdrawn && (
                                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold flex items-center gap-1">
                                        <Heart className="w-2.5 h-2.5 text-rose-500" />
                                        <span>رابط عائلي/أزواج</span>
                                      </span>
                                    )}
                                    {p.notes && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold truncate max-w-[180px]">
                                        📝 {p.notes}
                                      </span>
                                    )}
                                    {p.room_spec && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                                        طلب: {p.room_spec}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {roomsGroupMap.size === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <BedDouble className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-cairo">
                        {isAnyFilterActive ? 'لا توجد غرف تطابق شروط التصفية الحالية' : 'لم يتم توزيع الغرف لهذا الفندق بعد. اضغط "التسكين الذكي التلقائي" للتوزيع بنسب السعة والروابط العائلية.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(roomsGroupMap.entries()).map(([roomNo, roomPilgrims]) => {
                        const roomType = roomPilgrims[0]?.room_type || 'رباعي';
                        const gender = roomPilgrims[0]?.gender || 'ذكر';
                        const hasFamilyNotesInRoom = roomPilgrims.some(p => p.family_group_link || (p.notes && /زوج|زوجة|زوجين|أزواج|عائلة|إخوة|اسره/i.test(p.notes)));
                        const isTarget = activeDropTarget === `room-${hotel.hotel_name}-${roomNo}`;

                        return (
                          <div 
                            key={roomNo} 
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (activeDropTarget !== `room-${hotel.hotel_name}-${roomNo}`) {
                                setActiveDropTarget(`room-${hotel.hotel_name}-${roomNo}`);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              if (activeDropTarget === `room-${hotel.hotel_name}-${roomNo}`) {
                                setActiveDropTarget(null);
                              }
                            }}
                            onDrop={(e) => handleDropOnRoom(e, roomNo, roomType, hotel.hotel_name)}
                            className={`p-4 rounded-2xl border space-y-3 transition-all duration-200 ${
                              isTarget 
                                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 scale-[1.02] shadow-xl' 
                                : hasFamilyNotesInRoom 
                                ? 'bg-amber-500/5 dark:bg-amber-900/10 border-amber-500/30' 
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black font-mono px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300">
                                  غرفة #{roomNo}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  gender === 'ذكر' ? 'bg-blue-500/10 text-blue-600' : 'bg-pink-500/10 text-pink-600'
                                }`}>
                                  {gender}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-medium">سعة الغرفة:</span>
                                <select
                                  value={roomType}
                                  onChange={(e) => handleQuickChangeRoomType(roomPilgrims, e.target.value as RoomType)}
                                  className="bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  title="تعديل نوع وسعة الغرفة فوراً"
                                >
                                  <option value="فردي">فردي (1)</option>
                                  <option value="ثنائي">ثنائي (2)</option>
                                  <option value="ثلاثي">ثلاثي (3)</option>
                                  <option value="رباعي">رباعي (4)</option>
                                </select>
                                <span className="text-[10px] font-mono text-slate-400">({roomPilgrims.length})</span>
                              </div>
                            </div>

                            <div className="space-y-2 min-h-[50px]">
                              {roomPilgrims.map(p => {
                                const pIsCoupleOrFamily = Boolean(p.family_group_link) || Boolean(p.notes && /زوج|زوجة|زوجين|أزواج|عائلة|إخوة|اسره/i.test(p.notes));
                                const pIsWithdrawn = isPilgrimWithdrawn(p);
                                return (
                                  <div 
                                    key={p.id} 
                                    draggable={!pIsWithdrawn}
                                    onDragStart={(e) => {
                                      if (pIsWithdrawn) {
                                        e.preventDefault();
                                        toast.error(`المعتمر (${p.name}) ملغي/مستبعد`);
                                        return;
                                      }
                                      handleDragStart(e, p);
                                    }}
                                    onDragEnd={handleDragEnd}
                                    className={`p-2.5 rounded-xl border space-y-1.5 group transition-all ${
                                      pIsWithdrawn
                                        ? 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 cursor-not-allowed opacity-90'
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:border-amber-500/50 hover:shadow-sm'
                                    } ${
                                      draggedPilgrim?.id === p.id ? 'opacity-40 scale-95' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1.5">
                                        {!pIsWithdrawn && <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                        <div>
                                          <span className={`font-bold block ${pIsWithdrawn ? 'text-rose-800 dark:text-rose-300 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                            {p.name}
                                          </span>
                                          <span className="text-[10px] font-mono text-slate-400">{p.passport_number}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Action buttons for Move or Remove */}
                                      <div className="flex items-center gap-1 opacity-90 sm:opacity-70 group-hover:opacity-100 transition-opacity">
                                        {!pIsWithdrawn && (
                                          <button
                                            onClick={() => handleOpenMoveModal(p, hotel.hotel_name)}
                                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                            title="نقل المعتمر لغرفة أخرى"
                                          >
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleRemoveFromRoom(p)}
                                          className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                          title="إلغاء التسكين (إزالة من الغرفة)"
                                        >
                                          <UserX className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Merged Notes / Family Badges / Withdrawn Status */}
                                    <div className="flex flex-wrap gap-1 text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800">
                                      {pIsWithdrawn && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-extrabold">
                                          ملغي/مستبعد (يلزم إلغاء تسكينه)
                                        </span>
                                      )}
                                      {pIsCoupleOrFamily && !pIsWithdrawn && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold flex items-center gap-0.5">
                                          <Heart className="w-2.5 h-2.5 text-rose-500" />
                                          <span>رابط عائلي/أزواج</span>
                                        </span>
                                      )}
                                        {p.notes && (
                                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold truncate max-w-[200px]" title={p.notes}>
                                            📝 {p.notes}
                                          </span>
                                        )}
                                        {p.room_spec && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                                            مواصفة: {p.room_spec}
                                          </span>
                                        )}
                                      </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Move / Assign Room */}
      {movingPilgrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold font-cairo text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <span>نقل / تسكين المعتمر بالغرفة</span>
              </h3>
              <button
                onClick={() => setMovingPilgrim(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomMove} className="space-y-4 text-right">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">المعتمر:</span>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-amber-400 block">{movingPilgrim.name}</strong>
                <span className="text-xs text-slate-500 font-mono block">جواز: {movingPilgrim.passport_number} ({movingPilgrim.gender})</span>
                {movingPilgrim.notes && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-1">📝 ملاحظات الشيت: {movingPilgrim.notes}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الغرفة المستهدفة
                </label>
                <input
                  type="text"
                  required
                  value={targetRoomNo}
                  onChange={(e) => setTargetRoomNo(e.target.value)}
                  placeholder="مثال: 101 أو 204"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع الغرفة
                </label>
                <select
                  value={targetRoomType}
                  onChange={(e) => setTargetRoomType(e.target.value as RoomType)}
                  className="w-full p-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="رباعي">رباعي (4 أسرة)</option>
                  <option value="ثلاثي">ثلاثي (3 أسرة)</option>
                  <option value="ثنائي">ثنائي (سريران)</option>
                  <option value="فردي">فردي (1 سرير)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
                >
                  حفظ ونقل المعتمر
                </button>
                {movingPilgrim.room_number && (
                  <button
                    type="button"
                    onClick={() => {
                      updatePilgrim(movingPilgrim.id, { room_number: '' });
                      toast.info(`تم إلغاء تسكين المعتمر ${movingPilgrim.name}`);
                      setMovingPilgrim(null);
                    }}
                    className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-all"
                  >
                    إلغاء التسكين
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preflight Modal */}
      {showPreflightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>تقرير الفحص المسبق (Preflight Check)</span>
              </h3>
              <button onClick={() => setShowPreflightModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-right">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div>إجمالي المعتمرين بالفحص: <strong className="text-slate-900 dark:text-white">{preflightReport.stats.totalPilgrims}</strong></div>
                <div>تم تسكينهم: <strong className="text-emerald-600">{preflightReport.stats.assignedToRooms}</strong></div>
                <div>في انتظار التسكين: <strong className="text-amber-600">{preflightReport.stats.unassignedPilgrims}</strong></div>
                <div>تقدير الغرف المطلوبة: <strong className="text-blue-600">{preflightReport.stats.totalRoomsNeeded} غرف</strong></div>
              </div>

              {/* Errors */}
              {preflightReport.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-600 font-cairo">أخطاء التسكين الحرجة:</h4>
                  {preflightReport.errors.map((err, i) => (
                    <div key={i} className="p-3 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                      {err.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {preflightReport.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-600 font-cairo">تحذيرات وملاحظات:</h4>
                  {preflightReport.warnings.map((warn, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
                      {warn.message}
                    </div>
                  ))}
                </div>
              )}

              {!preflightReport.hasErrors && preflightReport.warnings.length === 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <span>تسكين متوازن ومطابق بالكامل للضوابط الشرعية والمواصفات الفندقية!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowPreflightModal(false)}
                className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
