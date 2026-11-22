import React, { useEffect, useState } from 'react';
import {
  X,
  Send,
  AlertTriangle,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Tag,
} from 'lucide-react';
import { CurrencyCode, GreenCoffeeLot, PartnerAccount, RfqRequest, RfqStatus } from '../types';
import {
  detectContactViolation,
  getMaskedImporterLabel,
  getMaskedRoasterLabel,
  isDealConfirmedStatus,
} from '../utils/contentGuard';
import { formatEgp, formatMoney, formatNumber } from '../utils/formatters';

interface NegotiationChatDrawerProps {
  rfq: RfqRequest | null;
  lot?: GreenCoffeeLot;
  partners: PartnerAccount[];
  currency: CurrencyCode;
  viewerRole: 'roaster' | 'importer' | 'admin';
  onClose: () => void;
  onSendMessage: (
    rfqId: string,
    senderRole: 'roaster' | 'importer',
    text: string,
    proposedPricePerKgEgp?: number
  ) => void;
  onLogViolation: (
    rfqId: string,
    senderRole: 'roaster' | 'importer',
    attemptedText: string,
    reason: string
  ) => void;
  onUpdateRfqStatus: (rfqId: string, status: RfqStatus, quotedPrice?: number) => void;
  onOpenInvoice: (rfq: RfqRequest) => void;
}

const QUICK_PROMPTS_ROASTER = [
  'هل السعر المعلن قابل للتخفيض للكمية المطلوبة؟',
  'ما هو موعد الشحن والتسليم المتاح وفق شرط التسليم المحدد؟',
  'هل تتوفر شهادة فحص رطوبة وجودة حديثة لهذا المنتج؟',
];

const QUICK_PROMPTS_IMPORTER = [
  'السعر النهائي يشمل التحميل والتغليف في شوالات سليمة مطابقة للمواصفة.',
  'الكمية جاهزة للتجهيز والشحن خلال 48 ساعة من تأكيد الاتفاق.',
  'يمكن إرسال عينة فحص 500 جم للمراجعة المخبرية قبل الشراء.',
];

