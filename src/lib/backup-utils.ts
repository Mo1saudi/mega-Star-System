import { 
  Pilgrim, Trip, Rooming, Staff, Transport, FamilyGroup, FinanceRecord, AppSnapshot 
} from '../types';

/**
 * Downloads data as a JSON file
 */
export function downloadJsonBackup(snapshot: AppSnapshot, customFilename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = customFilename || `megastar_full_backup_${timestamp}.json`;

  const backupData = {
    metadata: {
      appName: 'MegaStar Umrah ERP',
      version: 'V3.8 ERP Production',
      exportedAt: new Date().toISOString(),
      recordCounts: {
        pilgrims: snapshot.pilgrims?.length || 0,
        trips: snapshot.trips?.length || 0,
        transports: snapshot.transports?.length || 0,
        roomings: snapshot.roomings?.length || 0,
        familyGroups: snapshot.familyGroups?.length || 0,
        staff: snapshot.staff?.length || 0,
        financeRecords: snapshot.financeRecords?.length || 0,
        documents: snapshot.documents?.length || 0,
        notifications: snapshot.notifications?.length || 0,
        closings: snapshot.closings?.length || 0,
      }
    },
    data: snapshot
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Utility to download CSV with UTF-8 BOM for Arabic compatibility in Excel
 */
export function downloadCsv(data: Record<string, any>[], columns: { key: string; label: string }[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error('لا توجد بيانات للتصدير');
  }

  // Header row
  const headers = columns.map(col => escapeCsvValue(col.label)).join(',');
  
  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const val = row[col.key];
      return escapeCsvValue(val);
    }).join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel Arabic support
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function escapeCsvValue(val: any): string {
  if (val === undefined || val === null) return '""';
  if (typeof val === 'boolean') return val ? '"نعم"' : '"لا"';
  let str = String(val).replace(/"/g, '""'); // Escape quotes
  // Wrap in double quotes
  return `"${str}"`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Data formatters for CSV exports

export function exportPilgrimsToCsv(pilgrims: Pilgrim[], trips: Trip[]) {
  const tripMap = new Map(trips.map(t => [t.id, t.trip_name]));
  
  const columns = [
    { key: 'passport_number', label: 'رقم الجواز' },
    { key: 'name', label: 'اسم المعتمر' },
    { key: 'gender', label: 'الجنس' },
    { key: 'agent_main', label: 'الوكيل الرئيسي' },
    { key: 'agent_sub', label: 'الوكيل الفرعي' },
    { key: 'visa_status', label: 'حالة التأشيرة' },
    { key: 'barcode_status', label: 'حالة البار كود' },
    { key: 'makkah_hotel', label: 'فندق مكة' },
    { key: 'madinah_hotel', label: 'فندق المدينة' },
    { key: 'room_type', label: 'نوع الغرفة' },
    { key: 'trip_name', label: 'رحلة الطيران' },
    { key: 'family_group_link', label: 'رمز العائلة' },
    { key: 'needs_bed', label: 'محتاج سرير' },
    { key: 'is_withdrawn', label: 'حالة السحب/الإلغاء' },
    { key: 'notes', label: 'ملاحظات' },
  ];

  const formattedData = pilgrims.map(p => ({
    ...p,
    trip_name: tripMap.get(p.trip_id) || p.trip_id || 'غير محدد',
    needs_bed: p.needs_bed ? 'نعم' : 'لا',
    is_withdrawn: p.is_withdrawn ? 'مسحوب / ملغي' : 'نشط',
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(formattedData, columns, `megastar_pilgrims_${timestamp}.csv`);
}

export function exportTripsToCsv(trips: Trip[]) {
  const columns = [
    { key: 'trip_name', label: 'اسم الرحلة' },
    { key: 'pnr', label: 'رمز PNR' },
    { key: 'airline', label: 'شركة الطيران' },
    { key: 'route', label: 'خط السير' },
    { key: 'passenger_count', label: 'عدد المسافرين' },
    { key: 'departure_date', label: 'تاريخ المغادرة' },
    { key: 'departure_time', label: 'وقت المغادرة' },
    { key: 'flight_number_outbound', label: 'رقم رحلة الذهاب' },
    { key: 'return_date', label: 'تاريخ العودة' },
    { key: 'return_time', label: 'وقت العودة' },
    { key: 'flight_number_inbound', label: 'رقم رحلة العودة' },
    { key: 'status', label: 'الحالة' },
  ];

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(trips, columns, `megastar_trips_${timestamp}.csv`);
}

export function exportTransportsToCsv(transports: Transport[]) {
  const columns = [
    { key: 'shift_number', label: 'الوردية / الحركة' },
    { key: 'trip_name', label: 'اسم الرحلة/التفويج' },
    { key: 'vehicle_type', label: 'نوع المركبة' },
    { key: 'umrah_operating_number', label: 'رقم التشغيلة' },
    { key: 'from_location', label: 'من' },
    { key: 'to_location', label: 'إلى' },
    { key: 'makkah_hotel', label: 'فندق مكة' },
    { key: 'madinah_hotel', label: 'فندق المدينة' },
    { key: 'ground_supervisor', label: 'المشرف الميداني' },
    { key: 'passenger_count', label: 'عدد المعتمرين' },
    { key: 'date', label: 'التاريخ' },
    { key: 'pickup_time', label: 'وقت الحركة' },
  ];

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(transports, columns, `megastar_transports_${timestamp}.csv`);
}

export function exportRoomingsToCsv(roomings: Rooming[]) {
  const columns = [
    { key: 'hotel_name', label: 'اسم الفندق' },
    { key: 'city', label: 'المدينة' },
    { key: 'total_rooms', label: 'إجمالي الغرف' },
    { key: 'double_rooms', label: 'غرف ثنائية' },
    { key: 'triple_rooms', label: 'غرف ثلاثية' },
    { key: 'quad_rooms', label: 'غرف رباعية' },
  ];

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(roomings, columns, `megastar_roomings_${timestamp}.csv`);
}

export function exportStaffToCsv(staff: Staff[]) {
  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'role', label: 'الدور الوظيفي' },
    { key: 'phone', label: 'رقم الهاتف' },
    { key: 'status', label: 'الحالة' },
    { key: 'iqama_number', label: 'رقم الإقامة' },
    { key: 'iqama_expiry_date', label: 'تاريخ انتهاء الإقامة' },
  ];

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(staff, columns, `megastar_staff_${timestamp}.csv`);
}

export function exportFinanceToCsv(financeRecords: FinanceRecord[]) {
  const columns = [
    { key: 'id', label: 'المعرف' },
    { key: 'type', label: 'نوع الحركة' },
    { key: 'category', label: 'التصنيف' },
    { key: 'amount', label: 'المبلغ (ر.س)' },
    { key: 'description', label: 'البيان/الوصف' },
    { key: 'date', label: 'التاريخ' },
    { key: 'payment_method', label: 'طريقة الدفع' },
    { key: 'receipt_number', label: 'رقم السند/الفاتورة' },
  ];

  const formattedData = financeRecords.map(f => ({
    ...f,
    type: f.type === 'revenue' ? 'إيراد / تحصيل' : 'مصروف / تشغيل',
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(formattedData, columns, `megastar_finance_${timestamp}.csv`);
}

export function exportFamilyGroupsToCsv(familyGroups: FamilyGroup[]) {
  const columns = [
    { key: 'id', label: 'معرف المجموعة' },
    { key: 'group_name', label: 'اسم العائلة' },
    { key: 'member_count', label: 'عدد الأفراد' },
    { key: 'notes', label: 'ملاحظات' },
  ];

  const formattedData = familyGroups.map(fg => ({
    ...fg,
    member_count: fg.pilgrim_ids?.length || 0,
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(formattedData, columns, `megastar_families_${timestamp}.csv`);
}
