import { Pilgrim, Trip, Rooming, Staff, Transport, FamilyGroup } from './types';

export const initialTrips: Trip[] = [
  {
    id: 'TRIP-101',
    trip_name: 'رحلة الطليعة 1 - القاهرة/جدة',
    route: 'القاهرة (CAI) ➔ جدة (JED)',
    airline: 'مصر للطيران (MS-661)',
    departure_date: '2026-08-10',
    departure_time: '08:30',
    return_date: '2026-08-20',
    return_time: '18:45',
    pnr: 'MS789X'
  },
  {
    id: 'TRIP-102',
    trip_name: 'رحلة الصفوة 2 - الإسكندرية/جدة',
    route: 'برج العرب (HBE) ➔ جدة (JED)',
    airline: 'الخطوط السعودية (SV-312)',
    departure_date: '2026-08-12',
    departure_time: '11:15',
    return_date: '2026-08-22',
    return_time: '21:00',
    pnr: 'SV452Z'
  },
  {
    id: 'TRIP-103',
    trip_name: 'رحلة الكوثر 3 - سوهاج/المدينة',
    route: 'سوهاج (HMB) ➔ المدينة (MED)',
    airline: 'طيران نسما (NE-404)',
    departure_date: '2026-08-14',
    departure_time: '06:00',
    return_date: '2026-08-24',
    return_time: '15:30',
    pnr: 'NE881P'
  },
  {
    id: 'TRIP-104',
    trip_name: 'رحلة الإيمان 4 - دبي/جدة',
    route: 'دبي (DXB) ➔ جدة (JED)',
    airline: 'طيران الإمارات (EK-803)',
    departure_date: '2026-08-15',
    departure_time: '14:20',
    return_date: '2026-08-25',
    return_time: '23:10',
    pnr: 'EK309M'
  },
  {
    id: 'TRIP-105',
    trip_name: 'رحلة النور 5 - عمان/المدينة',
    route: 'عمان (AMM) ➔ المدينة (MED)',
    airline: 'الملكية الأردنية (RJ-710)',
    departure_date: '2026-08-18',
    departure_time: '09:45',
    return_date: '2026-08-28',
    return_time: '19:00',
    pnr: 'RJ992A'
  },
  {
    id: 'TRIP-106',
    trip_name: 'رحلة البركة 6 - الكويـت/جدة',
    route: 'الكويت (KWI) ➔ جدة (JED)',
    airline: 'الخطوط الكويتية (KU-615)',
    departure_date: '2026-08-20',
    departure_time: '13:00',
    return_date: '2026-08-30',
    return_time: '20:15',
    pnr: 'KU104L'
  }
];

export const initialRoomings: Rooming[] = [
  {
    id: 'ROOM-01',
    hotel_name: 'فندق أنجم مكة',
    city: 'مكة',
    total_rooms: 25,
    double_rooms: 8,
    triple_rooms: 10,
    quad_rooms: 7
  },
  {
    id: 'ROOM-02',
    hotel_name: 'فندق أبراج القصواء مكة',
    city: 'مكة',
    total_rooms: 20,
    double_rooms: 5,
    triple_rooms: 8,
    quad_rooms: 7
  },
  {
    id: 'ROOM-03',
    hotel_name: 'فندق دار الهجرة المدينة',
    city: 'المدينة',
    total_rooms: 22,
    double_rooms: 6,
    triple_rooms: 10,
    quad_rooms: 6
  },
  {
    id: 'ROOM-04',
    hotel_name: 'فندق الفيروز الماسي المدينة',
    city: 'المدينة',
    total_rooms: 18,
    double_rooms: 4,
    triple_rooms: 8,
    quad_rooms: 6
  },
  {
    id: 'ROOM-05',
    hotel_name: 'فندق بولمان زمزم مكة',
    city: 'مكة',
    total_rooms: 15,
    double_rooms: 5,
    triple_rooms: 5,
    quad_rooms: 5
  }
];

