import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { FileText, Plus, Trash2, Download, Search, CheckCircle2, AlertCircle, FileCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const DocumentsPage: React.FC = () => {
  const { documents, addDocument, deleteDocument } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'visa' | 'passport' | 'hotel_voucher' | 'ticket' | 'contract'>('visa');
  const [newEntityName, setNewEntityName] = useState('');

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.entity_name && doc.entity_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      toast.error('يرجى كتابة عنوان المستند');
      return;
    }

    addDocument({
      title: newTitle,
      type: newType,
      entity_type: 'trip',
      entity_name: newEntityName || 'رحلة عمرة عامة',
      upload_date: new Date().toISOString().split('T')[0],
      file_size: '2.1 MB',
      status: 'معتمد',
    });

    setIsAddOpen(false);
    setNewTitle('');
    setNewEntityName('');
  };

  return (
    <div className="space-y-6 dir-rtl font-cairo animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#151c2d] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              خزينة المستندات والتأشيرات
            </span>
            <span className="text-xs text-slate-400">تخزين آمن 100%</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            إدارة التأشيرات والعقود والفوتشرات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            أرشيف المستندات الرسمية، التأشيرات المجمعة، عقود النقل وفوتشرات الفنادق
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>رفع مستند / عقد جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#151c2d] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                filterType === 'all' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              الكل ({documents.length})
            </button>
            <button
              onClick={() => setFilterType('visa')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                filterType === 'visa' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              التأشيرات والباركود
            </button>
            <button
              onClick={() => setFilterType('hotel_voucher')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                filterType === 'hotel_voucher' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              فوتشرات الفنادق
            </button>
            <button
              onClick={() => setFilterType('contract')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                filterType === 'contract' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              العقود المبرمة
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث باسم المستند أو الفندق..."
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredDocs.map(doc => (
            <div 
              key={doc.id}
              className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    الجهة: {doc.entity_name || 'عام'}
                  </p>
                </div>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="text-slate-400 hover:text-rose-500 p-1 transition-all"
                  title="حذف المستند"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-700/60 pt-3">
                <span className="font-mono">الحجم: {doc.file_size || '1.5 MB'}</span>
                <span className="font-mono">تاريخ الرفع: {doc.upload_date}</span>
                <span className="px-2 py-0.5 font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {doc.status}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Add Doc Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              رفع واعتماد مستند جديد
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان المستند
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: عقود حافلات نقل مكة والمدينة"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع المستند
                </label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                >
                  <option value="visa">تأشيرات مجمعة</option>
                  <option value="hotel_voucher">فوتشر فندق</option>
                  <option value="contract">عقد شركة نقل / طيران</option>
                  <option value="passport">جواز سفر معتمر</option>
                  <option value="ticket">تذكرة طيران</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الفندق / الرحلة / الشركة المرتبطة
                </label>
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="مثال: فندق أنجم مكة / رحلة الطليعة 1"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md"
                >
                  اعتماد المستند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
