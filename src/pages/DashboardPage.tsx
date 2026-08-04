import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { AddPilgrimModal } from '../components/AddPilgrimModal';
import { 
  Users, FileCheck, ShieldCheck, QrCode, RefreshCw, 
  UserPlus, PlaneTakeoff, BedDouble, ArrowUpRight, CheckCircle2,
  AlertTriangle, Hotel, Sparkles, UserX, UserMinus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { 
    pilgrims, roomings, syncFromGoogleSheets, 
    setActivePage, autoRooming, addPilgrim, addTrip 
  } = useStore();

  const [showAddPilgrimModal, setShowAddPilgrimModal] = useState(false);
  const [showAddTripModal, setShowAddTripModal] = useState(false);

  // New pilgrim state for modal
  const [newPilgrimName, setNewPilgrimName] = useState('');
  const [newPilgrimPassport, setNewPilgrimPassport] = useState('');
  const [newPilgrimGender, setNewPilgrimGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [newPilgrimMakkahHotel, setNewPilgrimMakkahHotel] = useState('فندق أنجم مكة');

  // New trip state for modal
  const [newTripName, setNewTripName] = useState('');
  const [newTripPnr, setNewTripPnr] = useState('');

  // KPIs Calculations
  const withdrawnPilgrims = pilgrims.filter(p => p.is_withdrawn || /سحب|إلغاء|الغاء|ملغي|مسحوب/i.test(`${p.program || ''} ${p.notes || ''} ${p.withdrawal_status || ''}`));
  const withdrawnCount = withdrawnPilgrims.length;
  const activePilgrims = pilgrims.filter(p => !p.is_withdrawn && !/سحب|إلغاء|الغاء|ملغي|مسحوب/i.test(`${p.program || ''} ${p.notes || ''} ${p.withdrawal_status || ''}`));
  const activePilgrimsCount = activePilgrims.length;
  const totalPilgrims = pilgrims.length;

  const travelPermitsCount = activePilgrims.filter(p => p.travel_permit_required).length;
  const completedVisasCount = activePilgrims.filter(p => p.visa_status === 'مكتملة').length;
  const uploadedNusukCount = activePilgrims.filter(p => p.barcode_status === 'مكتمل' || p.barcode_status === 'مرفوع').length;

  // Chart 1: BarChart - Pilgrims distribution by hotel
  const hotelDistributionMap = new Map<string, number>();
  pilgrims.forEach(p => {
    const h = p.makkah_hotel || 'غير محدد';
    hotelDistributionMap.set(h, (hotelDistributionMap.get(h) || 0) + 1);
  });
  const hotelBarData = Array.from(hotelDistributionMap.entries()).map(([hotel, count]) => ({
    hotel: hotel.replace('فندق ', ''),
    count
  }));

  // Chart 2: PieChart - Room types distribution
  const roomTypeCounts = {
    quad: pilgrims.filter(p => p.room_type === 'رباعي').length,
    triple: pilgrims.filter(p => p.room_type === 'ثلاثي').length,
    double: pilgrims.filter(p => p.room_type === 'ثنائي').length,
  };
  const roomPieData = [
    { name: 'رباعي (4)', value: roomTypeCounts.quad, color: '#f59e0b' },
    { name: 'ثلاثي (3)', value: roomTypeCounts.triple, color: '#3b82f6' },
    { name: 'ثنائي (2)', value: roomTypeCounts.double, color: '#10b981' },
  ];

  // Chart 3: Visa Status Breakdown
  const visaBreakdownData = [
    { name: 'تأشيرة مكتملة', count: completedVisasCount, fill: '#10b981' },
    { name: 'قيد الإجراء', count: pilgrims.filter(p => p.visa_status === 'قيد الإجراء').length, fill: '#f59e0b' },
    { name: 'لم تبدأ بعد', count: pilgrims.filter(p => p.visa_status === 'لم تبدأ').length, fill: '#ef4444' },
  ];

  const handleCreatePilgrimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPilgrimName || !newPilgrimPassport) return;
    addPilgrim({
      name: newPilgrimName,
      passport_number: newPilgrimPassport,
      gender: newPilgrimGender,
      agent_main: 'شركة الطليعة للسياحة',
      agent_sub: 'فرع المبيعات المباشرة',
      visa_status: 'مكتملة',
      barcode_status: 'مكتمل',
      travel_permit_required: false,
      makkah_hotel: newPilgrimMakkahHotel,
      madinah_hotel: 'فندق دار الهجرة المدينة',
      room_type: 'رباعي',
      trip_id: 'TRIP-101',
      needs_bed: true
    });
    setNewPilgrimName('');
    setNewPilgrimPassport('');
    setShowAddPilgrimModal(false);
  };

  const handleCreateTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName || !newTripPnr) return;
    addTrip({
      trip_name: newTripName,
      pnr: newTripPnr,
      route: 'القاهرة ➔ جدة',
      airline: 'مصر للطيران',
      departure_date: '2026-08-15',
      departure_time: '10:00',
      return_date: '2026-08-25',
      return_time: '18:00'
    });
    setNewTripName('');
    setNewTripPnr('');
    setShowAddTripModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <SEO title="لوحة التحكم" description="مؤشرات الأداء الرئيسية والتحليلات السريعة لنظام ميجا ستار لإدارة العمرة" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-navy p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-cairo border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>نظام إدارة العمليات والتسكين الذكي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo tracking-tight">
              أهلاً بك في منصة ميجا ستار
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              إدارة شامـلة وموسعة لجميع رحلات، تسكين، ونقل المعتمرين لموسم 1448 هـ مع التزامن الآلي.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={syncFromGoogleSheets}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl gradient-gold text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all font-cairo cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث البيانات من الشيت</span>
            </button>
          </div>
        </div>

        {/* Background Decorative Circles */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* KPIs Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Active Pilgrims */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo">المعتمرين الفعليين</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-cairo text-slate-900 dark:text-white">
              {activePilgrimsCount}
            </span>
            <span className="text-[11px] text-slate-400 block sm:inline mr-1">نشط في الكشوفات</span>
          </div>
        </div>

        {/* KPI 2: Withdrawn & Cancelled Pilgrims */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-900/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-cairo">سحب وإلغاء (مستبعدون)</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-cairo text-rose-600 dark:text-rose-400">
              {withdrawnCount}
            </span>
            <span className="text-[11px] text-rose-500/80 block sm:inline mr-1">حالات ملغية من الشيت</span>
          </div>
        </div>

        {/* KPI 3: Travel Permits */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo">تصاريح السفر</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-cairo text-amber-600 dark:text-amber-400">
              {travelPermitsCount}
            </span>
            <span className="text-[11px] text-slate-400 block sm:inline mr-1">تصريح يلزم متابعته</span>
          </div>
        </div>

        {/* KPI 4: Visas Completed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo">التأشيرات المكتملة</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-cairo text-emerald-600 dark:text-emerald-400">
              {completedVisasCount}
            </span>
            <span className="text-[11px] text-slate-400 block sm:inline mr-1">من أصل {activePilgrimsCount}</span>
          </div>
        </div>

        {/* KPI 5: Nusuk Uploads */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-cairo">الرفع على نسك</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-cairo text-purple-600 dark:text-purple-400">
              {uploadedNusukCount}
            </span>
            <span className="text-[11px] text-slate-400 block sm:inline mr-1">باركود جاهز</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white font-cairo mb-4 flex items-center gap-2">
          <span>إجراءات سريعة</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setShowAddPilgrimModal(true)}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 text-slate-800 dark:text-slate-200 hover:text-amber-600 font-bold text-xs transition-all border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-4 h-4 text-amber-500" />
              <span>إضافة معتمر جديد</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => setShowAddTripModal(true)}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-500/10 text-slate-800 dark:text-slate-200 hover:text-blue-600 font-bold text-xs transition-all border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-2.5">
              <PlaneTakeoff className="w-4 h-4 text-blue-500" />
              <span>إنشاء رحلة جديدة</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => setActivePage('rooming')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200 hover:text-emerald-600 font-bold text-xs transition-all border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-2.5">
              <BedDouble className="w-4 h-4 text-emerald-500" />
              <span>تجميع وتسكين الغرف</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: BarChart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
              <Hotel className="w-4 h-4 text-amber-500" />
              <span>توزيع المعتمرين حسب الفنادق بمكة</span>
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotelBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="hotel" stroke="#888888" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} معتمر`, 'العدد']}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: PieChart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-blue-500" />
              <span>نسب توزيع أنواع الغرف المطلوب</span>
            </h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roomPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend formatter={(val) => <span className="text-xs font-bold font-cairo text-slate-600 dark:text-slate-300">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal: Add Pilgrim (MegaStar Tourism Flow) */}
      <AddPilgrimModal
        isOpen={showAddPilgrimModal}
        onClose={() => setShowAddPilgrimModal(false)}
      />

      {/* Modal: Add Trip */}
      {showAddTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">إنشاء رحلة طيران جديدة</h3>
            <form onSubmit={handleCreateTripSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم الرحلة</label>
                <input
                  type="text"
                  required
                  value={newTripName}
                  onChange={e => setNewTripName(e.target.value)}
                  placeholder="مثال: رحلة الفجر - القاهرة / جدة"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رمز PNR</label>
                <input
                  type="text"
                  required
                  value={newTripPnr}
                  onChange={e => setNewTripPnr(e.target.value)}
                  placeholder="مثال: MS882K"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTripModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  حفظ الرحلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
