import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { Staff } from '../types';
import { 
  UserCheck, Plus, Search, Edit3, Trash2, 
  Phone, Shield, CheckCircle, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export const StaffPage: React.FC = () => {
  const { 
    staff, addStaff, updateStaff, deleteStaff, 
    toggleStaffStatus, searchQuery 
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    role: 'مشرف ميداني',
    status: 'نشط',
    phone: '+966 500000000'
  });

  const filteredStaff = staff.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || 
           s.role.toLowerCase().includes(q) || 
           s.phone.includes(q);
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'مشرف ميداني',
      status: 'نشط',
      phone: '+966 5' + Math.floor(10000000 + Math.random() * 90000000)
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

  return (
    <div className="space-y-6 pb-24">
      <SEO title="الموظفون والكادر" description="إدارة كادر العمليات والمشرفين الميدانيين والسائقين ومتابعة حالة التنشيط" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <span>سجل كادر العمليات والمشرفين (50 موظف)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة حالة النشاط والهواتف والتخصصات لجميع طاقم الخدمة الميدانية.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all font-cairo shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="p-3.5">الرمز</th>
                <th className="p-3.5">اسم الموظف</th>
                <th className="p-3.5">المسمى الوظيفي</th>
                <th className="p-3.5">رقم التواصل</th>
                <th className="p-3.5">حالة النشاط</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredStaff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400">{s.id}</td>
                  <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{s.name}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">{s.role}</td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{s.phone}</td>
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
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف الموظف ${s.name}؟`)) deleteStaff(s.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                  placeholder="مثال: محمد الشريف"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">المسمى الوظيفي</label>
                <select
                  value={formData.role || 'مشرف ميداني'}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="مشرف ميداني">مشرف ميداني</option>
                  <option value="مرشد ديني">مرشد ديني</option>
                  <option value="منسق تسكين">منسق تسكين</option>
                  <option value="سائق حافلة">سائق حافلة</option>
                  <option value="مشرف مطار">مشرف مطار</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  required
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="مثال: +966 501234567"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-600"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
