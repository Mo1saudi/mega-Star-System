import React from 'react';
import { useStore } from '../lib/store';
import { 
  LayoutDashboard, Users, HeartHandshake, BedDouble, 
  PlaneTakeoff, UserCheck, Star, RefreshCw 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, syncFromGoogleSheets } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pilgrims', label: 'سجل المعتمرين', icon: Users },
    { id: 'family-groups', label: 'الروابط العائلية', icon: HeartHandshake },
    { id: 'rooming', label: 'التسكين والفنادق', icon: BedDouble },
    { id: 'trips-transports', label: 'الرحلات والنقل', icon: PlaneTakeoff },
    { id: 'staff', label: 'كادر الموظفين', icon: UserCheck },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-[#151c2d] border-l border-slate-200 dark:border-slate-800 shadow-sm z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-bold shrink-0">
          <Star className="w-6 h-6 fill-slate-950 stroke-slate-950" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo leading-tight">
            ميجا ستار
          </h1>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            إدارة عمليات العمرة
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          القائمة الرئيسية
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
              <span className="font-cairo">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Action: Google Sheet Sync */}
      <div className="px-4 py-2">
        <button
          onClick={syncFromGoogleSheets}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span>تحديث البيانات من الشيت</span>
        </button>
      </div>

      {/* Season Badge Footer */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 dark:bg-[#1a2337] border border-slate-200/60 dark:border-slate-800 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-extrabold font-cairo">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>موسم 1448 هـ</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
          مؤسسة ميجا ستار لخدمات المعتمرين
        </p>
      </div>
    </aside>
  );
};
