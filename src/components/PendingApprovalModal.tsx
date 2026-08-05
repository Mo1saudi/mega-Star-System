import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, LogOut, ShieldCheck, RefreshCw, Sparkles, Building2 } from 'lucide-react';
import { useStore } from '../lib/store';

export const PendingApprovalModal: React.FC = () => {
  const { currentUser, logoutCurrentUser, loginAsAdminBypass, loginWithGoogle } = useStore();

  if (!currentUser || currentUser.status === 'approved' || currentUser.status === 'admin') {
    return null;
  }

  const isPending = currentUser.status === 'pending';
  const isRejected = currentUser.status === 'rejected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in dir-rtl">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 overflow-hidden">
        
        {/* Top Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Company Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              شركة ميجا ستار تورز للسياحة والحج والعمرة
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              نظام إدارة كادر العمليات وتفويج المعتمرين - موسم 1448 هـ
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="mt-5 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName}
              className="w-12 h-12 rounded-full border-2 border-amber-500/40 object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-amber-500/20 text-amber-500 font-black rounded-full flex items-center justify-center text-lg">
              {currentUser.displayName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {currentUser.displayName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate dir-ltr text-right">
              {currentUser.email}
            </p>
          </div>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
            isPending
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
              : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
          }`}>
            {isPending ? 'قيد المراجعة' : 'مرفوض'}
          </span>
        </div>

        {/* Status Content */}
        {isPending ? (
          <div className="mt-5 text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shadow-inner">
              <Clock className="w-8 h-8 animate-spin-slow" />
            </div>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400">
              طلب الانضمام بانتظار موافقة مدير النظام
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              تم إرسال إشعار فوري لمدير النظام لتأكيد وظيفتك وصلاحياتك. لن تتمكن من تصفح بيانات الشريعة والم المعتمرين أو تعديل السجلات حتى يتم اعتماد الحساب رسميًا.
            </p>
            
            <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 text-right space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>ماذا يحدث الآن؟</span>
              </div>
              <p className="text-[11px] opacity-90">
                1. يتلقى مدير النظام إشعاراً باسمك وبريدك عبر لوحة التحكم.<br />
                2. يقوم المدير بتعيين وظيفتك (مثلاً: موظف عمليات / محاسب / مدير رحلات).<br />
                3. فور الاعتماد، سيتم تحديث شاشتك تلقائياً وتفعيل الصلاحيات.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-red-600 dark:text-red-400">
              تم رفض طلب الدخول
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              نأسف، لم يوافق مدير النظام على منح الصلاحيات لهذا الحساب. يرجى التواصل مع إدارة الشركة للمراجعة.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          {isPending && (
            <button
              onClick={() => loginWithGoogle()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة فحص حالة الموافقة والربط</span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => loginAsAdminBypass()}
              className="py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>الدخول كمدير نظام (معاينة)</span>
            </button>

            <button
              onClick={() => logoutCurrentUser()}
              className="py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
