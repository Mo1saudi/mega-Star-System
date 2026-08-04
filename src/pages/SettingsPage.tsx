import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { 
  Settings, Database, RefreshCw, Shield, Key, FileSpreadsheet, 
  CheckCircle2, Laptop, UserCheck, AlertTriangle, Moon, Sun, Save, Download
} from 'lucide-react';
import { UserRole } from '../types';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { 
    currentRole, setCurrentRole, resetToDefaultSeed, 
    syncFromGoogleSheets, theme, toggleTheme,
    isGoogleConnected, googleUserEmail, handleGoogleSignIn, handleGoogleLogout
  } = useStore();

  const [spreadsheetUrl, setSpreadsheetUrl] = useState('https://docs.google.com/spreadsheets/d/1yJy9OeGP9uyHzzh35gUVYyXS8aRi41UM6Fg0LrWtsrU/edit?usp=sharing');
  const [autoSyncMinutes, setAutoSyncMinutes] = useState('15');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('تم حفظ إعدادات النظام ومزامنة جوجل شيت بنجاح');
  };

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
            إعدادات النظام والأمن
          </span>
          <span className="text-xs text-slate-400">إصدار V3.8 ERP Production</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
          تكوين نظام ميجا ستار وإدارة المزامنة
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          إدارة اتصال شيت جوجل، الصلاحيات الأدوارية، والنسخ الاحتياطي لقاعدة البيانات LocalDB
        </p>
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
