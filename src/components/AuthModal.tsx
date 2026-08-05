import React, { useState } from 'react';
import { X, Lock, User, KeyRound, Shield, CheckCircle2, UserCheck, LogOut, ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { UserRole } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentRole, setCurrentRole } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  if (!isOpen) return null;

  const roleLabels: Record<UserRole, { label: string; desc: string; badge: string }> = {
    admin: { label: 'مدير النظام الكامل (Admin)', desc: 'تحكم كامل بالتسكين، الحسابات، المعتمرين، والتقارير والإعدادات', badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
    manager: { label: 'مدير العمليات (Manager)', desc: 'إدارة الرحلات والسكن وتخصيص الموظفين والتقارير الشاملة', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
    operations: { label: 'موظف عمليات وتفويج (Operations)', desc: 'متابعة المعتمرين والرحلات وتصاريح العمرة والروضة والحافلات والغرف', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    finance: { label: 'المحاسب المالي المعتمد (Finance)', desc: 'إدارة المقبوضات والمصروفات والعمولات والتحصيل والإغلاق المالي', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    viewer: { label: 'مستعرض / للقراءة فقط (Viewer)', desc: 'عرض البيانات والتقارير دون إمكانية التعديل أو الحذف', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setCurrentRole(selectedRole);
    toast.success(
      mode === 'login'
        ? `تم تسجيل الدخول بنجاح بصلاحية: ${roleLabels[selectedRole].label}`
        : `تم إنشاء الحساب وتسجيل الدخول بصلاحية: ${roleLabels[selectedRole].label}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in dir-rtl">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-amber-400">
                {mode === 'login' ? 'تسجيل الدخول للنظام' : 'إنشاء حساب جديد بصلاحيات'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                نظام إدارة الصلاحيات والأدوار المتقدم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Status */}
        <div className="mt-4 p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5 text-xs">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-slate-500 dark:text-slate-400">الصلاحية الحالية: </span>
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{roleLabels[currentRole]?.label}</strong>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${roleLabels[currentRole]?.badge}`}>
            نشط
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المستخدم / البريد الإلكتروني
            </label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم..."
                className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              تحديد صلاحية الحساب (المنصب)
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r].label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 px-1">
              {roleLabels[selectedRole]?.desc}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{mode === 'login' ? 'دخول النظام' : 'تأكيد التسجيل والدخول'}</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>

        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
          </span>
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-bold text-amber-500 hover:underline"
          >
            {mode === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </div>

      </div>
    </div>
  );
};
