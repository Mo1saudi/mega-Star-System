import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { Staff, StaffPermission } from '../types';
import { 
  UserCheck, Plus, Search, Edit3, Trash2, 
  Phone, Shield, CheckCircle, XCircle, CheckSquare, Square, 
  Briefcase, Award, Sparkles, X, ChevronDown, IdCard, Calendar, BellRing, Send, Lock, Eye, Key, Check, Users, Building
} from 'lucide-react';
import { toast } from 'sonner';

const getDefaultPermissionsForRole = (role: string): StaffPermission => {
  const r = role.toLowerCase();
  if (r.includes('مدير') || r.includes('عام') || r.includes('admin')) {
    return {
      canManagePilgrims: true,
      canManageTripsTransports: true,
      canManageRooming: true,
      canManageFinance: true,
      canManageStaff: true,
      canCloseAccounting: true,
      canExportBackup: true,
      canViewReports: true
    };
  }
  if (r.includes('محاسب') || r.includes('مالي') || r.includes('finance')) {
    return {
      canManagePilgrims: false,
      canManageTripsTransports: false,
      canManageRooming: false,
      canManageFinance: true,
      canManageStaff: false,
      canCloseAccounting: true,
      canExportBackup: true,
      canViewReports: true
    };
  }
  if (r.includes('تسكين') || r.includes('فندق')) {
    return {
      canManagePilgrims: true,
      canManageTripsTransports: false,
      canManageRooming: true,
      canManageFinance: false,
      canManageStaff: false,
      canCloseAccounting: false,
      canExportBackup: false,
      canViewReports: true
    };
  }
  return {
    canManagePilgrims: true,
    canManageTripsTransports: true,
    canManageRooming: true,
    canManageFinance: false,
    canManageStaff: false,
    canCloseAccounting: false,
    canExportBackup: false,
    canViewReports: true
  };
};

