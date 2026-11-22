import React, { useState } from 'react';
import { Smartphone, Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1C110B] bg-[#F2C864] hover:bg-[#C89B3C] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#2A1A11] bg-[#FBF9F6] hover:bg-[#F3EDE4] border border-[#2A1A11]/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#B4532A]" />
          <span>تثبيت على الآيفون</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 bg-[#1C110B]/60 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="تثبيت التطبيق على الآيفون"
          >
            <div className="bg-white border border-[#2A1A11]/15 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#1C110B]">
                  تثبيت «بُنّ تك» كتطبيق على الآيفون
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[#4E342E] hover:text-[#1C110B] cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="text-xs sm:text-sm text-[#4E342E] space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#B4532A]">1.</span>
                  <span>
                    اضغط على أيقونة <strong>المشاركة (Share)</strong>{' '}
                    <Share className="inline w-3.5 h-3.5 text-[#2A1A11]" /> في شريط متصفح Safari
                    بالأسفل.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#B4532A]">2.</span>
                  <span>
                    مرّر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#B4532A]">3.</span>
                  <span>اضغط <strong>إضافة (Add)</strong> ليظهر التطبيق بأيقونته الكاملة على هاتفك.</span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
              >
                فهمت، إغلاق
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
