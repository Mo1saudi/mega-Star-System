import React from 'react';
import { useStore } from '../lib/store';
import { 
  LayoutDashboard, Users, HeartHandshake, BedDouble, 
  PlaneTakeoff, UserCheck, Star, RefreshCw, DollarSign, 
  FileText, BarChart3, Bell, Lock, Settings 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, syncFromGoogleSheets, notifications } = useStore();

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pilgrims', label: 'سجل المعتمرين', icon: Users },
    { id: 'family-groups', label: 'الروابط العائلية', icon: HeartHandshake },
    { id: 'rooming', label: 'التسكين والفنادق', icon: BedDouble },
    { id: 'trips-transports', label: 'الرحلات والنقل', icon: PlaneTakeoff },
    { id: 'finance', label: 'المالية والأرباح', icon: DollarSign },
    { id: 'documents', label: 'خزينة المستندات', icon: FileText },
    { id: 'reports', label: 'مركز التقارير', icon: BarChart3 },
    { id: 'notifications', label: 'التنبيهات', icon: Bell, badge: unreadNotifs },
    { id: 'staff', label: 'كادر الموظفين', icon: UserCheck },
    { id: 'accounting-closing', label: 'قفل الفترات', icon: Lock },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
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
            إدارة عمليات العمرة ERP
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          قائمة النظام ERP
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                <span className="font-cairo">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500 text-slate-950 rounded-full">
                  {item.badge}
                </span>
              )}
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
          <span>تحديث من جوجل شيت</span>
        </button>
      </div>

      {/* Season Badge Footer */}
      <div className="p-3 m-3 rounded-2xl bg-slate-50 dark:bg-[#1a2337] border border-slate-200/60 dark:border-slate-800 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold font-cairo">
          <Star className="w-3 h-3 fill-current" />
          <span>موسم 1448 هـ</span>
        </div>
      </div>
    </aside>
  );
};
