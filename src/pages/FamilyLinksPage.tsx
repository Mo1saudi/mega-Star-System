import React, { useState } from 'react';
import { useStore, isPilgrimWithdrawn } from '../lib/store';
import { SEO } from '../components/SEO';
import { FamilyGroup, FamilyValidationResult, Pilgrim } from '../types';
import { 
  HeartHandshake, Plus, Users, ShieldAlert, AlertTriangle, 
  CheckCircle2, Trash2, Edit3, UserCheck, X, Search, ArrowRightLeft, UserX, CopyX, GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

export const FamilyLinksPage: React.FC = () => {
  const { 
    familyGroups, pilgrims, addFamilyGroup, updateFamilyGroup, 
    deleteFamilyGroup, validateFamilyGroups, updatePilgrim,
    unlinkFamilyMemberAndRedistribute, deleteFamilyGroupAndRedistribute,
    transferFamilyMember, deduplicateFamilyGroups, generateNumberedFamilyLinks
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FamilyGroup | null>(null);

  // Drag and drop states
  const [draggedMember, setDraggedMember] = useState<{ pilgrim: Pilgrim; sourceGroup: FamilyGroup } | null>(null);
  const [activeFamilyDropTarget, setActiveFamilyDropTarget] = useState<string | null>(null);

  const [groupName, setGroupName] = useState('');
  const [selectedPilgrimIds, setSelectedPilgrimIds] = useState<string[]>([]);
  const [groupNotes, setGroupNotes] = useState('');

  // Member transfer modal state
  const [transferringMember, setTransferringMember] = useState<{ pilgrim: Pilgrim; sourceGroup: FamilyGroup } | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  // Search states
  const [searchGroupQuery, setSearchGroupQuery] = useState('');
  const [searchPilgrimQuery, setSearchPilgrimQuery] = useState('');

  const validationResults: FamilyValidationResult[] = validateFamilyGroups();
  const validationMap = new Map<string, FamilyValidationResult>(validationResults.map(v => [v.groupId, v]));

  const handleOpenAddModal = () => {
    setEditingGroup(null);
    setGroupName('');
    setSelectedPilgrimIds([]);
    setGroupNotes('');
    setSearchPilgrimQuery('');
    setShowModal(true);
  };

  const handleOpenEditModal = (group: FamilyGroup) => {
    setEditingGroup(group);
    setGroupName(group.group_name);
    setSelectedPilgrimIds(group.pilgrim_ids);
    setGroupNotes(group.notes || '');
    setSearchPilgrimQuery('');
    setShowModal(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || selectedPilgrimIds.length === 0) {
      toast.error('يرجى تحديد اسم الرابطة العائلية وااختيار فرد واحد على الأقل');
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

  const togglePilgrimSelection = (p: Pilgrim) => {
    if (isPilgrimWithdrawn(p)) {
      toast.error(`المعتمر (${p.name}) ملغي/مستبعد؛ لا يمكن ربطه عائلياً`);
      return;
    }
    setSelectedPilgrimIds(prev => 
      prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]
    );
  };

  // Remove individual member from family group and redistribute them automatically
  const handleRemoveMemberAndRedistribute = (pilgrim: Pilgrim, group: FamilyGroup) => {
    setConfirmModal({
      title: 'إزالة الربط العائلي وإعادة التوزيع',
      message: `هل أنت متأكد من إزالة الربط العائلي للمعتمر (${pilgrim.name}) من عائلة (${group.group_name})؟ سيتم إعادة توزيعه تلقائياً في غرفة متوافقة مع الجنس.`,
      confirmText: 'تأكيد إزالة الربط',
      onConfirm: () => {
        unlinkFamilyMemberAndRedistribute(pilgrim.id);
        setConfirmModal(null);
      }
    });
  };

  // Delete family group completely and redistribute all members automatically
  const handleDeleteGroupAndRedistribute = (group: FamilyGroup) => {
    setConfirmModal({
      title: 'حذف الرابط العائلي بالكامل',
      message: `هل أنت متأكد من حذف الرابط العائلي (${group.group_name}) بالكامل؟ سيتم إعادة توزيع جميع أفراده تلقائياً في غرف متوافقة مع الجنس.`,
      confirmText: 'تأكيد الحذف وتوزيع الأفراد',
      onConfirm: () => {
        deleteFamilyGroupAndRedistribute(group.id);
        setConfirmModal(null);
      }
    });
  };

  // Transfer member to another family group or create new
  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringMember) return;

    const { pilgrim, sourceGroup } = transferringMember;

    if (!targetGroupId) {
      toast.error('يرجى اختيار الرابط العائلي المستهدف');
      return;
    }

    transferFamilyMember(
      pilgrim.id,
      sourceGroup.id,
      targetGroupId,
      `عائلة المعتمر (${pilgrim.name})`
    );

    setTransferringMember(null);
  };

  return (
    <div className="space-y-6 pb-24">
      <SEO title="الروابط العائلية" description="إدارة الروابط العائلية وكشف التعارضات الشرعية والفندقية في توزيع أسر المعتمرين" />

      {/* Header & Search */}
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

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Main Search Bar for Family Groups */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchGroupQuery}
              onChange={(e) => setSearchGroupQuery(e.target.value)}
              placeholder="بحث باسم العائلة أو المعتمر..."
              className="w-full pr-10 pl-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none transition-all"
            />
            {searchGroupQuery && (
              <button
                onClick={() => setSearchGroupQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => generateNumberedFamilyLinks()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl transition-all font-cairo cursor-pointer shrink-0 border border-emerald-500/30"
            title="توزيع المستقلين الذين ليس لديهم روابط عائلية إلى روابط بأرقام (رابط رقم 1، رابط رقم 2...) بالضوابط الشرعية"
          >
            <Users className="w-4 h-4" />
            <span>توليد روابط رقمية للمستقلين</span>
          </button>

          <button
            onClick={() => deduplicateFamilyGroups()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl transition-all font-cairo cursor-pointer shrink-0 border border-amber-500/30"
            title="دمج العائلات المكررة بنفس الاسم"
          >
            <CopyX className="w-4 h-4" />
            <span>دمج العائلات المكررة</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all font-cairo shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء رابطة جديدة</span>
          </button>
        </div>
      </div>

      {/* New Group Drop Zone Banner when Dragging a Member */}
      {draggedMember && (
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (activeFamilyDropTarget !== 'new_group') setActiveFamilyDropTarget('new_group');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (activeFamilyDropTarget === 'new_group') setActiveFamilyDropTarget(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setActiveFamilyDropTarget(null);
            const { pilgrim, sourceGroup } = draggedMember;
            setDraggedMember(null);
            transferFamilyMember(pilgrim.id, sourceGroup.id, 'new_group', `عائلة المعتمر (${pilgrim.name})`);
            toast.success(`تم نقل (${pilgrim.name}) لإنشاء مجموعة عائلية جديدة`);
          }}
          className={`p-4 rounded-2xl border-2 border-dashed transition-all text-center animate-pulse ${
            activeFamilyDropTarget === 'new_group'
              ? 'bg-amber-500/25 border-amber-500 scale-[1.02] ring-2 ring-amber-500/40 text-amber-900 dark:text-amber-200 font-extrabold shadow-xl'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold'
          }`}
        >
          ✨ أسقط المعتمر ({draggedMember.pilgrim.name}) هنا لإنشاء مجموعة عائلية جديدة خاصة به
        </div>
      )}

      {/* Family Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {familyGroups
          .filter((group) => {
            if (!searchGroupQuery.trim()) return true;
            const q = searchGroupQuery.toLowerCase().trim();
            const groupPilgrims = pilgrims.filter(p => group.pilgrim_ids.includes(p.id) && !isPilgrimWithdrawn(p));
            const hasMatchingPilgrim = groupPilgrims.some(
              p => p.name.toLowerCase().includes(q) || p.passport_number.toLowerCase().includes(q)
            );
            return (
              group.group_name.toLowerCase().includes(q) ||
              (group.notes && group.notes.toLowerCase().includes(q)) ||
              hasMatchingPilgrim
            );
          })
          .map((group) => {
          const groupPilgrims = pilgrims.filter(p => group.pilgrim_ids.includes(p.id) && !isPilgrimWithdrawn(p));
          const validation = validationMap.get(group.id);
          const isDropTarget = activeFamilyDropTarget === group.id;

          return (
            <div 
              key={group.id} 
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (activeFamilyDropTarget !== group.id) setActiveFamilyDropTarget(group.id);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (activeFamilyDropTarget === group.id) setActiveFamilyDropTarget(null);
              }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveFamilyDropTarget(null);

            let pilgrimId = draggedMember?.pilgrim?.id;
            let sourceGroupId = draggedMember?.sourceGroup?.id;
            let pilgrimName = draggedMember?.pilgrim?.name || '';
            let pilgrimObj = draggedMember?.pilgrim;

            if (!pilgrimId || !sourceGroupId) {
              try {
                const jsonStr = e.dataTransfer.getData('application/json');
                const textStr = e.dataTransfer.getData('text/plain');
                const raw = jsonStr || textStr;
                if (raw) {
                  if (raw.startsWith('{')) {
                    const parsed = JSON.parse(raw);
                    pilgrimId = parsed.pilgrimId;
                    sourceGroupId = parsed.sourceGroupId;
                    pilgrimName = parsed.name || '';
                  } else {
                    pilgrimId = raw;
                  }
                }
              } catch (err) {
                console.error(err);
              }
            }

            setDraggedMember(null);

            if (!pilgrimId) return;
            if (sourceGroupId === group.id) return;

            if (!pilgrimObj) {
              pilgrimObj = pilgrims.find(p => p.id === pilgrimId);
            }

            if (pilgrimObj && isPilgrimWithdrawn(pilgrimObj)) {
              toast.error(`المعتمر (${pilgrimObj.name}) ملغي/مستبعد؛ لا يمكن ربطه عائلياً`);
              return;
            }

            transferFamilyMember(pilgrimId, sourceGroupId || '', group.id);
            toast.success(`تم نقل المعتمر (${pilgrimName || 'المعتمر'}) إلى (${group.group_name}) بنجاح بالسحب والإفلات`);
          }}
              className={`bg-white dark:bg-[#151c2d] rounded-2xl border transition-all duration-200 shadow-sm p-5 space-y-4 flex flex-col justify-between ${
                isDropTarget 
                  ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10 scale-[1.02] shadow-xl' 
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
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
                      title="تعديل اسم وملاحظات العائلة"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroupAndRedistribute(group)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="إلغاء الربط العائلي وإعادة توزيع الأفراد تلقائياً في غرف متوافقة مع الجنس"
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 font-cairo">أفراد المجموعة (قابلون للسحب):</span>
                    <span className="text-[10px] text-slate-400 font-medium">اسحب لمجموعة عائلية أخرى</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupPilgrims.map(p => {
                      const isWithdrawn = isPilgrimWithdrawn(p);
                      return (
                        <div 
                          key={p.id} 
                          draggable={!isWithdrawn}
                          onDragStart={(e) => {
                            if (isWithdrawn) {
                              e.preventDefault();
                              toast.error(`المعتمر (${p.name}) ملغي/مستبعد`);
                              return;
                            }
                            try {
                              e.dataTransfer.setData('text/plain', p.id);
                              e.dataTransfer.setData('application/json', JSON.stringify({ pilgrimId: p.id, sourceGroupId: group.id, name: p.name }));
                            } catch (err) {
                              console.error(err);
                            }
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedMember({ pilgrim: p, sourceGroup: group });
                          }}
                          onDragEnd={() => {
                            setDraggedMember(null);
                            setActiveFamilyDropTarget(null);
                          }}
                          className={`group/pill flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            isWithdrawn 
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 line-through opacity-80 cursor-not-allowed'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 cursor-grab active:cursor-grabbing hover:border-amber-500 hover:shadow-sm'
                          } ${
                            draggedMember?.pilgrim.id === p.id ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          {!isWithdrawn && <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span>{p.name}</span>
                          <span className="text-[10px] opacity-75 font-normal">({p.gender})</span>
                          {isWithdrawn && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold no-underline">
                              ملغي/مستبعد
                            </span>
                          )}

                          <div className="flex items-center gap-1 mr-1 border-r border-slate-300 dark:border-slate-700 pr-1.5 opacity-90 sm:opacity-60 group-hover/pill:opacity-100 transition-opacity">
                            {!isWithdrawn && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferringMember({ pilgrim: p, sourceGroup: group });
                                  setTargetGroupId('');
                                }}
                                className="p-1 hover:text-amber-500 rounded transition-colors cursor-pointer"
                                title="نقل المعتمر إلى مجموعة عائلية أخرى"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMemberAndRedistribute(p, group)}
                              className="p-1 hover:text-rose-500 rounded transition-colors cursor-pointer"
                              title="إزالة الربط العائلي للمعتمر"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

      {/* Modal: Transfer Member to Another Group */}
      {transferringMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold font-cairo text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <span>نقل معتمر لرابط عائلي آخر</span>
              </h3>
              <button
                onClick={() => setTransferringMember(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4 text-right">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">المعتمر المراد نقله:</span>
                <strong className="text-sm font-extrabold text-slate-900 dark:text-amber-400 block">{transferringMember.pilgrim.name}</strong>
                <span className="text-xs text-slate-500">من مجموعة: {transferringMember.sourceGroup.group_name}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اختر المجموعة العائلية المستهدفة
                </label>
                <select
                  required
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:outline-none text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="">-- اختر مجموعة عائلية --</option>
                  <option value="new_group">➕ إنشاء مجموعة عائلية جديدة للمعتمر</option>
                  {familyGroups
                    .filter(g => g.id !== transferringMember.sourceGroup.id)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.group_name} ({g.pilgrim_ids.length} أفراد)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  تأكيد نقل المعتمر
                </button>
                <button
                  type="button"
                  onClick={() => setTransferringMember(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Family Group */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold font-cairo text-slate-900 dark:text-white">
                {editingGroup ? 'تعديل الرابطة العائلية' : 'إنشاء رابطة عائلية جديدة'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم المجموعة العائلية</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="مثال: عائلة الشاذلي (3 أفراد)"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    اختر أفراد العائلة من المعتمرين
                  </label>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    تم تحديد {selectedPilgrimIds.length} معتمر
                  </span>
                </div>

                {/* Pilgrim Search Input inside Modal */}
                <div className="relative mb-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchPilgrimQuery}
                    onChange={(e) => setSearchPilgrimQuery(e.target.value)}
                    placeholder="ابحث باسم المعتمر، رقم الجواز، أو الملاحظات..."
                    className="w-full pr-9 pl-8 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700/60 focus:border-amber-500 focus:outline-none"
                  />
                  {searchPilgrimQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchPilgrimQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pilgrims
                    .filter(p => !isPilgrimWithdrawn(p))
                    .filter(p => {
                      if (!searchPilgrimQuery.trim()) return true;
                      const q = searchPilgrimQuery.toLowerCase().trim();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        p.passport_number.toLowerCase().includes(q) ||
                        (p.notes && p.notes.toLowerCase().includes(q))
                      );
                    })
                    .map(p => {
                      const isSelected = selectedPilgrimIds.includes(p.id);
                      const isWithdrawn = isPilgrimWithdrawn(p);
                      return (
                        <div 
                          key={p.id}
                          onClick={() => togglePilgrimSelection(p)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isWithdrawn
                              ? 'bg-rose-500/10 text-rose-800 dark:text-rose-300 opacity-60 line-through cursor-not-allowed'
                              : isSelected ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-slate-300'}`} />
                            <span>{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isWithdrawn && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold no-underline">
                                ملغي/مستبعد
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">{p.passport_number} ({p.gender})</span>
                          </div>
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
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none text-slate-900 dark:text-slate-100 h-20 resize-none"
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
      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151c2d] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5 text-amber-600 dark:text-amber-400">
              <div className="p-3 bg-amber-500/10 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold font-cairo text-slate-900 dark:text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{confirmModal.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