export const StaffPage: React.FC = () => {
  const { 
    staff, addStaff, updateStaff, bulkUpdateStaff, deleteStaff, 
    bulkDeleteStaff, toggleStaffStatus, searchQuery, addFinanceRecord,
    sendDirectAlertToStaff, pendingUsers, approvePendingUser, rejectPendingUser
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Pending users approval state
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [approvingUser, setApprovingUser] = useState<any | null>(null);
  const [assignedRole, setAssignedRole] = useState('مشرف رحلات العمرة والمجموعات');
  const [userPhone, setUserPhone] = useState('01000000000');
  const [userNationalId, setUserNationalId] = useState('29000000000000');
  const [userPermissions, setUserPermissions] = useState<StaffPermission>(getDefaultPermissionsForRole('مشرف رحلات العمرة والمجموعات'));

  // Direct alert modal
  const [showDirectAlertModal, setShowDirectAlertModal] = useState(false);
  const [targetStaffForAlert, setTargetStaffForAlert] = useState<Staff | null>(null);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Multi-select state
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  
  // Batch modals
  const [showBatchRoleModal, setShowBatchRoleModal] = useState(false);
  const [batchRoleValue, setBatchRoleValue] = useState('مشرف رحلات العمرة');

  const [showBatchIncentiveModal, setShowBatchIncentiveModal] = useState(false);
  const [batchIncentiveType, setBatchIncentiveType] = useState('حافز تميز رحلات العمرة');
  const [batchIncentiveAmount, setBatchIncentiveAmount] = useState<number>(1000);
  const [batchIncentiveCurrency, setBatchIncentiveCurrency] = useState<'SAR' | 'EGP'>('EGP');
  const [batchIncentiveNotes, setBatchIncentiveNotes] = useState('مكافأة أداء لموظفي شركة السياحة');

  const defaultRole = 'مشرف رحلات العمرة والمجموعات';

  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    role: defaultRole,
    status: 'نشط',
    phone: '01000000000',
    national_id: '',
    permissions: getDefaultPermissionsForRole(defaultRole)
  });

  const filteredStaff = staff.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || 
           s.role.toLowerCase().includes(q) || 
           s.phone.includes(q) ||
           (s.national_id && s.national_id.includes(q));
  });

  const activeStaffCount = staff.filter(s => s.status === 'نشط').length;
  const inactiveStaffCount = staff.filter(s => s.status === 'غير نشط').length;

  // Select / Deselect All
  const isAllSelected = filteredStaff.length > 0 && filteredStaff.every(s => selectedStaffIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(filteredStaff.map(s => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Batch actions
  const handleBatchRoleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchRoleValue || selectedStaffIds.length === 0) return;
    bulkUpdateStaff(selectedStaffIds, { role: batchRoleValue });
    setShowBatchRoleModal(false);
  };

  const handleBatchStatusUpdate = (status: 'نشط' | 'غير نشط') => {
    if (selectedStaffIds.length === 0) return;
    bulkUpdateStaff(selectedStaffIds, { status });
    toast.success(`تم تغيير حالة النشاط إلى (${status}) لعدد ${selectedStaffIds.length} موظف`);
  };

  const handleBatchIncentiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaffIds.length === 0 || batchIncentiveAmount <= 0) return;

    const selectedStaffMembers = staff.filter(s => selectedStaffIds.includes(s.id));
    let count = 0;

    selectedStaffMembers.forEach(s => {
      addFinanceRecord({
        type: 'expense',
        category: 'حوافز ومكافآت',
        amount: batchIncentiveAmount,
        currency: batchIncentiveCurrency,
        description: `صرف حافز جماعي (${batchIncentiveType}) للموظف (${s.name}) - ${batchIncentiveNotes}`,
        date: new Date().toISOString().split('T')[0],
        status: 'مكتمل',
        party_name: s.name,
        payment_method: 'تحويل بنكي'
      });
      count++;
    });

    toast.success(`تم إدراج وصرف حافز بقيمة ${batchIncentiveAmount} لكل موظف لعدد (${count}) موظف بنجاح!`);
    setShowBatchIncentiveModal(false);
  };

  const handleBatchDelete = () => {
    if (selectedStaffIds.length === 0) return;
    if (window.confirm(`هل أنت تأكد من حذف عدد (${selectedStaffIds.length}) موظف نهائياً؟`)) {
      bulkDeleteStaff(selectedStaffIds);
      setSelectedStaffIds([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: defaultRole,
      status: 'نشط',
      phone: '010' + Math.floor(10000000 + Math.random() * 90000000),
      national_id: '29' + Math.floor(100000000000 + Math.random() * 900000000000),
      permissions: getDefaultPermissionsForRole(defaultRole)
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s: Staff) => {
    setEditingStaff(s);
    setFormData(s);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingStaff) {
      updateStaff(editingStaff.id, formData);
    } else {
      addStaff(formData as Omit<Staff, 'id'>);
    }

    setShowModal(false);
  };

  const handleOpenSendDirectAlert = (st: Staff) => {
    setTargetStaffForAlert(st);
    setAlertTitle(`تنبيه إداري للموظف (${st.name})`);
    setAlertMessage(`عزيزي ${st.name}، يُرجى متابعة مجموعات العمرة المسندة إليك والتأكد من مراجعة كشوفات الطيران والتسكين.`);
    setShowDirectAlertModal(true);
  };

  const handleSendAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStaffForAlert) return;
    sendDirectAlertToStaff(targetStaffForAlert.id, alertTitle, alertMessage);
    setShowDirectAlertModal(false);
  };

  return (
    <div className="space-y-6 pb-24">
      <SEO title="الموظفون المسجلون" description="سجل الموظفين المسجلين بشركة السياحة وتتبع المسميات الوظيفية والتواصل" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <span>الموظفون المسجلون ({staff.length} موظف)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            سجل الموظفين المسجلين في شركة السياحة، متابعة المسميات الوظيفية، الأرقام القومية وأرقام التواصل.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingUsers.filter(u => u.status === 'pending').length > 0 && (
            <button
              onClick={() => {
                setApprovingUser(pendingUsers.find(u => u.status === 'pending') || null);
                setShowPendingModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl transition-all cursor-pointer animate-pulse"
            >
              <Shield className="w-4 h-4 text-amber-500" />
              <span>طلبات انضمام جوجل ({pendingUsers.filter(u => u.status === 'pending').length})</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all font-cairo shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Pending Google Sign-In Approval Alert Banner */}
      {pendingUsers.filter(u => u.status === 'pending').length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 font-black rounded-xl shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-amber-400">
                🚨 هناك ({pendingUsers.filter(u => u.status === 'pending').length}) طلب انضمام جديد عبر جوجل بانتظار موافقة مدير النظام
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                يلزم تحديد المسمى الوظيفي للموظف والصلاحيات والموافقة على دخول النظام.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setApprovingUser(pendingUsers.find(u => u.status === 'pending') || null);
              setShowPendingModal(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
          >
            مراجعة واعتماد الطلبات
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي الموظفين المسجلين</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">{staff.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#151c2d] rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">الموظفون النشطون علي النظام</div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{activeStaffCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">الموظفون غير النشطين</div>
            <div className="text-xl font-extrabold text-slate-600 dark:text-slate-400 font-mono mt-0.5">{inactiveStaffCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BATCH ACTIONS BAR */}
      {selectedStaffIds.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            <span>تم تحديد ({selectedStaffIds.length}) موظف</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBatchRoleModal(true)}
              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-500" />
              <span>تغيير المسمى الوظيفي</span>
            </button>

            <button
              onClick={() => handleBatchStatusUpdate('نشط')}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>تعيين كـ (نشط)</span>
            </button>

            <button
              onClick={() => handleBatchStatusUpdate('غير نشط')}
              className="px-3 py-1.5 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>تعيين كـ (غير نشط)</span>
            </button>

            <button
              onClick={() => setShowBatchIncentiveModal(true)}
              className="px-3 py-1.5 text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>صرف حافز جماعي</span>
            </button>

            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المحددين</span>
            </button>

            <button
              onClick={() => setSelectedStaffIds([])}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg cursor-pointer"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">الرمز</th>
                <th className="p-3.5">اسم الموظف</th>
                <th className="p-3.5">المسمى الوظيفي</th>
                <th className="p-3.5">رقم التواصل</th>
                <th className="p-3.5">الرقم القومي</th>
                <th className="p-3.5">حالة النشاط</th>
                <th className="p-3.5 text-center">الإجراءات والإنذار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStaff.map((s) => {
                const isSelected = selectedStaffIds.includes(s.id);

                return (
                  <tr 
                    key={s.id} 
                    className={`transition-colors ${
                      isSelected 
                        ? 'bg-amber-500/10 dark:bg-amber-500/15' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(s.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{s.id}</td>
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">
                        {s.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{s.phone}</td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {s.national_id ? (
                        <span className="flex items-center gap-1">
                          <IdCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.national_id}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans italic">غير مدخل</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => toggleStaffStatus(s.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          s.status === 'نشط'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                        }`}
                        title="اضغط للتغيير"
                      >
                        {s.status === 'نشط' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{s.status}</span>
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenSendDirectAlert(s)}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                          title="إرسال تنبيه مباشر للموظف"
                        >
                          <Send className="w-3 h-3 text-amber-500" />
                          <span>تنبيه</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            deleteStaff(s.id);
                            toast.success(`تم حذف الموظف (${s.name}) بنجاح`);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="حذف الموظف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Direct Alert to Staff */}
      {showDirectAlertModal && targetStaffForAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-500" />
              <span>إرسال إشعار تنبيه مباشر للموظف ({targetStaffForAlert.name})</span>
            </h3>

            <form onSubmit={handleSendAlertSubmit} className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  عنوان التنبيه
                </label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={e => setAlertTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  نص التنبيه الإداري
                </label>
                <textarea
                  rows={3}
                  required
                  value={alertMessage}
                  onChange={e => setAlertMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDirectAlertModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال التنبيه الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Change Role */}
      {showBatchRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" />
              <span>تغيير المسمى الوظيفي الجماعي لعدد ({selectedStaffIds.length}) موظف</span>
            </h3>

            <form onSubmit={handleBatchRoleUpdate} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  المسمى الوظيفي الجديد
                </label>
                <input
                  type="text"
                  list="roles-list-batch"
                  value={batchRoleValue}
                  onChange={e => setBatchRoleValue(e.target.value)}
                  placeholder="اختر أو اكتب المسمى..."
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
                <datalist id="roles-list-batch">
                  <option value="مدير عمليات العمرة والحج" />
                  <option value="مسؤول حجز الطيران والتأشيرات (بوابة العمرة)" />
                  <option value="مشرف الرحلة والمجموعات (مكة والمدينة)" />
                  <option value="محاسب رحلات العمرة والحج" />
                  <option value="منسق تسكين وفنادق" />
                  <option value="مسؤول التسويق والمبيعات" />
                </datalist>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchRoleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600 cursor-pointer"
                >
                  تطبيق الجماعي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Issue Incentive */}
      {showBatchIncentiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span>صرف حافز جماعي لعدد ({selectedStaffIds.length}) موظف</span>
            </h3>

            <form onSubmit={handleBatchIncentiveSubmit} className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  نوع الحافز / المكافأة
                </label>
                <select
                  value={batchIncentiveType}
                  onChange={e => setBatchIncentiveType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="حافز تميز رحلات العمرة">حافز تميز رحلات العمرة</option>
                  <option value="مكافأة نجاح موسم الحج">مكافأة نجاح موسم الحج</option>
                  <option value="بدل إشراف ومجموعات">بدل إشراف ومجموعات</option>
                  <option value="حافز تميز خدمة المعتمرين">حافز تميز خدمة المعتمرين</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    قيمة الحافز (لكل موظف)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={batchIncentiveAmount}
                    onChange={e => setBatchIncentiveAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    العملة
                  </label>
                  <select
                    value={batchIncentiveCurrency}
                    onChange={e => setBatchIncentiveCurrency(e.target.value as 'SAR' | 'EGP')}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  ملاحظات أو بيان السند
                </label>
                <input
                  type="text"
                  value={batchIncentiveNotes}
                  onChange={e => setBatchIncentiveNotes(e.target.value)}
                  placeholder="ملاحظات الحافز..."
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>إجمالي المبلغ المنصرف للجماعة:</span>
                  <span className="font-mono text-sm">
                    {(batchIncentiveAmount * selectedStaffIds.length).toLocaleString('ar-EG')} {batchIncentiveCurrency === 'EGP' ? 'ج.م' : 'ر.س'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchIncentiveModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer"
                >
                  صرف الحافز الجماعي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Staff */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">
              {editingStaff ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم الموظف الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحمد محمود علي"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المسمى الوظيفي</label>
                <input
                  type="text"
                  list="roles-list"
                  value={formData.role || ''}
                  onChange={e => {
                    const newRole = e.target.value;
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      permissions: getDefaultPermissionsForRole(newRole)
                    });
                  }}
                  placeholder="أدخل المسمى الوظيفي..."
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-bold text-amber-700 dark:text-amber-400"
                />
                <datalist id="roles-list">
                  <option value="مدير عمليات العمرة والحج" />
                  <option value="مسؤول حجز الطيران والتأشيرات (بوابة العمرة)" />
                  <option value="مشرف الرحلة والمجموعات (مكة والمدينة)" />
                  <option value="محاسب رحلات العمرة والحج" />
                  <option value="منسق تسكين وفنادق" />
                  <option value="مسؤول التسويق والمبيعات" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم التواصل</label>
                <input
                  type="text"
                  required
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="مثال: 01012345678"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الرقم القومي (14 رقم)</label>
                <input
                  type="text"
                  maxLength={14}
                  value={formData.national_id || ''}
                  onChange={e => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="2xxxxxxxxx"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600 cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Google Sign-In User Approval Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in dir-rtl">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#151c2d] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    اعتماد طلبات الانضمام والتسجيل عبر جوجل
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    مراجعة طلبات الانضمام الجديدة، تعيين الصلاحيات والمسمى الوظيفي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pending List / Selected Form */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {pendingUsers.filter(u => u.status === 'pending').length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
                  <p className="font-bold text-sm">لا يوجد أي طلبات معلقة حالياً!</p>
                  <p className="text-xs">جميع طلبات التسجيل عبر جوجل تم اعتمادها أو مراجعتها.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Column: Requests List */}
                  <div className="md:col-span-1 space-y-2 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-3 pb-3 md:pb-0">
                    <label className="block text-xs font-bold text-slate-500 mb-2">طلبات الانضمام المعلقة ({pendingUsers.filter(u => u.status === 'pending').length})</label>
                    {pendingUsers.filter(u => u.status === 'pending').map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setApprovingUser(u);
                          setAssignedRole(u.role || 'مشرف رحلات العمرة والمجموعات');
                        }}
                        className={`w-full p-3 text-right rounded-xl border text-xs transition-all ${
                          approvingUser?.id === u.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold truncate">{u.displayName}</div>
                        <div className="text-[11px] opacity-75 truncate dir-ltr text-right">{u.email}</div>
                        <div className="text-[10px] text-amber-500 mt-1">{u.requestedAt}</div>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: User Details & Role Assignment */}
                  {approvingUser ? (
                    <div className="md:col-span-2 space-y-4">
                      <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
                        {approvingUser.photoURL ? (
                          <img src={approvingUser.photoURL} alt={approvingUser.displayName} className="w-10 h-10 rounded-full border border-amber-500/40 object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-amber-500/20 text-amber-500 font-bold rounded-full flex items-center justify-center">
                            {approvingUser.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{approvingUser.displayName}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dir-ltr text-right truncate">{approvingUser.email}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            تعيين المسمى الوظيفي والدور بالشركة
                          </label>
                          <input
                            type="text"
                            list="approval-roles-list"
                            value={assignedRole}
                            onChange={(e) => {
                              const r = e.target.value;
                              setAssignedRole(r);
                              setUserPermissions(getDefaultPermissionsForRole(r));
                            }}
                            placeholder="اختر أو اكتب المسمى الوظيفي..."
                            className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-bold text-amber-600 dark:text-amber-400"
                          />
                          <datalist id="approval-roles-list">
                            <option value="مدير عمليات العمرة والحج (Admin)" />
                            <option value="مدير العمليات والتفويج (Manager)" />
                            <option value="موظف عمليات وتفويج (Operations)" />
                            <option value="المحاسب المالي المعتمد (Finance)" />
                            <option value="مشرف المجموعات والفنادق" />
                            <option value="مستعرض / للقراءة فقط (Viewer)" />
                          </datalist>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف والتواصل</label>
                            <input
                              type="text"
                              value={userPhone}
                              onChange={(e) => setUserPhone(e.target.value)}
                              placeholder="010xxxxxxxx"
                              className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم القومي (14 رقم)</label>
                            <input
                              type="text"
                              maxLength={14}
                              value={userNationalId}
                              onChange={(e) => setUserNationalId(e.target.value)}
                              placeholder="2xxxxxxxxx"
                              className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Permissions Overview */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            صلاحيات النظام المكتسبة لهذا المسمى الوظيفي:
                          </label>
                          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              {userPermissions.canManagePilgrims ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                              <span>إدارة المعتمرين والتسكين</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              {userPermissions.canManageFinance ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                              <span>الحسابات والعمولات</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              {userPermissions.canManageStaff ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                              <span>إدارة الموظفين والصلاحيات</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              {userPermissions.canManageTripsTransports ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                              <span>الرحلات والنقل والحافلات</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Approval Buttons */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            rejectPendingUser(approvingUser.id);
                            const next = pendingUsers.find(u => u.status === 'pending' && u.id !== approvingUser.id);
                            setApprovingUser(next || null);
                          }}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-500/30 transition-all"
                        >
                          رفض الطلب
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            approvePendingUser(approvingUser.id, assignedRole, userPhone, userNationalId, userPermissions);
                            const next = pendingUsers.find(u => u.status === 'pending' && u.id !== approvingUser.id);
                            setApprovingUser(next || null);
                            if (!next) setShowPendingModal(false);
                          }}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>تأكيد اعتماد الدخول وإضافة الموظف</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="md:col-span-2 py-12 text-center text-slate-400 text-xs">
                      حدد حساياً من القائمة لمراجعته واعتماده.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
