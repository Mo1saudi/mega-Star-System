import { Pilgrim, Trip, Rooming, Staff, Transport, FamilyGroup, FinanceRecord, DocumentRecord, NotificationRecord, AccountingClosingRecord } from './types';

export const initialTrips: Trip[] = [];
export const initialRoomings: Rooming[] = [];
export const initialTransports: Transport[] = [];

export const initialStaff: Staff[] = [
  {
    id: 'ST-101',
    name: 'أحمد محمود علي',
    role: 'مدير عمليات العمرة والحج',
    status: 'نشط',
    phone: '01012345678',
    national_id: '29208150102938',
    permissions: {
      canManagePilgrims: true,
      canManageTripsTransports: true,
      canManageRooming: true,
      canManageFinance: false,
      canManageStaff: true,
      canCloseAccounting: false,
      canExportBackup: true,
      canViewReports: true
    }
  },
  {
    id: 'ST-102',
    name: 'عبد الله السيد الشريف',
    role: 'مسؤول حجز الطيران والتأشيرات (بوابة العمرة)',
    status: 'نشط',
    phone: '01198765432',
    national_id: '28910120103921',
    permissions: {
      canManagePilgrims: true,
      canManageTripsTransports: true,
      canManageRooming: true,
      canManageFinance: false,
      canManageStaff: false,
      canCloseAccounting: false,
      canExportBackup: false,
      canViewReports: true
    }
  },
  {
    id: 'ST-103',
    name: 'خالد عبد الرحمن المنصوري',
    role: 'مشرف الرحلة والمجموعات (مكة والمدينة)',
    status: 'نشط',
    phone: '01211223344',
    national_id: '29503040102911',
    permissions: {
      canManagePilgrims: true,
      canManageTripsTransports: true,
      canManageRooming: true,
      canManageFinance: false,
      canManageStaff: false,
      canCloseAccounting: false,
      canExportBackup: false,
      canViewReports: false
    }
  },
  {
    id: 'ST-104',
    name: 'عمر فاروق حسن',
    role: 'محاسب مالي معتمد (رحلات الحج والعمرة)',
    status: 'نشط',
    phone: '01033445566',
    national_id: '29105200104821',
    permissions: {
      canManagePilgrims: false,
      canManageTripsTransports: false,
      canManageRooming: false,
      canManageFinance: true,
      canManageStaff: false,
      canCloseAccounting: true,
      canExportBackup: true,
      canViewReports: true
    }
  }
];

export const initialFamilyGroups: FamilyGroup[] = [];
export const initialPilgrims: Pilgrim[] = [];

export const initialFinanceRecords: FinanceRecord[] = [];

export const initialDocuments: DocumentRecord[] = [
  {
    id: 'DOC-101',
    title: 'ترخيص وزارة السياحة المصرية لعمرة وحج موسم 1448 هـ',
    type: 'contract',
    entity_type: 'company',
    upload_date: new Date().toISOString().slice(0, 10),
    file_size: '2.4 MB',
    status: 'معتمد'
  },
  {
    id: 'DOC-102',
    title: 'كشف التأشيرات وتصاريح باركود بوابة العمرة المصرية',
    type: 'visa',
    entity_type: 'company',
    upload_date: new Date().toISOString().slice(0, 10),
    file_size: '1.8 MB',
    status: 'معتمد'
  }
];

export const initialNotifications: NotificationRecord[] = [
  {
    id: 'NOTIF-01',
    title: 'مرحباً بك في نظام شركة ميجا ستار تورز للسياحة والحج والعمرة',
    message: 'تم تفعيل نظام إدارة رحلات العمرة والتسكين، المزامنة الذكية مع شيت جوجل وبوابة العمرة المصرية.',
    type: 'document',
    date: new Date().toISOString().split('T')[0],
    read: false,
    severity: 'low'
  }
];

export const initialClosings: AccountingClosingRecord[] = [];

