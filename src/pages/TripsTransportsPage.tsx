import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { Trip, Transport, Pilgrim } from '../types';
import { 
  PlaneTakeoff, Bus, Plus, Printer, Edit3, Trash2, 
  MapPin, Clock, ShieldCheck, UserCheck, Calendar, Hash, FileText, X, CheckCircle2, Sparkles,
  UserPlus, Users, Search, CheckSquare, Square, ArrowRightLeft, UserX
} from 'lucide-react';
import { toast } from 'sonner';

export const TripsTransportsPage: React.FC = () => {
  const { 
    trips, transports, pilgrims, staff,
    addTrip, updateTrip, deleteTrip,
    addTransport, updateTransport, deleteTransport,
    updatePilgrim, bulkUpdatePilgrims
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'trips' | 'transports'>('trips');
  
  // Modals visibility
  const [showTripModal, setShowTripModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showTripPilgrimsModal, setShowTripPilgrimsModal] = useState(false);
  const [showTransportPilgrimsModal, setShowTransportPilgrimsModal] = useState(false);

  // Edit IDs
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);

  // Selected records for modals
  const [selectedTripForPrint, setSelectedTripForPrint] = useState<Trip | null>(null);
  const [selectedTransportForDispatch, setSelectedTransportForDispatch] = useState<Transport | null>(null);
  const [selectedTripForPilgrims, setSelectedTripForPilgrims] = useState<Trip | null>(null);
  const [selectedTransportForPilgrims, setSelectedTransportForPilgrims] = useState<Transport | null>(null);

  // Pilgrim selection state inside assignment modals
  const [tripPilgrimsSearch, setTripPilgrimsSearch] = useState('');
  const [selectedPilgrimIdsForTrip, setSelectedPilgrimIdsForTrip] = useState<string[]>([]);
  
  const [transportPilgrimsSearch, setTransportPilgrimsSearch] = useState('');
  const [selectedPilgrimIdsForTransport, setSelectedPilgrimIdsForTransport] = useState<string[]>([]);
  const [selectedFlightForTransportImport, setSelectedFlightForTransportImport] = useState<string>('');

  // Linked Transport creation state when adding a comprehensive trip
  const [createLinkedTransport, setCreateLinkedTransport] = useState(true);
  const [linkedVehicleType, setLinkedVehicleType] = useState('حافلة VIP 50 راكب');
  const [linkedMakkahHotel, setLinkedMakkahHotel] = useState('فندق أنجم مكة');
  const [linkedMadinahHotel, setLinkedMadinahHotel] = useState('فندق دار الهجرة المدينة');
  const [linkedOperatingNumber, setLinkedOperatingNumber] = useState('480900505396');

  // Trip form
  const [tripFormData, setTripFormData] = useState<Partial<Trip>>({
    trip_name: 'رحلة الإسراء 1',
    pnr: 'SV992K',
    airline: 'مصر للطيران',
    passenger_count: 45,
    departure_date: '2026-08-15',
    route: 'القاهرة (CAI) ➔ جدة (JED)',
    flight_number_outbound: 'MS663',
    arrival_time: '11:30',
    return_date: '2026-08-25',
    return_route: 'المدينة (MED) ➔ القاهرة (CAI)',
    flight_number_inbound: 'MS664',
    departure_time: '16:00',
    status: 'مؤكد'
  });

  // Transport form
  const [trnFormData, setTrnFormData] = useState<Partial<Transport>>({
    umrah_operating_number: '480900505396',
    trip_name: 'تفويج وصل مطار جدة إلى مكة المكرمة',
    shift_number: 'وردية A1',
    date: '2026-08-15',
    ground_supervisor: staff[0]?.name || 'عبد الرحمن الشريف',
    pickup_time: '12:00',
    from_location: 'مطار الملك عبد العزيز - جدة',
    to_location: 'فندق أنجم - مكة المكرمة',
    makkah_hotel: 'فندق أنجم مكة',
    madinah_hotel: 'فندق دار التقوى المدينة',
    passenger_count: 45,
    vehicle_type: 'حافلة VIP 50 راكب',
    external_agent: 'ميجا ستار / شركة برايت لخدمات المعتمرين',
    supervisor: staff[1]?.name || 'أحمد فاروق',
    group_number: '480900505396',
    flight_number: 'MS663',
    airline_type: 'مصر للطيران',
    flight_time: '11:30 ص',
    return_details: 'عودة يوم 25/8 الساعة 4 عصراً من مطار المدينة',
    rawdah_permit_time: '18/08/2026 - 10:00 مساءً (النساء: 08:00 صباحاً)'
  });

  // Open Add Trip
  const handleOpenAddTrip = () => {
    setEditingTripId(null);
    setTripFormData({
      trip_name: '',
      pnr: '',
      airline: 'مصر للطيران',
      passenger_count: 45,
      departure_date: new Date().toISOString().split('T')[0],
      route: 'القاهرة (CAI) ➔ جدة (JED)',
      flight_number_outbound: 'MS663',
      arrival_time: '11:30 ص',
      return_date: '',
      return_route: 'المدينة (MED) ➔ القاهرة (CAI)',
      flight_number_inbound: 'MS664',
      departure_time: '16:00',
      status: 'مؤكد'
    });
    setShowTripModal(true);
  };

  // Open Edit Trip
  const handleOpenEditTrip = (trip: Trip) => {
    setEditingTripId(trip.id);
    setTripFormData({ ...trip });
    setShowTripModal(true);
  };

  // Save Trip (Add or Edit)
  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripFormData.trip_name || !tripFormData.pnr) {
      toast.error('يرجى ملء كافة البيانات المطلوبة للرحلة');
      return;
    }
    if (editingTripId) {
      updateTrip(editingTripId, tripFormData);
      toast.success('تم تحديث بيانات رحلة الطيران بنجاح');
    } else {
      addTrip(tripFormData as Omit<Trip, 'id'>);

      // Create linked transport automatically if option checked
      if (createLinkedTransport) {
        addTransport({
          trip_id: `TRIP-${Date.now().toString().slice(-4)}`,
          trip_name: `تفويج ونقل (${tripFormData.trip_name})`,
          shift_number: `وردية A1 - PNR ${tripFormData.pnr}`,
          date: tripFormData.departure_date || new Date().toISOString().split('T')[0],
          pickup_time: tripFormData.arrival_time || '11:30 ص',
          from_location: 'مطار الملك عبد العزيز (جدة) / مطار المدينة',
          to_location: linkedMakkahHotel || 'فندق أنجم مكة',
          makkah_hotel: linkedMakkahHotel || 'فندق أنجم مكة',
          madinah_hotel: linkedMadinahHotel || 'فندق دار الهجرة المدينة',
          vehicle_type: linkedVehicleType || 'حافلة VIP 50 راكب',
          ground_supervisor: staff[0]?.name || 'عبد الرحمن الشريف',
          passenger_count: tripFormData.passenger_count || 45,
          flight_number: tripFormData.flight_number_outbound || 'MS663',
          airline_type: tripFormData.airline || 'مصر للطيران',
          flight_time: tripFormData.arrival_time || '11:30 ص',
          umrah_operating_number: linkedOperatingNumber || '480900505396'
        });
        toast.success(`تم إنشاء رحلة الطيران (${tripFormData.trip_name}) وحركة النقل البري المرتبطة بها بنجاح! ✈️🚌`);
      } else {
        toast.success(`تم إضافة رحلة الطيران (${tripFormData.trip_name}) بنجاح`);
      }
    }
    setShowTripModal(false);
  };

  // Open Add Transport
  const handleOpenAddTransport = () => {
    setEditingTransportId(null);
    setTrnFormData({
      umrah_operating_number: '480900505396',
      trip_name: 'تفويج وصل مطار جدة إلى مكة المكرمة',
      shift_number: 'وردية A1',
      date: new Date().toISOString().split('T')[0],
      ground_supervisor: staff[0]?.name || 'عبد الرحمن الشريف',
      pickup_time: '12:00',
      from_location: 'مطار الملك عبد العزيز - جدة',
      to_location: 'فندق أنجم - مكة المكرمة',
      makkah_hotel: 'فندق أنجم مكة',
      madinah_hotel: 'فندق دار التقوى المدينة',
      passenger_count: 45,
      vehicle_type: 'حافلة VIP 50 راكب',
      external_agent: 'ميجا ستار / شركة برايت لخدمات المعتمرين',
      supervisor: staff[1]?.name || 'أحمد فاروق',
      group_number: '480900505396',
      flight_number: 'MS663',
      airline_type: 'مصر للطيران',
      flight_time: '11:30 ص',
      return_details: 'عودة يوم 25/8 الساعة 4 عصراً من مطار المدينة',
      rawdah_permit_time: '18/08/2026 - 10:00 مساءً (النساء: 08:00 صباحاً)'
    });
    setShowTransportModal(true);
  };

  // Open Edit Transport
  const handleOpenEditTransport = (trn: Transport) => {
    setEditingTransportId(trn.id);
    setTrnFormData({ ...trn });
    setShowTransportModal(true);
  };

  // Save Transport (Add or Edit)
  const handleSaveTransport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trnFormData.shift_number && !trnFormData.trip_name) {
      toast.error('يرجى كتابة اسم أو رقم الحركة');
      return;
    }
    if (editingTransportId) {
      updateTransport(editingTransportId, trnFormData);
      toast.success('تم تحديث حركة النقل والتفويج بنجاح');
    } else {
      addTransport(trnFormData as Omit<Transport, 'id'>);
      toast.success('تم إضافة حركة النقل والتفويج بنجاح');
    }
    setShowTransportModal(false);
  };

  // Open Manage Trip Pilgrims Modal
  const handleOpenManageTripPilgrims = (trip: Trip) => {
    setSelectedTripForPilgrims(trip);
    setSelectedPilgrimIdsForTrip([]);
    setTripPilgrimsSearch('');
    setShowTripPilgrimsModal(true);
  };

  // Toggle selection for trip assignment
  const toggleSelectPilgrimForTrip = (id: string) => {
    setSelectedPilgrimIdsForTrip(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Bulk add selected pilgrims to trip
  const handleAddSelectedPilgrimsToTrip = () => {
    if (!selectedTripForPilgrims || selectedPilgrimIdsForTrip.length === 0) return;
    bulkUpdatePilgrims(selectedPilgrimIdsForTrip, { trip_id: selectedTripForPilgrims.id });
    toast.success(`تم إضافة (${selectedPilgrimIdsForTrip.length}) معتمر إلى الرحلة بنجاح!`);
    setSelectedPilgrimIdsForTrip([]);
  };

  // Remove pilgrim from trip
  const handleRemovePilgrimFromTrip = (pilgrimId: string) => {
    updatePilgrim(pilgrimId, { trip_id: '' });
    toast.info('تم إزالة المعتمر من هذه الرحلة');
  };

  // Open Manage Transport Pilgrims Modal
  const handleOpenManageTransportPilgrims = (trn: Transport) => {
    setSelectedTransportForPilgrims(trn);
    setSelectedPilgrimIdsForTransport([]);
    setTransportPilgrimsSearch('');
    setSelectedFlightForTransportImport('');
    setShowTransportPilgrimsModal(true);
  };

  // Toggle selection for transport assignment
  const toggleSelectPilgrimForTransport = (id: string) => {
    setSelectedPilgrimIdsForTransport(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Bulk add selected pilgrims to transport
  const handleAddSelectedPilgrimsToTransport = () => {
    if (!selectedTransportForPilgrims || selectedPilgrimIdsForTransport.length === 0) return;
    bulkUpdatePilgrims(selectedPilgrimIdsForTransport, { transport_id: selectedTransportForPilgrims.id });
    toast.success(`تم تخصيص (${selectedPilgrimIdsForTransport.length}) معتمر على هذه الحافلة بنجاح! 🚌`);
    setSelectedPilgrimIdsForTransport([]);
  };

  // Import all pilgrims from a flight trip to transport
  const handleImportFlightPilgrimsToTransport = () => {
    if (!selectedTransportForPilgrims || !selectedFlightForTransportImport) return;
    const flightPilgrimIds = pilgrims.filter(p => p.trip_id === selectedFlightForTransportImport).map(p => p.id);
    if (flightPilgrimIds.length === 0) {
      toast.warning('لا يوجد معتمرين مسجلين على رحلة الطيران المحددة');
      return;
    }
    bulkUpdatePilgrims(flightPilgrimIds, { transport_id: selectedTransportForPilgrims.id });
    toast.success(`تم استيراد وتخصيص (${flightPilgrimIds.length}) معتمر من رحلة الطيران إلى حافلة النقل بنجاح! 🚌`);
    setSelectedFlightForTransportImport('');
  };

  // Remove pilgrim from transport
  const handleRemovePilgrimFromTransport = (pilgrimId: string) => {
    updatePilgrim(pilgrimId, { transport_id: undefined });
    toast.info('تم إزالة المعتمر من حافلة النقل');
  };

  const handlePrintPassengerList = (trip: Trip) => {
    setSelectedTripForPrint(trip);
    setShowPrintModal(true);
  };

  const handleOpenDispatchForm = (trn: Transport) => {
    setSelectedTransportForDispatch(trn);
    setShowDispatchModal(true);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 font-cairo dir-rtl animate-in fade-in duration-200">
      <SEO title="الرحلات والنقل" description="إدارة جدول رحلات الطيران ورموز PNR وورديات حافلات نقل المعتمرين وقوائم التفويج" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PlaneTakeoff className="w-5 h-5 text-amber-500" />
            <span>جدول رحلات الطيران وورديات حركة النقل والتفويج</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة وتعديل PNR والخطوط الناقلة وتعيين المعتمرين الرسميين ونماذج أمر التشغيل والتفويج.
          </p>
        </div>

        {/* SubTab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('trips')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'trips' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            جدول رحلات الطيران ({trips.length})
          </button>
          <button
            onClick={() => setActiveSubTab('transports')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'transports' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ورديات النقل والتفويج ({transports.length})
          </button>
        </div>
      </div>

      {/* CONTENT: TRIPS TAB */}
      {activeSubTab === 'trips' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddTrip}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة رحلة طيران جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const tripPilgrims = pilgrims.filter(p => p.trip_id === trip.id);

              return (
                <div key={trip.id} className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {trip.trip_name}
                          </h3>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            trip.status === 'مؤكد' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                          }`}>
                            {trip.status || 'مؤكد'}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                          PNR: {trip.pnr}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditTrip(trip)}
                          title="تعديل بيانات الرحلة"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTrip(trip.id)}
                          title="حذف الرحلة"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">الشركة الناقلة:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{trip.airline}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">سعة الرحلة:</span>
                        <span className="font-mono font-bold">{trip.passenger_count || 45} مقعد</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">تاريخ ورقم رحلة الذهاب:</span>
                        <span className="font-mono font-bold text-amber-600">{trip.departure_date} | {trip.flight_number_outbound || 'MS663'} ({trip.departure_time})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">خط سير الذهاب:</span>
                        <span className="font-bold">{trip.route}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ساعة الوصول:</span>
                        <span className="font-mono">{trip.arrival_time || '11:30 ص'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-400">تاريخ ورقم رحلة العودة:</span>
                        <span className="font-mono font-bold text-blue-600">{trip.return_date} | {trip.flight_number_inbound || 'MS664'} ({trip.return_time})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">خط سير العودة:</span>
                        <span className="font-bold">{trip.return_route || trip.route}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-400 font-bold">المسافرين المسجلين:</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-extrabold">{tripPilgrims.length} معتمر</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenManageTripPilgrims(trip)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>إضافة وتعديل المعتمرين على الرحلة ({tripPilgrims.length})</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditTrip(trip)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل تفاصيل الرحلة</span>
                      </button>

                      <button
                        onClick={() => handlePrintPassengerList(trip)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>طباعة الكشف</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENT: TRANSPORTS TAB */}
      {activeSubTab === 'transports' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddTransport}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حركة نقل / تفويج جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transports.map((trn) => {
              const transportPilgrims = pilgrims.filter(p => p.transport_id === trn.id);

              return (
                <div key={trn.id} className="bg-white dark:bg-[#151c2d] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Bus className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {trn.trip_name || trn.shift_number}
                          </h3>
                          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                            تشغيلة رقم: {trn.umrah_operating_number || '480900505396'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditTransport(trn)}
                          title="تعديل بيانات الحركة"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTransport(trn.id)}
                          title="حذف الحركة"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                      <div><span className="text-slate-400">التاريخ:</span> <strong className="font-mono">{trn.date || '2026-08-15'}</strong></div>
                      <div><span className="text-slate-400">ساعة التحرك:</span> <strong className="font-mono">{trn.pickup_time}</strong></div>
                      <div><span className="text-slate-400">من:</span> {trn.from_location}</div>
                      <div><span className="text-slate-400">إلى:</span> {trn.to_location}</div>
                      <div><span className="text-slate-400">فندق مكة:</span> {trn.makkah_hotel || 'فندق أنجم مكة'}</div>
                      <div><span className="text-slate-400">فندق المدينة:</span> {trn.madinah_hotel || 'فندق دار التقوى'}</div>
                      <div><span className="text-slate-400">العدد المحدد:</span> <strong className="font-mono">{trn.passenger_count || 45} معتمر</strong></div>
                      <div><span className="text-slate-400">نوع المركبة:</span> {trn.vehicle_type}</div>
                      <div><span className="text-slate-400">الوكيل الخارجي:</span> {trn.external_agent || 'شركة برايت'}</div>
                      <div><span className="text-slate-400">رقم الرحلة/الطيران:</span> <strong className="font-mono">{trn.flight_number || 'MS663'} ({trn.airline_type || 'مصر للطيران'})</strong></div>
                      <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-slate-400">المعتمرين المخصصين بالحافلة:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {transportPilgrims.length} معتمر
                        </span>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-slate-400">مشرف الأرضية / المشرف:</span> <strong className="text-amber-600 dark:text-amber-400">{trn.ground_supervisor || trn.supervisor || 'عبد الرحمن الشريف'}</strong>
                      </div>
                      {trn.rawdah_permit_time && (
                        <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-purple-700 dark:text-purple-300 bg-purple-500/10 p-2 rounded-xl">
                          <span className="flex items-center gap-1 font-bold text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>تصريح الروضة:</span>
                          </span>
                          <strong className="font-mono text-xs">{trn.rawdah_permit_time}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenManageTransportPilgrims(trn)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>تخصيص ركاب الحافلة / المعتمرين ({transportPilgrims.length})</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditTransport(trn)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل الحركة</span>
                      </button>

                      <button
                        onClick={() => handleOpenDispatchForm(trn)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>أمر التشغيل</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT TRIP */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-amber-500" />
                <span>{editingTripId ? 'تعديل بيانات رحلة الطيران' : 'إضافة رحلة طيران جديدة'}</span>
              </h3>
              <button onClick={() => setShowTripModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrip} className="space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم الرحلة</label>
                  <input
                    type="text"
                    required
                    value={tripFormData.trip_name || ''}
                    onChange={e => setTripFormData({ ...tripFormData, trip_name: e.target.value })}
                    placeholder="مثال: رحلة الإسراء 1"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رمز الحجز (PNR)</label>
                  <input
                    type="text"
                    required
                    value={tripFormData.pnr || ''}
                    onChange={e => setTripFormData({ ...tripFormData, pnr: e.target.value })}
                    placeholder="مثال: SV992K"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الشركة الناقلة</label>
                  <input
                    type="text"
                    required
                    value={tripFormData.airline || ''}
                    onChange={e => setTripFormData({ ...tripFormData, airline: e.target.value })}
                    placeholder="مثال: مصر للطيران / الخطوط السعودية"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">العدد (سعة مقاعد الرحلة)</label>
                  <input
                    type="number"
                    value={tripFormData.passenger_count || 45}
                    onChange={e => setTripFormData({ ...tripFormData, passenger_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاريخ الذهاب</label>
                  <input
                    type="date"
                    value={tripFormData.departure_date || ''}
                    onChange={e => setTripFormData({ ...tripFormData, departure_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">خط السير (الذهاب)</label>
                  <input
                    type="text"
                    value={tripFormData.route || ''}
                    onChange={e => setTripFormData({ ...tripFormData, route: e.target.value })}
                    placeholder="القاهرة (CAI) ➔ جدة (JED)"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم رحلة الذهاب</label>
                  <input
                    type="text"
                    value={tripFormData.flight_number_outbound || ''}
                    onChange={e => setTripFormData({ ...tripFormData, flight_number_outbound: e.target.value })}
                    placeholder="MS663"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ساعة الوصول</label>
                  <input
                    type="text"
                    value={tripFormData.arrival_time || ''}
                    onChange={e => setTripFormData({ ...tripFormData, arrival_time: e.target.value })}
                    placeholder="11:30 صباحاً"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاريخ العودة</label>
                  <input
                    type="date"
                    value={tripFormData.return_date || ''}
                    onChange={e => setTripFormData({ ...tripFormData, return_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم رحلة العودة</label>
                  <input
                    type="text"
                    value={tripFormData.flight_number_inbound || ''}
                    onChange={e => setTripFormData({ ...tripFormData, flight_number_inbound: e.target.value })}
                    placeholder="MS664"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ساعة الإقلاع (العودة)</label>
                  <input
                    type="text"
                    value={tripFormData.departure_time || ''}
                    onChange={e => setTripFormData({ ...tripFormData, departure_time: e.target.value })}
                    placeholder="16:00"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">حالة التأكيد</label>
                  <select
                    value={tripFormData.status || 'مؤكد'}
                    onChange={e => setTripFormData({ ...tripFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  >
                    <option value="مؤكد">مؤكد</option>
                    <option value="مبدئي">مبدئي</option>
                    <option value="تحت الطلب">تحت الطلب</option>
                  </select>
                </div>
              </div>

              {!editingTripId && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-amber-900 dark:text-amber-300">
                      <input
                        type="checkbox"
                        checked={createLinkedTransport}
                        onChange={e => setCreateLinkedTransport(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>إنشاء حركة نقل بري وتفويج حافلات موازية تلقائياً للرحلة (طيران + نقل) 🚌</span>
                    </label>
                  </div>

                  {createLinkedTransport && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-500/20 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">نوع حافلة / مركبة النقل</label>
                        <select
                          value={linkedVehicleType}
                          onChange={e => setLinkedVehicleType(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white"
                        >
                          <option value="حافلة VIP 50 راكب">حافلة VIP 50 راكب</option>
                          <option value="حافلة حديثة 45 راكب">حافلة حديثة 45 راكب</option>
                          <option value="فان VIP 12 راكب">فان VIP 12 راكب</option>
                          <option value="سيارة خاصة GMC">سيارة خاصة GMC</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">رقم التشغيلة الرسمي</label>
                        <input
                          type="text"
                          value={linkedOperatingNumber}
                          onChange={e => setLinkedOperatingNumber(e.target.value)}
                          placeholder="480900505396"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">فندق مكة المكرمة المخصص</label>
                        <input
                          type="text"
                          value={linkedMakkahHotel}
                          onChange={e => setLinkedMakkahHotel(e.target.value)}
                          placeholder="فندق أنجم مكة"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">فندق المدينة المنورة المخصص</label>
                        <input
                          type="text"
                          value={linkedMadinahHotel}
                          onChange={e => setLinkedMadinahHotel(e.target.value)}
                          placeholder="فندق دار الهجرة المدينة"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition-colors"
                >
                  {editingTripId ? 'تحديث بيانات الرحلة' : 'حفظ بيانات الرحلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT TRANSPORT */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-500" />
                <span>{editingTransportId ? 'تعديل بيانات حركة النقل والتفويج' : 'إضافة حركة نقل جديدة / أمر تفويج'}</span>
              </h3>
              <button onClick={() => setShowTransportModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransport} className="space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم تشغيلة العمرة</label>
                  <input
                    type="text"
                    value={trnFormData.umrah_operating_number || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, umrah_operating_number: e.target.value })}
                    placeholder="480900505396"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم الرحلة / التشغيلة</label>
                  <input
                    type="text"
                    required
                    value={trnFormData.trip_name || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, trip_name: e.target.value })}
                    placeholder="مثال: نقل وصول مطار جدة"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={trnFormData.date || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">مشرف الأرضية</label>
                  <input
                    type="text"
                    value={trnFormData.ground_supervisor || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, ground_supervisor: e.target.value })}
                    placeholder="عبد الرحمن الشريف"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ساعة تحرك</label>
                  <input
                    type="text"
                    value={trnFormData.pickup_time || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, pickup_time: e.target.value })}
                    placeholder="12:00"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">من (نقطة الانطلاق)</label>
                  <input
                    type="text"
                    value={trnFormData.from_location || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, from_location: e.target.value })}
                    placeholder="مطار جدة"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">إلى (الوجهة)</label>
                  <input
                    type="text"
                    value={trnFormData.to_location || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, to_location: e.target.value })}
                    placeholder="فندق أنجم مكة"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">فندق مكة المكرمة</label>
                  <input
                    type="text"
                    value={trnFormData.makkah_hotel || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, makkah_hotel: e.target.value })}
                    placeholder="فندق أنجم مكة"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">فندق المدينة المنورة</label>
                  <input
                    type="text"
                    value={trnFormData.madinah_hotel || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, madinah_hotel: e.target.value })}
                    placeholder="فندق دار التقوى"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">العدد (سعة الحافلة)</label>
                  <input
                    type="number"
                    value={trnFormData.passenger_count || 45}
                    onChange={e => setTrnFormData({ ...trnFormData, passenger_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">نوع السيارة / الحافلة</label>
                  <input
                    type="text"
                    value={trnFormData.vehicle_type || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, vehicle_type: e.target.value })}
                    placeholder="حافلة VIP 50 راكب"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الوكيل الخارجي</label>
                  <input
                    type="text"
                    value={trnFormData.external_agent || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, external_agent: e.target.value })}
                    placeholder="ميجا ستار"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المشرف المسؤول</label>
                  <input
                    type="text"
                    value={trnFormData.supervisor || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, supervisor: e.target.value })}
                    placeholder="أحمد فاروق"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم المجموعة</label>
                  <input
                    type="text"
                    value={trnFormData.group_number || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, group_number: e.target.value })}
                    placeholder="480900505396"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم الرحلة ونوع الطيران</label>
                  <input
                    type="text"
                    value={trnFormData.flight_number || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, flight_number: e.target.value })}
                    placeholder="MS663 - مصر للطيران"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">موعد إقلاع أو الهبوط</label>
                  <input
                    type="text"
                    value={trnFormData.flight_time || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, flight_time: e.target.value })}
                    placeholder="11:30 صباحاً"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">عودات وتفاصيل العودة</label>
                  <input
                    type="text"
                    value={trnFormData.return_details || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, return_details: e.target.value })}
                    placeholder="عودة يوم 25/8 الساعة 4 عصراً من مطار المدينة"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>معاد/تصريح حجز الروضة الشريفة</span>
                  </label>
                  <input
                    type="text"
                    value={trnFormData.rawdah_permit_time || ''}
                    onChange={e => setTrnFormData({ ...trnFormData, rawdah_permit_time: e.target.value })}
                    placeholder="مثال: 18/08/2026 - 10:00 مساءً (النساء: 08:00 صباحاً)"
                    className="w-full px-3 py-2 text-xs bg-purple-50/50 dark:bg-purple-950/20 text-slate-900 dark:text-slate-100 rounded-xl border border-purple-200 dark:border-purple-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition-colors"
                >
                  {editingTransportId ? 'تحديث بيانات الحركة' : 'حفظ حركة النقل والتفويج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE PILGRIMS ON TRIP (إضافة وتعديل المعتمرين على رحلة الطيران) */}
      {showTripPilgrimsModal && selectedTripForPilgrims && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-500" />
                  <span>إدارة وتعيين المعتمرين على الرحلة: {selectedTripForPilgrims.trip_name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  رمز الحجز PNR: <strong className="font-mono text-amber-600">{selectedTripForPilgrims.pnr}</strong> | شركة الطيران: {selectedTripForPilgrims.airline}
                </p>
              </div>
              <button 
                onClick={() => setShowTripPilgrimsModal(false)} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats header */}
            {(() => {
              const currentAssigned = pilgrims.filter(p => p.trip_id === selectedTripForPilgrims.id);
              const totalCapacity = selectedTripForPilgrims.passenger_count || 45;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-center sm:border-l border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">سعة مقاعد الرحلة</span>
                    <strong className="text-sm font-mono text-slate-900 dark:text-white font-black">{totalCapacity} مقعد</strong>
                  </div>
                  <div className="text-center sm:border-l border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">المعتمرين المسجلين حالياً</span>
                    <strong className="text-sm font-mono text-emerald-600 font-black">{currentAssigned.length} معتمر</strong>
                  </div>
                  <div className="text-center col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">المقاعد المتبقية</span>
                    <strong className="text-sm font-mono text-amber-600 font-black">{Math.max(0, totalCapacity - currentAssigned.length)} مقعد</strong>
                  </div>
                </div>
              );
            })()}

            {/* Currently assigned list */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>المعتمرون المسجلون فعلياً على هذه الرحلة ({pilgrims.filter(p => p.trip_id === selectedTripForPilgrims.id).length}):</span>
              </h4>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/40">
                {pilgrims.filter(p => p.trip_id === selectedTripForPilgrims.id).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">لا يوجد أي معتمر مضاف على هذه الرحلة بعد.</p>
                ) : (
                  pilgrims.filter(p => p.trip_id === selectedTripForPilgrims.id).map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white dark:bg-[#151c2d] p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                      <div>
                        <strong className="text-slate-900 dark:text-white font-bold block">{p.name}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">الجواز: {p.passport_number} | الوكيل: {p.agent_main}</span>
                      </div>
                      <button
                        onClick={() => handleRemovePilgrimFromTrip(p.id)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>إزالة</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add new pilgrims section */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  <span>اختر المعتمرين لإضافتهم إلى هذه الرحلة:</span>
                </h4>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="بحث باسم المعتمر أو رقم الجواز..."
                    value={tripPilgrimsSearch}
                    onChange={(e) => setTripPilgrimsSearch(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Unassigned or other pilgrims list */}
              {(() => {
                const unassignedOrOthers = pilgrims.filter(p => {
                  if (p.trip_id === selectedTripForPilgrims.id) return false;
                  if (!tripPilgrimsSearch.trim()) return true;
                  const query = tripPilgrimsSearch.toLowerCase();
                  return p.name.toLowerCase().includes(query) || p.passport_number.toLowerCase().includes(query) || (p.agent_main && p.agent_main.toLowerCase().includes(query));
                });

                const allSelected = unassignedOrOthers.length > 0 && unassignedOrOthers.every(p => selectedPilgrimIdsForTrip.includes(p.id));

                const toggleSelectAll = () => {
                  if (allSelected) {
                    setSelectedPilgrimIdsForTrip([]);
                  } else {
                    setSelectedPilgrimIdsForTrip(unassignedOrOthers.map(p => p.id));
                  }
                };

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="flex items-center gap-1.5 font-bold text-amber-600 hover:underline cursor-pointer"
                      >
                        {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span>تحديد كل المعروضين ({unassignedOrOthers.length})</span>
                      </button>
                      <span>تم تحديد: {selectedPilgrimIdsForTrip.length} معتمر</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/30 dark:bg-slate-900/20">
                      {unassignedOrOthers.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">جميع المعتمرين مضافون بالفعل أو لا يوجد نتائج مطابقة للبحث.</p>
                      ) : (
                        unassignedOrOthers.map((p) => {
                          const isSelected = selectedPilgrimIdsForTrip.includes(p.id);

                          return (
                            <div 
                              key={p.id}
                              onClick={() => toggleSelectPilgrimForTrip(p.id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                                isSelected 
                                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400' 
                                  : 'bg-white dark:bg-[#151c2d] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div>
                                  <strong className="text-slate-900 dark:text-white font-bold block">{p.name}</strong>
                                  <span className="text-[11px] text-slate-400 font-mono">الجواز: {p.passport_number} | {p.gender} | الوكيل: {p.agent_main}</span>
                                </div>
                              </div>
                              {p.trip_id && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                                  مسجل بـ {p.trip_id}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTripPilgrimsModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                إغلاق
              </button>
              <button
                type="button"
                disabled={selectedPilgrimIdsForTrip.length === 0}
                onClick={handleAddSelectedPilgrimsToTrip}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedPilgrimIdsForTrip.length > 0 
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md cursor-pointer' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة المعتمرين المحددين للرحلة ({selectedPilgrimIdsForTrip.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANAGE PILGRIMS ON TRANSPORT (تخصيص المعتمرين على حافلة النقل) */}
      {showTransportPilgrimsModal && selectedTransportForPilgrims && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bus className="w-5 h-5 text-amber-500" />
                  <span>تخصيص المعتمرين على حافلة النقل: {selectedTransportForPilgrims.trip_name || selectedTransportForPilgrims.shift_number}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  رقم التشغيل: <strong className="font-mono text-amber-600">{selectedTransportForPilgrims.umrah_operating_number || '480900505396'}</strong> | النوع: {selectedTransportForPilgrims.vehicle_type}
                </p>
              </div>
              <button 
                onClick={() => setShowTransportPilgrimsModal(false)} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick flight import feature */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl space-y-2">
              <label className="block text-xs font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4" />
                <span>استيراد وتخصيص معتمري رحلة طيران بالكامل للحافلة:</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedFlightForTransportImport}
                  onChange={(e) => setSelectedFlightForTransportImport(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- اختر رحلة الطيران لاستيراد كافة ركابها --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.trip_name} (PNR: {t.pnr}) - {pilgrims.filter(p => p.trip_id === t.id).length} معتمر
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedFlightForTransportImport}
                  onClick={handleImportFlightPilgrimsToTransport}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
                    selectedFlightForTransportImport
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  استيراد للركاب
                </button>
              </div>
            </div>

            {/* Currently assigned list */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>المعتمرون المخصصون على حافلة النقل هذه ({pilgrims.filter(p => p.transport_id === selectedTransportForPilgrims.id).length}):</span>
              </h4>

              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/40">
                {pilgrims.filter(p => p.transport_id === selectedTransportForPilgrims.id).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">لا يوجد أي معتمر مخصص على هذه الحافلة بعد.</p>
                ) : (
                  pilgrims.filter(p => p.transport_id === selectedTransportForPilgrims.id).map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white dark:bg-[#151c2d] p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                      <div>
                        <strong className="text-slate-900 dark:text-white font-bold block">{p.name}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">الجواز: {p.passport_number} | الوكيل: {p.agent_main}</span>
                      </div>
                      <button
                        onClick={() => handleRemovePilgrimFromTransport(p.id)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>إزالة من الحافلة</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add new pilgrims section */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  <span>اختر معتمرين لتسكينهم على الحافلة:</span>
                </h4>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="بحث باسم المعتمر أو رقم الجواز..."
                    value={transportPilgrimsSearch}
                    onChange={(e) => setTransportPilgrimsSearch(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Unassigned or other pilgrims list */}
              {(() => {
                const unassignedOrOthers = pilgrims.filter(p => {
                  if (p.transport_id === selectedTransportForPilgrims.id) return false;
                  if (!transportPilgrimsSearch.trim()) return true;
                  const query = transportPilgrimsSearch.toLowerCase();
                  return p.name.toLowerCase().includes(query) || p.passport_number.toLowerCase().includes(query) || (p.agent_main && p.agent_main.toLowerCase().includes(query));
                });

                const allSelected = unassignedOrOthers.length > 0 && unassignedOrOthers.every(p => selectedPilgrimIdsForTransport.includes(p.id));

                const toggleSelectAll = () => {
                  if (allSelected) {
                    setSelectedPilgrimIdsForTransport([]);
                  } else {
                    setSelectedPilgrimIdsForTransport(unassignedOrOthers.map(p => p.id));
                  }
                };

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="flex items-center gap-1.5 font-bold text-amber-600 hover:underline cursor-pointer"
                      >
                        {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span>تحديد كل المعروضين ({unassignedOrOthers.length})</span>
                      </button>
                      <span>تم تحديد: {selectedPilgrimIdsForTransport.length} معتمر</span>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/30 dark:bg-slate-900/20">
                      {unassignedOrOthers.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">جميع المعتمرين مخصصون بالفعل أو لا يوجد نتائج مطابقة للبحث.</p>
                      ) : (
                        unassignedOrOthers.map((p) => {
                          const isSelected = selectedPilgrimIdsForTransport.includes(p.id);

                          return (
                            <div 
                              key={p.id}
                              onClick={() => toggleSelectPilgrimForTransport(p.id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                                isSelected 
                                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400' 
                                  : 'bg-white dark:bg-[#151c2d] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div>
                                  <strong className="text-slate-900 dark:text-white font-bold block">{p.name}</strong>
                                  <span className="text-[11px] text-slate-400 font-mono">الجواز: {p.passport_number} | {p.gender} | الوكيل: {p.agent_main}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTransportPilgrimsModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                إغلاق
              </button>
              <button
                type="button"
                disabled={selectedPilgrimIdsForTransport.length === 0}
                onClick={handleAddSelectedPilgrimsToTransport}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedPilgrimIdsForTransport.length > 0 
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md cursor-pointer' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة المعتمرين المحددين للحافلة ({selectedPilgrimIdsForTransport.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DISPATCH SHEET / ORDER FORM (نموذج التفويج الرسمي) */}
      {showDispatchModal && selectedTransportForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl p-6 shadow-2xl space-y-4 my-8 dir-rtl print:p-0 print:shadow-none print:w-full font-sans border-2 border-slate-800">
            
            {/* Header Red Title */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <span className="text-red-600 font-mono font-bold text-xs">#OFFICIAL_MANIFEST</span>
              <h2 className="text-red-600 font-black text-xl text-center flex-1">
                تشغيل رقم ({selectedTransportForDispatch.umrah_operating_number || '480900505396'})
              </h2>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 no-print"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub text */}
            <div className="text-right text-xs font-bold text-slate-900 space-y-1">
              <div className="flex justify-between items-center">
                <span>السادة شركة / <strong className="text-slate-950 text-sm font-extrabold">{selectedTransportForDispatch.external_agent || 'شركة برايت لخدمات المعتمرين'}</strong> المحترمين</span>
              </div>
              <p className="text-slate-700">نأمل التكرم بجدولة الرحلة طبقاً للبيان التالي:</p>
            </div>

            {/* SECTION 1: Group Data */}
            <div className="border border-slate-800">
              <div className="bg-slate-200 p-1.5 font-black text-xs border-b border-slate-800 flex justify-between">
                <span>Group Data</span>
                <span>بيانات المجموعة</span>
              </div>
              <table className="w-full text-center text-[11px] border-collapse">
                <thead className="bg-emerald-100 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-1.5 border-r border-slate-800">الوكيل / The Agent</th>
                    <th className="p-1.5 border-r border-slate-800">الجنسية / Nationality</th>
                    <th className="p-1.5 border-r border-slate-800">عدد المعتمرين / Pilgrims</th>
                    <th className="p-1.5 border-r border-slate-800">نوع المركبة / Vehicle</th>
                    <th className="p-1.5 border-r border-slate-800">عدد المركبات</th>
                    <th className="p-1.5">رقم المجموعة / Group No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-bold">
                  <tr>
                    <td className="p-1.5 border-r border-slate-800">{selectedTransportForDispatch.external_agent || 'ميجا ستار'}</td>
                    <td className="p-1.5 border-r border-slate-800">مصرى</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono text-sm">{selectedTransportForDispatch.passenger_count || 45}</td>
                    <td className="p-1.5 border-r border-slate-800">{selectedTransportForDispatch.vehicle_type || 'باص 50'}</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono">1</td>
                    <td className="p-1.5 font-mono">{selectedTransportForDispatch.group_number || '480900505396'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 2: Flight Data */}
            <div className="border border-slate-800">
              <div className="bg-slate-200 p-1.5 font-black text-xs border-b border-slate-800 flex justify-between">
                <span>Flight Data</span>
                <span>بيانات الرحلة</span>
              </div>
              <div className="p-1.5 bg-emerald-100/60 font-bold text-xs border-b border-slate-800 flex justify-between">
                <div>شركة الطيران / Airline Company: <span className="font-extrabold text-slate-950">{selectedTransportForDispatch.airline_type || 'مصر للطيران'}</span></div>
                <div>خط السير / Itinerary: <span className="font-extrabold text-slate-950">{selectedTransportForDispatch.from_location} ➔ {selectedTransportForDispatch.to_location}</span></div>
              </div>
              <table className="w-full text-center text-[11px] border-collapse">
                <thead className="bg-emerald-100 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-1.5 border-r border-slate-800">الحركة</th>
                    <th className="p-1.5 border-r border-slate-800">التاريخ / The Date</th>
                    <th className="p-1.5 border-r border-slate-800">رقم الرحلة / Flight No</th>
                    <th className="p-1.5">وقت الإقلاع أو الوصول / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-bold">
                  <tr>
                    <td className="p-1.5 border-r border-slate-800 bg-emerald-50">الوصول / Arrival</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono">{selectedTransportForDispatch.date || '2026-08-15'}</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono">{selectedTransportForDispatch.flight_number || 'MS663'}</td>
                    <td className="p-1.5 font-mono">{selectedTransportForDispatch.flight_time || '11:30 ص'}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-slate-800 bg-emerald-50">المغادرة / Departure</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono">2026-08-25</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono">MS664</td>
                    <td className="p-1.5 font-mono">16:00 م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 3: Operating Data */}
            <div className="border border-slate-800">
              <div className="bg-slate-200 p-1.5 font-black text-xs border-b border-slate-800 flex justify-between">
                <span>Operating Data</span>
                <span>بيانات التشغيل والتفويج</span>
              </div>
              <table className="w-full text-center text-[11px] border-collapse">
                <thead className="bg-emerald-100 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-1 border-r border-slate-800 w-8">#</th>
                    <th className="p-1 border-r border-slate-800">البيان / Statement</th>
                    <th className="p-1 border-r border-slate-800">التاريخ / The Date</th>
                    <th className="p-1 border-r border-slate-800">الوقت / Time</th>
                    <th className="p-1">خط السير / Itinerary (من ➔ إلى)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-bold">
                  <tr>
                    <td className="p-1 border-r border-slate-800 font-mono">1</td>
                    <td className="p-1 border-r border-slate-800">الاتجاه الأول / First</td>
                    <td className="p-1 border-r border-slate-800 font-mono">{selectedTransportForDispatch.date || '2026-08-15'}</td>
                    <td className="p-1 border-r border-slate-800 font-mono">{selectedTransportForDispatch.pickup_time || '12:00'}</td>
                    <td className="p-1">{selectedTransportForDispatch.from_location} ➔ {selectedTransportForDispatch.makkah_hotel || 'فندق مكة'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border-r border-slate-800 font-mono">2</td>
                    <td className="p-1 border-r border-slate-800">الاتجاه الثاني / Second</td>
                    <td className="p-1 border-r border-slate-800 font-mono">2026-08-20</td>
                    <td className="p-1 border-r border-slate-800 font-mono">14:00</td>
                    <td className="p-1">{selectedTransportForDispatch.makkah_hotel || 'فندق مكة'} ➔ {selectedTransportForDispatch.madinah_hotel || 'فندق المدينة'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border-r border-slate-800 font-mono">3</td>
                    <td className="p-1 border-r border-slate-800">الاتجاه الثالث / Third</td>
                    <td className="p-1 border-r border-slate-800 font-mono">2026-08-25</td>
                    <td className="p-1 border-r border-slate-800 font-mono">10:00</td>
                    <td className="p-1">{selectedTransportForDispatch.madinah_hotel || 'فندق المدينة'} ➔ مطار المدينة/جدة</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 4: Hotel Data */}
            <div className="border border-slate-800">
              <div className="bg-slate-200 p-1.5 font-black text-xs border-b border-slate-800 flex justify-between">
                <span>Hotel Data</span>
                <span>بيانات الفنادق والتسكين</span>
              </div>
              <table className="w-full text-center text-[11px] border-collapse">
                <thead className="bg-emerald-100 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-1.5 border-r border-slate-800">المدينة / City</th>
                    <th className="p-1.5 border-r border-slate-800">اسم الفندق / Hotel Name</th>
                    <th className="p-1.5 border-r border-slate-800">عدد الغرف</th>
                    <th className="p-1.5 border-r border-slate-800">نوع الغرف</th>
                    <th className="p-1.5">رقم الاتفاقية / Agreement No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-bold">
                  <tr>
                    <td className="p-1.5 border-r border-slate-800">مكة المكرمة</td>
                    <td className="p-1.5 border-r border-slate-800">{selectedTransportForDispatch.makkah_hotel || 'فندق أنجم مكة'}</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono">12</td>
                    <td className="p-1.5 border-r border-slate-800">رباعي / ثلاثي</td>
                    <td className="p-1.5 font-mono">AGR-9921</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-slate-800">المدينة المنورة</td>
                    <td className="p-1.5 border-r border-slate-800">{selectedTransportForDispatch.madinah_hotel || 'فندق دار التقوى'}</td>
                    <td className="p-1.5 border-r border-slate-800 font-mono">12</td>
                    <td className="p-1.5 border-r border-slate-800">رباعي / ثلاثي</td>
                    <td className="p-1.5 font-mono">AGR-9922</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 4.5: Rawdah Permit */}
            <div className="border border-slate-800">
              <div className="bg-purple-100 p-1.5 font-black text-xs border-b border-slate-800 flex justify-between text-purple-950">
                <span>Rawdah Permit / Appointment Date</span>
                <span>تصريح وموعد حجز الروضة الشريفة</span>
              </div>
              <div className="p-2 bg-purple-50/60 text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>معاد وتفاصيل حجز الروضة الشريفة للمعتمرين:</span>
                <span className="font-mono text-xs text-purple-900 font-extrabold bg-white px-3 py-1 rounded border border-purple-300">
                  {selectedTransportForDispatch.rawdah_permit_time || '18/08/2026 - 10:00 مساءً (النساء: 08:00 صباحاً)'}
                </span>
              </div>
            </div>

            {/* SECTION 5: Mutamers List */}
            <div className="border border-slate-800">
              <div className="bg-slate-200 p-1.5 font-black text-xs border-b border-slate-800 flex justify-between">
                <span>Data Of Mutamers</span>
                <span>بيانات المعتمرين المرفقين بالرحلة ({pilgrims.length} معتمر)</span>
              </div>
              <table className="w-full text-center text-[10px] border-collapse">
                <thead className="bg-emerald-100 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-1 border-r border-slate-800 w-8">#</th>
                    <th className="p-1 border-r border-slate-800">الاسم الكامل / Full Name</th>
                    <th className="p-1 border-r border-slate-800">رقم جواز السفر / Passport No</th>
                    <th className="p-1 border-r border-slate-800">الجنس / Gender</th>
                    <th className="p-1">رقم المجموعة / Group No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pilgrims.slice(0, 8).map((p, idx) => (
                    <tr key={p.id}>
                      <td className="p-1 border-r border-slate-800 font-mono">{idx + 1}</td>
                      <td className="p-1 border-r border-slate-800 font-bold text-right pr-2">{p.name}</td>
                      <td className="p-1 border-r border-slate-800 font-mono">{p.passport_number}</td>
                      <td className="p-1 border-r border-slate-800">{p.gender}</td>
                      <td className="p-1 font-mono">{selectedTransportForDispatch.group_number || '480900505396'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-300 no-print">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إغلاق
              </button>
              <button
                onClick={triggerBrowserPrint}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-md"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>طباعة أمر التشغيل / نموذج التفويج</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: PRINT PASSENGER LIST */}
      {showPrintModal && selectedTripForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl p-8 shadow-2xl space-y-6 my-8 print:p-0 print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-300 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
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

    </div>
  );
};
