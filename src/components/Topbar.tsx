import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Search, Undo2, Redo2, Hotel, Moon, Sun, RefreshCw, Download, Monitor, Shield, Cloud, CheckCircle2, Link2 } from 'lucide-react';
import { ExeDownloadModal } from './ExeDownloadModal';
import { AuthModal } from './AuthModal';
import { HostingGuideModal } from './HostingGuideModal';

export const Topbar: React.FC = () => {
  const [isExeModalOpen, setIsExeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHostingModalOpen, setIsHostingModalOpen] = useState(false);
  
  const { 
    searchQuery, setSearchQuery, 
    selectedHotelFilter, setSelectedHotelFilter,
    roomings, 
    canUndo, canRedo, undo, redo,
    theme, toggleTheme,
    syncFromGoogleSheets,
    isGoogleConnected, googleUserEmail, handleGoogleSignIn, handleGoogleLogout,
    currentRole
  } = useStore();

  const hotelOptions = Array.from(new Set(roomings.map(r => r.hotel_name)));

  const roleNames: Record<string, string> = {
    admin: 'مدير النظام',
    manager: 'مدير عمليات',
    operations: 'إشراف تسكين',
    finance: 'محاسب مالي',
    supervisor: 'مشرف ميداني',
    viewer: 'مشاهد فقط'
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#151c2d]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الجواز، أو الرمز..."
              className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 flex-wrap">
            
            {/* Hotel Filter */}
            <div className="relative min-w-[130px]">
              <Hotel className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
              <select
                value={selectedHotelFilter}
                onChange={(e) => setSelectedHotelFilter(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold rounded-xl border border-transparent focus:border-amber-500 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="all">كل الفنادق (الجميع)</option>
                {hotelOptions.map(hotel => (
                  <option key={hotel} value={hotel}>{hotel}</option>
                ))}
              </select>
            </div>

            {/* Undo / Redo Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="تراجع (Ctrl + Z)"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="إعادة (Ctrl + Y)"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Google Sheet Sync & Connection Badge */}
            <div className="flex items-center gap-1">
              {isGoogleConnected ? (
                <button
                  onClick={syncFromGoogleSheets}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl transition-all shrink-0"
                  title={`مربوط كـ ${googleUserEmail} - انقر لإجراء مزامنة يدوية فورية`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">مزامنة ثنائية نشطة</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all shrink-0"
                  title="ربط حساب جوجل لتفعيل المزامنة المباشرة وثنائية الاتجاه مع Google Sheets"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>ربط Google Sheet</span>
                </button>
              )}
            </div>

            {/* Free Hosting Guide Button */}
            <button
              onClick={() => setIsHostingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 rounded-xl transition-all shrink-0"
              title="طريقة رفع الموقع أونلاين مجاناً 100%"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">الاستضافة المجانية</span>
            </button>

            {/* Role & Auth Login Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl transition-all shrink-0"
              title="تسجيل الدخول وإدارة الصلاحيات"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>{roleNames[currentRole] || 'تسجيل دخول'}</span>
            </button>

            {/* EXE App Download Button */}
            <button
              onClick={() => setIsExeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md shadow-amber-500/10 transition-all shrink-0"
              title="تحميل تطبيق سطح المكتب (.exe) لأجهزة ويندوز"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">تحميل EXE</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title={theme === 'light' ? 'الوضع الداكن' : 'الوضع المضيء'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </header>

      {/* Desktop EXE Package Download Modal */}
      <ExeDownloadModal 
        isOpen={isExeModalOpen} 
        onClose={() => setIsExeModalOpen(false)} 
      />

      {/* Auth & Role Manager Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Hosting Guide Modal */}
      <HostingGuideModal
        isOpen={isHostingModalOpen}
        onClose={() => setIsHostingModalOpen(false)}
      />
    </>
  );
};
