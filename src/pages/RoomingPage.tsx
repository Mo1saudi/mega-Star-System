import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { 
  BedDouble, Hotel, Sparkles, CheckCircle2, ShieldAlert, 
  AlertTriangle, RefreshCw, Wand2, Users, Building, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export const RoomingPage: React.FC = () => {
  const { 
    roomings, pilgrims, autoRooming, validatePreflight, 
    selectedHotelFilter, updatePilgrim 
  } = useStore();

  const [activeCityTab, setActiveCityTab] = useState<'مكة' | 'المدينة'>('مكة');
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [selectedHotelForPreflight, setSelectedHotelForPreflight] = useState<string>('');

  // Dynamically extract all unique hotels from pilgrims for Makkah and Madinah
  const makkahHotelsFromPilgrims = Array.from(new Set(pilgrims.map(p => p.makkah_hotel).filter(Boolean)));
  const madinahHotelsFromPilgrims = Array.from(new Set(pilgrims.map(p => p.madinah_hotel).filter(Boolean)));

  // Combine store roomings with pilgrim hotels for the active city
  const storeCityRoomings = roomings.filter(r => r.city === activeCityTab);
  const cityHotelsFromPilgrims = activeCityTab === 'مكة' ? makkahHotelsFromPilgrims : madinahHotelsFromPilgrims;

  // Unified list of hotel objects for rendering based on main sheet data
  const hotelNamesSet = new Set([
    ...storeCityRoomings.map(r => r.hotel_name),
    ...cityHotelsFromPilgrims
  ]);

  const displayHotels = Array.from(hotelNamesSet).map((hotelName, idx) => {
    const existing = storeCityRoomings.find(r => r.hotel_name === hotelName);
    if (existing) return existing;

    const hotelKey = activeCityTab === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';
    const hotelPilgrimsCount = pilgrims.filter(p => p[hotelKey] === hotelName).length;
    const estimatedRooms = Math.max(1, Math.ceil(hotelPilgrimsCount / 3));

    return {
      id: `ROOM-DYN-${activeCityTab}-${idx + 1}`,
      hotel_name: hotelName,
      city: activeCityTab,
      total_rooms: estimatedRooms,
      double_rooms: Math.floor(estimatedRooms * 0.2),
      triple_rooms: Math.floor(estimatedRooms * 0.3),
      quad_rooms: Math.ceil(estimatedRooms * 0.5)
    };
  });

  const handleRunAutoRooming = (hotelName: string) => {
    autoRooming(hotelName, activeCityTab);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleOpenPreflight = (hotelName: string) => {
    setSelectedHotelForPreflight(hotelName);
    setShowPreflightModal(true);
  };

  const preflightReport = validatePreflight(selectedHotelForPreflight);

  return (
    <div className="space-y-6 pb-24">
      <SEO title="تسكين الفنادق" description="التسكين الذكي والـ Preflight Validation لتوزيع أسر ومعتمري العمرة على الفنادق" />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-amber-500" />
            <span>نظام التسكين الذكي والـ Preflight Check</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            التجميع التلقائي للغرف بنسب السعة (رباعي 4 ➔ ثلاثي 3 ➔ ثنائي 2) مع الفحص المسبق والأمان.
          </p>
        </div>

        {/* City Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveCityTab('مكة')}
            className={`px-5 py-2 rounded-xl text-xs font-bold font-cairo transition-all ${
              activeCityTab === 'مكة' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            فنادق مكة المكرمة
          </button>
          <button
            onClick={() => setActiveCityTab('المدينة')}
            className={`px-5 py-2 rounded-xl text-xs font-bold font-cairo transition-all ${
              activeCityTab === 'المدينة' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            فنادق المدينة المنورة
          </button>
        </div>
      </div>

      {/* Hotel Cards & Roomings */}
      <div className="space-y-6">
        {displayHotels.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Building className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-cairo">
              لا توجد فنادق مسجلة حالياً لمدينة ({activeCityTab})
            </h3>
            <p className="text-xs text-slate-500">
              تأكد من اختيار أو استيراد بيانات المعتمرين الموزعين على فنادق {activeCityTab}.
            </p>
          </div>
        ) : (
          displayHotels.map((hotel) => {
          const hotelKey = activeCityTab === 'مكة' ? 'makkah_hotel' : 'madinah_hotel';
          const hotelPilgrims = pilgrims.filter(p => p[hotelKey] === hotel.hotel_name);
          const assignedCount = hotelPilgrims.filter(p => p.room_number).length;
          const unassignedCount = hotelPilgrims.length - assignedCount;

          // Group by assigned room number
          const roomsGroupMap = new Map<string, typeof hotelPilgrims>();
          hotelPilgrims.forEach(p => {
            if (p.room_number) {
              const list = roomsGroupMap.get(p.room_number) || [];
              list.push(p);
              roomsGroupMap.set(p.room_number, list);
            }
          });

          return (
            <div 
              key={hotel.id} 
              className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4"
            >
              {/* Hotel Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo">
                      {hotel.hotel_name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      محيط {hotel.city}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>إجمالي المعتمرين: <strong className="text-slate-900 dark:text-white">{hotelPilgrims.length}</strong></span>
                    <span>تم التسكين: <strong className="text-emerald-600">{assignedCount}</strong></span>
                    <span>في الانتظار: <strong className="text-amber-600">{unassignedCount}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPreflight(hotel.hotel_name)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>فحص Preflight</span>
                  </button>

                  <button
                    onClick={() => handleRunAutoRooming(hotel.hotel_name)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all shadow-md shadow-amber-500/20 font-cairo cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>تجميع الغرف تلقائياً</span>
                  </button>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="p-5">
                {roomsGroupMap.size === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <BedDouble className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 font-cairo">
                      لم يتم توزيع الغرف لهذا الفندق بعد. اضغط "تجميع الغرف تلقائياً" للتوزيع بنسب 4 ➔ 3 ➔ 2.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(roomsGroupMap.entries()).map(([roomNo, roomPilgrims]) => {
                      const roomType = roomPilgrims[0]?.room_type || 'رباعي';
                      const gender = roomPilgrims[0]?.gender || 'ذكر';

                      return (
                        <div 
                          key={roomNo} 
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black font-mono px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300">
                                غرفة #{roomNo}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                gender === 'ذكر' ? 'bg-blue-500/10 text-blue-600' : 'bg-pink-500/10 text-pink-600'
                              }`}>
                                {gender}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 font-cairo">
                              نوع: {roomType}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {roomPilgrims.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                                <span className="text-[10px] font-mono text-slate-400">{p.passport_number}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }))}
      </div>

      {/* Preflight Modal */}
      {showPreflightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>تقرير الفحص المسبق (Preflight Check)</span>
              </h3>
              <button onClick={() => setShowPreflightModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-right">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <div>إجمالي المعتمرين بالفحص: <strong className="text-slate-900 dark:text-white">{preflightReport.stats.totalPilgrims}</strong></div>
                <div>تم تسكينهم: <strong className="text-emerald-600">{preflightReport.stats.assignedToRooms}</strong></div>
                <div>في انتظار التسكين: <strong className="text-amber-600">{preflightReport.stats.unassignedPilgrims}</strong></div>
                <div>تقدير الغرف المطلوبة: <strong className="text-blue-600">{preflightReport.stats.totalRoomsNeeded} غرف</strong></div>
              </div>

              {/* Errors */}
              {preflightReport.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-600 font-cairo">أخطاء التسكين الحرجة:</h4>
                  {preflightReport.errors.map((err, i) => (
                    <div key={i} className="p-3 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                      {err.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {preflightReport.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-600 font-cairo">تحذيرات وملاحظات:</h4>
                  {preflightReport.warnings.map((warn, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
                      {warn.message}
                    </div>
                  ))}
                </div>
              )}

              {!preflightReport.hasErrors && preflightReport.warnings.length === 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <span>تسكين متوازن ومطابق بالكامل للضوابط الشرعية والمواصفات الفندقية!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowPreflightModal(false)}
                className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
