import React from 'react';
import { X, Cloud, Server, Globe, CheckCircle2, ArrowRight, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface HostingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingGuideModal: React.FC<HostingGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in dir-rtl">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#151c2d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-amber-400">
                دليل رفـع ونشر الموقع على استضافة مجانية 100%
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                خطوات رفع المشروع وتشغيله أونلاين مجاناً مدى الحياة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Quick Overview */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-700 dark:text-amber-400">أفضل منصات استضافة مجانية تدعم Node.js و React</h4>
              <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                يمكنك رفع الموقع مجاناً بالكامل دون دفع أي رسوم على منصات عالمية سريعة ومجانية مثل <strong>Render</strong> أو <strong>Vercel</strong> أو <strong>Netlify</strong>.
              </p>
            </div>
          </div>

          {/* Option 1: Render.com (Recommended for Full-Stack Node.js/Express) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">الخيار الموصى به</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">1. الاستضافة الكاملة على Render.com (مجاني 100%)</h3>
              </div>
              <a href="https://render.com" target="_blank" rel="noreferrer" className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-bold">
                زيارة الموقع <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <li>حمل كود الموقع بصيغة <strong>ZIP</strong> من قائمة إعدادات الموقع أو اربطه بحسابك على <strong>GitHub</strong>.</li>
              <li>انشئ حساباً مجانياً على موقع <a href="https://render.com" target="_blank" rel="noreferrer" className="text-amber-500 font-bold underline">Render.com</a>.</li>
              <li>اضغط على <strong>New +</strong> ثم اختر <strong>Web Service</strong>.</li>
              <li>اختر مستودع المشروع من GitHub.</li>
              <li>حدد إعدادات التشغيل كالتالي:
                <ul className="list-disc list-inside mr-4 mt-1 space-y-1 font-mono text-[11px] text-amber-600 dark:text-amber-400">
                  <li>Build Command: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">npm run build</code></li>
                  <li>Start Command: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">npm start</code></li>
                </ul>
              </li>
              <li>اضغط <strong>Deploy Web Service</strong> وسيصبح موقعك يعمل على رابط عالمي مجاني مثل: <code className="font-mono text-emerald-500">https://megastar-umrah.onrender.com</code>.</li>
            </ol>
          </div>

          {/* Option 2: Vercel / Netlify */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">2. النشر المباشر عبر Vercel أو Netlify</h3>
              <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-bold">
                Vercel.com <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <ul className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>قم برفع مشروعك على مستودع GitHub خاص بك.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>قم بربط حساب Vercel بحساب GitHub واضغط <strong>Import Project</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>سيقوم Vercel ببناء الموقع أوتوماتيكياً وتزويدك برابط مجاني مجاناً مع شهادة أمان SSL تلقائية.</span>
              </li>
            </ul>
          </div>

          {/* Step 3: Export & Backup */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl space-y-2">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              كيفية تحميل الملفات الآن لرفعها
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يمكنك تصدير كود الموقع كاملاً من القائمة العلوية من إعدادات التطبيق كملف ZIP أو رفعه إلى GitHub مباشرة بضغطة زر.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all"
          >
            فهمت ذلك، إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