export const initialTransports: Transport[] = [
  {
    id: 'TRN-01',
    shift_number: 'وردية A1',
    trip_id: 'TRIP-101',
    pickup_time: '2026-08-10 10:30',
    from_location: 'مطار الملك عبد العزيز - صالة الشمالية',
    to_location: 'فندق أنجم مكة',
    vehicle_type: 'حافلة VIP 50 راكب',
    ground_supervisor: 'عبد الرحمن الشريف'
  },
  {
    id: 'TRN-02',
    shift_number: 'وردية A2',
    trip_id: 'TRIP-102',
    pickup_time: '2026-08-12 13:00',
    from_location: 'مطار الملك عبد العزيز - صالة 1',
    to_location: 'فندق أبراج القصواء مكة',
    vehicle_type: 'حافلة مرسيدس 49 راكب',
    ground_supervisor: 'خالد المطيري'
  },
  {
    id: 'TRN-03',
    shift_number: 'وردية B1',
    trip_id: 'TRIP-103',
    pickup_time: '2026-08-14 08:00',
    from_location: 'مطار الأمير محمد بن عبد العزيز - المدينة',
    to_location: 'فندق دار الهجرة المدينة',
    vehicle_type: 'حافلة حديثة 50 راكب',
    ground_supervisor: 'سعود الحارثي'
  },
  {
    id: 'TRN-04',
    shift_number: 'وردية B2',
    trip_id: 'TRIP-104',
    pickup_time: '2026-08-15 16:00',
    from_location: 'مطار الملك عبد العزيز - جدة',
    to_location: 'فندق بولمان زمزم مكة',
    vehicle_type: 'حافلتين VIP',
    ground_supervisor: 'أحمد الغامدي'
  }
];

// Seed Staff - 50 staff members
export const initialStaff: Staff[] = Array.from({ length: 50 }, (_, i) => {
  const roles = [
    'مشرف ميداني',
    'مرشد ديني',
    'سائق حافلة',
    'منسق تسكين',
    'إداري استقبل',
    'مشرف مطار',
    'مسؤول علاقات'
  ];
  const names = [
    'محمد علي النجار', 'أحمد محمود العبد', 'محمود حسن الشاذلي', 'مصطفى خليل السيد',
    'عبد الله إبراهيم', 'عمر فاروق الباز', 'طارق عبد العزيز', 'سعيد فاروق العوضي',
    'ياسر صلاح الدين', 'حسام الدين زكي', 'علي حسن مكي', 'إسلام فتحي القاضي',
    'أشرف عبد السلام', 'أيمن كمال نصار', 'سامح عبد المجيد', 'وليد عثمان رضوان',
    'كريم توفيق البحيري', 'عمرو عبد الفتاح', 'خالد يوسف الشربيني', 'هاني فؤاد يونس',
    'بلال عبد الرحيم', 'رضا إبراهيم الشامي', 'حمزة السيد العطار', 'زياد حامد منصور',
    'ماهر شريف بدوي', 'وائل جلال عبد الرازق', 'شريف حمدي البكري', 'تامر عزت زهران',
    'مدحت فاروق سلامة', 'عاطف شوقي زكي', 'مجدي كمال الديب', 'عادل سليمان مرسي',
    'إيهاب توفيق غانم', 'نبيل فتحي زغلول', 'أسامة صلاح خليل', 'جمال عبد الناصر',
    'ممدوح إسماعيل', 'صلاح الدين الأيوبي', 'بدر الدين العيني', 'عصام عبد المنعم',
    'شادي رأفت الخطيب', 'أنس خالد الجوهري', 'مؤمن عادل صقر', 'صفوت جابر البنا',
    'رمضان السيد متولي', 'سليمان عبد الظاهر', 'فارس مصطفى زايد', 'جهاد حلمي عامر',
    'مروان يوسف الهواري', 'زياد طارق عاشور'
  ];
  return {
    id: `STF-${1001 + i}`,
    name: names[i] || `موظف ${i + 1}`,
    role: roles[i % roles.length],
    status: i % 7 === 0 ? 'غير نشط' : 'نشط',
    phone: `+966 5${(i % 9) + 1}${Math.floor(1000000 + Math.random() * 9000000)}`
  };
});

export const initialFamilyGroups: FamilyGroup[] = [
  {
    id: 'FAM-01',
    group_name: 'عائلة العوضي (4 أفراد)',
    pilgrim_ids: ['PIL-1001', 'PIL-1002', 'PIL-1003', 'PIL-1004'],
    notes: 'توصية بتوفير غرفة رباعية مجمعة في فندق أنجم'
  },
  {
    id: 'FAM-02',
    group_name: 'عائلة الشاذلي (3 أفراد)',
    pilgrim_ids: ['PIL-1005', 'PIL-1006', 'PIL-1007'],
    notes: 'غرفة ثلاثية خيار أول'
  },
  {
    id: 'FAM-03',
    group_name: 'عائلة رضوان (2 أفراد)',
    pilgrim_ids: ['PIL-1008', 'PIL-1009'],
    notes: 'زوج وزوجة'
  },
  {
    id: 'FAM-04',
    group_name: 'عائلة البحيري (5 أفراد)',
    pilgrim_ids: ['PIL-1010', 'PIL-1011', 'PIL-1012', 'PIL-1013', 'PIL-1014'],
    notes: 'غرفة ثنائية + ثلاثية متجاورة'
  }
];

