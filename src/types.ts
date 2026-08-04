export type Gender = 'ذكر' | 'أنثى';

export type VisaStatus = 'مكتملة' | 'قيد الإجراء' | 'لم تبدأ';
export type BarcodeStatus = 'مرفوع' | 'غير مرفوع' | 'مكتمل';
export type RoomType = 'ثنائي' | 'ثلاثي' | 'رباعي';

export interface Pilgrim {
  id: string;
  name: string;
  gender: Gender;
  passport_number: string;
  agent_main: string;
  agent_sub: string;
  visa_status: VisaStatus;
  barcode_status: BarcodeStatus;
  travel_permit_required: boolean;
  makkah_hotel: string;
  madinah_hotel: string;
  room_type: RoomType;
  family_group_link?: string;
  trip_id: string;
  notes?: string;
  needs_bed: boolean;
  room_number?: string;
  
  // Sheet-specific properties
  program?: string;
  visa_type?: string;
  group_number?: string;
  trip_number?: string;
  arrival_time?: string;
  return_trip?: string;
  return_date?: string;
  travel_time?: string;
  departure_time?: string;
  room_spec?: string;
}

export interface Trip {
  id: string;
  trip_name: string;
  route: string;
  airline: string;
  departure_date: string;
  departure_time: string;
  return_date: string;
  return_time: string;
  pnr: string;
}

export interface Rooming {
  id: string;
  hotel_name: string;
  city: 'مكة' | 'المدينة';
  total_rooms: number;
  double_rooms: number;
  triple_rooms: number;
  quad_rooms: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  status: 'نشط' | 'غير نشط';
  phone: string;
}

export interface Transport {
  id: string;
  shift_number: string;
  trip_id: string;
  pickup_time: string;
  from_location: string;
  to_location: string;
  vehicle_type: string;
  ground_supervisor: string;
}

export interface FamilyGroup {
  id: string;
  group_name: string;
  pilgrim_ids: string[];
  notes?: string;
}

export interface FamilyValidationResult {
  groupId: string;
  groupName: string;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface PreflightValidationResult {
  hasErrors: boolean;
  errors: Array<{
    type: 'hotel_mismatch' | 'unbalanced_room' | 'gender_mismatch' | 'missing_bed' | 'capacity_exceeded';
    message: string;
    details?: string;
    hotel?: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
  }>;
  stats: {
    totalPilgrims: number;
    assignedToRooms: number;
    unassignedPilgrims: number;
    totalRoomsNeeded: number;
  };
}

export type UserRole = 'admin' | 'manager' | 'operations' | 'finance' | 'supervisor' | 'viewer';

export interface FinanceRecord {
  id: string;
  type: 'revenue' | 'expense';
  category: string; // e.g. 'رسوم عمرة', 'حجز فنادق', 'تذاكر طيران', 'نقل حافلات', 'عمولات سماسرة', 'إعاشة وتغذية'
  amount: number;
  description: string;
  date: string;
  status: 'مكتمل' | 'معلق' | 'مسوى';
  trip_id?: string;
  invoice_number?: string;
  party_name?: string; // Client or Supplier name
  payment_method: 'تحويل بنكي' | 'نقداً' | 'شيك' | 'بطاقة سداد';
}

export interface DocumentRecord {
  id: string;
  title: string;
  type: 'visa' | 'passport' | 'hotel_voucher' | 'ticket' | 'contract';
  entity_type: 'pilgrim' | 'trip' | 'hotel' | 'company';
  entity_id?: string;
  entity_name?: string;
  upload_date: string;
  file_size?: string;
  status: 'معتمد' | 'قيد المراجعة' | 'ينتهي قريباً';
  file_url?: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: 'flight' | 'document' | 'payment' | 'hotel' | 'transport';
  date: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface AccountingClosingRecord {
  id: string;
  period_name: string;
  closing_date: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  status: 'مغلق' | 'تحت التدقيق' | 'مفتوح';
  closed_by: string;
  notes?: string;
}

export interface AppSnapshot {
  pilgrims: Pilgrim[];
  trips: Trip[];
  roomings: Rooming[];
  staff: Staff[];
  transports: Transport[];
  familyGroups: FamilyGroup[];
  financeRecords: FinanceRecord[];
  documents: DocumentRecord[];
  notifications: NotificationRecord[];
  closings: AccountingClosingRecord[];
  currentRole?: UserRole;
}
