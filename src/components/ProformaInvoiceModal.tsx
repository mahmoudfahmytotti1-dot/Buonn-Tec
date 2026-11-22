import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { CurrencyCode, GreenCoffeeLot, PartnerAccount, RfqRequest } from '../types';
import { formatMoney, formatNumber } from '../utils/formatters';

interface ProformaInvoiceModalProps {
  rfq: RfqRequest | null;
  lot?: GreenCoffeeLot;
  partners: PartnerAccount[];
  currency: CurrencyCode;
  onClose: () => void;
}

export const ProformaInvoiceModal: React.FC<ProformaInvoiceModalProps> = ({
  rfq,
  lot,
  partners,
  currency,
  onClose,
}) => {
  if (!rfq) return null;

  const importer = partners.find((p) => p.id === rfq.importerId);
  const roaster = partners.find(
    (p) => p.name === rfq.roasterName && p.type === 'roaster'
  );

  const unitPrice = rfq.quotedPricePerKgEgp ?? rfq.initialPricePerKgEgp;
  const totalKg = rfq.type === 'bulk_rfq' ? (rfq.requestedTons || 0) * 1000 : 0;
  const grossTotal = totalKg * unitPrice;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2A1A11]/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-[#2A1A11]/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#2A1A11]/10 bg-[#FBF9F6] flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#2A1A11]">
              ملخص الاتفاق التجاري والفاتورة المبدئية (B2B)
            </h3>
            <p className="text-xs font-mono text-[#4E342E] mt-0.5">
              مرجع الصفقة: {rfq.id} · {rfq.lotCode}
              {lot ? ` · ${lot.incoterm}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Verified Status Banner */}
          <div className="bg-[#1E7E34]/10 border border-[#1E7E34]/30 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-[#1E7E34]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">بيانات الطرفين مكتملة لإتمام التسليم</p>
              <p className="text-[#2A1A11]/80 mt-0.5">
                حالة العقد: <strong>{rfq.status}</strong> · تاريخ الاعتماد:{' '}
                <span className="font-mono">{rfq.completedAt || rfq.createdAt}</span>
              </p>
            </div>
          </div>

          {/* Revealed Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FBF9F6] border border-[#2A1A11]/10 space-y-1 text-xs">
              <p className="text-[#4E342E]/75 font-semibold">الطرف الأول (المورد / المستورد البائع)</p>
              <p className="text-sm font-bold text-[#2A1A11]">{rfq.importerName}</p>
              <p className="text-[#4E342E]">
                الدولة والمركز: {importer?.country || 'مصر'} — {importer?.governorate || ''}
              </p>
              <p className="font-mono text-[#4E342E]">
                السجل الضريبي: {importer?.taxId || '304-882-910'}
              </p>
              <p className="font-mono text-[#4E342E]">
                الهاتف: {importer?.phone || '+20 100 442 8810'}
              </p>
              <p className="text-[#4E342E]">
                موقع الاستلام: {lot?.warehouseLocation || importer?.governorate}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FBF9F6] border border-[#2A1A11]/10 space-y-1 text-xs">
              <p className="text-[#4E342E]/75 font-semibold">الطرف الثاني (المحمصة المشترية)</p>
              <p className="text-sm font-bold text-[#2A1A11]">{rfq.roasterName}</p>
              <p className="text-[#4E342E]">
                الدولة والمدينة: {roaster?.country || 'دولي'} — {roaster?.governorate || rfq.targetGovernorate}
              </p>
              <p className="font-mono text-[#4E342E]">
                السجل الضريبي: {roaster?.taxId || '219-403-881'}
              </p>
              <p className="font-mono text-[#4E342E]">
                الهاتف: {roaster?.phone || '+20 109 883 4512'}
              </p>
              <p className="text-[#4E342E]">وجهة التسليم: {rfq.targetGovernorate}</p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-[#2A1A11]/12 rounded-xl overflow-hidden">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-[#4E342E]">
                  <th className="py-2.5 px-4">البند والمواصفات</th>
                  <th className="py-2.5 px-4">الكمية</th>
                  <th className="py-2.5 px-4">السعر المتفق عليه</th>
                  <th className="py-2.5 px-4">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#2A1A11]/10">
                  <td className="py-3 px-4 font-bold text-[#2A1A11]">
                    {rfq.lotTitle}
                    {lot && (
                      <div className="text-[11px] font-normal text-[#4E342E] mt-0.5">
                        {lot.origin} · {lot.process} · سكرين {lot.screen} · رطوبة {lot.moisturePct}% · {lot.incoterm}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-[#2A1A11]">
                    {rfq.type === 'sample'
                      ? `عينة ${rfq.sampleWeightGrams} جم`
                      : `${formatNumber(rfq.requestedTons || 0, 1)} طن (${formatNumber(totalKg)} كجم)`}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-[#2A1A11]">
                    {formatMoney(unitPrice, currency)} / كجم
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#2A1A11]">
                    {rfq.type === 'sample' ? 'عينة فحص' : formatMoney(grossTotal, currency)}
                  </td>
                </tr>
              </tbody>
            </table>

            {rfq.type === 'bulk_rfq' && (
              <div className="bg-[#FBF9F6] p-4 flex items-center justify-between text-sm font-extrabold text-[#2A1A11]">
                <span>إجمالي قيمة التوريد المتفق عليها ({lot?.incoterm || 'EXW'}):</span>
                <span className="font-mono tabular-nums text-base">
                  {formatMoney(grossTotal, currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#2A1A11]/10 bg-[#FBF9F6] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#2A1A11] bg-white border border-[#2A1A11]/20 hover:bg-[#F3EDE4] rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C89B3C]" />
            <span>طباعة العقد المبدئي</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
