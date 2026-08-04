import React from 'react';
import { useStore } from '../lib/store';
import { Bell, AlertTriangle, CheckCircle2, Clock, Calendar, ShieldAlert, FileWarning, PlaneTakeoff, DollarSign } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, pilgrims, trips } = useStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
              مركز التنبيهات والإنذارات المبكرة
            </span>
            <span className="text-xs text-slate-400">مراقبة حية 24/7</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            التنبيهات والملاحة التشغيلية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة إقلاع الرحلات، صلاحية التأشيرات، استحقاق الفنادق والباركود
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Bell className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
            {unreadCount} تنبيهات غير مقروءة
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              لا توجد تنبيهات جديدة في النظام
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              جميع الرحلات والمستندات والعمليات المالية تحت السيطرة ومحدثة بالكامل
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.read 
                  ? 'bg-white/60 dark:bg-[#151c2d]/60 border-slate-200 dark:border-slate-800 text-slate-600 opacity-80' 
                  : 'bg-white dark:bg-[#151c2d] border-amber-500/40 shadow-md text-slate-900 dark:text-white'
              }`}
            >
              <div className={`p-3 rounded-2xl shrink-0 ${
                notif.severity === 'high' ? 'bg-rose-500/15 text-rose-500' :
                notif.severity === 'medium' ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-500'
              }`}>
                {notif.type === 'flight' && <PlaneTakeoff className="w-5 h-5" />}
                {notif.type === 'document' && <FileWarning className="w-5 h-5" />}
                {notif.type === 'payment' && <DollarSign className="w-5 h-5" />}
                {notif.type === 'hotel' && <AlertTriangle className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    {notif.title}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {notif.date}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {notif.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
