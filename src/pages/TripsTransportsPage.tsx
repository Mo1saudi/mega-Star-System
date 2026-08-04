import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { Trip, Transport } from '../types';
import { 
  PlaneTakeoff, Bus, Plus, Printer, Edit3, Trash2, 
  MapPin, Clock, ShieldCheck, UserCheck, Calendar, Hash 
} from 'lucide-react';
import { toast } from 'sonner';

export const TripsTransportsPage: React.FC = () => {
  const { 
    trips, transports, pilgrims, staff,
    addTrip, updateTrip, deleteTrip,
    addTransport, updateTransport, deleteTransport
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'trips' | 'transports'>('trips');
  const [showTripModal, setShowTripModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTripForPrint, setSelectedTripForPrint] = useState<Trip | null>(null);

  // Trip form
  const [tripFormData, setTripFormData] = useState<Partial<Trip>>({
    trip_name: '',
    pnr: '',
    route: 'القاهرة (CAI) ➔ جدة (JED)',
    airline: 'مصر للطيران',
    departure_date: '2026-08-15',
    departure_time: '08:00',
    return_date: '2026-08-25',
    return_time: '18:00'
  });

  // Transport form
  const [trnFormData, setTrnFormData] = useState<Partial<Transport>>({
    shift_number: 'وردية A1',
    trip_id: trips[0]?.id || 'TRIP-101',
    pickup_time: '2026-08-15 12:00',
    from_location: 'مطار الملك عبد العزيز',
    to_location: 'فندق أنجم مكة',
    vehicle_type: 'حافلة VIP 50 راكب',
    ground_supervisor: staff[0]?.name || 'عبد الرحمن الشريف'
  });

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripFormData.trip_name || !tripFormData.pnr) return;
    addTrip(tripFormData as Omit<Trip, 'id'>);
    setShowTripModal(false);
  };

  const handleSaveTransport = (e: React.FormEvent) => {
    e.preventDefault();
    addTransport(trnFormData as Omit<Transport, 'id'>);
    setShowTransportModal(false);
  };

  const handlePrintPassengerList = (trip: Trip) => {
    setSelectedTripForPrint(trip);
    setShowPrintModal(true);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24">
      <SEO title="الرحلات والنقل" description="إدارة جدول رحلات الطيران ورموز PNR وورديات حافلات نقل المعتمرين وقوائم المسافرين" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <PlaneTakeoff className="w-5 h-5 text-amber-500" />
            <span>جدول الرحلات وشيفتات النقل الحافلات</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة رموز PNR والمشرفين الميدانيين وطباعة كشوف المغادرة.
          </p>
        </div>

        {/* SubTab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('trips')}
            className={`px-5 py-2 rounded-xl text-xs font-bold font-cairo transition-all ${
              activeSubTab === 'trips' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            جدول رحلات الطيران
          </button>
          <button
            onClick={() => setActiveSubTab('transports')}
            className={`px-5 py-2 rounded-xl text-xs font-bold font-cairo transition-all ${
              activeSubTab === 'transports' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ورديات النقل والتفويج
          </button>
        </div>
      </div>

      {/* Content: Trips Tab */}
      {activeSubTab === 'trips' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTripModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-cairo shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة رحلة طيران</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const tripPilgrims = pilgrims.filter(p => p.trip_id === trip.id);

              return (
                <div key={trip.id} className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo">
                          {trip.trip_name}
                        </h3>
                        <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                          PNR: {trip.pnr}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTrip(trip.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">مسار الطيران:</span>
                        <span className="font-bold">{trip.route}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">شركة الطيران:</span>
                        <span className="font-bold">{trip.airline}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">تاريخ الذهاب:</span>
                        <span className="font-mono">{trip.departure_date} ({trip.departure_time})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">تاريخ العودة:</span>
                        <span className="font-mono">{trip.return_date} ({trip.return_time})</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">المسافرين المسجلين:</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-bold">{tripPilgrims.length} معتمر</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePrintPassengerList(trip)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>طباعة قائمة المسافرين</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content: Transports Tab */}
      {activeSubTab === 'transports' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTransportModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-cairo shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شيفت نقل جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transports.map((trn) => (
              <div key={trn.id} className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bus className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo">
                      {trn.shift_number}
                    </h3>
                  </div>
                  <button
                    onClick={() => deleteTransport(trn.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <div><span className="text-slate-400">من:</span> {trn.from_location}</div>
                  <div><span className="text-slate-400">إلى:</span> {trn.to_location}</div>
                  <div><span className="text-slate-400">موعد التحرك:</span> {trn.pickup_time}</div>
                  <div><span className="text-slate-400">نوع المركبة:</span> {trn.vehicle_type}</div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                    <span className="text-slate-400">المشرف الميداني المسؤول:</span> <strong className="text-amber-600">{trn.ground_supervisor}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Passenger List Modal */}
      {showPrintModal && selectedTripForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl p-8 shadow-2xl space-y-6 my-8 print:p-0 print:shadow-none">
            {/* Printable Header */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-4">
              <div>
                <h2 className="text-2xl font-black font-cairo text-slate-950">
                  شركة ميجا ستار لإدارة خدمات العمرة
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  كشف وأسماء مسافري رحلة الطيران المعتمدة - موسم 1448 هـ
                </p>
              </div>
              <div className="text-left font-mono text-xs">
                <div><strong>PNR:</strong> {selectedTripForPrint.pnr}</div>
                <div><strong>الرحلة:</strong> {selectedTripForPrint.trip_name}</div>
                <div><strong>التاريخ:</strong> {selectedTripForPrint.departure_date}</div>
              </div>
            </div>

            {/* Table of Passengers */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">#</th>
                    <th className="p-2 border-r border-slate-300">اسم المعتمر الكامل</th>
                    <th className="p-2 border-r border-slate-300">الجنس</th>
                    <th className="p-2 border-r border-slate-300">رقم الجواز</th>
                    <th className="p-2 border-r border-slate-300">فندق مكة</th>
                    <th className="p-2 border-r border-slate-300">نوع الغرفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pilgrims.filter(p => p.trip_id === selectedTripForPrint.id).map((p, idx) => (
                    <tr key={p.id}>
                      <td className="p-2 border-r border-slate-300 font-mono text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-300 font-bold">{p.name}</td>
                      <td className="p-2 border-r border-slate-300">{p.gender}</td>
                      <td className="p-2 border-r border-slate-300 font-mono">{p.passport_number}</td>
                      <td className="p-2 border-r border-slate-300">{p.makkah_hotel}</td>
                      <td className="p-2 border-r border-slate-300">{p.room_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-300 no-print">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إغلاق
              </button>
              <button
                onClick={triggerBrowserPrint}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>طباعة الكشف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Trip */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">إضافة رحلة طيران جديدة</h3>
            <form onSubmit={handleSaveTrip} className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم الرحلة</label>
                <input
                  type="text"
                  required
                  value={tripFormData.trip_name}
                  onChange={e => setTripFormData({ ...tripFormData, trip_name: e.target.value })}
                  placeholder="مثال: رحلة الإسراء 1"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رمز PNR</label>
                <input
                  type="text"
                  required
                  value={tripFormData.pnr}
                  onChange={e => setTripFormData({ ...tripFormData, pnr: e.target.value })}
                  placeholder="مثال: SV992K"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTripModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600"
                >
                  حفظ الرحلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Transport */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">إضافة حركة نقل جديدة</h3>
            <form onSubmit={handleSaveTransport} className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم/اسم الشيفت</label>
                <input
                  type="text"
                  required
                  value={trnFormData.shift_number}
                  onChange={e => setTrnFormData({ ...trnFormData, shift_number: e.target.value })}
                  placeholder="مثال: وردية A3"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600"
                >
                  حفظ حركة النقل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
