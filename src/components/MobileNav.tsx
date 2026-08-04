import React from 'react';
import { useStore } from '../lib/store';
import { LayoutDashboard, Users, HeartHandshake, BedDouble, PlaneTakeoff, UserCheck } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activePage, setActivePage } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'pilgrims', label: 'المعتمرين', icon: Users },
    { id: 'family-groups', label: 'العائلات', icon: HeartHandshake },
    { id: 'rooming', label: 'التسكين', icon: BedDouble },
    { id: 'trips-transports', label: 'الرحلات', icon: PlaneTakeoff },
    { id: 'staff', label: 'الموظفون', icon: UserCheck },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#151c2d]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-amber-600 dark:text-amber-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-cairo whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
