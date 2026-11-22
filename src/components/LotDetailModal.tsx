import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  MapPin,
  Package,
  FileText,
  Award,
  Ship,
} from 'lucide-react';
import { CurrencyCode, GreenCoffeeLot, PartnerAccount, RfqType } from '../types';
import { SafeImage } from './SafeImage';
import { formatMoney, formatNumber } from '../utils/formatters';
import { getMaskedImporterLabel } from '../utils/contentGuard';

interface LotDetailModalProps {
  lot: GreenCoffeeLot | null;
  partners: PartnerAccount[];
  currency: CurrencyCode;
  onClose: () => void;
  onRequestAction: (lot: GreenCoffeeLot, type: RfqType) => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  lot,
  partners,
  currency,
  onClose,
  onRequestAction,
}) => {
  const [bagCount, setBagCount] = useState<number>(10);

  if (!lot) return null;

  const isOutOfStock = lot.availableTons <= 0;
  const maskedImporter = getMaskedImporterLabel(lot.importerId, partners);
  const maxBags = Math.max(1, Math.floor((lot.availableTons * 1000) / lot.bagWeightKg));
  const clampedBags = Math.min(maxBags, Math.max(1, bagCount));
  const totalKg = clampedBags * lot.bagWeightKg;
  const totalTons = totalKg / 1000;
  const estimatedSubtotal = totalKg * lot.pricePerKgEgp;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2A1A11]/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-[#2A1A11]/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A1A11]/10 bg-[#FBF9F6] flex items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#4E342E]">
              <span className="font-mono font-bold text-[#2A1A11]">{lot.lotCode}</span>
              <span aria-hidden="true">·</span>
              <span>{lot.origin}</span>
              <span aria-hidden="true">·</span>
              <span>{lot.species}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#2A1A11]">{lot.incoterm}</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#2A1A11] mt-0.5">
              {lot.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
            <div
              className={`sm:col-span-5 rounded-xl overflow-hidden border border-[#2A1A11]/10 min-h-[160px] ${
                lot.whiteBgStudio || lot.mediaType === 'video' ? 'bg-white p-2' : 'bg-[#F3EDE4]'
              }`}
            >
              {lot.mediaType === 'video' && lot.videoUrl ? (
                <video
                  src={lot.videoUrl}
                  controls
                  muted
                  playsInline
                  loop
                  className="w-full h-full object-contain bg-white rounded-lg"
                  aria-label={`فيديو توضيحي للمنتج ${lot.title}`}
                />
              ) : (
                <SafeImage
                  src={lot.imageUrl}
                  alt={lot.title}
                  className={`w-full h-full ${
                    lot.whiteBgStudio ? 'object-contain bg-white' : 'object-cover'
                  }`}
                />
              )}
            </div>

            <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-bold text-[#2A1A11]">
                    <Lock className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span>{maskedImporter}</span>
                  </span>
                  {lot.qualitySealed && (
                    <span className="inline-flex items-center gap-1 font-bold text-[#1E7E34]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>✔ منتج مفحوص</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[#4E342E]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>نطاق التخزين: {lot.warehouseGovernorate} (العنوان الدقيق عند الاتفاق)</span>
                </div>

                <div className="flex items-center gap-1 text-[#4E342E]">
                  <Ship className="w-3.5 h-3.5 shrink-0 text-[#C89B3C]" />
                  <span>شرط التسليم الدولي (Incoterm): {lot.incoterm}</span>
                </div>
              </div>

              {/* Technical Cupping Specs */}
              <div className="grid grid-cols-2 gap-2.5 bg-[#FBF9F6] border border-[#2A1A11]/10 rounded-xl p-3.5 text-xs">
                <div>
                  <span className="text-[#4E342E]/75 block">تقييم التذوق (SCA)</span>
                  <span className="font-mono tabular-nums font-bold text-[#2A1A11] inline-flex items-center gap-1 mt-0.5">
                    <Award className="w-3.5 h-3.5 text-[#C89B3C]" />
                    {lot.scaScore} نقطة
                  </span>
                </div>
                <div>
                  <span className="text-[#4E342E]/75 block">المعالجة</span>
                  <span className="font-bold text-[#2A1A11] mt-0.5 block">{lot.process}</span>
                </div>
                <div>
                  <span className="text-[#4E342E]/75 block">السكرين والرطوبة</span>
                  <span className="font-mono tabular-nums font-bold text-[#2A1A11] mt-0.5 block">
                    {lot.screen} · {lot.moisturePct}%
                  </span>
                </div>
                <div>
                  <span className="text-[#4E342E]/75 block">وزن الشوال / الحد الأدنى</span>
                  <span className="font-mono tabular-nums font-bold text-[#2A1A11] mt-0.5 block">
                    {lot.bagWeightKg} كجم · {lot.minOrderTons} طن
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bag & Cost Calculator */}
          <div className="bg-[#FBF9F6] border border-[#2A1A11]/12 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#2A1A11]">
                حاسبة الكمية بالشوال ({lot.bagWeightKg} كجم / شوال)
              </span>
              <span className="text-xs text-[#4E342E] font-mono tabular-nums">
                {isOutOfStock
                  ? 'نفذت الكمية المتاحة'
                  : `المتاح: ${maxBags} شوال (${formatNumber(lot.availableTons, 1)} طن)`}
              </span>
            </div>

            {!isOutOfStock && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <label className="block">
                  <span className="block text-[11px] text-[#4E342E] mb-1">عدد الشوالات</span>
                  <input
                    type="number"
                    min={1}
                    max={maxBags}
                    value={clampedBags}
                    onChange={(e) => setBagCount(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg"
                  />
                </label>

                <div>
                  <span className="block text-[11px] text-[#4E342E]">إجمالي الوزن</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-[#2A1A11]">
                    {formatNumber(totalKg)} كجم ({formatNumber(totalTons, 2)} طن)
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] text-[#4E342E]">التكلفة التقديرية</span>
                  <span className="text-base font-extrabold font-mono tabular-nums text-[#2A1A11]">
                    {formatMoney(estimatedSubtotal, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="px-6 py-4 border-t border-[#2A1A11]/10 bg-[#FBF9F6] flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#4E342E] block">
              السعر المعلن للكيلو ({lot.incoterm.split(' ')[0]})
            </span>
            <span className="text-lg font-extrabold font-mono tabular-nums text-[#2A1A11]">
              {formatMoney(lot.pricePerKgEgp, currency)} / كجم
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                onClose();
                onRequestAction(lot, 'sample');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#2A1A11] bg-white hover:bg-[#F3EDE4] border border-[#2A1A11]/20 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-4 h-4 text-[#C89B3C]" />
              <span>اطلب عينة</span>
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                onClose();
                onRequestAction(lot, 'bulk_rfq');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 text-[#C89B3C]" />
              <span>{isOutOfStock ? 'نفذت الكمية' : 'اطلب عرض سعر للكمية'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
