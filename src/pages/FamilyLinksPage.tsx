import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { SEO } from '../components/SEO';
import { FamilyGroup } from '../types';
import { 
  HeartHandshake, Plus, Users, ShieldAlert, AlertTriangle, 
  CheckCircle2, Trash2, Edit3, UserCheck, X 
} from 'lucide-react';
import { toast } from 'sonner';

export const FamilyLinksPage: React.FC = () => {
  const { 
    familyGroups, pilgrims, addFamilyGroup, updateFamilyGroup, 
    deleteFamilyGroup, validateFamilyGroups 
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FamilyGroup | null>(null);

  const [groupName, setGroupName] = useState('');
  const [selectedPilgrimIds, setSelectedPilgrimIds] = useState<string[]>([]);
  const [groupNotes, setGroupNotes] = useState('');

  const validationResults = validateFamilyGroups();
  const validationMap = new Map(validationResults.map(v => [v.groupId, v]));

  const handleOpenAddModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setSelectedPilgrimIds([]);
    setGroupNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (group: FamilyGroup) => {
    setEditingGroup(group);
    setGroupName(group.group_name);
    setSelectedPilgrimIds(group.pilgrim_ids);
    setGroupNotes(group.notes || '');
    setShowModal(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || selectedPilgrimIds.length === 0) {
      toast.error('يرجى تحديد اسم الرابطة العائلية واختيار فرد واحد على الأقل');
      return;
    }

    if (editingGroup) {
      updateFamilyGroup(editingGroup.id, {
        group_name: groupName,
        pilgrim_ids: selectedPilgrimIds,
        notes: groupNotes
      });
    } else {
      addFamilyGroup({
        group_name: groupName,
        pilgrim_ids: selectedPilgrimIds,
        notes: groupNotes
      });
    }

    setShowModal(false);
  };

  const togglePilgrimSelection = (id: string) => {
    setSelectedPilgrimIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <SEO title="الروابط العائلية" description="إدارة الروابط العائلية وكشف التعارضات الشرعية والفندقية في توزيع أسر المعتمرين" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-cairo flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-500" />
            <span>نظام الروابط العائلية والتحقق الذكي</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ربط أسر المعتمرين مع الفحص التلقائي للتعارضات والفنادق والمحارم.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all font-cairo shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء رابطة عائلية جديدة</span>
        </button>
      </div>

      {/* Family Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {familyGroups.map((group) => {
          const groupPilgrims = pilgrims.filter(p => group.pilgrim_ids.includes(p.id));
          const validation = validationMap.get(group.id);

          return (
            <div 
              key={group.id} 
              className="bg-white dark:bg-[#151c2d] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-cairo">
                      {group.group_name}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {groupPilgrims.length} أفراد مسجلين بالرابط
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(group)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف مجموعة ${group.group_name}؟`)) deleteFamilyGroup(group.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Validation Status Badges */}
                {validation && (
                  <div className="mt-3 space-y-2">
                    {validation.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}

                    {validation.warnings.map((warn, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{warn}</span>
                      </div>
                    ))}

                    {validation.isValid && validation.warnings.length === 0 && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>جميع الشروط متطابقة ولا توجد تعارضات بشرعية التسكين أو الفنادق.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Member Pills */}
                <div className="mt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-400 font-cairo">أفراد المجموعة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {groupPilgrims.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-slate-400">({p.gender})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {group.notes && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 italic">
                  ملاحظة: {group.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Create/Edit Family Group */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">
              {editingGroup ? 'تعديل الرابطة العائلية' : 'إنشاء رابطة عائلية جديدة'}
            </h3>

            <form onSubmit={handleSaveGroup} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم المجموعة العائلية</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="مثال: عائلة الشاذلي (3 أفراد)"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اختر أفراد العائلة من المعتمرين</label>
                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {pilgrims.map(p => {
                    const isSelected = selectedPilgrimIds.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => togglePilgrimSelection(p.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isSelected ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-slate-300'}`} />
                          <span>{p.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{p.passport_number} ({p.gender})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ملاحظات التسكين الخاصة</label>
                <textarea
                  value={groupNotes}
                  onChange={e => setGroupNotes(e.target.value)}
                  placeholder="مثال: يفضل غرف متجاورة بالفندق"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none h-20 resize-none"
                ></textarea>
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
                  حفظ الرابطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
