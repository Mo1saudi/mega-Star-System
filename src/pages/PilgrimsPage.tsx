import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { AddPilgrimModal } from '../components/AddPilgrimModal';
import { Pilgrim, RoomType, VisaStatus, BarcodeStatus } from '../types';
import { 
  Users, Search, Hotel, FileSpreadsheet, Camera, Plus, 
  Trash2, Edit3, CheckSquare, Square, Download, Upload, 
  Filter, Check, AlertCircle, Sparkles, UserCheck, ShieldAlert,
  SlidersHorizontal, X, RotateCcw, CreditCard, Plane
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export const PilgrimsPage: React.FC = () => {
  const { 
    pilgrims, trips, roomings, selectedHotelFilter, setSelectedHotelFilter,
    searchQuery, setSearchQuery, addPilgrim, updatePilgrim, deletePilgrim, 
    bulkUpdatePilgrims, bulkDeletePilgrims, importPilgrims, ocrExtractPassport 
  } = useStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [editingPilgrim, setEditingPilgrim] = useState<Pilgrim | null>(null);

  // Advanced Search & Filter States
  const [searchPassport, setSearchPassport] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedVisaStatus, setSelectedVisaStatus] = useState('all');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);

  // Deletion Confirmation States
  const [deletingPilgrimTarget, setDeletingPilgrimTarget] = useState<Pilgrim | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Single Pilgrim Excel Export
  const handleExportSinglePilgrim = async (p: Pilgrim) => {
    try {
      const item = p as any;
      // 2. Generate downloadable Excel sheet formatted for sheet tab "الرئيسيه"
      const rowData = [{
        'م': 1,
        'الاسم': item.name || '',
        'المندوب': item.agent_main || 'شركة ميجا ستار للسياحة',
        'المندوب الفرعى': item.agent_sub || 'فرع المبيعات المباشرة',
        'رقم الجواز': item.passport_number || '',
        'تصاريح': item.travel_permit || (item.travel_permit_required ? 'يلزم تصريح' : 'لا يلزم') || 'نعم',
        'غرف خاصه': item.room_type || item.room_spec || 'رباعي',
        'النوع': item.gender || 'ذكر',
        'البرنامج': item.program || item.program_type || 'برنامج عمره',
        'نوع التأشيرة': item.visa_type || item.visa_sponsor || 'عمرة إلكترونية',
        'الباركود': item.barcode || item.barcode_status || 'مكتمل',
        'ملاحظات': item.notes || '',
        'فندق مكه': item.makkah_hotel || '',
        'فندق المدينه': item.madinah_hotel || '',
        'اسم الرحله': item.trip_name || 'رحلة العمرة الرئيسية'
      }];

      const ws = XLSX.utils.json_to_sheet(rowData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الرئيسيه');

      const fileName = `معتمر_${item.name.replace(/\s+/g, '_')}_${item.passport_number || 'جواز'}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`تم تصدير المعتمر (${item.name}) لشيت الإكسيل (ورقة الرئيسية) أونلاين وتحميل الملف 🟢`);
    } catch (err) {
      toast.error('حدث خطأ أثناء تصدير بيانات المعتمر');
    }
  };

  // Form states
  const [formData, setFormData] = useState<Partial<Pilgrim>>({
    name: '',
    gender: 'ذكر',
    passport_number: '',
    agent_main: 'شركة الطليعة للسياحة',
    agent_sub: 'فرع المبيعات المباشرة',
    visa_status: 'مكتملة',
    barcode_status: 'مكتمل',
    travel_permit_required: false,
    makkah_hotel: 'فندق أنجم مكة',
    madinah_hotel: 'فندق دار الهجرة المدينة',
    room_type: 'رباعي',
    needs_bed: true
  });

  // Bulk edit states
  const [bulkMakkahHotel, setBulkMakkahHotel] = useState('');
  const [bulkRoomType, setBulkRoomType] = useState<RoomType | ''>('');
  const [bulkVisaStatus, setBulkVisaStatus] = useState<VisaStatus | ''>('');

  // File input ref for Excel import and Passport OCR
  const excelFileRef = useRef<HTMLInputElement>(null);
  const passportFileRef = useRef<HTMLInputElement>(null);

  // Extract unique hotels for filter
  const uniqueHotels = useMemo(() => {
    const hotelsSet = new Set<string>();
    pilgrims.forEach(p => {
      if (p.makkah_hotel) hotelsSet.add(p.makkah_hotel.trim());
      if (p.madinah_hotel) hotelsSet.add(p.madinah_hotel.trim());
    });
    return Array.from(hotelsSet).sort();
  }, [pilgrims]);

  // Extract unique agents for filter
  const uniqueAgents = useMemo(() => {
    const agentsSet = new Set<string>();
    pilgrims.forEach(p => {
      if (p.agent_main && p.agent_main.trim()) agentsSet.add(p.agent_main.trim());
      if (p.agent_sub && p.agent_sub.trim()) agentsSet.add(p.agent_sub.trim());
    });
    return Array.from(agentsSet).sort();
  }, [pilgrims]);

  // Extract unique trips for filter
  const uniqueTrips = useMemo(() => {
    const tripsSet = new Set<string>();
    if (trips) {
      trips.forEach(t => {
        if (t.trip_name) tripsSet.add(t.trip_name.trim());
      });
    }
    pilgrims.forEach(p => {
      if (p.trip_id && p.trip_id.trim()) tripsSet.add(p.trip_id.trim());
      if (p.trip_number && p.trip_number.trim()) tripsSet.add(p.trip_number.trim());
      if (p.program && p.program.trim()) tripsSet.add(p.program.trim());
    });
    return Array.from(tripsSet).sort();
  }, [trips, pilgrims]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (searchPassport.trim()) count++;
    if (selectedAgent && selectedAgent !== 'all') count++;
    if (selectedTrip && selectedTrip !== 'all') count++;
    if (selectedHotelFilter && selectedHotelFilter !== 'all') count++;
    if (selectedGender && selectedGender !== 'all') count++;
    if (selectedVisaStatus && selectedVisaStatus !== 'all') count++;
    return count;
  }, [searchQuery, searchPassport, selectedAgent, selectedTrip, selectedHotelFilter, selectedGender, selectedVisaStatus]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSearchPassport('');
    setSelectedAgent('all');
    setSelectedTrip('all');
    setSelectedHotelFilter('all');
    setSelectedGender('all');
    setSelectedVisaStatus('all');
  };

  // Filter Pilgrims by advanced search & hotel filter
  const filteredPilgrims = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const passQ = searchPassport.toLowerCase().trim();
    const agentQ = selectedAgent.toLowerCase().trim();
    const tripQ = selectedTrip.toLowerCase().trim();

    return pilgrims.filter(p => {
      // 1. Hotel filter
      const matchesHotel = selectedHotelFilter === 'all' || 
        p.makkah_hotel === selectedHotelFilter || 
        p.madinah_hotel === selectedHotelFilter;

      // 2. Global search query
      const matchesQuery = !q || 
        p.name.toLowerCase().includes(q) || 
        p.passport_number.toLowerCase().includes(q) ||
        p.agent_main.toLowerCase().includes(q) ||
        (p.agent_sub && p.agent_sub.toLowerCase().includes(q)) ||
        (p.program && p.program.toLowerCase().includes(q)) ||
        (p.visa_type && p.visa_type.toLowerCase().includes(q)) ||
        (p.group_number && p.group_number.toLowerCase().includes(q)) ||
        (p.trip_number && p.trip_number.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.room_number && p.room_number.includes(q));

      // 3. Passport Number filter
      const matchesPassport = !passQ || p.passport_number.toLowerCase().includes(passQ);

      // 4. Agent Name filter
      const matchesAgent = !agentQ || agentQ === 'all' || 
        p.agent_main.toLowerCase().includes(agentQ) || 
        (p.agent_sub && p.agent_sub.toLowerCase().includes(agentQ));

      // 5. Trip Name filter
      const matchesTrip = !tripQ || tripQ === 'all' || 
        (p.trip_id && p.trip_id.toLowerCase().includes(tripQ)) ||
        (p.trip_number && p.trip_number.toLowerCase().includes(tripQ)) ||
        (p.program && p.program.toLowerCase().includes(tripQ));

      // 6. Gender filter
      const matchesGender = selectedGender === 'all' || p.gender === selectedGender;

      // 7. Visa status filter
      const matchesVisa = selectedVisaStatus === 'all' || p.visa_status === selectedVisaStatus;

      return matchesHotel && matchesQuery && matchesPassport && matchesAgent && matchesTrip && matchesGender && matchesVisa;
    });
  }, [pilgrims, selectedHotelFilter, searchQuery, searchPassport, selectedAgent, selectedTrip, selectedGender, selectedVisaStatus]);

  // Grouping MUST BE by Makkah Hotel as required!
  const groupedByMakkahHotel = useMemo(() => {
    const groups = new Map<string, Pilgrim[]>();
    filteredPilgrims.forEach(p => {
      const hotel = p.makkah_hotel || 'غير مسكن بفندق مكة';
      const list = groups.get(hotel) || [];
      list.push(p);
      groups.set(hotel, list);
    });
    return groups;
  }, [filteredPilgrims]);

  // Handle select all in a group
  const toggleSelectGroup = (groupPilgrims: Pilgrim[]) => {
    const groupIds = groupPilgrims.map(p => p.id);
    const allSelected = groupIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSavePilgrim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.passport_number) {
      toast.error('يرجى ملء كافة البيانات الأساسية المكتوبة');
      return;
    }

    if (editingPilgrim) {
      updatePilgrim(editingPilgrim.id, formData);
      setEditingPilgrim(null);
    } else {
      addPilgrim(formData as Omit<Pilgrim, 'id'>);
    }

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'ذكر',
      passport_number: '',
      agent_main: 'شركة الطليعة للسياحة',
      agent_sub: 'فرع المبيعات المباشرة',
      visa_status: 'مكتملة',
      barcode_status: 'مكتمل',
      travel_permit_required: false,
      makkah_hotel: 'فندق أنجم مكة',
      madinah_hotel: 'فندق دار الهجرة المدينة',
      room_type: 'رباعي',
      needs_bed: true
    });
  };

  const handleApplyBulkEdit = () => {
    const updates: Partial<Pilgrim> = {};
    if (bulkMakkahHotel) updates.makkah_hotel = bulkMakkahHotel;
    if (bulkRoomType) updates.room_type = bulkRoomType;
    if (bulkVisaStatus) updates.visa_status = bulkVisaStatus;

    if (Object.keys(updates).length === 0) {
      toast.error('لم تقم باختيار أي حقل للتعديل الجماعي');
      return;
    }

    bulkUpdatePilgrims(selectedIds, updates);
    setShowBulkEditModal(false);
    setSelectedIds([]);
  };

  // Safa Excel / CSV Import Parser
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        if (rawData.length < 2) {
          toast.error('ملف الإكسل فارغ أو غير متوافق');
          return;
        }

        // Parse rows safely across multiple blocks
        const importedList: Pilgrim[] = [];
        let currentHotel = 'فندق أنجم مكة';

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          // Detect hotel block headers (e.g. "فندق أنجم", "أبراج القصواء")
          const rowStr = row.join(' ');
          if (rowStr.includes('فندق') || rowStr.includes('أبراج')) {
            if (rowStr.includes('أنجم')) currentHotel = 'فندق أنجم مكة';
            else if (rowStr.includes('القصواء')) currentHotel = 'فندق أبراج القصواء مكة';
            else if (rowStr.includes('زمزم')) currentHotel = 'فندق بولمان زمزم مكة';
            else if (rowStr.includes('الهجرة')) currentHotel = 'فندق دار الهجرة المدينة';
          }

          // Check if row has passport and name
          const pName = row[0] || row[1];
          const pPass = row[1] || row[2];
          if (pName && pPass && typeof pName === 'string' && typeof pPass === 'string' && pPass.length >= 6) {
            importedList.push({
              id: `PIL-IMP-${Date.now().toString().slice(-4)}-${i}`,
              name: pName.trim(),
              passport_number: pPass.trim(),
              gender: (row[2] || '').includes('أنثى') ? 'أنثى' : 'ذكر',
              agent_main: row[3] || 'برنامج الصفا',
              agent_sub: 'استيراد خارجي',
              visa_status: 'مكتملة',
              barcode_status: 'مكتمل',
              travel_permit_required: false,
              makkah_hotel: currentHotel,
              madinah_hotel: 'فندق دار الهجرة المدينة',
              room_type: 'رباعي',
              trip_id: 'TRIP-101',
              needs_bed: true
            });
          }
        }

        if (importedList.length > 0) {
          importPilgrims(importedList, 'append');
        } else {
          toast.error('لم نتمكن من العثور على أسطر معتمرين صالحة بملف الإكسل');
        }

      } catch (err) {
        toast.error('حدث خطأ أثناء قراءة ملف الإكسل');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Passport OCR file trigger
  const handlePassportImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const extracted = await ocrExtractPassport(base64, file.type);
      if (extracted) {
        setFormData({
          name: extracted.name || '',
          passport_number: extracted.passport_number || '',
          gender: extracted.gender?.includes('أنثى') ? 'أنثى' : 'ذكر',
          agent_main: 'شركة الطليعة للسياحة',
          agent_sub: 'مسح الجواز الذكي AI',
          visa_status: 'مكتملة',
          barcode_status: 'مكتمل',
          makkah_hotel: 'فندق أنجم مكة',
          madinah_hotel: 'فندق دار الهجرة المدينة',
          room_type: 'رباعي',
          needs_bed: true
        });
        setShowAddModal(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Export to Excel with all 21 Google Sheet columns
  const exportToExcel = () => {
    const exportData = filteredPilgrims.map((p, idx) => ({
      'م': idx + 1,
      'الاسم': p.name,
      'المندوب': p.agent_main,
      'المندوب الفرعى': p.agent_sub || '',
      'رقم الجواز': p.passport_number,
      'تصاريح': p.travel_permit_required ? 'مطلوب' : 'غير مطلوب',
      'غرف خاصه': p.room_spec || p.room_type,
      'النوع': p.gender,
      'البرنامج': p.program || 'برنامج عمره',
      'نوع التأشيرة': p.visa_type || p.visa_status,
      'الباركود': p.barcode_status,
      'ملاحظات': p.notes || '',
      'فندق مكه': p.makkah_hotel,
      'فندق المدينه': p.madinah_hotel,
      'اسم الرحله': p.trip_id,
      'رقم المجموعه': p.group_number || '',
      'رقم الرحله': p.trip_number || '',
      'ساعه الوصول': p.arrival_time || '',
      'رحله العوده': p.return_trip || '',
      'تاريخ العوده': p.return_date || '',
      'ساعه السفر': p.travel_time || '',
      'ساعة الاقلاع': p.departure_time || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل المعتمرين الشامل');
    XLSX.writeFile(wb, `بيانات_المعتمرين_المصدرة_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('تم تصدير سجل المعتمرين بجميع أعمدة الشيت (21 عمود) بنجاح');
  };

  return (
    <div className="space-y-6 pb-24">
      <SEO title="سجل المعتمرين" description="عرض وتصفية وتصنيف معتمري شركات العمرة حسب فنادق مكة المكرمة مع المزامنة والـ OCR" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>سجل المعتمرين (مجمع حسب فندق مكة)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إجمالي {filteredPilgrims.length} معتمر مطابق للفلاتر البحثية والحالية
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={excelFileRef} 
            onChange={handleExcelFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={passportFileRef} 
            onChange={handlePassportImageSelect} 
            accept="image/*" 
            className="hidden" 
          />

          <button
            onClick={() => passportFileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/30 rounded-xl transition-all"
            title="مسح وتحليل جواز السفر باستخدام الذكاء الاصطناعي Gemini"
          >
            <Camera className="w-4 h-4" />
            <span>مسح جواز (OCR)</span>
          </button>

          <button
            onClick={() => excelFileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl transition-all"
            title="استيراد كشف برنامج الصفا بالإكسل"
          >
            <Upload className="w-4 h-4" />
            <span>استيراد إكسل الصفا</span>
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all"
            title="تصدير السجل إلى Excel"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => { setEditingPilgrim(null); resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all font-cairo shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة معتمر</span>
          </button>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <div className="bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Main Search Controls Row */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* General Quick Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث السريع (الاسم الكامل، رقم الغرفة، الملاحظات...)"
              className="w-full pr-10 pl-9 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Hotel Select */}
          <div className="relative w-full md:w-56">
            <Hotel className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedHotelFilter}
              onChange={(e) => setSelectedHotelFilter(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all appearance-none font-medium cursor-pointer"
            >
              <option value="all">جميع الفنادق</option>
              {uniqueHotels.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Advanced Search Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(prev => !prev)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer whitespace-nowrap w-full md:w-auto ${
              isAdvancedOpen || activeFiltersCount > 0
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>الفلترة المتقدمة</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Reset Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-all cursor-pointer whitespace-nowrap w-full md:w-auto"
              title="تفريغ كل خيارات البحث والتصفية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>

        {/* Expandable Advanced Filter Panel */}
        {isAdvancedOpen && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
            {/* 1. Filter by Passport Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>رقم الجواز</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchPassport}
                  onChange={(e) => setSearchPassport(e.target.value)}
                  placeholder="ابحث برقم الجواز..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                {searchPassport && (
                  <button
                    type="button"
                    onClick={() => setSearchPassport('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Filter by Agent */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>اسم المندوب / الشركة</span>
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer font-medium"
              >
                <option value="all">كل المندوبين والفروع</option>
                {uniqueAgents.map(ag => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>

            {/* 3. Filter by Trip Name / Program */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Plane className="w-3.5 h-3.5 text-amber-500" />
                <span>اسم / رقم الرحلة والبرنامج</span>
              </label>
              <select
                value={selectedTrip}
                onChange={(e) => setSelectedTrip(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer font-medium"
              >
                <option value="all">كل الرحلات والبرامج</option>
                {uniqueTrips.map(tr => (
                  <option key={tr} value={tr}>{tr}</option>
                ))}
              </select>
            </div>

            {/* 4. Gender & Visa Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>الجنس وحالة التأشيرة</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                >
                  <option value="all">الكل (الجنس)</option>
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>

                <select
                  value={selectedVisaStatus}
                  onChange={(e) => setSelectedVisaStatus(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                >
                  <option value="all">الكل (التأشيرة)</option>
                  <option value="مكتملة">مكتملة</option>
                  <option value="قيد الإجراء">قيد الإجراء</option>
                  <option value="لم تبدأ">لم تبدأ</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Badges Bar */}
        {activeFiltersCount > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400">الفلاتر المطبقة حالياً:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
                بحث: "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
              </span>
            )}

            {searchPassport && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-mono font-bold">
                جواز: {searchPassport}
                <button type="button" onClick={() => setSearchPassport('')} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedAgent !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-medium">
                المندوب: {selectedAgent}
                <button type="button" onClick={() => setSelectedAgent('all')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedTrip !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium">
                الرحلة: {selectedTrip}
                <button type="button" onClick={() => setSelectedTrip('all')} className="hover:text-emerald-900"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedHotelFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
                الفندق: {selectedHotelFilter}
                <button type="button" onClick={() => setSelectedHotelFilter('all')} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedGender !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                الجنس: {selectedGender}
                <button type="button" onClick={() => setSelectedGender('all')} className="hover:text-slate-900"><X className="w-3 h-3" /></button>
              </span>
            )}

            {selectedVisaStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                التأشيرة: {selectedVisaStatus}
                <button type="button" onClick={() => setSelectedVisaStatus('all')} className="hover:text-slate-900"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            <span>تم تحديد {selectedIds.length} معتمر</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkEditModal(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 text-xs font-bold transition-all"
            >
              تعديل جماعي
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-bold transition-all cursor-pointer"
            >
              حذف المحدد
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Grouped Lists (Desktop Table / Mobile Cards) */}
      {Array.from(groupedByMakkahHotel.entries()).map(([hotelName, groupPilgrims]) => {
        const isAllGroupSelected = groupPilgrims.map(p => p.id).every(id => selectedIds.includes(id));

        return (
          <div key={hotelName} className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSelectGroup(groupPilgrims)}
                  className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  {isAllGroupSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-cairo">
                    {hotelName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    {groupPilgrims.length} معتمر
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/40 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">الاسم الكامل</th>
                    <th className="p-3">الجنس</th>
                    <th className="p-3">رقم الجواز</th>
                    <th className="p-3">الوكيل الرئيسي</th>
                    <th className="p-3">فندق المدينة</th>
                    <th className="p-3">الغرفة المطلوب</th>
                    <th className="p-3">رقم الغرفة</th>
                    <th className="p-3">حالة التأشيرة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {groupPilgrims.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button onClick={() => toggleSelectOne(p.id)}>
                            {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                          </button>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.gender === 'ذكر' ? 'bg-blue-500/10 text-blue-600' : 'bg-pink-500/10 text-pink-600'
                          }`}>
                            {p.gender}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">{p.passport_number}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{p.agent_main}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{p.madinah_hotel}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[10px]">
                            {p.room_type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-amber-300">
                          {p.room_number ? `غرفة ${p.room_number}` : 'غير مسكن'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.visa_status === 'مكتملة' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {p.visa_status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleExportSinglePilgrim(p)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                              title="تصدير لشيت الإكسيل (ورقة الرئيسية)"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingPilgrim(p); setFormData(p); setShowAddModal(true); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              title="تعديل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingPilgrimTarget(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              title="حذف المعتمر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {groupPilgrims.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <div key={p.id} className={`p-4 space-y-2.5 ${isSelected ? 'bg-amber-500/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleSelectOne(p.id)}>
                          {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </button>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h4>
                          <span className="text-[11px] font-mono text-slate-400">{p.passport_number}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.gender === 'ذكر' ? 'bg-blue-500/10 text-blue-600' : 'bg-pink-500/10 text-pink-600'
                      }`}>
                        {p.gender}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                      <div><span className="text-slate-400">الوكيل:</span> {p.agent_main}</div>
                      <div><span className="text-slate-400">فندق المدينة:</span> {p.madinah_hotel}</div>
                      <div><span className="text-slate-400">نوع الغرفة:</span> {p.room_type}</div>
                      <div><span className="text-slate-400">رقم الغرفة:</span> {p.room_number || 'غير مسكن'}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.visa_status === 'مكتملة' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {p.visa_status}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExportSinglePilgrim(p)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          title="تصدير إكسيل"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          تصدير إكسيل
                        </button>
                        <button
                          onClick={() => { setEditingPilgrim(p); setFormData(p); setShowAddModal(true); }}
                          className="px-2.5 py-1 text-xs font-bold text-amber-600 bg-amber-500/10 rounded-lg cursor-pointer"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => setDeletingPilgrimTarget(p)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg cursor-pointer transition-all"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Modal: Add Pilgrim (MegaStar Tourism - Manual & OCR Batch Flow) */}
      <AddPilgrimModal
        isOpen={showAddModal && !editingPilgrim}
        onClose={() => setShowAddModal(false)}
        initialPassportData={formData}
      />

      {/* Modal: Edit Existing Pilgrim */}
      {showAddModal && editingPilgrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">
              تعديل بيانات المعتمر
            </h3>

            <form onSubmit={handleSavePilgrim} className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحمد عبد الرحمن العوضي"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم الجواز</label>
                  <input
                    type="text"
                    required
                    value={formData.passport_number || ''}
                    onChange={e => setFormData({ ...formData, passport_number: e.target.value })}
                    placeholder="مثال: A1284901"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الجنس</label>
                  <select
                    value={formData.gender || 'ذكر'}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المندوب (الوكيل الرئيسي)</label>
                  <input
                    type="text"
                    value={formData.agent_main || ''}
                    onChange={e => setFormData({ ...formData, agent_main: e.target.value })}
                    placeholder="اسم المندوب الرئيسي"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المندوب الفرعي</label>
                  <input
                    type="text"
                    value={formData.agent_sub || ''}
                    onChange={e => setFormData({ ...formData, agent_sub: e.target.value })}
                    placeholder="اسم الفرع أو المندوب المساعد"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">البرنامج</label>
                  <input
                    type="text"
                    value={formData.program || 'برنامج عمره'}
                    onChange={e => setFormData({ ...formData, program: e.target.value })}
                    placeholder="مثال: برنامج عمره / تأشيرة فقط"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">نوع التأشيرة / الكفيل</label>
                  <input
                    type="text"
                    value={formData.visa_type || ''}
                    onChange={e => setFormData({ ...formData, visa_type: e.target.value })}
                    placeholder="اسم جهة الاصدار أو الكفيل"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">فندق مكة المكرمة</label>
                  <input
                    type="text"
                    value={formData.makkah_hotel || ''}
                    onChange={e => setFormData({ ...formData, makkah_hotel: e.target.value })}
                    placeholder="اسم فندق مكة"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">فندق المدينة المنورة</label>
                  <input
                    type="text"
                    value={formData.madinah_hotel || ''}
                    onChange={e => setFormData({ ...formData, madinah_hotel: e.target.value })}
                    placeholder="اسم فندق المدينة"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">نوع الغرفة</label>
                  <select
                    value={formData.room_type || 'رباعي'}
                    onChange={e => setFormData({ ...formData, room_type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  >
                    <option value="رباعي">رباعي (4 أسرّة)</option>
                    <option value="ثلاثي">ثلاثي (3 أسرّة)</option>
                    <option value="ثنائي">ثنائي (2 أسرّة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">غرف خاصة / مواصفات</label>
                  <input
                    type="text"
                    value={formData.room_spec || ''}
                    onChange={e => setFormData({ ...formData, room_spec: e.target.value })}
                    placeholder="مثال: ثنائي خاص / جناح"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم المجموعة</label>
                  <input
                    type="text"
                    value={formData.group_number || ''}
                    onChange={e => setFormData({ ...formData, group_number: e.target.value })}
                    placeholder="مثال: 101"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم الرحلة</label>
                  <input
                    type="text"
                    value={formData.trip_number || ''}
                    onChange={e => setFormData({ ...formData, trip_number: e.target.value })}
                    placeholder="مثال: 2525147"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاحظات والتصاريح</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية عن التصاريح أو الرغبات الخاصة..."
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="travel_permit"
                  disabled={formData.gender === 'أنثى'}
                  checked={formData.gender === 'أنثى' ? false : (formData.travel_permit_required || false)}
                  onChange={e => setFormData({ ...formData, travel_permit_required: e.target.checked })}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 disabled:opacity-40 cursor-pointer"
                />
                <div>
                  <label htmlFor="travel_permit" className={`text-xs font-bold ${formData.gender === 'أنثى' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer block`}>
                    تصريح سفر الجيش / التجنيد
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {formData.gender === 'أنثى' 
                      ? 'غير مطلوب للإناث (للذكور والشباب فقط من سن 18 حتى 45 سنة)' 
                      : 'مطلوب للذكور والشباب المصريين من سن 18 إلى 45 سنة'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingPilgrim(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Edit */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">
              تعديل جماعي لـ {selectedIds.length} معتمر
            </h3>

            <div className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تعديل فندق مكة المكرمة</label>
                <select
                  value={bulkMakkahHotel}
                  onChange={e => setBulkMakkahHotel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- بدون تغيير --</option>
                  <option value="فندق أنجم مكة">فندق أنجم مكة</option>
                  <option value="فندق أبراج القصواء مكة">فندق أبراج القصواء</option>
                  <option value="فندق بولمان زمزم مكة">فندق بولمان زمزم</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تعديل نوع الغرفة</label>
                <select
                  value={bulkRoomType}
                  onChange={e => setBulkRoomType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- بدون تغيير --</option>
                  <option value="رباعي">رباعي</option>
                  <option value="ثلاثي">ثلاثي</option>
                  <option value="ثنائي">ثنائي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تعديل حالة التأشيرة</label>
                <select
                  value={bulkVisaStatus}
                  onChange={e => setBulkVisaStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- بدون تغيير --</option>
                  <option value="مكتملة">مكتملة</option>
                  <option value="قيد الإجراء">قيد الإجراء</option>
                  <option value="لم تبدأ">لم تبدأ</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkEdit}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600"
                >
                  تطبيق التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Pilgrim */}
      {deletingPilgrimTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 font-cairo">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">تأكيد حذف المعتمر</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">سيتم مسح المعتمر وتحديث بيانات الشيت مباشرة أونلاين</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 text-right">
              <p className="font-bold text-slate-900 dark:text-white">{deletingPilgrimTarget.name}</p>
              <p className="text-slate-500">رقم الجواز: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{deletingPilgrimTarget.passport_number}</span></p>
              <p className="text-slate-500">فندق مكة: <span className="font-semibold text-slate-700 dark:text-slate-300">{deletingPilgrimTarget.makkah_hotel || 'غير محدد'}</span></p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPilgrimTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePilgrim(deletingPilgrimTarget.id);
                  setDeletingPilgrimTarget(null);
                }}
                className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                نعم، تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Bulk Delete Pilgrims */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 font-cairo text-right">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">حذف جماعي للمعتمرين</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  هل أنت متأكد من حذف <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">{selectedIds.length}</span> معتمر محدد من الكشف؟
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  bulkDeletePilgrims(selectedIds);
                  setSelectedIds([]);
                  setShowBulkDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                تأكيد الحذف الجماعي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
