import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Lock, Unlock, CheckCircle2, DollarSign, Calendar, FileCheck, Shield, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const AccountingClosingPage: React.FC = () => {
  const { closings, addAccountingClosing, financeRecords, formatCurrency } = useStore();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [periodName, setPeriodName] = useState('قفلة شهر أغسطس 2026');
  const [notes, setNotes] = useState('');

  // Calculate stats (excluding withdrawn / cancelled records)
  const totalRevenue = financeRecords
    .filter(r => r.type === 'revenue' && !r.is_withdrawn && r.category !== 'سحب وإلغاء')
    .reduce((s, r) => s + r.amount, 0);
  const totalExpenses = financeRecords
    .filter(r => r.type === 'expense' && !r.is_withdrawn)
    .reduce((s, r) => s + r.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleClosePeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAccountingClosing({
      period_name: periodName,
      closing_date: new Date().toISOString().split('T')[0],
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      status: 'مغلق',
      closed_by: 'المدير المحاسبي الرئيسي',
      notes: notes || 'تم إغلاق وتأمين كافة الفواتير والقيود لضمان جودة الأرباح',
    });

    setIsOpenModal(false);
  };

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              إغلاق الفترات المحاسبية والقفل المالي
            </span>
            <span className="text-xs text-slate-400">حماية من التعديل</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            قفلات الحسابات والتسويات النهائية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إقفال الفترات المالية الشهيرة والمواسم لمنع التعديل وتجميد السجلات المحاسبية
          </p>
        </div>

        <button
          onClick={() => setIsOpenModal(true)}
          className="px-4 py-2.5 text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Lock className="w-4 h-4" />
          <span>إغلاق وقفل الفترة المالية الحالية</span>
        </button>
      </div>

      {/* Closings List */}
      <div className="space-y-4">
        {closings.map(closing => (
          <div 
            key={closing.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {closing.period_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    تاريخ الإغلاق: {closing.closing_date} | بواسطة: {closing.closed_by}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                حالة الفترة: {closing.status} (مقفل ومحمي)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-slate-500">إجمالي الإيرادات المقفلة</span>
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(closing.total_revenue)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-slate-500">إجمالي المصروفات المقفلة</span>
                <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(closing.total_expenses)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">صافي الأرباح المرحّلة</span>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(closing.net_profit)}
                </div>
              </div>
            </div>

            {closing.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl">
                ملاحظات التدقيق: {closing.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Modal Lock Period */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              تأكيد قفل وإغلاق الفترة المحاسبية
            </h3>
            
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs">
              ⚠️ بعد الإقفال، سيتم تجميد جميع القيود الفردية المقترنة بهذه الفترة ولن يمكن تعديل المبالغ.
            </div>

            <form onSubmit={handleClosePeriodSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم أو عنوان فترة الإقفال
                </label>
                <input
                  type="text"
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وتقرير المراجعة النهائية
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات المراجع المحاسبي..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md"
                >
                  إغلاق وتجميد السجلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
