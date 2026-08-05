import React, { useState } from 'react';
import { useStore, isPilgrimWithdrawn } from '../lib/store';
import { SEO } from '../components/SEO';
import { 
  Award, DollarSign, Users, UserCheck, Plus, CheckCircle2, 
  Clock, ArrowUpRight, ShieldCheck, Printer, Calculator, Wallet, Percent,
  CheckSquare, Edit3, X
} from 'lucide-react';
import { toast } from 'sonner';

export const IncentivesCommissionsPage: React.FC = () => {
  const { 
    pilgrims, staff, financeRecords, addFinanceRecord, formatCurrency, currency 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'agents' | 'staff'>('agents');
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);

  // Custom commission rates stored in state (Agent Name -> Rate per pilgrim)
  const [agentRates, setAgentRates] = useState<Record<string, number>>({});

  // Multi-select agents state
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [showBatchRateModal, setShowBatchRateModal] = useState(false);
  const [batchRateValue, setBatchRateValue] = useState<number>(50);

  const [showBatchCommissionModal, setShowBatchCommissionModal] = useState(false);
  const [batchPayMethod, setBatchPayMethod] = useState<'تحويل بنكي' | 'نقداً' | 'شيك'>('تحويل بنكي');
  const [batchPayCurrency, setBatchPayCurrency] = useState<'SAR' | 'EGP'>('EGP');

  // Incentive form
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [incentiveType, setIncentiveType] = useState('حافز تميز ميداني');
  const [incentiveAmount, setIncentiveAmount] = useState<number>(5000);
  const [incentiveCurrency, setIncentiveCurrency] = useState<'SAR' | 'EGP'>('EGP');
  const [incentiveNotes, setIncentiveNotes] = useState('');

  // Commission Payment Modal State
  const [selectedAgentForPayment, setSelectedAgentForPayment] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(2000);
  const [payCurrency, setPayCurrency] = useState<'SAR' | 'EGP'>('EGP');
  const [paymentMethod, setPaymentMethod] = useState<'تحويل بنكي' | 'نقداً' | 'شيك'>('تحويل بنكي');

  // Group Pilgrims by Agent
  const agentMap = new Map<string, {
    agentName: string;
    totalPilgrims: number;
    activePilgrims: number;
    withdrawnPilgrims: number;
  }>();

  pilgrims.forEach(p => {
    const agentName = p.agent_main || p.agent_sub || 'مبيعات مباشرة';
    const curr = agentMap.get(agentName) || {
      agentName,
      totalPilgrims: 0,
      activePilgrims: 0,
      withdrawnPilgrims: 0,
    };
    curr.totalPilgrims += 1;
    if (isPilgrimWithdrawn(p)) {
      curr.withdrawnPilgrims += 1;
    } else {
      curr.activePilgrims += 1;
    }
    agentMap.set(agentName, curr);
  });

  const agentList = Array.from(agentMap.values());

  // Calculate total agent commissions paid from financeRecords
  const getPaidCommissionForAgent = (agentName: string) => {
    return financeRecords
      .filter(r => r.type === 'expense' && r.category === 'عمولات سماسرة' && (r.party_name === agentName || (r.description && r.description.includes(agentName))))
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const defaultRate = currency === 'EGP' ? 150 : 35; // Default commission rate per pilgrim

  const totalCommissionsDue = agentList.reduce((sum, ag) => {
    const rate = agentRates[ag.agentName] ?? defaultRate;
    return sum + (ag.activePilgrims * rate);
  }, 0);

  const totalCommissionsPaid = agentList.reduce((sum, ag) => {
    return sum + getPaidCommissionForAgent(ag.agentName);
  }, 0);

  // Calculate staff incentives from financeRecords
  const staffIncentiveRecords = financeRecords.filter(r => r.type === 'expense' && r.category === 'حوافز ومكافآت');
  const totalStaffIncentivesPaid = staffIncentiveRecords.reduce((sum, r) => sum + r.amount, 0);

  // Handle Rate Change for an Agent
  const handleRateChange = (agentName: string, rate: number) => {
    setAgentRates(prev => ({ ...prev, [agentName]: Math.max(0, rate) }));
  };

  // Batch Select Agents
  const isAllAgentsSelected = agentList.length > 0 && agentList.every(ag => selectedAgents.includes(ag.agentName));

  const handleToggleSelectAllAgents = () => {
    if (isAllAgentsSelected) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agentList.map(ag => ag.agentName));
    }
  };

  const handleToggleSelectAgent = (agentName: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentName) ? prev.filter(name => name !== agentName) : [...prev, agentName]
    );
  };

  const handleBatchRateUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAgents.length === 0) return;
    const newRates = { ...agentRates };
    selectedAgents.forEach(name => {
      newRates[name] = Math.max(0, batchRateValue);
    });
    setAgentRates(newRates);
    toast.success(`تم تحديث عمولة المعتمر الواحدة إلى (${batchRateValue} ${currency}) لعدد (${selectedAgents.length}) وكيل/مندوب بنجاح`);
    setShowBatchRateModal(false);
  };

  const handleBatchCommissionPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAgents.length === 0) return;

    let totalDisbursed = 0;
    let agentCount = 0;

    selectedAgents.forEach(agentName => {
      const ag = agentList.find(a => a.agentName === agentName);
      if (!ag) return;
      const rate = agentRates[ag.agentName] ?? defaultRate;
      const totalDue = ag.activePilgrims * rate;
      const paid = getPaidCommissionForAgent(ag.agentName);
      const remaining = Math.max(0, totalDue - paid);

      const amountToPay = remaining > 0 ? remaining : (rate * ag.activePilgrims);
      if (amountToPay > 0) {
        addFinanceRecord({
          type: 'expense',
          category: 'عمولات سماسرة',
          amount: amountToPay,
          currency: batchPayCurrency,
          description: `صرف عمولة مبيعات جماعية للمندوب/الوكيل (${agentName})`,
          date: new Date().toISOString().split('T')[0],
          status: 'مكتمل',
          party_name: agentName,
          payment_method: batchPayMethod
        });
        totalDisbursed += amountToPay;
        agentCount++;
      }
    });

    toast.success(`تم تسوية وصرف عمولات جماعية بقيمة ${totalDisbursed.toLocaleString('ar-EG')} لعدد (${agentCount}) وكيل بنجاح`);
    setShowBatchCommissionModal(false);
  };

  // Submit Staff Incentive
  const handleSaveIncentive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffName || incentiveAmount <= 0) {
      toast.error('يرجى اختيار الموظف وإدخال مبلغ حافز صحيح');
      return;
    }

    addFinanceRecord({
      type: 'expense',
      category: 'حوافز ومكافآت',
      amount: incentiveAmount,
      currency: incentiveCurrency,
      description: `صرف ${incentiveType} للموظف (${selectedStaffName}) - ${incentiveNotes || 'مكافأة أداء ميداني'}`,
      date: new Date().toISOString().split('T')[0],
      status: 'مكتمل',
      party_name: selectedStaffName,
      payment_method: 'تحويل بنكي'
    });

    toast.success(`تم صرف وقيد حافز بقيمة ${incentiveAmount.toLocaleString('ar-EG')} ${incentiveCurrency === 'EGP' ? 'ج.م' : 'ر.س'} للموظف (${selectedStaffName})`);
    setShowIncentiveModal(false);
    setSelectedStaffName('');
    setIncentiveNotes('');
  };

  // Submit Commission Payment to Agent
  const handlePayCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForPayment || payAmount <= 0) {
      toast.error('يرجى تحديد المندوب والمبلغ بشكل صحيح');
      return;
    }

    addFinanceRecord({
      type: 'expense',
      category: 'عمولات سماسرة',
      amount: payAmount,
      currency: payCurrency,
      description: `صرف عمولة مبيعات للمندوب/الوكيل (${selectedAgentForPayment})`,
      date: new Date().toISOString().split('T')[0],
      status: 'مكتمل',
      party_name: selectedAgentForPayment,
      payment_method: paymentMethod
    });

    toast.success(`تم تسجيل صرف عمولة بقيمة ${payAmount.toLocaleString('ar-EG')} ${payCurrency === 'EGP' ? 'ج.م' : 'ر.س'} للمندوب (${selectedAgentForPayment})`);
    setShowCommissionModal(false);
  };

  return (
    <div className="space-y-6 pb-24 font-cairo dir-rtl animate-in fade-in duration-200">
      <SEO title="الحوافز والعمولات" description="حساب عمولات المناديب والوكلاء وحوافز كادر العمليات والمكافآت الميدانية" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              قسم المكافآت والعمولات ERP
            </span>
            <span className="text-xs text-slate-400">حسابات دقيقة 100%</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>لوحة الحوافز وعمولات المناديب</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            حساب عمولات الوكلاء والمناديب المستحقة تلقائياً باستبعاد المعتمرين الملغيين وصرف حوافز الكادر
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIncentiveModal(true)}
            className="px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حافز موظف</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">إجمالي عمولات المناديب المستحقة</span>
            <Calculator className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalCommissionsDue)}
          </div>
          <p className="text-[11px] text-slate-400">محسوبة بناءً على المعتمرين الفعليين</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">العمولات المدفوعة للمناديب</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCommissionsPaid)}
          </div>
          <p className="text-[11px] text-slate-400">مسجلة في سندات الصرف المالية</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">المتبقي للعمولات (مستحق)</span>
            <Wallet className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(Math.max(0, totalCommissionsDue - totalCommissionsPaid))}
          </div>
          <p className="text-[11px] text-slate-400">رصيد المتبقي لصرف عمولات السماسرة</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">إجمالي حوافز الموظفين المصروفة</span>
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(totalStaffIncentivesPaid)}
          </div>
          <p className="text-[11px] text-slate-400">مكافآت التميز والعمل الميداني</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'agents'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-[#151c2d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>عمولات المناديب والوكلاء ({agentList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-[#151c2d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>حوافز الموظفين والكادر ({staffIncentiveRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: AGENT COMMISSIONS */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {/* BATCH ACTION BAR FOR AGENTS */}
          {selectedAgents.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>تم تحديد ({selectedAgents.length}) وكيل/مندوب</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowBatchRateModal(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  <span>تعديل عمولة المعتمر الجماعية</span>
                </button>

                <button
                  onClick={() => setShowBatchCommissionModal(true)}
                  className="px-3.5 py-1.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>تسجيل صرف جماعي للعمولات</span>
                </button>

                <button
                  onClick={() => setSelectedAgents([])}
                  className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
                  title="إلغاء التحديد"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  جدول حساب عمولات المناديب والوكلاء (ورقة تقفيل الحسابات)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تُحسب العمولة تلقائياً بناءً على عدد المعتمرين الفعليين (تستبعد تلقائياً حالات الإلغاء والسحب)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/60 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllAgentsSelected}
                        onChange={handleToggleSelectAllAgents}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">اسم المندوب / الوكيل</th>
                    <th className="p-3.5 text-center">إجمالي المعتمرين</th>
                    <th className="p-3.5 text-center">المستبعدين (إلغاء)</th>
                    <th className="p-3.5 text-center">المعتمرين الفعليين</th>
                    <th className="p-3.5 text-center">عمولة المعتمر الواحدة</th>
                    <th className="p-3.5 text-center">إجمالي العمولة المستحقة</th>
                    <th className="p-3.5 text-center">المدفوع (سندات)</th>
                    <th className="p-3.5 text-center">المتبقي</th>
                    <th className="p-3.5 text-center">إجراء الصرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {agentList.map((ag) => {
                    const rate = agentRates[ag.agentName] ?? defaultRate;
                    const totalDue = ag.activePilgrims * rate;
                    const paid = getPaidCommissionForAgent(ag.agentName);
                    const remaining = totalDue - paid;
                    const isSelected = selectedAgents.includes(ag.agentName);

                    return (
                      <tr 
                        key={ag.agentName} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-amber-500/10 dark:bg-amber-500/15' 
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectAgent(ag.agentName)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                          {ag.agentName}
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-400">
                          {ag.totalPilgrims}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          {ag.withdrawnPilgrims > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold">
                              -{ag.withdrawnPilgrims}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {ag.activePilgrims}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              value={rate}
                              onChange={(e) => handleRateChange(ag.agentName, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-center font-mono font-bold bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400">{currency}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-slate-900 dark:text-white">
                          {formatCurrency(totalDue)}
                        </td>
                        <td className="p-3.5 text-center font-mono text-emerald-600 font-bold">
                          {formatCurrency(paid)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <span className={remaining > 0 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-400'}>
                            {formatCurrency(remaining)}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedAgentForPayment(ag.agentName);
                              setPayAmount(remaining > 0 ? remaining : 500);
                              setShowCommissionModal(true);
                            }}
                            className="px-3 py-1.5 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl transition-all active:scale-95"
                          >
                            تسجيل صرف
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF INCENTIVES */}
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                سجل حوافز ومكافآت كادر الموظفين
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                متابعة المكافآت المالية وصرف حوافز الأداء الميداني للمشرفين والموظفين
              </p>
            </div>

            <button
              onClick={() => setShowIncentiveModal(true)}
              className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حافز جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/60 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">تاريخ الصرف</th>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">المسمى الوظيفي</th>
                  <th className="p-3.5">تفاصيل الحافز</th>
                  <th className="p-3.5 font-mono">المبلغ</th>
                  <th className="p-3.5">حالة السند</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {staffIncentiveRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد حوافز أو مكافآت مصروفة حتى الآن. يمكنك إضافة حافز جديد بالضغط على "إضافة حافز جديد".
                    </td>
                  </tr>
                ) : (
                  staffIncentiveRecords.map(r => {
                    const staffMember = staff.find(s => s.name === r.party_name);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500">{r.date}</td>
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{r.party_name || 'موظف'}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">{staffMember?.role || 'كادر عمليات'}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">{r.description}</td>
                        <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(r.amount)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Incentive */}
      {showIncentiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              صرف وقيد حافز موظف جديد
            </h3>
            <form onSubmit={handleSaveIncentive} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اختر الموظف
                </label>
                <select
                  value={selectedStaffName}
                  onChange={(e) => setSelectedStaffName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- حدد الموظف --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع المكافأة / الحافز
                </label>
                <input
                  type="text"
                  value={incentiveType}
                  onChange={(e) => setIncentiveType(e.target.value)}
                  placeholder="مثال: حافز تميز ميداني / مكافأة التزام"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عملة صرف الحافز
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIncentiveCurrency('SAR')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      incentiveCurrency === 'SAR'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <span>🇸🇦</span>
                    <span>ريال سعودي (SAR)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncentiveCurrency('EGP')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      incentiveCurrency === 'EGP'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <span>🇪🇬</span>
                    <span>جنيه مصري (EGP)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مبلغ الحافز ({incentiveCurrency === 'EGP' ? 'بالجنيه المصري' : 'بالريال السعودي'})
                </label>
                <input
                  type="number"
                  value={incentiveAmount}
                  onChange={(e) => setIncentiveAmount(parseFloat(e.target.value) || 0)}
                  min={1}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وسبب الصرف
                </label>
                <textarea
                  value={incentiveNotes}
                  onChange={(e) => setIncentiveNotes(e.target.value)}
                  placeholder="مثال: مكافأة عن التميز في تفويج رحلة الإسراء..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncentiveModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md"
                >
                  صرف وقيد الحافز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Commission to Agent */}
      {showCommissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              تسجيل صرف عمولة للمندوب ({selectedAgentForPayment})
            </h3>
            <form onSubmit={handlePayCommission} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عملة صرف العمولة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayCurrency('SAR')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      payCurrency === 'SAR'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <span>🇸🇦</span>
                    <span>ريال سعودي (SAR)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayCurrency('EGP')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      payCurrency === 'EGP'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <span>🇪🇬</span>
                    <span>جنيه مصري (EGP)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ المصروف ({payCurrency === 'EGP' ? 'بالجنيه المصري' : 'بالريال السعودي'})
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  min={1}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وسيلة الدفع
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="نقداً">نقداً</option>
                  <option value="شيك">شيك</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md"
                >
                  إتمام تسجيل الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Rate Update */}
      {showBatchRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-500" />
              <span>تعديل عمولة المعتمر الواحدة لعدد ({selectedAgents.length}) وكيل</span>
            </h3>
            <form onSubmit={handleBatchRateUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عمولة المعتمر الجديدة ({currency})
                </label>
                <input
                  type="number"
                  value={batchRateValue}
                  onChange={(e) => setBatchRateValue(parseFloat(e.target.value) || 0)}
                  min={0}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono text-center font-bold text-base"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  سيتم تطبيق هذه العمولة على جميع الوكلاء المحددين حالياً.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchRateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md"
                >
                  تطبيق العمولات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Commission Disbursement */}
      {showBatchCommissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              <span>تسجيل صرف جماعي لعمولات ({selectedAgents.length}) وكيل</span>
            </h3>
            <form onSubmit={handleBatchCommissionPaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عملة صرف العمولة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchPayCurrency('SAR')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      batchPayCurrency === 'SAR'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <span>🇸🇦</span>
                    <span>ريال سعودي (SAR)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchPayCurrency('EGP')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      batchPayCurrency === 'EGP'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    <span>🇪🇬</span>
                    <span>جنيه مصري (EGP)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وسيلة الدفع
                </label>
                <select
                  value={batchPayMethod}
                  onChange={(e: any) => setBatchPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="نقداً">نقداً</option>
                  <option value="شيك">شيك</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                سيتم صرف وتصفية كامل العمولات المتبقية لجميع الوكلاء المحددين وتوليد قيود مالية سريعة.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchCommissionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md"
                >
                  إتمام الصرف الجماعي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
