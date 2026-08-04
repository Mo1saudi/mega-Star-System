import { Pilgrim, Trip, Rooming, Staff, Transport, FamilyGroup, FinanceRecord, DocumentRecord, NotificationRecord, AccountingClosingRecord } from './types';

export const initialTrips: Trip[] = [];
export const initialRoomings: Rooming[] = [];
export const initialTransports: Transport[] = [];
export const initialStaff: Staff[] = [];
export const initialFamilyGroups: FamilyGroup[] = [];
export const initialPilgrims: Pilgrim[] = [];

export const initialFinanceRecords: FinanceRecord[] = [];

export const initialDocuments: DocumentRecord[] = [
  {
    id: 'DOC-101',
    title: 'عقد سكن وتسكين مكة المكرمة الشامل',
    type: 'contract',
    entity_type: 'company',
    upload_date: new Date().toISOString().slice(0, 10),
    file_size: '2.4 MB',
    status: 'معتمد'
  },
  {
    id: 'DOC-102',
    title: 'كشف التأشيرات وتصاريح العمرة المعتمدة',
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
    title: 'مرحباً بك في نظام إدارة العمرة والرحلات (ميجا ستار)',
    message: 'تم تفعيل الربط التلقائي المباشر مع شيت المعتمرين وبدء معالجة بيانات التسكين والروابط العائلية.',
    type: 'document',
    date: new Date().toLocaleTimeString('ar-SA'),
    read: false,
    severity: 'low'
  }
];

export const initialClosings: AccountingClosingRecord[] = [];
