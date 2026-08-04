import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, Plus, Trash2, 
  FileText, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, 
  AlertCircle, Sparkles, Download, Filter, Search, Building2
} from 'lucide-react';
import { FinanceRecord } from '../types';
import { toast } from 'sonner';

export const FinancePage: React.FC = () => {
  const { 
    financeRecords, addFinanceRecord, deleteFinanceRecord, 
    generateFinancialInsights, trips 
  } = useStore();

  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [aiInsightText, setAiInsightText] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // New Record Form State
  const [newType, setNewType] = useState<'revenue' | 'expense'>('revenue');
  const [newCategory, setNewCategory] = useState('رسوم عمرة');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newParty, setNewParty] = useState('');
  const [newInvoice, setNewInvoice] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'تحويل بنكي' | 'نقداً' | 'شيك' | 'بطاقة سداد'>('تحويل بنكي');
  const [newTripId, setNewTripId] = useState('');

  // Calculations
  const totalRevenue = financeRecords
    .filter(r => r.type === 'revenue')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = financeRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const filteredRecords = financeRecords.filter(record => {
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesSearch = 
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.party_name && record.party_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.invoice_number && record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount))) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    addFinanceRecord({
      type: newType,
      category: newCategory,
      amount: Number(newAmount),
      description: newDesc || (newType === 'revenue' ? 'تحصيل باقة عمرة' : 'مصروف عمليات'),
      date: new Date().toISOString().split('T')[0],
      status: 'مكتمل',
      party_name: newParty || 'عميل / مورد',
      invoice_number: newInvoice || `INV-${Date.now().toString().slice(-4)}`,
      payment_method: newPaymentMethod,
      trip_id: newTripId || undefined,
    });

    setIsAddModalOpen(false);
    setNewAmount('');
    setNewDesc('');
    setNewParty('');
    setNewInvoice('');
  };

  const handleFetchAiInsights = async () => {
    setLoadingAi(true);
    const result = await generateFinancialInsights(financeRecords);
    setAiInsightText(result);
    setLoadingAi(false);
  };

  const handleExportCSV = () => {
    const headers = ['رقم القيد', 'النوع', 'الفئة', 'المبلغ', 'البيان', 'الطرف الآخر', 'التاريخ', 'طريقة الدفع'];
    const rows = filteredRecords.map(r => [
      r.id,
      r.type === 'revenue' ? 'إيراد' : 'مصروف',
      r.category,
      r.amount,
      `"${r.description}"`,
      `"${r.party_name || ''}"`,
      r.date,
      r.payment_method
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MegaStar_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير التقرير المالي CSV بنجاح');
  };

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              الوحدة المالية والإيرادات
            </span>
            <span className="text-xs text-slate-400">موسم 1448 هـ</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            الإدارة المالية وحسابات الأرباح
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة كافة سندات القبض والصرف، فواتير الفنادق والطيران وحساب صافي الأرباح
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFetchAiInsights}
            disabled={loadingAi}
            className="px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loadingAi ? 'جاري التحليل...' : 'تحليل المستشار المالي الذكي (AI)'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قيد مالي جديد</span>
          </button>
        </div>
      </div>

      {/* AI Financial Insight Banner */}
      {aiInsightText && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/30 text-slate-200 relative overflow-hidden shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-amber-300 border border-purple-500/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300 mb-1 flex items-center gap-2">
                توصيات المستشار المالي للذكاء الاصطناعي
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {aiInsightText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الإيرادات</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>تحصيل المعتمرين والباقات</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المصروفات</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalExpense.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>فنادق + طيران + نقل + إعاشة</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-500/15 dark:via-[#151c2d] dark:to-[#151c2d] border border-amber-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">صافي الأرباح</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {netProfit.toLocaleString()} <span className="text-xs font-normal text-slate-400">ر.س</span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
              هامش الربح: {profitMargin}%
            </div>
          </div>
        </div>

        {/* Pending Records */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">سندات قيد التسوية</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {financeRecords.filter(r => r.status === 'معلق').length} <span className="text-xs font-normal text-slate-400">سند</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              في انتظار اعتماد المحاسب
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Table Container */}
      <div className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                filterType === 'all'
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              الكل ({financeRecords.length})
            </button>
            <button
              onClick={() => setFilterType('revenue')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                filterType === 'revenue'
                  ? 'bg-emerald-500 text-white font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              الإيرادات المقبوضة
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                filterType === 'expense'
                  ? 'bg-rose-500 text-white font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              المصروفات
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالملاحظات، الفاتورة، أو المورد..."
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          </div>

        </div>

        {/* Finance Records Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">رمز القيد</th>
                <th className="p-3.5">النوع</th>
                <th className="p-3.5">الفئة والمصرف</th>
                <th className="p-3.5">البيان / الوصف</th>
                <th className="p-3.5">الطرف الآخر (عميل / مورد)</th>
                <th className="p-3.5">المبلغ</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد قيود مالية مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {record.id}
                    </td>
                    <td className="p-3.5">
                      {record.type === 'revenue' ? (
                        <span className="px-2.5 py-1 text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                          إيراد (+)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
                          مصروف (-)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {record.category}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {record.description}
                      {record.invoice_number && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          فاتورة: {record.invoice_number}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {record.party_name || '-'}
                    </td>
                    <td className="p-3.5 font-extrabold text-sm text-slate-900 dark:text-white">
                      {record.amount.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ر.س</span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {record.payment_method}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {record.date}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        record.status === 'مكتمل' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => deleteFinanceRecord(record.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all"
                        title="حذف القيد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Finance Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                إضافة سند مالي جديد (قبض / صرف)
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setNewType('revenue'); setNewCategory('رسوم عمرة'); }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    newType === 'revenue' 
                      ? 'bg-emerald-500 text-white border-emerald-500' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                  }`}
                >
                  سند قبض (إيراد)
                </button>
                <button
                  type="button"
                  onClick={() => { setNewType('expense'); setNewCategory('حجز فنادق'); }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    newType === 'expense' 
                      ? 'bg-rose-500 text-white border-rose-500' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                  }`}
                >
                  سند صرف (مصروف)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  فئة القيد
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  {newType === 'revenue' ? (
                    <>
                      <option value="رسوم عمرة">رسوم عمرة وباقات</option>
                      <option value="عمولة وكيل">عمولة وكيل خارجي</option>
                      <option value="خدمات إضافية">خدمات وتأشيرات إضافية</option>
                    </>
                  ) : (
                    <>
                      <option value="حجز فنادق">حجز فنادق (مكة/المدينة)</option>
                      <option value="تذاكر طيران">تذاكر طيران وحجوزات</option>
                      <option value="نقل حافلات">نقل وحافلات VIP</option>
                      <option value="إعاشة وتغذية">إعاشة وتغذية معتمرين</option>
                      <option value="عمولات سماسرة">عمولات ومصروفات إدارية</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ (بالريال السعودي)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="مثال: 15000"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الطرف الآخر (اسم العميل أو المورد/الفندق)
                </label>
                <input
                  type="text"
                  value={newParty}
                  onChange={(e) => setNewParty(e.target.value)}
                  placeholder="مثال: مجموعة أنجم الفندقية / شركة الطليعة"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والملاحظات
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="وصف مختصر للدفعة السداد..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md"
                >
                  حفظ القيد
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