// Helper to construct 119 realistic pilgrims
const agentsMainList = ['شركة الطليعة للسياحة', 'وكالة الصفا والمروة', 'شركة الفجر للخدمات', 'وكالة الإيمان الدولية', 'شركة مكة للخدمات'];
const makkahHotels = ['فندق أنجم مكة', 'فندق أبراج القصواء مكة', 'فندق بولمان زمزم مكة'];
const madinahHotels = ['فندق دار الهجرة المدينة', 'فندق الفيروز الماسي المدينة'];

const maleFirstNames = ['محمد', 'أحمد', 'محمود', 'عبد الله', 'مصطفى', 'عمر', 'خالد', 'علي', 'حسن', 'إبراهيم', 'يوسف', 'سعيد', 'طارق', 'ياسر', 'صلاح', 'حمزة', 'بلال', 'زیاد', 'كريم', 'أيمن'];
const femaleFirstNames = ['فاطمة', 'عائشة', 'مريم', 'زينب', 'خديجة', 'أسماء', 'سارة', 'نور', 'منى', 'رانيا', 'دعاء', 'شيماء', 'هدى', 'سمية', 'إيمان', 'صفاء', 'آية', 'رحمة', 'وفاء', 'أميرة'];
const familyNames = ['العوضي', 'الشاذلي', 'النجار', 'رضوان', 'البحيري', 'الزين', 'الشريف', 'منصور', 'العطار', 'القاضي', 'بدوي', 'الحداد', 'الهواري', 'الصاوي', 'خليل', 'زايد', 'الصقر', 'الجوهري', 'الخطيب', 'سلامة'];

export const initialPilgrims: Pilgrim[] = Array.from({ length: 119 }, (_, i) => {
  const isMale = i % 2 === 0;
  const firstName = isMale 
    ? maleFirstNames[i % maleFirstNames.length] 
    : femaleFirstNames[i % femaleFirstNames.length];
  const fatherName = maleFirstNames[(i + 3) % maleFirstNames.length];
  const familyName = familyNames[(i + 5) % familyNames.length];
  const fullName = `${firstName} ${fatherName} ${familyName}`;
  
  const pNum = `A${10000000 + i * 317}`;
  const mainAgent = agentsMainList[i % agentsMainList.length];
  const subAgent = `فرع ${mainAgent.split(' ')[1]} - ${(i % 3) + 1}`;
  
  const tripId = initialTrips[i % initialTrips.length].id;
  const makkahH = makkahHotels[i % makkahHotels.length];
  const madinahH = madinahHotels[i % madinahHotels.length];
  
  let familyGroupLink: string | undefined = undefined;
  if (i < 4) familyGroupLink = 'FAM-01';
  else if (i >= 4 && i < 7) familyGroupLink = 'FAM-02';
  else if (i >= 7 && i < 9) familyGroupLink = 'FAM-03';
  else if (i >= 9 && i < 14) familyGroupLink = 'FAM-04';
  
  const roomTypes: Array<'ثنائي' | 'ثلاثي' | 'رباعي'> = ['رباعي', 'ثلاثي', 'ثنائي'];
  const rType = roomTypes[i % 3];

  const visaStat: 'مكتملة' | 'قيد الإجراء' | 'لم تبدأ' = i % 10 === 0 ? 'لم تبدأ' : i % 8 === 0 ? 'قيد الإجراء' : 'مكتملة';
  const barcodeStat: 'مرفوع' | 'غير مرفوع' | 'مكتمل' = i % 9 === 0 ? 'غير مرفوع' : i % 5 === 0 ? 'مرفوع' : 'مكتمل';
  const needsPermit = i % 4 === 0;

  return {
    id: `PIL-${1001 + i}`,
    name: fullName,
    gender: isMale ? 'ذكر' : 'أنثى',
    passport_number: pNum,
    agent_main: mainAgent,
    agent_sub: subAgent,
    visa_status: visaStat,
    barcode_status: barcodeStat,
    travel_permit_required: needsPermit,
    makkah_hotel: makkahH,
    madinah_hotel: madinahH,
    room_type: rType,
    family_group_link: familyGroupLink,
    trip_id: tripId,
    notes: i % 15 === 0 ? 'يحتاج كرسياً متحركاً بالخدمات' : undefined,
    needs_bed: true,
    room_number: i < 30 ? `10${Math.floor(i / 4) + 1}` : undefined
  };
});
