import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, Plus, Trash2, 
  FileText, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, 
  AlertCircle, Sparkles, Download, Filter, Search, Building2,
  UserX, Lock, Plane, Hotel, Bus, Calculator, Users, ArrowLeftRight,
  Layers, Table, Check, RefreshCw, AlertTriangle
} from 'lucide-react';
import { FinanceRecord, Pilgrim } from '../types';
import { toast } from 'sonner';

export const FinancePage: React.FC = () => {
  const { 
    financeRecords, addFinanceRecord, deleteFinanceRecord, 
    generateFinancialInsights, trips, pilgrims, setActivePage,
    currency, setCurrency, exchangeRate, setExchangeRate, formatCurrency
  } = useStore();

  // Active Sheet Tab (General Ledger / Agent Accounts / Withdrawals & Cancellations)
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'withdrawals'>('overview');

  // Ledger Filter State
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense' | 'withdrawn'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [aiInsightText, setAiInsightText] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Currency Converter Widget State
  const [calcAmount, setCalcAmount] = useState<string>('1000');
  const [calcDirection, setCalcDirection] = useState<'SAR_TO_EGP' | 'EGP_TO_SAR'>('SAR_TO_EGP');

  // New Record Form State
  const [newType, setNewType] = useState<'revenue' | 'expense'>('revenue');
  const [newCategory, setNewCategory] = useState('رسوم عمرة');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newParty, setNewParty] = useState('');
  const [newInvoice, setNewInvoice] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'تحويل بنكي' | 'نقداً' | 'شيك' | 'بطاقة سداد'>('تحويل بنكي');
  const [newTripId, setNewTripId] = useState('');

  // Settlement for Withdrawn Pilgrim Modal
  const [settlingPilgrim, setSettlingPilgrim] = useState<Pilgrim | null>(null);
  const [settlementRefundAmount, setSettlementRefundAmount] = useState('');
  const [settlementFeeAmount, setSettlementFeeAmount] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');

  // Dual Currency Formatter Helper
  const formatDual = (amountInSar: number) => {
    if (isNaN(amountInSar)) return { primary: '0', secondary: '0' };
    const sarFormatted = `${Math.round(amountInSar).toLocaleString('ar-EG')} ر.س`;
    const egpFormatted = `${Math.round(amountInSar * exchangeRate).toLocaleString('ar-EG')} ج.م`;

    if (currency === 'EGP') {
      return { primary: egpFormatted, secondary: sarFormatted };
    }
    return { primary: sarFormatted, secondary: egpFormatted };
  };

  // Calculations (Excluding withdrawn & cancelled records from active operational budget)
  const totalRevenue = financeRecords
    .filter(r => r.type === 'revenue' && !r.is_withdrawn && r.category !== 'سحب وإلغاء')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = financeRecords
    .filter(r => r.type === 'expense' && !r.is_withdrawn)
    .reduce((sum, r) => sum + r.amount, 0);

  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Withdrawn & Cancelled Pilgrims count & records
  const withdrawnPilgrims = pilgrims.filter(p => 
    p.is_withdrawn || 
    /سحب|إلغاء|الغاء|ملغي|مسحوب|اعتذار/i.test(`${p.program || ''} ${p.notes || ''} ${p.withdrawal_status || ''}`)
  );

  const withdrawnPilgrimsCount = withdrawnPilgrims.length;
  const withdrawnRecords = financeRecords.filter(r => r.is_withdrawn || r.category === 'سحب وإلغاء');
  const withdrawnTotalRefunds = withdrawnRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  // Trip Costs Breakdown Categories
  const hotelExpensesTotal = financeRecords
    .filter(r => r.type === 'expense' && !r.is_withdrawn && (r.category.includes('فنادق') || r.category.includes('سكن')))
    .reduce((sum, r) => sum + r.amount, 0);

  const flightExpensesTotal = financeRecords
    .filter(r => r.type === 'expense' && !r.is_withdrawn && (r.category.includes('طيران') || r.category.includes('تذاكر')))
    .reduce((sum, r) => sum + r.amount, 0);

  const transportExpensesTotal = financeRecords
    .filter(r => r.type === 'expense' && !r.is_withdrawn && (r.category.includes('نقل') || r.category.includes('حافلات')))
    .reduce((sum, r) => sum + r.amount, 0);

  // Agent Statements Calculations (Grouped by Agent)
  const agentMap = new Map<string, { name: string; totalPilgrims: number; withdrawnPilgrims: number; estimatedRevenue: number }>();
  pilgrims.forEach(p => {
    const agentName = p.agent_main || p.agent_sub || 'مباشر / أفراد';
    const curr = agentMap.get(agentName) || { name: agentName, totalPilgrims: 0, withdrawnPilgrims: 0, estimatedRevenue: 0 };
    curr.totalPilgrims += 1;
    if (p.is_withdrawn || /سحب|إلغاء|الغاء|ملغي|مسحوب/i.test(`${p.notes || ''} ${p.withdrawal_status || ''}`)) {
      curr.withdrawnPilgrims += 1;
    } else {
      curr.estimatedRevenue += 3500; // Estimated baseline package cost per pilgrim
    }
    agentMap.set(agentName, curr);
  });
  const agentList = Array.from(agentMap.values());

  // Filtered Financial Ledger Records
  const filteredRecords = financeRecords.filter(record => {
    let matchesType = true;
    if (filterType === 'revenue') matchesType = record.type === 'revenue' && !record.is_withdrawn;
    else if (filterType === 'expense') matchesType = record.type === 'expense' && !record.is_withdrawn;
    else if (filterType === 'withdrawn') matchesType = record.is_withdrawn === true || record.category === 'سحب وإلغاء';

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
      is_withdrawn: newCategory === 'سحب وإلغاء',
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

  const handleOpenSettlement = (pilgrim: Pilgrim) => {
    setSettlingPilgrim(pilgrim);
    setSettlementRefundAmount('3000');
    setSettlementFeeAmount('500');
    setSettlementNotes(`تسوية وإلغاء معتمر ${pilgrim.name} - جواز: ${pilgrim.passport_number}`);
  };

  const handleSaveSettlement = () => {
    if (!settlingPilgrim) return;

    const refundVal = Number(settlementRefundAmount) || 0;
    const feeVal = Number(settlementFeeAmount) || 0;

    // Record refund expense
    if (refundVal > 0) {
      addFinanceRecord({
        type: 'expense',
        category: 'سحب وإلغاء',
        amount: refundVal,
        description: `استرداد المبلغ للمعتمر الملغي: ${settlingPilgrim.name} (${settlementNotes})`,
        date: new Date().toISOString().split('T')[0],
        status: 'مسوى',
        party_name: settlingPilgrim.name,
        invoice_number: `REF-${Date.now().toString().slice(-4)}`,
        payment_method: 'تحويل بنكي',
        is_withdrawn: true,
      });
    }

    // Record cancellation fee revenue if applicable
    if (feeVal > 0) {
      addFinanceRecord({
        type: 'revenue',
        category: 'سحب وإلغاء',
        amount: feeVal,
        description: `رسوم/غرامة إلغاء محصلة من: ${settlingPilgrim.name}`,
        date: new Date().toISOString().split('T')[0],
        status: 'مسوى',
        party_name: settlingPilgrim.name,
        invoice_number: `FEE-${Date.now().toString().slice(-4)}`,
        payment_method: 'نقداً',
        is_withdrawn: true,
      });
    }

    toast.success(`تم تسوية المبلغ المالي للمعتمر المسحوب (${settlingPilgrim.name}) بنجاح`);
    setSettlingPilgrim(null);
  };

  const handleExportCSV = () => {
    const headers = ['رقم القيد', 'النوع', 'الفئة', 'المبلغ (ر.س)', 'المبلغ (ج.م)', 'البيان', 'الطرف الآخر', 'التاريخ', 'طريقة الدفع', 'حالة السحب'];
    const rows = filteredRecords.map(r => [
      r.id,
      r.type === 'revenue' ? 'إيراد' : 'مصروف',
      r.category,
      r.amount,
      Math.round(r.amount * exchangeRate),
      `"${r.description}"`,
      `"${r.party_name || ''}"`,
      r.date,
      r.payment_method,
      r.is_withdrawn ? 'سحب/إلغاء' : 'نشط'
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

  // Calculator Result
  const parsedCalcVal = parseFloat(calcAmount) || 0;
  const calcConvertedVal = calcDirection === 'SAR_TO_EGP'
    ? Math.round(parsedCalcVal * exchangeRate)
    : Math.round(parsedCalcVal / exchangeRate);

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200">
      
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              الوحدة المالية وحسابات أوراق الشيت
            </span>
            <span className="text-xs text-slate-400">موسم 1448 هـ</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            الإدارة المالية ومطابقة الشيت والعملات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة كافة سندات المقبوضات والمصروفات، تحويل العملات (ريال/جنيه)، وعرض خاص لحالات السحب والإلغاء
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActivePage('closing')}
            className="px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>القفل المالي والتقفيل</span>
          </button>

          <button
            onClick={handleFetchAiInsights}
            disabled={loadingAi}
            className="px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loadingAi ? 'جاري التحليل...' : 'مستشار AI المالي'}</span>
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

      {/* Sheets Style Navigation Tabs Bar */}
      <div className="bg-white dark:bg-[#151c2d] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>ورقة السجل المالي العام (General Ledger)</span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'agents'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ورقة حسابات الوكلاء والشركات ({agentList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'withdrawals'
                ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>لوحة السحب والإلغاء والغرامات</span>
            {withdrawnPilgrimsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white text-rose-600 font-extrabold">
                {withdrawnPilgrimsCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono pl-2">
          مزامنة الشيت: <strong className="text-emerald-500">نشطة (Excel Compatible)</strong>
        </div>
      </div>

      {/* Currency & Live Exchange Rate Converter Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white dark:bg-[#111625] border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-cairo text-amber-400 flex items-center gap-2">
                <span>إدارة العملات ومطابقة سعر الصرف (الريال السعودي / الجنيه المصري)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تحديد عملة التقرير الرئيسية وتعديل سعر صرف الريال مقابل الجنيه لحظياً
              </p>
            </div>
          </div>

          {/* Currency Toggle & Rate Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
              <button
                onClick={() => setCurrency('SAR')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  currency === 'SAR'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇸🇦 ريال سعودي (ر.س)
              </button>
              <button
                onClick={() => setCurrency('EGP')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  currency === 'EGP'
                    ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇪🇬 جنيه مصري (ج.م)
              </button>
            </div>

            {/* Exchange Rate Input */}
            <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-2xl border border-amber-500/30 text-xs">
              <span className="text-slate-300 font-bold">1 ريال =</span>
              <input
                type="number"
                step="0.1"
                min="1"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-bold font-mono text-center focus:outline-none focus:border-amber-400"
              />
              <span className="text-slate-300 font-bold">ج.م</span>
            </div>

            {/* Exchange Presets */}
            <div className="hidden sm:flex items-center gap-1">
              {[13.5, 14.0, 14.5, 15.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setExchangeRate(rate)}
                  className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all ${
                    exchangeRate === rate
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Currency Calculator Widget */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>حاسبة التحويل السريع للدفعة:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              placeholder="أدخل المبلغ..."
              className="w-32 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none"
            />

            <button
              onClick={() => setCalcDirection(prev => prev === 'SAR_TO_EGP' ? 'EGP_TO_SAR' : 'SAR_TO_EGP')}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <span>{calcDirection === 'SAR_TO_EGP' ? 'ريال ➔ جنيه' : 'جنيه ➔ ريال'}</span>
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            <div className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold text-sm font-mono">
              = {calcConvertedVal.toLocaleString('ar-EG')} {calcDirection === 'SAR_TO_EGP' ? 'ج.م' : 'ر.س'}
            </div>
          </div>
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

      {/* TAB 1: GENERAL LEDGER OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Revenue */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الإيرادات المقبوضة</span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatDual(totalRevenue).primary}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  تساوي: {formatDual(totalRevenue).secondary}
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
                  {formatDual(totalExpense).primary}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  تساوي: {formatDual(totalExpense).secondary}
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
                  {formatDual(netProfit).primary}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                  هامش الربح التشغيلي: {profitMargin}%
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

          {/* Trip Services Breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white dark:bg-[#111625] border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold font-cairo flex items-center gap-2 text-amber-400">
                  <Building2 className="w-4 h-4" />
                  تفاصيل تكاليف أوراق الخدمات (فنادق، طيران، حافلات)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  حساب المصروفات الفعلية بالريال والجنيه باستبعاد حالات الإلغاء
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Hotel className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">تكاليف الفنادق والسكن</span>
                    <span className="text-lg font-extrabold text-white font-cairo">
                      {formatDual(hotelExpensesTotal).primary}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ({formatDual(hotelExpensesTotal).secondary})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">تكاليف الطيران والتذاكر</span>
                    <span className="text-lg font-extrabold text-white font-cairo">
                      {formatDual(flightExpensesTotal).primary}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ({formatDual(flightExpensesTotal).secondary})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">تكاليف النقل والحافلات</span>
                    <span className="text-lg font-extrabold text-white font-cairo">
                      {formatDual(transportExpensesTotal).primary}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ({formatDual(transportExpensesTotal).secondary})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Ledger Records Table */}
          <div className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            
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
                  جميع القيود ({financeRecords.length})
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
                <button
                  onClick={() => setFilterType('withdrawn')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    filterType === 'withdrawn'
                      ? 'bg-purple-600 text-white font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  تسويات السحب/الإلغاء ({withdrawnRecords.length})
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

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">رمز القيد</th>
                    <th className="p-3.5">النوع</th>
                    <th className="p-3.5">الفئة والمصرف</th>
                    <th className="p-3.5">البيان / الوصف</th>
                    <th className="p-3.5">الطرف الآخر (عميل / مورد)</th>
                    <th className="p-3.5">المبلغ (ر.س)</th>
                    <th className="p-3.5">المبلغ (ج.م)</th>
                    <th className="p-3.5">طريقة الدفع</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
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
                          {record.is_withdrawn || record.category === 'سحب وإلغاء' ? (
                            <span className="px-2.5 py-1 text-[11px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/20">
                              سحب/إلغاء
                            </span>
                          ) : record.type === 'revenue' ? (
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
                          {record.amount.toLocaleString('ar-EG')} ر.س
                        </td>
                        <td className="p-3.5 font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          {Math.round(record.amount * exchangeRate).toLocaleString('ar-EG')} ج.م
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

        </div>
      )}

      {/* TAB 2: AGENTS & CORPORATE ACCOUNTS SHEET */}
      {activeTab === 'agents' && (
        <div className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>ورقة كشوف حسابات الوكلاء المعتمدين والمشرفين</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تتبع كشوفات أعداد معتمري الوكلاء والمبالغ المحصلة والمسحوبة بسعر الصرف الحالي
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">اسم الوكيل / الشركة</th>
                  <th className="p-3.5">المعتمرين النشطين</th>
                  <th className="p-3.5">حالات السحب والإلغاء</th>
                  <th className="p-3.5">إجمالي الباقات (ر.س)</th>
                  <th className="p-3.5">إجمالي الباقات (ج.م)</th>
                  <th className="p-3.5">الحالة الحسابية</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agentList.map((ag) => (
                  <tr key={ag.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white font-cairo">
                      {ag.name}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                      {ag.totalPilgrims - ag.withdrawnPilgrims} معتمر
                    </td>
                    <td className="p-3.5">
                      {ag.withdrawnPilgrims > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold text-[11px]">
                          {ag.withdrawnPilgrims} ملغي
                        </span>
                      ) : (
                        <span className="text-slate-400">لا يوجد</span>
                      )}
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                      {ag.estimatedRevenue.toLocaleString('ar-EG')} ر.س
                    </td>
                    <td className="p-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {Math.round(ag.estimatedRevenue * exchangeRate).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                        حساب منتظم
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setNewParty(ag.name);
                          setNewCategory('عمولة وكيل');
                          setIsAddModalOpen(true);
                        }}
                        className="px-3 py-1 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg transition-all"
                      >
                        إضافة قيد للوكيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEDICATED WITHDRAWALS & CANCELLATIONS PANEL ('سحب/إلغاء') */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          
          {/* Withdrawal KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">إجمالي حالات السحب والإلغاء</span>
                <UserX className="w-5 h-5 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-extrabold font-cairo">
                {withdrawnPilgrimsCount} معتمر
              </div>
              <p className="text-[11px] opacity-80 mt-1">مستبعدين تلقائياً من الأرباح وتكاليف الفنادق والطيران</p>
            </div>

            <div className="p-5 rounded-3xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">قيود التسوية المالية للملغيين</span>
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div className="mt-2 text-2xl font-extrabold font-cairo">
                {withdrawnRecords.length} سندات تسوية
              </div>
              <p className="text-[11px] opacity-80 mt-1">تتضمن مبالغ مستردة وغرامات إلغاء مسجلة</p>
            </div>

            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">إجمالي المبالغ المستردة للملغيين</span>
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-extrabold font-cairo">
                {formatDual(withdrawnTotalRefunds).primary}
              </div>
              <p className="text-[11px] opacity-80 mt-1">تساوي: {formatDual(withdrawnTotalRefunds).secondary}</p>
            </div>

          </div>

          {/* Withdrawn Pilgrims List & Financial Settlement Panel */}
          <div className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-500" />
                  <span>جدول المعتمرين الحاملين لحالة (سحب وإلغاء) وإجراءات الاسترداد</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يمكنك إجراء التسويات المالية وقيد غرامات الإلغاء أو الاسترداد مباشرة
                </p>
              </div>
            </div>

            {withdrawnPilgrims.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  لا توجد أي حالات سحب أو إلغاء مسجلة حالياً
                </p>
                <p className="text-xs text-slate-400">جميع المعتمرين مسجلين بنشاط تام في الرحلات</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">اسم المعتمر</th>
                      <th className="p-3.5">رقم الجواز</th>
                      <th className="p-3.5">الوكيل / المصدر</th>
                      <th className="p-3.5">ملاحظات وسبب السحب</th>
                      <th className="p-3.5">حالة التسوية المالية</th>
                      <th className="p-3.5 text-center">إجراء التسوية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {withdrawnPilgrims.map((p) => {
                      const hasSettlementRecord = withdrawnRecords.some(r => r.party_name?.includes(p.name));

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">
                            {p.passport_number}
                          </td>
                          <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                            {p.agent_main || p.agent_sub || 'مباشر'}
                          </td>
                          <td className="p-3.5 text-rose-600 dark:text-rose-400 font-bold max-w-xs truncate">
                            {p.notes || p.withdrawal_status || 'سحب وإلغاء معتمر'}
                          </td>
                          <td className="p-3.5">
                            {hasSettlementRecord ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 font-bold text-[10px] flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>تمت التسوية بنجاح</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 font-bold text-[10px] flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>في انتظار التسوية</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleOpenSettlement(p)}
                              className="px-3 py-1.5 text-[11px] font-extrabold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-sm"
                            >
                              تسوية الاسترداد / الغرامة
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal: Add Finance Record */}
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
                      <option value="سحب وإلغاء">غرامة إلغاء/تسوية سحب</option>
                    </>
                  ) : (
                    <>
                      <option value="حجز فنادق">حجز فنادق (مكة/المدينة)</option>
                      <option value="تذاكر طيران">تذاكر طيران وحجوزات</option>
                      <option value="نقل حافلات">نقل وحافلات VIP</option>
                      <option value="إعاشة وتغذية">إعاشة وتغذية معتمرين</option>
                      <option value="سحب وإلغاء">استرداد معتمر مسحوب (إلغاء)</option>
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
                {newAmount && !isNaN(Number(newAmount)) && (
                  <span className="text-[11px] text-emerald-500 font-mono font-bold block mt-1">
                    يعادل بالجنيه: {Math.round(Number(newAmount) * exchangeRate).toLocaleString('ar-EG')} ج.م
                  </span>
                )}
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

      {/* Modal: Financial Settlement for Withdrawn Pilgrim */}
      {settlingPilgrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-500" />
                <span>تسوية مالية لمعتمر مسحوب / ملغي</span>
              </h3>
              <button
                onClick={() => setSettlingPilgrim(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
              <span className="text-slate-400">المعتمر:</span>
              <strong className="text-slate-900 dark:text-white block font-bold">{settlingPilgrim.name}</strong>
              <span className="text-[11px] text-slate-400 font-mono block">الجواز: {settlingPilgrim.passport_number} | الوكيل: {settlingPilgrim.agent_main || 'مباشر'}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ الاسترداد للمعتمر (مصروف) - بالريال السعودي
                </label>
                <input
                  type="number"
                  value={settlementRefundAmount}
                  onChange={(e) => setSettlementRefundAmount(e.target.value)}
                  placeholder="3000"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  غرامة / رسوم الإلغاء المستقطعة (إيراد) - بالريال السعودي
                </label>
                <input
                  type="number"
                  value={settlementFeeAmount}
                  onChange={(e) => setSettlementFeeAmount(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والملاحظات
                </label>
                <textarea
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSettlingPilgrim(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveSettlement}
                className="px-5 py-2 text-xs font-extrabold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md"
              >
                إتمام تسوية الإلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
