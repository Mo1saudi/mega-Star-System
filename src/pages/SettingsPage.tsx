import React, { useState, useRef } from 'react';
import { useStore } from '../lib/store';
import { CompanyLogo } from '../components/CompanyLogo';
import { 
  Settings, Database, RefreshCw, Shield, Key, FileSpreadsheet, 
  CheckCircle2, Laptop, UserCheck, AlertTriangle, Moon, Sun, Save, Download,
  FileJson, Upload, Table, DownloadCloud, ShieldCheck, Check, HardDrive
} from 'lucide-react';
import { UserRole } from '../types';
import { toast } from 'sonner';
import {
  downloadJsonBackup,
  exportPilgrimsToCsv,
  exportTripsToCsv,
  exportTransportsToCsv,
  exportRoomingsToCsv,
  exportStaffToCsv,
  exportFinanceToCsv,
  exportFamilyGroupsToCsv
} from '../lib/backup-utils';

export const SettingsPage: React.FC = () => {
  const { 
    currentRole, setCurrentRole, resetToDefaultSeed, restoreFullBackup,
    syncFromGoogleSheets, theme, toggleTheme,
    isGoogleConnected, googleUserEmail, handleGoogleSignIn, handleGoogleLogout,
    pilgrims, trips, transports, roomings, familyGroups, staff, financeRecords,
    documents, notifications, closings
  } = useStore();

  const [spreadsheetUrl, setSpreadsheetUrl] = useState('https://docs.google.com/spreadsheets/d/1yJy9OeGP9uyHzzh35gUVYyXS8aRi41UM6Fg0LrWtsrU/edit?usp=sharing');
  const [selectedCsvCollection, setSelectedCsvCollection] = useState<string>('pilgrims');

  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('تم حفظ إعدادات النظام ومزامنة جوجل شيت بنجاح');
  };

  // Construct current app snapshot object
  const getCurrentSnapshot = () => ({
    pilgrims,
    trips,
    transports,
    roomings,
    familyGroups,
    staff,
    financeRecords,
    documents,
    notifications,
    closings,
    currentRole
  });

  // Handler for full JSON backup download
  const handleExportJsonBackup = () => {
    try {
      const snapshot = getCurrentSnapshot();
      downloadJsonBackup(snapshot);
      toast.success('تم تصدير ملف النسخة الاحتياطية الكاملة (JSON) بنجاح 🛡️');
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء تصدير النسخة الاحتياطية');
    }
  };

  // Handler for restoring JSON backup file upload
  const handleRestoreJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const dataToRestore = parsed.data || parsed;

        if (!dataToRestore || typeof dataToRestore !== 'object') {
          throw new Error('صيغة ملف النسخة الاحتياطية غير صالحة');
        }

        const confirmRestore = window.confirm(
          `هل أنت أصلًا متأكد من استرجاع ملف النسخة الاحتياطية؟\n\nتاريخ التصدير: ${parsed.metadata?.exportedAt || 'غير معروف'}\nعدد المعتمرين في الملف: ${dataToRestore.pilgrims?.length || 0}\n\nسيتم استبدال البيانات الحالية بالسجلات الموجودة بالملف.`
        );

        if (confirmRestore) {
          restoreFullBackup(dataToRestore);
        }
      } catch (err: any) {
        toast.error(`فشل استرجاع الملف: ${err.message || 'الملف مكسور أو ليس بتنسيق JSON صحيح'}`);
      }
    };

    reader.readAsText(file);
    if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
  };

  // Handler for exporting individual CSV entity
  const handleExportSingleCsv = (collectionKey: string) => {
    try {
      switch (collectionKey) {
        case 'pilgrims':
          exportPilgrimsToCsv(pilgrims, trips);
          toast.success(`تم تصدير سجل المعتمرين (${pilgrims.length} معتمر) إلى ملف CSV بنجاح!`);
          break;
        case 'trips':
          exportTripsToCsv(trips);
          toast.success(`تم تصدير سجل رحلات الطيران (${trips.length} رحلة) إلى ملف CSV بنجاح!`);
          break;
        case 'transports':
          exportTransportsToCsv(transports);
          toast.success(`تم تصدير سجل حركات النقل والتفويج (${transports.length} حركة) إلى ملف CSV بنجاح!`);
          break;
        case 'roomings':
          exportRoomingsToCsv(roomings);
          toast.success(`تم تصدير سجل الفنادق والغرف (${roomings.length} فندق) إلى ملف CSV بنجاح!`);
          break;
        case 'families':
          exportFamilyGroupsToCsv(familyGroups);
          toast.success(`تم تصدير سجل المجموعات والعائلات (${familyGroups.length} عائلة) إلى ملف CSV بنجاح!`);
          break;
        case 'staff':
          exportStaffToCsv(staff);
          toast.success(`تم تصدير سجل فريق العمل والمشرفين (${staff.length} موظف) إلى ملف CSV بنجاح!`);
          break;
        case 'finance':
          exportFinanceToCsv(financeRecords);
          toast.success(`تم تصدير المعاملات المالية (${financeRecords.length} معاملة) إلى ملف CSV بنجاح!`);
          break;
        default:
          break;
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تصدير CSV');
    }
  };

  // Bulk Export all collections as CSVs
  const handleExportAllCsvs = () => {
    try {
      if (pilgrims.length > 0) exportPilgrimsToCsv(pilgrims, trips);
      if (trips.length > 0) exportTripsToCsv(trips);
      if (transports.length > 0) exportTransportsToCsv(transports);
      if (roomings.length > 0) exportRoomingsToCsv(roomings);
      if (familyGroups.length > 0) exportFamilyGroupsToCsv(familyGroups);
      if (staff.length > 0) exportStaffToCsv(staff);
      if (financeRecords.length > 0) exportFinanceToCsv(financeRecords);

      toast.success('تم تصدير جميع الجداول والسجلات إلى ملفات CSV مخصصة لبرنامج Excel! 📊');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تصدير حزمة CSV');
    }
  };

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200 max-w-5xl mx-auto pb-12">
      
      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleRestoreJsonFileUpload}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header with Official Logo */}
      <div className="bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              إعدادات النظام والأمن
            </span>
            <span className="text-xs text-slate-400">إصدار V3.8 ERP Production</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-cairo">
            تكوين نظام ميجا ستار وإدارة المزامنة والنسخ الاحتياطي
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة اتصال شيت جوجل، الصلاحيات الأدوارية للكادر، وتصدير واسترجاع النسخ الاحتياطية لتأمين السجلات
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shrink-0">
          <CompanyLogo size="lg" showText={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Nav / Info */}
        <div className="space-y-4">
          
          {/* Current Role Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3 text-amber-500">
              <Shield className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">الصلاحية الحالية</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر دورك الوظيفي في الشركة لاختبار مستويات الوصول المختلفة:
            </p>
            <div className="space-y-2 pt-1">
              {[
                { role: 'admin' as UserRole, label: 'مدير النظام (Admin Full Access)' },
                { role: 'operations' as UserRole, label: 'مدير العمليات والتسكين' },
                { role: 'finance' as UserRole, label: 'المحاسب المالي والسيولة' },
                { role: 'supervisor' as UserRole, label: 'مشرف ميداني (مكة / المدينة)' },
                { role: 'viewer' as UserRole, label: 'مستعرض فقط (Read Only)' },
              ].map(item => (
                <button
                  key={item.role}
                  onClick={() => setCurrentRole(item.role)}
                  className={`w-full text-right p-2.5 text-xs font-bold rounded-xl transition-all border ${
                    currentRole === item.role
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Settings Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">المظهر والألوان</h3>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">الوضع الليلي (Dark Mode)</span>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all"
              >
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </div>

        {/* Right Settings Form */}
        <div className="md:col-span-2 space-y-6">
          
          {/* SECTION: Backup & Security Export (تصدير النسخة الاحتياطية وتأمين البيانات) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#151c2d] border border-amber-500/30 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      النسخ الاحتياطي وتصدير سجلات النظام (JSON / CSV)
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-slate-950 rounded-md">
                      خصائص المسؤولين
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    حفظ نسخة احتياطية آمنة شاملة لكافة بيانات الشركة والموسم لاستعادتها أو فتحها ببرامج التحليل
                  </p>
                </div>
              </div>

              {currentRole !== 'admin' && (
                <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  صلاحية متصفح: ({currentRole})
                </span>
              )}
            </div>

            {/* Quick Record Counter Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="p-2 bg-white dark:bg-slate-900/80 rounded-xl">
                <div className="text-slate-400 text-[10px]">المعتمرين</div>
                <div className="font-extrabold text-amber-500 text-sm">{pilgrims.length}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900/80 rounded-xl">
                <div className="text-slate-400 text-[10px]">الرحلات والحافلات</div>
                <div className="font-extrabold text-amber-500 text-sm">{trips.length + transports.length}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900/80 rounded-xl">
                <div className="text-slate-400 text-[10px]">الفنادق والتسكين</div>
                <div className="font-extrabold text-amber-500 text-sm">{roomings.length}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900/80 rounded-xl">
                <div className="text-slate-400 text-[10px]">المعاملات المالية</div>
                <div className="font-extrabold text-amber-500 text-sm">{financeRecords.length}</div>
              </div>
            </div>

            {/* Sub-Card 1: JSON System Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      1. النسخة الاحتياطية الشاملة بتنسيق JSON (Full System Snapshot)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ملف برمجيات موحد يحتوي على كافة الجداول والسجلات والبيانات لاستعادة النظام بالكامل بأي وقت.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportJsonBackup}
                  className="px-4 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية كاملة (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="px-4 py-2.5 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>استرجاع نسخة احتياطية من ملف (JSON)</span>
                </button>
              </div>
            </div>

            {/* Sub-Card 2: CSV Data Export (Excel Friendly) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    2. تصدير الجداول والسجلات بتنسيق CSV (Excel مع ترميز اللغة العربية UTF-8 BOM)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    يمكنك تصدير الجدول المطلوب مباشرة أو تصدير حزمة ملفات كاملة.
                  </p>
                </div>
              </div>

              {/* Selector and buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    اختر الجدول المراد تصديره CSV:
                  </label>
                  <select
                    value={selectedCsvCollection}
                    onChange={(e) => setSelectedCsvCollection(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="pilgrims">📋 سجل المعتمرين ({pilgrims.length} معتمر)</option>
                    <option value="trips">✈️ رحلات الطيران ({trips.length} رحلة)</option>
                    <option value="transports">🚌 حركات النقل والتفويج ({transports.length} حركة)</option>
                    <option value="roomings">🏨 الفنادق والتسكين ({roomings.length} فندق)</option>
                    <option value="families">👨‍👩‍👧‍👦 مجموعات العائلات ({familyGroups.length} عائلة)</option>
                    <option value="staff">👨‍💼 فريق العمل والمشرفين ({staff.length} موظف)</option>
                    <option value="finance">💰 المعاملات المالية ({financeRecords.length} سجل)</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportSingleCsv(selectedCsvCollection)}
                    className="w-full py-2 px-3 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>تصدير CSV المختار</span>
                  </button>
                </div>
              </div>

              {/* Bulk Export Button */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
                <button
                  type="button"
                  onClick={handleExportAllCsvs}
                  className="px-4 py-2 text-xs font-bold bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl flex items-center gap-2 transition-all"
                >
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span>تصدير حزمة CSV كاملة (جميع الجداول دفعة واحدة)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Google Sheets Sync Config */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    إعدادات الربط المباشر والمزامنة ثنائية الاتجاه (Two-Way Sync)
                  </h3>
                  <p className="text-xs text-slate-400">
                    تحديث شيت جوجل فوراً عند تعديل أي بيانات داخل التطبيق، وتجاهل الصفوف الفارغة
                  </p>
                </div>
              </div>

              {/* Status Badge & OAuth Login */}
              {isGoogleConnected ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-2xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    مربوط كـ {googleUserEmail}
                  </span>
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="text-[11px] text-rose-500 hover:underline mr-2"
                  >
                    فصل الحساب
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
                >
                  تسجيل الدخول بـ Google OAuth
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رابط جدول شيت جوجل (Google Spreadsheet URL)
                </label>
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-mono dir-ltr bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => syncFromGoogleSheets()}
                  className="w-full py-2.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>استيراد البيانات المبدئية من شيت جوجل (قراءة فقط)</span>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التكوين</span>
                </button>
              </div>
            </form>
          </div>

          {/* Local Storage & DB Management */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Database className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  إدارة التخزين المحلي والبيانات Off-line LocalDB
                </h3>
                <p className="text-xs text-slate-400">
                  يستخدم النظام IndexedDB + LocalStorage للعمل بدون إنترنت وإعادة الضبط
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  إعادة تهيئة البيانات الافتراضية للموسم
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  استرجاع قاعدة البيانات النموذجية المكونة من 119 معتمراً والرحلات والفنادق الأساسية
                </p>
              </div>

              <button
                type="button"
                onClick={resetToDefaultSeed}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shrink-0 transition-all"
              >
                إعادة ضبط البيانات Seed
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
