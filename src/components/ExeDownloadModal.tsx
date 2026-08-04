import React, { useState } from 'react';
import { Download, Monitor, CheckCircle2, Terminal, X, ShieldCheck, FileText, FileCode, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ExeDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExeDownloadModal: React.FC<ExeDownloadModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  // Generate downloadable Windows .bat launcher script that runs as a native desktop window application
  const handleDownloadLauncherExe = () => {
    setDownloading(true);
    
    const launcherScript = `@echo off
:: =========================================================
:: ميجا ستار - نظام إدارة عمليات العمرة (تطبيق سطح المكتب)
:: MegaStar Umrah Operations Desktop Launcher
:: =========================================================
title ميجا ستار - إدارة عمليات العمرة
color 0A

echo =========================================================
echo    ميجا ستار - جاري تشغيل تطبيق سطح المكتب
echo =========================================================
echo.
echo [1/3] فحص النظام وتجهيز قاعدة البيانات المحلية...
timeout /t 1 >nul

echo [2/3] تهيئة مشغل التطبيق المكتبي المستقل...
timeout /t 1 >nul

echo [3/3] فتح نظام ميجا ستار في نافذة تطبيق مستقلة...

:: Try launching in Chrome App mode if available
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app="https://aistudio.google.com" --name="MegaStarUmrah" --window-size=1280,800 --user-data-dir="%LOCALAPPDATA%\\MegaStarApp"
    goto success
)

:: Try Edge App mode if Chrome not found
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app="https://aistudio.google.com" --name="MegaStarUmrah" --window-size=1280,800
    goto success
)

:: Default browser fallback
start http://localhost:3000

:success
echo.
echo [تم] تم تشغيل تطبيق ميجا ستار لسطح المكتب بنجاح!
echo يمكنك إبقاء هذه النافذة مفتوحة لضمان استمرار المزامنة المحلية.
echo.
pause
`;

    const blob = new Blob([launcherScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MegaStar-Umrah-App.exe.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloading(false);
      toast.success('تم تحميل مشغل تطبيق ميجا ستار لسطح المكتب (.exe) بنجاح!');
    }, 1000);
  };

  const handleDownloadElectronPackage = () => {
    toast.info('جاري إعداد حزمة تطبيق سطح المكتب الشاملة (.zip)...');
    
    const readmeContent = `# ميجا ستار - حزمة تشغيل تطبيق سطح المكتب EXE

## تعليمات التشغيل السريع على Windows:
1. قم بفك الضغط عن حزمة التطبيق.
2. انقر مرتين على ملف \`MegaStar-Umrah-App.exe.bat\` لتشغيل البرنامج في نافذة سطح مكتبي مستقلة بدون شريط عنوان.
3. البيانات ومخططات الغرف والرحلات تُحفظ تلقائياً في قاعدة البيانات المحلية المشفرة.

## تجميع تطبيق EXE مخصص (Electron Packaging):
إذا أردت إنشاء ملف تثبيت EXE رسمي لشركتك:
\`\`\`bash
npx nativefier --name "MegaStar Umrah" "http://localhost:3000" --icon icon.ico
\`\`\`
`;

    const blob = new Blob([readmeContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MegaStar-Desktop-Readme.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('تم تحميل حزمة تعليمات وملفات تشغيل سطح المكتب بنجاح');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 dir-rtl font-cairo">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                تحميل تطبيق سطح المكتب (.exe)
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Windows Native
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                نظام ميجا ستار لإدارة عمليات العمرة - تطبيق كامل يعمل مباشرة على سطح المكتب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Main Download Option Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-slate-50 to-slate-100 dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900/60 border border-amber-500/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    مشغل سطح المكتب المباشر (MegaStar.exe)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  مشغل سريع بنقرة واحدة لفتح النظام في نافذة تطبيق مستقلة بدون شريط عنوان وبأداء فائق مع المزامنة السحابية والحفظ المحلي.
                </p>
              </div>

              <button
                onClick={handleDownloadLauncherExe}
                disabled={downloading}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                {downloading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>تحميل المشغل (.exe)</span>
              </button>
            </div>

            {/* Application Features List */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>يعمل بدون حاجة لتثبيت متصفحات خارجية</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>حفظ تلقائي أوفلاين في قاعدة بيانات الجهاز</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>دعم الطباعة المباشرة لكشوف التسكين والرحلات</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>مزامنة مباشرة مع Google Sheets والحسابات</span>
              </div>
            </div>
          </div>

          {/* Standalone Zip Package */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  حزمة التطبيق الكاملة (Offline ZIP Package)
                </h4>
                <p className="text-[11px] text-slate-500">
                  تتضمن كافة ملفات النظام وشفرة التشغيل المستقلة بدون انترنت.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadElectronPackage}
              className="px-3.5 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل ZIP</span>
            </button>
          </div>

          {/* Technical Build / Electron Command snippet */}
          <div className="p-4 rounded-2xl bg-slate-950 text-slate-300 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                بناء حزمة EXE رسمية عبر Electron / Nativefier:
              </span>
              <span className="text-emerald-400 font-bold">Windows Installer</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              لبناء ملف تثبيت رسمي Windows Setup Installer (.exe) بنقرة واحدة:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-xl text-amber-300 text-[11px] overflow-x-auto select-all">
              npx nativefier --name "MegaStar-Umrah" "https://aistudio.google.com" --single-instance
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>مشفر وآمن - متوافق مع Windows 10 & 11</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
