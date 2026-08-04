import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { Pilgrim, RoomType, VisaStatus, BarcodeStatus } from '../types';
import { 
  Users, Search, Hotel, FileSpreadsheet, Camera, Plus, 
  Trash2, Edit3, CheckSquare, Square, Download, Upload, 
  Filter, Check, AlertCircle, Sparkles, UserCheck, ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export const PilgrimsPage: React.FC = () => {
  const { 
    pilgrims, roomings, selectedHotelFilter, searchQuery,
    addPilgrim, updatePilgrim, deletePilgrim, bulkUpdatePilgrims, 
    bulkDeletePilgrims, importPilgrims, ocrExtractPassport 
  } = useStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [editingPilgrim, setEditingPilgrim] = useState<Pilgrim | null>(null);

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

  // Filter Pilgrims by search & hotel filter
  const filteredPilgrims = useMemo(() => {
    return pilgrims.filter(p => {
      const matchesHotel = selectedHotelFilter === 'all' || p.makkah_hotel === selectedHotelFilter || p.madinah_hotel === selectedHotelFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        p.name.toLowerCase().includes(q) || 
        p.passport_number.toLowerCase().includes(q) ||
        p.agent_main.toLowerCase().includes(q) ||
        (p.room_number && p.room_number.includes(q));
      
      return matchesHotel && matchesQuery;
    });
  }, [pilgrims, selectedHotelFilter, searchQuery]);

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

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredPilgrims.map(p => ({
      'الاسم الكامل': p.name,
      'رقم الجواز': p.passport_number,
      'الجنس': p.gender,
      'الوكيل الرئيسي': p.agent_main,
      'فندق مكة': p.makkah_hotel,
      'فندق المدينة': p.madinah_hotel,
      'نوع الغرفة': p.room_type,
      'رقم الغرفة': p.room_number || 'غير مسكن',
      'حالة التأشيرة': p.visa_status,
      'تصريح السفر': p.travel_permit_required ? 'مطلوب' : 'غير مطلوب'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل المعتمرين');
    XLSX.writeFile(wb, `سجل_المعتمرين_ميجا_ستار_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('تم تصدير سجل المعتمرين إلى إكسل بنجاح');
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
              onClick={() => {
                if (confirm(`هل أنت تأكد من رغبتك في حذف ${selectedIds.length} معتمر؟`)) {
                  bulkDeletePilgrims(selectedIds);
                  setSelectedIds([]);
                }
              }}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-bold transition-all"
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
                              onClick={() => { setEditingPilgrim(p); setFormData(p); setShowAddModal(true); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                              title="تعديل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت تأكد من حذف المعتمر ${p.name}؟`)) deletePilgrim(p.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                              title="حذف"
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
                          onClick={() => { setEditingPilgrim(p); setFormData(p); setShowAddModal(true); }}
                          className="px-2.5 py-1 text-xs font-bold text-amber-600 bg-amber-500/10 rounded-lg"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => { if (confirm('تأكيد الحذف؟')) deletePilgrim(p.id); }}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-500/10 rounded-lg"
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

      {/* Modal: Add/Edit Pilgrim */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">
              {editingPilgrim ? 'تعديل بيانات المعتمر' : 'إضافة معتمر جديد إلى السجل'}
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">فندق مكة المكرمة</label>
                  <select
                    value={formData.makkah_hotel || ''}
                    onChange={e => setFormData({ ...formData, makkah_hotel: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  >
                    <option value="فندق أنجم مكة">فندق أنجم مكة</option>
                    <option value="فندق أبراج القصواء مكة">فندق أبراج القصواء</option>
                    <option value="فندق بولمان زمزم مكة">فندق بولمان زمزم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">فندق المدينة المنورة</label>
                  <select
                    value={formData.madinah_hotel || ''}
                    onChange={e => setFormData({ ...formData, madinah_hotel: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  >
                    <option value="فندق دار الهجرة المدينة">فندق دار الهجرة</option>
                    <option value="فندق الفيروز الماسي المدينة">فندق الفيروز الماسي</option>
                  </select>
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">حالة التأشيرة</label>
                  <select
                    value={formData.visa_status || 'مكتملة'}
                    onChange={e => setFormData({ ...formData, visa_status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  >
                    <option value="مكتملة">مكتملة</option>
                    <option value="قيد الإجراء">قيد الإجراء</option>
                    <option value="لم تبدأ">لم تبدأ</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="travel_permit"
                  checked={formData.travel_permit_required || false}
                  onChange={e => setFormData({ ...formData, travel_permit_required: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="travel_permit" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  يلزم استخراج تصريح سفر خاص
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
    </div>
  );
};
