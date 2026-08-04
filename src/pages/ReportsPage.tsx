import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { 
  BarChart3, FileSpreadsheet, Download, Printer, Filter, 
  BedDouble, PlaneTakeoff, Users, DollarSign, UserCheck, 
  CheckCircle2, FileText, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const { pilgrims, trips, roomings, staff, financeRecords, selectedHotelFilter } = useStore();
  const [activeReportTab, setActiveReportTab] = useState<'trips' | 'pilgrims' | 'hotels' | 'financial' | 'staff'>('trips');

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    let filename = `Report_${activeReportTab}_${new Date().toISOString().split('T')[0]}.csv`;
    let headers: string[] = [];
    let rows: any[] = [];

    if (activeReportTab === 'trips') {
      headers = ['رقم الرحلة', 'اسم الرحلة', 'خط السير', 'شركة الطيران', 'تاريخ المغادرة', 'تاريخ العودة', 'رقم الحجز (PNR)'];
      rows = trips.map(t => [t.id, `"${t.trip_name}"`, `"${t.route}"`, `"${t.airline}"`, t.departure_date, t.return_date, t.pnr]);
    } else if (activeReportTab === 'pilgrims') {
      headers = ['الرقم', 'اسم المعتمر', 'الجنس', 'رقم الجواز', 'الوكيل الرئيسي', 'فندق مكة', 'فندق المدينة', 'نوع الغرفة', 'التأشيرة', 'الباركود'];
      rows = pilgrims.map(p => [p.id, `"${p.name}"`, p.gender, p.passport_number, `"${p.agent_main}"`, `"${p.makkah_hotel}"`, `"${p.madinah_hotel}"`, p.room_type, p.visa_status, p.barcode_status]);
    } else if (activeReportTab === 'hotels') {
      headers = ['رمز الفندق', 'اسم الفندق', 'المدينة', 'إجمالي الغرف', 'غرف ثنائية', 'غرف ثلاثية', 'غرف رباعية'];
      rows = roomings.map(r => [r.id, `"${r.hotel_name}"`, r.city, r.total_rooms, r.double_rooms, r.triple_rooms, r.quad_rooms]);
    } else if (activeReportTab === 'financial') {
      headers = ['رقم القيد', 'النوع', 'الفئة', 'المبلغ', 'البيان', 'التاريخ', 'طريقة الدفع'];
      rows = financeRecords.map(f => [f.id, f.type === 'revenue' ? 'إيراد' : 'مصروف', f.category, f.amount, `"${f.description}"`, f.date, f.payment_method]);
    } else {
      headers = ['رمز الموظف', 'اسم الموظف', 'الدور / الصفة', 'الحالة', 'رقم الهاتف'];
      rows = staff.map(s => [s.id, `"${s.name}"`, `"${s.role}"`, s.status, s.phone]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير تقرير التسكين والرحلات بصيغة CSV بنجاح');
  };

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              مركز التقارير المعتمد
            </span>
            <span className="text-xs text-slate-400">موسم 1448 هـ</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            تقارير العمليات والتسكين الشاملة
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            استخراج كشوفات الرحلات، المعتمرين، توزيع الغرف، الميزانيات وكوادر الإشراف
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 print:hidden">
        <button
          onClick={() => setActiveReportTab('trips')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'trips'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-[#151c2d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <PlaneTakeoff className="w-4 h-4" />
          <span>تقرير الرحلات والطيران ({trips.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('pilgrims')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'pilgrims'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-[#151c2d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>تقرير المعتمرين والباركود ({pilgrims.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('hotels')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'hotels'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-[#151c2d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>تقرير التسكين والفنادق ({roomings.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('financial')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'financial'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-[#151c2d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>تقرير الميزانية والمالية ({financeRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('staff')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'staff'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white dark:bg-[#151c2d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>تقرير المشرفين والكوادر ({staff.length})</span>
        </button>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 space-y-1">
        <h1 className="text-2xl font-bold">شركة ميجا ستار لخدمات المعتمرين</h1>
        <p className="text-sm">تقرير عمليات التسكين والرحلات المعتمد - موسم 1448 هـ</p>
        <p className="text-xs text-slate-500">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      {/* Report Content Panel */}
      <div className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        
        {activeReportTab === 'trips' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">رقم الرحلة</th>
                  <th className="p-3">اسم الرحلة</th>
                  <th className="p-3">خط السير</th>
                  <th className="p-3">الناقل الجوي</th>
                  <th className="p-3">تاريخ المغادرة</th>
                  <th className="p-3">تاريخ العودة</th>
                  <th className="p-3">رقم الحجز PNR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold">{trip.id}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{trip.trip_name}</td>
                    <td className="p-3">{trip.route}</td>
                    <td className="p-3">{trip.airline}</td>
                    <td className="p-3 font-mono">{trip.departure_date} ({trip.departure_time})</td>
                    <td className="p-3 font-mono">{trip.return_date} ({trip.return_time})</td>
                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{trip.pnr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReportTab === 'pilgrims' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">رمز المعتمر</th>
                  <th className="p-3">اسم المعتمر الكامل</th>
                  <th className="p-3">الجنس</th>
                  <th className="p-3">رقم الجواز</th>
                  <th className="p-3">الوكيل الرئيسي</th>
                  <th className="p-3">فندق مكة</th>
                  <th className="p-3">فندق المدينة</th>
                  <th className="p-3">نوع الغرفة</th>
                  <th className="p-3">حالة التأشيرة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pilgrims.slice(0, 50).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono">{p.id}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="p-3">{p.gender}</td>
                    <td className="p-3 font-mono font-bold">{p.passport_number}</td>
                    <td className="p-3">{p.agent_main}</td>
                    <td className="p-3">{p.makkah_hotel}</td>
                    <td className="p-3">{p.madinah_hotel}</td>
                    <td className="p-3 font-semibold">{p.room_type}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 rounded-md">
                        {p.visa_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center text-xs text-slate-400 mt-2">
              عرض أول 50 معتمراً من أصل {pilgrims.length} (استخدم تصدير CSV للحصول على القائمة الكاملة)
            </div>
          </div>
        )}

        {activeReportTab === 'hotels' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">الرمز</th>
                  <th className="p-3">اسم الفندق</th>
                  <th className="p-3">المدينة</th>
                  <th className="p-3">إجمالي الغرف</th>
                  <th className="p-3">غرف ثنائية</th>
                  <th className="p-3">غرف ثلاثية</th>
                  <th className="p-3">غرف رباعية</th>
                  <th className="p-3">السعة الإجمالية (أسرة)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roomings.map(r => {
                  const totalBeds = (r.double_rooms * 2) + (r.triple_rooms * 3) + (r.quad_rooms * 4);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold">{r.id}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{r.hotel_name}</td>
                      <td className="p-3 font-bold text-amber-600">{r.city}</td>
                      <td className="p-3 font-mono font-extrabold">{r.total_rooms} غرفة</td>
                      <td className="p-3">{r.double_rooms}</td>
                      <td className="p-3">{r.triple_rooms}</td>
                      <td className="p-3">{r.quad_rooms}</td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{totalBeds} سرير</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeReportTab === 'financial' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">رقم القيد</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">الفئة</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الوصف</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {financeRecords.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono">{f.id}</td>
                    <td className="p-3 font-bold">{f.type === 'revenue' ? 'إيراد' : 'مصروف'}</td>
                    <td className="p-3">{f.category}</td>
                    <td className="p-3 font-extrabold">{f.amount.toLocaleString()} ر.س</td>
                    <td className="p-3">{f.description}</td>
                    <td className="p-3 font-mono text-[11px]">{f.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReportTab === 'staff' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">رمز الموظف</th>
                  <th className="p-3">اسم الموظف / المشرف</th>
                  <th className="p-3">الدور والمسؤولية</th>
                  <th className="p-3">رقم التواصل</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold">{s.id}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="p-3">{s.role}</td>
                    <td className="p-3 font-mono">{s.phone}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        s.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
