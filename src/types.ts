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

export interface AppSnapshot {
  pilgrims: Pilgrim[];
  trips: Trip[];
  roomings: Rooming[];
  staff: Staff[];
  transports: Transport[];
  familyGroups: FamilyGroup[];
}