export const NegotiationChatDrawer: React.FC<NegotiationChatDrawerProps> = ({
  rfq,
  lot,
  partners,
  currency,
  viewerRole,
  onClose,
  onSendMessage,
  onLogViolation,
  onUpdateRfqStatus,
  onOpenInvoice,
}) => {
  const [messageText, setMessageText] = useState('');
  const [guardError, setGuardError] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);

  useEffect(() => {
    if (rfq) {
      setCounterPrice(rfq.quotedPricePerKgEgp ?? rfq.initialPricePerKgEgp);
      setGuardError(null);
    }
  }, [rfq?.id, rfq?.quotedPricePerKgEgp]);

  if (!rfq) return null;

  const dealConfirmed = isDealConfirmedStatus(rfq.status);
  const importerPartner = partners.find((p) => p.id === rfq.importerId);
  const roasterPartner = partners.find(
    (p) => p.name === rfq.roasterName && p.type === 'roaster'
  );

  const maskedImporter = getMaskedImporterLabel(
    rfq.importerId,
    partners,
    rfq.importerAnonCode
  );
  const maskedRoaster = getMaskedRoasterLabel(
    rfq.roasterName,
    partners,
    rfq.roasterAnonCode
  );

  const importerDisplay =
    viewerRole === 'importer' || viewerRole === 'admin' || dealConfirmed
      ? rfq.importerName
      : maskedImporter;

  const roasterDisplay =
    viewerRole === 'roaster' || viewerRole === 'admin' || dealConfirmed
      ? rfq.roasterName
      : maskedRoaster;

  const partnerNamesForGuard = partners.map((p) => p.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerRole === 'admin') return;
    const trimmed = messageText.trim();
    if (!trimmed) return;

    if (!dealConfirmed) {
      const check = detectContactViolation(trimmed, partnerNamesForGuard);
      if (check.blocked) {
        setGuardError(check.reason);
        onLogViolation(rfq.id, viewerRole, trimmed, check.reason);
        return;
      }
    }

    setGuardError(null);
    onSendMessage(rfq.id, viewerRole, trimmed);
    setMessageText('');
  };

  const handleSendCounterOffer = () => {
    if (viewerRole === 'admin' || counterPrice < 10) return;
    const displayOffer = formatMoney(counterPrice, currency);
    const offerText =
      viewerRole === 'importer'
        ? `عرض سعر رسمي محدّث: ${displayOffer} للكيلو (${formatEgp(counterPrice)}).`
        : `اقتراح سعر مستهدف من المحمصة: ${displayOffer} للكيلو (${formatEgp(counterPrice)}).`;
    onSendMessage(rfq.id, viewerRole, offerText, counterPrice);
    if (viewerRole === 'importer' && rfq.status === 'بانتظار التسعير') {
      onUpdateRfqStatus(rfq.id, 'تم إرسال العرض', counterPrice);
    }
  };

  const quickPrompts =
    viewerRole === 'roaster' ? QUICK_PROMPTS_ROASTER : QUICK_PROMPTS_IMPORTER;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2A1A11]/55 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white h-full flex flex-col justify-between shadow-2xl border-r border-[#2A1A11]/15"
        role="dialog"
        aria-modal="true"
        aria-label={`محادثة التفاوض للطلب ${rfq.id}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 bg-[#FBF9F6] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#2A1A11]">
                محادثة التفاوض — {rfq.id}
              </h2>
              <span className="text-xs font-mono text-[#4E342E]">({rfq.lotCode})</span>
            </div>
            <p className="text-xs font-semibold text-[#4E342E] mt-1 truncate">
              {rfq.lotTitle}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4E342E]/85 mt-1">
              <span>
                {rfq.type === 'sample'
                  ? `عينة ${rfq.sampleWeightGrams} جم`
                  : `الكمية: ${formatNumber(rfq.requestedTons || 0, 1)} طن`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                السعر: {formatMoney(rfq.quotedPricePerKgEgp ?? rfq.initialPricePerKgEgp, currency)}/كجم
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-bold text-[#2A1A11]">{rfq.status}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer shrink-0"
            aria-label="إغلاق المحادثة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Party Identity & Compliance Banners */}
        <div className="px-5 pt-4 space-y-3 border-b border-[#2A1A11]/10 pb-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FBF9F6] border border-[#2A1A11]/10 rounded-lg p-3">
            <div>
              <span className="text-[#4E342E]/75 block">المستورد / المورد:</span>
              <span className="font-bold text-[#2A1A11] flex items-center gap-1 mt-0.5">
                {!dealConfirmed && viewerRole === 'roaster' && (
                  <Lock className="w-3 h-3 text-[#C89B3C] shrink-0" />
                )}
                <span>{importerDisplay}</span>
              </span>
              {dealConfirmed && importerPartner && (
                <span className="block text-[11px] text-[#4E342E] mt-0.5 font-mono">
                  {importerPartner.phone} · {lot?.warehouseLocation || `${importerPartner.country} - ${importerPartner.governorate}`}
                </span>
              )}
            </div>

            <div>
              <span className="text-[#4E342E]/75 block">المحمصة الطالبة:</span>
              <span className="font-bold text-[#2A1A11] flex items-center gap-1 mt-0.5">
                {!dealConfirmed && viewerRole === 'importer' && (
                  <Lock className="w-3 h-3 text-[#C89B3C] shrink-0" />
                )}
                <span>{roasterDisplay}</span>
              </span>
              {dealConfirmed && roasterPartner && (
                <span className="block text-[11px] text-[#4E342E] mt-0.5 font-mono">
                  {roasterPartner.phone} · {roasterPartner.country} - {roasterPartner.governorate}
                </span>
              )}
            </div>
          </div>

          {dealConfirmed ? (
            <div className="bg-[#1E7E34]/10 border border-[#1E7E34]/30 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#1E7E34]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">بيانات الطرفين مكتملة لإتمام التسليم</p>
                  <p className="text-[#2A1A11]/80 mt-0.5">
                    تم اعتماد الصفقة وكشف بيانات التواصل ومواقع الاستلام الرسمية.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenInvoice(rfq)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#1E7E34] text-white rounded-md hover:bg-[#176429] cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>العقد والفاتورة المبدئية</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">
                تنبيه: يُحظر تماماً ذكر أسماء الشركات أو الأشخاص أو أرقام الهاتف أو الروابط أو محاولات التواصل خارج المنصة قبل إتمام العملية.
              </p>
            </div>
          )}

          {rfq.contactViolations.length > 0 && viewerRole === 'admin' && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-1.5 text-xs text-rose-900 max-h-36 overflow-y-auto">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                <span>
                  محاولة مشاركة بيانات تواصل ({rfq.contactViolations.length} محاولات مرصودة)
                </span>
              </div>
              {rfq.contactViolations.map((v) => (
                <div
                  key={v.id}
                  className="bg-white/80 border border-rose-200 rounded p-2 text-[11px]"
                >
                  <div className="flex justify-between font-mono text-rose-700">
                    <span>الطرف: {v.senderRole === 'roaster' ? 'المحمصة' : 'المستورد'}</span>
                    <span>{v.timestamp}</span>
                  </div>
                  <p className="font-semibold text-[#2A1A11] mt-0.5">
                    النص المحظور: «{v.attemptedText}»
                  </p>
                  <p className="text-rose-700">{v.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FBF9F6]/60">
          {rfq.messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#4E342E]">
              لا توجد رسائل في هذه المحادثة بعد. ابدأ التفاوض على السعر أو مواعيد التسليم.
            </div>
          ) : (
            rfq.messages.map((msg) => {
              if (msg.senderRole === 'system') {
                return (
                  <div
                    key={msg.id}
                    className="text-center text-[11px] text-[#1E7E34] bg-[#1E7E34]/8 border border-[#1E7E34]/20 rounded-lg py-2 px-3"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 inline ml-1" />
                    <span>{msg.text}</span>
                  </div>
                );
              }

              const isOwn =
                (viewerRole === 'roaster' && msg.senderRole === 'roaster') ||
                (viewerRole === 'importer' && msg.senderRole === 'importer');

              const labelToShow =
                viewerRole === 'admin' || dealConfirmed
                  ? msg.senderRole === 'importer'
                    ? `${rfq.importerName} (${rfq.importerAnonCode})`
                    : `${rfq.roasterName} (${rfq.roasterAnonCode})`
                  : msg.senderRole === 'importer'
                  ? maskedImporter
                  : maskedRoaster;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwn ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm border ${
                      isOwn
                        ? 'bg-[#2A1A11] text-white border-[#2A1A11]'
                        : 'bg-white text-[#2A1A11] border-[#2A1A11]/12'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-semibold mb-1 flex items-center justify-between gap-3 ${
                        isOwn ? 'text-[#C89B3C]' : 'text-[#4E342E]'
                      }`}
                    >
                      <span>{labelToShow}</span>
                      {msg.proposedPricePerKgEgp && (
                        <span className="font-mono tabular-nums font-bold">
                          عرض: {formatMoney(msg.proposedPricePerKgEgp, currency)}/كجم
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                    <div
                      className={`text-[10px] font-mono mt-1.5 ${
                        isOwn ? 'text-white/60' : 'text-[#4E342E]/60'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Counter-Offer & Message Composer */}
        {viewerRole === 'admin' ? (
          <div className="p-4 border-t border-[#2A1A11]/10 bg-[#FBF9F6] text-center text-xs font-semibold text-[#4E342E]">
            وضع المراقبة الإدارية: يمكن للإدارة مراجعة المحادثات ومحاولات مشاركة بيانات التواصل دون إرسال رسائل.
          </div>
        ) : (
          <div className="p-4 border-t border-[#2A1A11]/10 bg-white space-y-3">
            {guardError && (
              <div
                className="bg-rose-50 border border-rose-300 text-rose-900 rounded-lg p-3 text-xs flex items-start gap-2"
                role="alert"
              >
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{guardError}</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    تم تسجيل «محاولة مشاركة بيانات تواصل» في سجل المراجعة لدى الإدارة العليا.
                  </p>
                </div>
              </div>
            )}

            {/* Inline Price Counter-Offer Bar (while open) */}
            {!dealConfirmed && rfq.status !== 'مرفوض' && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FBF9F6] border border-[#2A1A11]/10 rounded-lg p-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
                  <span className="font-semibold text-[#2A1A11]">
                    {viewerRole === 'importer' ? 'عرض سعر رسمي:' : 'اقتراح سعر مستهدف:'}
                  </span>
                  <input
                    type="number"
                    min={10}
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(Number(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-xs font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded"
                  />
                  <span className="text-[#4E342E]">
                    ج.م/كجم
                    {currency !== 'EGP' && counterPrice > 0
                      ? ` (${formatMoney(counterPrice, currency)})`
                      : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={counterPrice < 10}
                    onClick={handleSendCounterOffer}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#4E342E] text-white rounded hover:bg-[#2A1A11] cursor-pointer disabled:opacity-50"
                  >
                    إرسال السعر
                  </button>
                  {rfq.status === 'تم إرسال العرض' && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateRfqStatus(
                          rfq.id,
                          'تم الاتفاق / جاري التنفيذ',
                          rfq.quotedPricePerKgEgp ?? counterPrice
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-[#1E7E34] text-white rounded hover:bg-[#176429] cursor-pointer"
                    >
                      تأكيد الاتفاق
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick negotiation templates */}
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setMessageText(q)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-[#FBF9F6] hover:bg-[#F3EDE4] text-[#4E342E] border border-[#2A1A11]/10 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  if (guardError) setGuardError(null);
                }}
                placeholder="اكتب رسالة التفاوض حول السعر، الكمية، أو شروط الشحن..."
                className="flex-1 px-3.5 py-2.5 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 text-[#C89B3C]" />
                <span>إرسال</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
