import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  SlidersHorizontal,
  XCircle,
  Video,
  RotateCcw,
  Mail,
} from 'lucide-react';
import {
  CommissionMode,
  CommissionRule,
  CommissionSettings,
  ContactInquiry,
  CurrencyCode,
  GreenCoffeeLot,
  LocalTickerItem,
  LotApprovalStatus,
  PartnerAccount,
  RetailOrder,
  RetailProduct,
  RfqRequest,
} from '../types';
import { formatMoney, formatNumber } from '../utils/formatters';
import { isDealConfirmedStatus } from '../utils/contentGuard';
import {
  calculateCommissionAmountEgp,
  getRetailOrderWeightKg,
  resolveB2BCommission,
  resolveB2CCommission,
} from '../utils/commission';
import { getSuggestedPartnerCodingDraft } from '../utils/partnerCoding';

interface SuperAdminDashboardProps {
  partners: PartnerAccount[];
  lots: GreenCoffeeLot[];
  retailProducts: RetailProduct[];
  rfqs: RfqRequest[];
  retailOrders: RetailOrder[];
  localTicker: LocalTickerItem[];
  commissionSettings: CommissionSettings;
  contactInquiries: ContactInquiry[];
  currency: CurrencyCode;
  onUpdateCommissionSettings: (settings: CommissionSettings) => void;
  onTogglePartnerVerified: (partnerId: string) => void;
  onApprovePartnerCoding: (partnerId: string, codingCode: string) => void;
  onRejectPartnerCoding: (partnerId: string, note?: string) => void;
  onApproveLot: (lotId: string) => void;
  onRejectLot: (lotId: string, note?: string) => void;
  onToggleLotSeal: (lotId: string) => void;
  onToggleProductSeal: (productId: string) => void;
  onSaveLocalTicker: (items: LocalTickerItem[]) => void;
  onOpenChat: (rfqId: string, viewerRole: 'admin') => void;
  onResetDemo: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  partners,
  lots,
  retailProducts,
  rfqs,
  retailOrders,
  localTicker,
  commissionSettings,
  contactInquiries,
  currency,
  onUpdateCommissionSettings,
  onTogglePartnerVerified,
  onApprovePartnerCoding,
  onRejectPartnerCoding,
  onApproveLot,
  onRejectLot,
  onToggleLotSeal,
  onToggleProductSeal,
  onSaveLocalTicker,
  onOpenChat,
  onResetDemo,
}) => {
  const [tickerDraft, setTickerDraft] = useState<LocalTickerItem[]>(localTicker);
  const [b2bRateDraft, setB2bRateDraft] = useState<number>(commissionSettings.b2bRatePct);
  const [b2cRateDraft, setB2cRateDraft] = useState<number>(commissionSettings.b2cRatePct);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [lotQueueFilter, setLotQueueFilter] = useState<'all' | LotApprovalStatus>('all');
  const [partnerFilter, setPartnerFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [codingCodeDrafts, setCodingCodeDrafts] = useState<Record<string, string>>({});
  const [partnerRejectNotes, setPartnerRejectNotes] = useState<Record<string, string>>({});
  const [confirmReset, setConfirmReset] = useState(false);

  React.useEffect(() => {
    setTickerDraft(localTicker);
  }, [localTicker]);

  React.useEffect(() => {
    setB2bRateDraft(commissionSettings.b2bRatePct);
    setB2cRateDraft(commissionSettings.b2cRatePct);
  }, [commissionSettings]);

  const financials = useMemo(() => {
    const completedBulkDeals = rfqs.filter(
      (r) => r.type === 'bulk_rfq' && isDealConfirmedStatus(r.status)
    );

    let b2bVolume = 0;
    let b2bCommission = 0;
    for (const deal of completedBulkDeals) {
      const price = deal.quotedPricePerKgEgp ?? deal.initialPricePerKgEgp;
      const weightKg = (deal.requestedTons || 0) * 1000;
      const volume = weightKg * price;
      const { rule } = resolveB2BCommission(deal, partners, commissionSettings);
      b2bVolume += volume;
      b2bCommission += calculateCommissionAmountEgp(volume, weightKg, rule);
    }

    let b2cGmv = 0;
    let b2cCommission = 0;
    for (const order of retailOrders) {
      const weightKg = getRetailOrderWeightKg(order);
      const { rule } = resolveB2CCommission(order, partners, commissionSettings);
      b2cGmv += order.subtotalEgp;
      b2cCommission += calculateCommissionAmountEgp(order.subtotalEgp, weightKg, rule);
    }

    const pendingPartners = partners.filter((p) => !p.verified).length;
    const pendingLots = lots.filter((l) => l.approvalStatus === 'بانتظار الاعتماد').length;
    const totalViolations = rfqs.reduce(
      (sum, r) => sum + (r.contactViolations?.length || 0),
      0
    );

    return {
      b2bVolume,
      b2bCommission,
      b2cGmv,
      b2cCommission,
      totalCommission: b2bCommission + b2cCommission,
      pendingPartners,
      pendingLots,
      completedBulkDeals,
      totalViolations,
    };
  }, [rfqs, retailOrders, partners, lots, commissionSettings]);

  const sortedLotsQueue = useMemo(() => {
    const rank = (status: LotApprovalStatus) =>
      status === 'بانتظار الاعتماد' ? 0 : status === 'مرفوض / مطلوب تعديل' ? 1 : 2;
    return lots
      .filter((l) => (lotQueueFilter === 'all' ? true : l.approvalStatus === lotQueueFilter))
      .slice()
      .sort((a, b) => rank(a.approvalStatus) - rank(b.approvalStatus));
  }, [lots, lotQueueFilter]);

  const originBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    for (const lot of lots) {
      map.set(lot.origin, (map.get(lot.origin) || 0) + lot.availableTons);
      total += lot.availableTons;
    }
    return Array.from(map.entries())
      .map(([origin, tons]) => ({
        origin,
        tons,
        pct: total > 0 ? Math.round((tons / total) * 100) : 0,
      }))
      .sort((a, b) => b.tons - a.tons);
  }, [lots]);

  const handleTickerChange = (
    id: string,
    field: keyof LocalTickerItem,
    value: string | number
  ) => {
    setTickerDraft((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddTickerRow = () => {
    setTickerDraft((prev) => [
      ...prev,
      {
        id: `loc-${Date.now()}`,
        name: 'بن جديد',
        grade: 'جريد 1',
        pricePerKgEgp: 350,
        changePct: 0.5,
      },
    ]);
  };

  const handleDeleteTickerRow = (id: string) => {
    setTickerDraft((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLocalTicker(tickerDraft);
  };

  const handleCommissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCommissionSettings({
      ...commissionSettings,
      b2bRatePct: Math.max(0, Math.min(25, b2bRateDraft)),
      b2cRatePct: Math.max(0, Math.min(40, b2cRateDraft)),
    });
  };

  const getPartnerRule = (partner: PartnerAccount): CommissionRule => {
    const existing = commissionSettings.partnerRules?.[partner.id];
    if (existing) return existing;
    return {
      mode: 'percent',
      value:
        partner.type === 'importer'
          ? commissionSettings.b2bRatePct
          : commissionSettings.b2bRatePct,
    };
  };

  const handlePartnerRuleChange = (partner: PartnerAccount, patch: Partial<CommissionRule>) => {
    const current = getPartnerRule(partner);
    const updated: CommissionRule = {
      mode: patch.mode ?? current.mode,
      value: Math.max(0, patch.value ?? current.value),
    };
    onUpdateCommissionSettings({
      ...commissionSettings,
      partnerRules: {
        ...(commissionSettings.partnerRules || {}),
        [partner.id]: updated,
      },
    });
  };

  const handleRowOverrideChange = (
    rowId: string,
    currentRule: CommissionRule,
    patch: Partial<CommissionRule>
  ) => {
    const updated: CommissionRule = {
      mode: patch.mode ?? currentRule.mode,
      value: Math.max(0, patch.value ?? currentRule.value),
    };
    onUpdateCommissionSettings({
      ...commissionSettings,
      dealOverrides: {
        ...(commissionSettings.dealOverrides || {}),
        [rowId]: updated,
      },
    });
  };

  const handleApplyRowRuleToPartner = (rowId: string, partnerId: string, rule: CommissionRule) => {
    const nextOverrides = { ...(commissionSettings.dealOverrides || {}) };
    delete nextOverrides[rowId];
    onUpdateCommissionSettings({
      ...commissionSettings,
      partnerRules: {
        ...(commissionSettings.partnerRules || {}),
        [partnerId]: rule,
      },
      dealOverrides: nextOverrides,
    });
  };

  const handleClearRowOverride = (rowId: string) => {
    const nextOverrides = { ...(commissionSettings.dealOverrides || {}) };
    delete nextOverrides[rowId];
    onUpdateCommissionSettings({
      ...commissionSettings,
      dealOverrides: nextOverrides,
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2A1A11]">
            لوحة الإدارة العليا — الحوكمة، التكويد، رقابة المفاوضات، وإدارة العمولات
          </h1>
          <p className="text-sm text-[#4E342E] mt-1">
            مراجعة طلبات تكويد التجار والمحامص والمستوردين، اعتماد المنتجات الجديدة، فحص محادثات
            التفاوض، وإدارة نسب العمولات حصرياً للإدارة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#4E342E] hover:text-rose-700 bg-[#FBF9F6] hover:bg-rose-50 border border-[#2A1A11]/15 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط البيانات الافتراضية</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-rose-800">استعادة البيانات الأصلية؟</span>
              <button
                type="button"
                onClick={() => {
                  onResetDemo();
                  setConfirmReset(false);
                }}
                className="px-2.5 py-1 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded cursor-pointer"
              >
                تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-xs font-semibold text-[#4E342E] hover:text-[#2A1A11] cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#2A1A11] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/80">
            حجم صفقات الجملة المؤكدة (B2B)
          </p>
          <p className="text-2xl font-black font-mono tabular-nums text-[#1C110B] mt-2">
            {formatMoney(financials.b2bVolume, currency)}
          </p>
          <p className="text-[11px] text-[#4E342E] mt-1">
            من {financials.completedBulkDeals.length} صفقات موثقة
          </p>
        </div>

        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#4E342E] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/80">
            إجمالي مبيعات المتجر (B2C GMV)
          </p>
          <p className="text-2xl font-black font-mono tabular-nums text-[#1C110B] mt-2">
            {formatMoney(financials.b2cGmv, currency)}
          </p>
          <p className="text-[11px] text-[#4E342E] mt-1">
            عبر {retailOrders.length} طلبات تجزئة
          </p>
        </div>

        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#1E7E34] rounded-xl p-5 hover:border-[#1E7E34]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/80">
            إجمالي عمولات المنصة المكتسبة
          </p>
          <p className="text-2xl font-black font-mono tabular-nums text-[#1E7E34] mt-2">
            {formatMoney(financials.totalCommission, currency, true)}
          </p>
          <p className="text-[11px] text-[#4E342E] mt-1 font-mono tabular-nums">
            B2B: {formatMoney(financials.b2bCommission, currency)} · B2C:{' '}
            {formatMoney(financials.b2cCommission, currency)}
          </p>
        </div>

        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#C89B3C] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/80">
            الاعتمادات المعلقة وتنبيهات التفاوض
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#C89B3C] mt-2">
            {financials.pendingLots} لوط · {financials.pendingPartners} شركاء
          </p>
          <p className="text-[11px] text-[#4E342E] mt-1">
            تنبيهات التواصل: {financials.totalViolations} · الشركاء: {partners.length}
          </p>
        </div>
      </div>

      {/* Lot Approval Queue (Super Admin Gatekeeping) */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#2A1A11]">
              اعتماد اللوطات الجديدة ({financials.pendingLots} بانتظار المراجعة من إجمالي {lots.length})
            </h2>
            <p className="text-xs text-[#4E342E] mt-0.5">
              لا يظهر أي منتج/لوط بن أخضر في سوق الجملة قبل اعتماده ونشره من الإدارة العليا، مع التحكم المستقل في شارة الجودة المفحوصة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#FBF9F6] p-1 rounded-lg border border-[#2A1A11]/10 text-xs">
            {(
              [
                { value: 'all', label: `الكل (${lots.length})` },
                { value: 'بانتظار الاعتماد', label: `بانتظار الاعتماد (${financials.pendingLots})` },
                { value: 'معتمد', label: 'منشور بالسوق' },
                { value: 'مرفوض / مطلوب تعديل', label: 'مرفوض / تعديل' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setLotQueueFilter(tab.value)}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  lotQueueFilter === tab.value
                    ? 'bg-[#2A1A11] text-white'
                    : 'text-[#4E342E] hover:text-[#2A1A11]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                <th className="py-3 px-4">تفاصيل المنتج والوسائط</th>
                <th className="py-3 px-4">المواصفات والسعر</th>
                <th className="py-3 px-4">المستورد</th>
                <th className="py-3 px-4">حالة الاعتماد</th>
                <th className="py-3 px-4">ملاحظة الرفض / التعديل</th>
                <th className="py-3 px-4">قرار الإدارة وشارة الجودة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
              {sortedLotsQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#4E342E]">
                    لا توجد منتجات مطابقة لهذا التصنيف حالياً.
                  </td>
                </tr>
              ) : (
                sortedLotsQueue.map((lot) => {
                  const imp = partners.find((p) => p.id === lot.importerId);
                  const noteDraft = rejectionNotes[lot.id] ?? lot.rejectionNote ?? '';

                  return (
                    <tr
                      key={lot.id}
                      className={
                        lot.approvalStatus === 'بانتظار الاعتماد'
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-[#FBF9F6]/60'
                      }
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-lg bg-white border border-[#2A1A11]/12 overflow-hidden shrink-0 flex items-center justify-center">
                            {lot.mediaType === 'video' && lot.videoUrl ? (
                              <Video className="w-4 h-4 text-[#C89B3C]" />
                            ) : (
                              <img
                                src={lot.imageUrl}
                                alt={lot.title}
                                className="w-full h-full object-contain bg-white"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#2A1A11] leading-snug truncate">
                              {lot.title}
                            </p>
                            <p className="text-[11px] font-mono text-[#4E342E] mt-0.5">
                              {lot.lotCode} · {lot.cropYear}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-[#4E342E] whitespace-nowrap">
                        <div>
                          {lot.origin} · {lot.species} · {lot.process}
                        </div>
                        <div className="font-mono tabular-nums text-[#2A1A11] font-semibold mt-0.5">
                          {formatMoney(lot.pricePerKgEgp, currency)}/كجم · {formatNumber(lot.availableTons, 1)} طن · SCA {lot.scaScore}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <p className="font-bold text-[#2A1A11]">{lot.importerName}</p>
                        <p className="text-[11px] text-[#4E342E]">
                          {imp?.verified ? '✔ مستورد معتمد' : '⏳ مستورد قيد المراجعة'}
                        </p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {lot.approvalStatus === 'معتمد' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E7E34]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>معتمد ومنشور</span>
                          </span>
                        ) : lot.approvalStatus === 'بانتظار الاعتماد' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Clock className="w-4 h-4" />
                            <span>بانتظار الاعتماد</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                            <XCircle className="w-4 h-4" />
                            <span>مرفوض / مطلوب تعديل</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={(e) =>
                            setRejectionNotes((prev) => ({
                              ...prev,
                              [lot.id]: e.target.value,
                            }))
                          }
                          placeholder="ملاحظة اختيارية للمستورد..."
                          aria-label={`ملاحظة الرفض أو التعديل للمنتج ${lot.title}`}
                          className="w-44 px-2.5 py-1.5 text-xs bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md focus:outline-none focus:border-[#C89B3C]"
                        />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {lot.approvalStatus !== 'معتمد' && (
                            <button
                              type="button"
                              onClick={() => onApproveLot(lot.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[#1E7E34] text-white rounded-md hover:bg-[#176429] cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>اعتماد ونشر في السوق</span>
                            </button>
                          )}

                          {lot.approvalStatus !== 'مرفوض / مطلوب تعديل' && (
                            <button
                              type="button"
                              onClick={() => onRejectLot(lot.id, noteDraft)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>رفض / طلب تعديل</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onToggleLotSeal(lot.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                              lot.qualitySealed
                                ? 'bg-[#2A1A11] text-[#C89B3C] hover:bg-[#4E342E]'
                                : 'bg-[#FBF9F6] text-[#4E342E] border border-[#2A1A11]/20 hover:bg-[#F3EDE4]'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {lot.qualitySealed ? 'شارة الجودة ✔' : 'منح شارة الجودة'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Rate Management & Origin Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#2A1A11]/12 rounded-xl p-5 space-y-4">
          <form onSubmit={handleCommissionSubmit} className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2A1A11]/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C89B3C]" />
                <h2 className="text-base font-bold text-[#2A1A11]">
                  إدارة العمولات المستقلة لكل عميل (حصرية للإدارة)
                </h2>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>حفظ الافتراضي</span>
              </button>
            </div>

            <p className="text-xs text-[#4E342E]">
              حدّد عمولة كل عميل بشكل مستقل تماماً (نسبة % أو مبلغ ثابت لكل كجم)، ويمكنك أيضاً التعديل اليدوي المباشر لكل معاملة في دفتر العمولات أدناه.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#2A1A11] mb-1">
                  النسبة الافتراضية B2B (%)
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="25"
                  value={b2bRateDraft}
                  onChange={(e) => setB2bRateDraft(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#2A1A11] mb-1">
                  النسبة الافتراضية B2C (%)
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="40"
                  value={b2cRateDraft}
                  onChange={(e) => setB2cRateDraft(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg"
                />
              </label>
            </div>
          </form>

          {/* Per-Client Independent Commission Rules */}
          <div className="border border-[#2A1A11]/10 rounded-lg overflow-hidden">
            <div className="bg-[#FBF9F6] px-3 py-2 border-b border-[#2A1A11]/10 text-[11px] font-bold text-[#2A1A11]">
              عمولة كل عميل مستقلة عن الآخر ({partners.length} عملاء)
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-[#2A1A11]/10">
              {partners.map((partner) => {
                const rule = getPartnerRule(partner);
                return (
                  <div
                    key={partner.id}
                    className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs hover:bg-[#FBF9F6]/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#2A1A11] truncate">{partner.name}</p>
                      <p className="text-[11px] text-[#4E342E]">
                        {partner.type === 'importer' ? 'مستورد' : 'محمصة'} · #{partner.anonCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={rule.mode}
                        onChange={(e) =>
                          handlePartnerRuleChange(partner, {
                            mode: e.target.value as CommissionMode,
                          })
                        }
                        aria-label={`نوع عمولة ${partner.name}`}
                        className="px-2 py-1 text-[11px] font-semibold bg-[#FBF9F6] border border-[#2A1A11]/15 rounded"
                      >
                        <option value="percent">نسبة (%)</option>
                        <option value="per_kg">مبلغ / كجم (ج.م)</option>
                      </select>
                      <input
                        type="number"
                        step={rule.mode === 'percent' ? '0.1' : '0.5'}
                        min="0"
                        value={rule.value}
                        onChange={(e) =>
                          handlePartnerRuleChange(partner, {
                            value: Number(e.target.value) || 0,
                          })
                        }
                        aria-label={`قيمة عمولة ${partner.name}`}
                        className="w-20 px-2 py-1 text-xs font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded"
                      />
                      <span className="text-[11px] font-mono text-[#4E342E] w-14">
                        {rule.mode === 'percent'
                          ? '%'
                          : `${formatMoney(rule.value, currency, currency !== 'EGP')}/كجم`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Origin Breakdown (Zero Inline Styles using SVG horizontal bar) */}
        <div className="lg:col-span-6 bg-white border border-[#2A1A11]/12 rounded-xl p-5 space-y-4">
          <div className="border-b border-[#2A1A11]/10 pb-3">
            <h2 className="text-base font-bold text-[#2A1A11]">
              توزيع المخزون العالمي حسب بلد المنشأ
            </h2>
          </div>
          <div className="space-y-3">
            {originBreakdown.map((row) => (
              <div key={row.origin} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2A1A11]">{row.origin}</span>
                  <span className="font-mono tabular-nums text-[#4E342E]">
                    {formatNumber(row.tons, 1)} طن ({row.pct}%)
                  </span>
                </div>
                <svg
                  viewBox="0 0 100 4"
                  preserveAspectRatio="none"
                  className="w-full h-2 rounded-full bg-[#FBF9F6] border border-[#2A1A11]/10 overflow-hidden"
                  aria-label={`${row.origin}: ${row.pct}%`}
                >
                  <rect x="0" y="0" width={row.pct} height="4" fill="#C89B3C" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. B2B Negotiation & Contact Violation Audit Log */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#2A1A11]">
              رقابة مفاوضات الجملة وتنبيهات مشاركة بيانات التواصل ({rfqs.length})
            </h2>
            <p className="text-xs text-[#4E342E] mt-0.5">
              تظهر هنا الهويات الحقيقية كاملة مع رصد أي محاولة لذكر أرقام هواتف أو وسائل تواصل خارجية.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                <th className="py-3 px-4">الطلب</th>
                <th className="py-3 px-4">المستورد (الاسم الحقيقي والكود)</th>
                <th className="py-3 px-4">المحمصة (الاسم الحقيقي والكود)</th>
                <th className="py-3 px-4">حالة الصفقة</th>
                <th className="py-3 px-4">رقابة المحتوى</th>
                <th className="py-3 px-4">فحص السجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
              {rfqs.map((rfq) => {
                const violationsCount = rfq.contactViolations?.length || 0;
                const dealConfirmed = isDealConfirmedStatus(rfq.status);

                return (
                  <tr key={rfq.id} className="hover:bg-[#FBF9F6]/60">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono tabular-nums text-xs font-bold text-[#2A1A11]">
                        {rfq.id}
                      </span>
                      <div className="text-[11px] text-[#4E342E] mt-0.5">{rfq.lotTitle}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-bold text-[#2A1A11]">{rfq.importerName}</p>
                      <p className="font-mono text-[#4E342E]/75">#{rfq.importerAnonCode}</p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-bold text-[#2A1A11]">{rfq.roasterName}</p>
                      <p className="font-mono text-[#4E342E]/75">#{rfq.roasterAnonCode}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold ${
                          dealConfirmed
                            ? 'text-[#1E7E34]'
                            : rfq.status === 'تم إرسال العرض'
                            ? 'text-[#C89B3C]'
                            : rfq.status === 'مرفوض'
                            ? 'text-rose-700'
                            : 'text-[#4E342E]'
                        }`}
                      >
                        {rfq.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {violationsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>محاولة مشاركة بيانات تواصل ({violationsCount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E7E34]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تواصل منضبط</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenChat(rfq.id, 'admin')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-md cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>فحص المحادثة ({rfq.messages.length})</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Partner Coding & Verification Queue */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#2A1A11]">
              طلبات التكويد واعتماد المستوردين والتجار والمحامص ({partners.length})
            </h2>
            <p className="text-xs text-[#4E342E] mt-0.5">
              مراجعة بيانات السجل التجاري والبطاقة الضريبية والنشاط وإصدار كود التكويد لتفعيل
              الحسابات الجديدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#FBF9F6] p-1 rounded-lg border border-[#2A1A11]/10 text-xs">
            {(
              [
                { value: 'all', label: `الكل (${partners.length})` },
                {
                  value: 'pending',
                  label: `بانتظار التكويد (${partners.filter((p) => !p.verified).length})`,
                },
                {
                  value: 'verified',
                  label: `معتمد ومفعّل (${partners.filter((p) => p.verified).length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPartnerFilter(tab.value)}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  partnerFilter === tab.value
                    ? 'bg-[#2A1A11] text-white'
                    : 'text-[#4E342E] hover:text-[#2A1A11]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                <th className="py-3 px-4">المنشأة والمسؤول</th>
                <th className="py-3 px-4">الصفة والنشاط</th>
                <th className="py-3 px-4">السجل التجاري والضريبي</th>
                <th className="py-3 px-4">التواصل والموقع</th>
                <th className="py-3 px-4">كود التكويد والحالة</th>
                <th className="py-3 px-4">إجراء التكويد والاعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
              {[...partners]
                .sort((a, b) => Number(a.verified) - Number(b.verified))
                .filter((p) => {
                  if (partnerFilter === 'pending') return !p.verified;
                  if (partnerFilter === 'verified') return p.verified;
                  return true;
                })
                .map((p) => {
                  const defaultCode = getSuggestedPartnerCodingDraft(p, partners);
                  const codeDraft = codingCodeDrafts[p.id] ?? defaultCode;
                  const rejectDraft = partnerRejectNotes[p.id] ?? p.codingReviewNote ?? '';

                  return (
                    <tr
                      key={p.id}
                      className={
                        !p.verified
                          ? 'bg-amber-50/35 hover:bg-amber-50/60'
                          : 'hover:bg-[#FBF9F6]/60'
                      }
                    >
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-bold text-[#2A1A11]">{p.name}</p>
                        {p.contactPerson && (
                          <p className="text-xs text-[#4E342E] mt-0.5">
                            المسؤول: {p.contactPerson}
                          </p>
                        )}
                        <p className="text-[11px] font-mono text-[#4E342E]/75 mt-0.5">
                          #{p.anonCode} · انضم {p.joinedAt}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-xs align-top max-w-[260px] space-y-1">
                        <p className="font-bold text-[#2A1A11]">
                          {p.type === 'importer'
                            ? 'مستورد بن أخضر'
                            : p.businessActivityType || 'تاجر / محمصة'}
                        </p>
                        {p.type === 'importer' && p.warehouseAddress && (
                          <p className="text-[#4E342E] leading-snug">
                            <span className="font-semibold text-[#2A1A11]">المخزن:</span>{' '}
                            {p.warehouseAddress}
                          </p>
                        )}
                        {p.preferredOriginsAndVarieties && p.preferredOriginsAndVarieties.length > 0 && (
                          <p className="text-[#4E342E] leading-snug">
                            <span className="font-semibold text-[#2A1A11]">
                              {p.type === 'importer' ? 'المناشئ:' : 'المطلوب:'}
                            </span>{' '}
                            {p.preferredOriginsAndVarieties.join('، ')}
                          </p>
                        )}
                        {p.supplyCapacityOrActivity && (
                          <p className="text-[#4E342E] leading-snug">
                            <span className="font-semibold text-[#2A1A11]">القدرة/النشاط:</span>{' '}
                            {p.supplyCapacityOrActivity}
                          </p>
                        )}
                        {p.monthlyOrderVolume && (
                          <p className="text-[#4E342E] leading-snug">
                            <span className="font-semibold text-[#2A1A11]">حجم الطلب:</span>{' '}
                            {p.monthlyOrderVolume}
                          </p>
                        )}
                        {!p.warehouseAddress &&
                          !p.supplyCapacityOrActivity &&
                          !p.monthlyOrderVolume &&
                          p.primaryActivity && (
                            <p className="text-[#4E342E] mt-0.5 leading-snug">{p.primaryActivity}</p>
                          )}
                      </td>

                      <td className="py-3.5 px-4 text-xs align-top whitespace-nowrap">
                        <div className="font-mono text-[#2A1A11]">
                          تجاري: {p.commercialReg || 'غير مرفق (اختياري)'}
                        </div>
                        <div className="font-mono text-[#4E342E] mt-0.5">
                          ضريبي: {p.taxId || 'غير مرفق (اختياري)'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs align-top">
                        <div className="font-semibold text-[#2A1A11]">
                          {p.country} · {p.governorate}
                        </div>
                        <div className="font-mono text-[#4E342E] mt-0.5" dir="ltr">
                          {p.phone}
                        </div>
                        {p.email && (
                          <div className="font-mono text-[11px] text-[#4E342E]/80">{p.email}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top space-y-1.5">
                        {p.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E7E34]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>معتمد ومفعّل</span>
                          </span>
                        ) : p.codingStatus === 'مرفوض' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                            <XCircle className="w-4 h-4" />
                            <span>مرفوض</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Clock className="w-4 h-4" />
                            <span>بانتظار التكويد والاعتماد</span>
                          </span>
                        )}

                        <div>
                          <input
                            type="text"
                            value={codeDraft}
                            onChange={(e) =>
                              setCodingCodeDrafts((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            aria-label={`كود تكويد ${p.name}`}
                            className="w-32 px-2 py-1 text-xs font-mono font-bold bg-white border border-[#2A1A11]/20 rounded-md focus:outline-none focus:border-[#C89B3C]"
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top space-y-2 min-w-[220px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {!p.verified ? (
                            <button
                              type="button"
                              onClick={() => onApprovePartnerCoding(p.id, codeDraft)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#1E7E34] hover:bg-[#176429] rounded-md cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>اعتماد وتكويد الحساب</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onTogglePartnerVerified(p.id)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#FBF9F6] text-rose-700 border border-rose-200 hover:bg-rose-50 cursor-pointer whitespace-nowrap"
                            >
                              تعليق الاعتماد
                            </button>
                          )}

                          {!p.verified && (
                            <button
                              type="button"
                              onClick={() => onRejectPartnerCoding(p.id, rejectDraft)}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer whitespace-nowrap"
                            >
                              رفض
                            </button>
                          )}
                        </div>

                        {!p.verified && (
                          <input
                            type="text"
                            value={rejectDraft}
                            onChange={(e) =>
                              setPartnerRejectNotes((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            placeholder="ملاحظة مراجعة / سبب الرفض (اختياري)"
                            className="w-full px-2.5 py-1 text-[11px] bg-white border border-[#2A1A11]/15 rounded-md focus:outline-none focus:border-[#C89B3C]"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Quality Seal Governance (B2B Lots & B2C Products) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2A1A11]/10">
            <h2 className="text-base font-bold text-[#2A1A11]">
              شارة الجودة المفحوصة — منتجات البن الأخضر (B2B)
            </h2>
          </div>
          <div className="divide-y divide-[#2A1A11]/10">
            {lots.map((lot) => (
              <div
                key={lot.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FBF9F6]/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2A1A11] truncate">{lot.title}</p>
                  <p className="text-xs text-[#4E342E] mt-0.5">
                    {lot.importerName} · رطوبة {lot.moisturePct}% ·{' '}
                    {formatMoney(lot.pricePerKgEgp, currency)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLotSeal(lot.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                    lot.qualitySealed
                      ? 'bg-[#1E7E34] text-white hover:bg-[#176429]'
                      : 'bg-[#FBF9F6] text-[#4E342E] border border-[#2A1A11]/20 hover:bg-[#F3EDE4]'
                  }`}
                >
                  {lot.qualitySealed ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>شارة مفعّلة (اضغط للسحب)</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>منح شارة الجودة</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2A1A11]/10">
            <h2 className="text-base font-bold text-[#2A1A11]">
              شارة الجودة المفحوصة — منتجات المتجر (B2C)
            </h2>
          </div>
          <div className="divide-y divide-[#2A1A11]/10">
            {retailProducts.map((prod) => (
              <div
                key={prod.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FBF9F6]/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2A1A11] truncate">{prod.name}</p>
                  <p className="text-xs text-[#4E342E] mt-0.5">
                    {prod.roasterName} · {prod.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleProductSeal(prod.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                    prod.qualitySealed
                      ? 'bg-[#1E7E34] text-white hover:bg-[#176429]'
                      : 'bg-[#FBF9F6] text-[#4E342E] border border-[#2A1A11]/20 hover:bg-[#F3EDE4]'
                  }`}
                >
                  {prod.qualitySealed ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>شارة مفعّلة (اضغط للسحب)</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>منح شارة الجودة</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Spot Benchmark Ticker Editor */}
      <form
        onSubmit={handleTickerSubmit}
        className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#2A1A11]">
              محرر مؤشر الأسعار الاسترشادي العالمي (الشريط العلوي)
            </h2>
            <p className="text-xs text-[#4E342E] mt-0.5">
              تُعدّل الأسعار بالعملة الأساسية (ج.م) وتتحول تلقائياً لعملة العرض المختارة لكل مستخدم.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTickerRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#2A1A11] bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md hover:bg-[#F3EDE4] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صنف</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>نشر التحديث في الشريط</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                <th className="py-2.5 px-4">اسم الصنف</th>
                <th className="py-2.5 px-4">الدرجة / المواصفة</th>
                <th className="py-2.5 px-4">السعر اليومي (ج.م / كجم)</th>
                <th className="py-2.5 px-4">نسبة التغير اليومي (%)</th>
                <th className="py-2.5 px-4">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
              {tickerDraft.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 px-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleTickerChange(item.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="text"
                      value={item.grade}
                      onChange={(e) => handleTickerChange(item.id, 'grade', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      value={item.pricePerKgEgp}
                      onChange={(e) =>
                        handleTickerChange(
                          item.id,
                          'pricePerKgEgp',
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-28 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      step="0.1"
                      value={item.changePct}
                      onChange={(e) =>
                        handleTickerChange(
                          item.id,
                          'changePct',
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-24 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleDeleteTickerRow(item.id)}
                      className="p-1.5 text-[#4E342E]/70 hover:text-rose-700 cursor-pointer"
                      aria-label={`حذف ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>

      {/* 6. Platform Commission Ledger (Exclusive to Super Admin — Manual % or Per-Kg Per Client) */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#2A1A11]">
              دفتر عمولات المنصة اليدوي (نسبة % أو مبلغ لكل كيلوجرام — مستقل لكل عميل)
            </h2>
            <p className="text-xs text-[#4E342E] mt-0.5">
              يمكنك تعديل نوع وقيمة العمولة يدوياً لكل معاملة أو عميل مباشرة داخل الدفتر؛ بيانات حصرية للإدارة العليا فقط.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#1E7E34]">
            الإجمالي: {formatMoney(financials.totalCommission, currency, true)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                <th className="py-3 px-4">المرجع</th>
                <th className="py-3 px-4">القناة والوزن</th>
                <th className="py-3 px-4">أطراف المعاملة والعميل</th>
                <th className="py-3 px-4">قيمة المعاملة ({currency})</th>
                <th className="py-3 px-4">طريقة الاحتساب (يدوي)</th>
                <th className="py-3 px-4">القيمة (% أو ج.م/كجم)</th>
                <th className="py-3 px-4">العمولة المكتسبة ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
              {financials.completedBulkDeals.map((deal) => {
                const price = deal.quotedPricePerKgEgp ?? deal.initialPricePerKgEgp;
                const weightKg = (deal.requestedTons || 0) * 1000;
                const volume = weightKg * price;
                const { rule, clientPartner, isOverridden } = resolveB2BCommission(
                  deal,
                  partners,
                  commissionSettings
                );
                const comm = calculateCommissionAmountEgp(volume, weightKg, rule);

                return (
                  <tr key={deal.id} className="hover:bg-[#FBF9F6]/60">
                    <td className="py-3 px-4 font-mono tabular-nums text-xs font-bold text-[#2A1A11] whitespace-nowrap">
                      {deal.id}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#4E342E] whitespace-nowrap">
                      <div>جملة B2B ({formatNumber(deal.requestedTons || 0, 1)} طن)</div>
                      <div className="text-[11px] font-mono text-[#4E342E]/75">
                        {formatNumber(weightKg)} كجم
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#2A1A11]">
                      <div>
                        {deal.importerName} ← {deal.roasterName}
                      </div>
                      <div className="text-[11px] text-[#4E342E] mt-0.5">
                        العميل المرجعي: <strong>{clientPartner?.name || deal.roasterName}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#2A1A11] whitespace-nowrap">
                      {formatMoney(volume, currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={rule.mode}
                        onChange={(e) =>
                          handleRowOverrideChange(deal.id, rule, {
                            mode: e.target.value as CommissionMode,
                          })
                        }
                        aria-label={`طريقة احتساب عمولة ${deal.id}`}
                        className="px-2 py-1 text-xs font-semibold bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-md"
                      >
                        <option value="percent">نسبة مئوية (%)</option>
                        <option value="per_kg">مبلغ لكل كجم (ج.م/كجم)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={rule.mode === 'percent' ? '0.1' : '0.5'}
                          min="0"
                          value={rule.value}
                          onChange={(e) =>
                            handleRowOverrideChange(deal.id, rule, {
                              value: Number(e.target.value) || 0,
                            })
                          }
                          aria-label={`قيمة عمولة ${deal.id}`}
                          className="w-20 px-2 py-1 text-xs font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-md focus:outline-none focus:border-[#C89B3C]"
                        />
                        <span className="text-[11px] font-mono text-[#4E342E]">
                          {rule.mode === 'percent' ? '%' : 'ج.م/كجم'}
                        </span>
                      </div>
                      {isOverridden && (
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          {clientPartner && (
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyRowRuleToPartner(deal.id, clientPartner.id, rule)
                              }
                              className="text-[#1E7E34] font-semibold hover:underline cursor-pointer"
                            >
                              اعتماد للعميل
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleClearRowOverride(deal.id)}
                            className="text-[#4E342E]/75 hover:underline cursor-pointer"
                          >
                            استعادة
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#1E7E34] whitespace-nowrap">
                      <div>{formatMoney(comm, currency, true)}</div>
                      {rule.mode === 'per_kg' && currency !== 'EGP' && (
                        <div className="text-[10px] font-normal text-[#4E342E]">
                          ({formatMoney(rule.value, currency, true)}/كجم)
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {retailOrders.map((order) => {
                const weightKg = getRetailOrderWeightKg(order);
                const { rule, clientPartner, isOverridden } = resolveB2CCommission(
                  order,
                  partners,
                  commissionSettings
                );
                const comm = calculateCommissionAmountEgp(
                  order.subtotalEgp,
                  weightKg,
                  rule
                );

                return (
                  <tr key={order.id} className="hover:bg-[#FBF9F6]/60">
                    <td className="py-3 px-4 font-mono tabular-nums text-xs font-bold text-[#2A1A11] whitespace-nowrap">
                      #{order.id}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#4E342E] whitespace-nowrap">
                      <div>تجزئة B2C</div>
                      <div className="text-[11px] font-mono text-[#4E342E]/75">
                        {formatNumber(weightKg, 2)} كجم
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#2A1A11]">
                      <div>
                        {order.customerName} ({order.country} · {order.governorate})
                      </div>
                      <div className="text-[11px] text-[#4E342E] mt-0.5">
                        المحمصة / العميل:{' '}
                        <strong>
                          {clientPartner?.name || order.items[0]?.roasterName || 'تجزئة'}
                        </strong>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#2A1A11] whitespace-nowrap">
                      {formatMoney(order.subtotalEgp, currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={rule.mode}
                        onChange={(e) =>
                          handleRowOverrideChange(order.id, rule, {
                            mode: e.target.value as CommissionMode,
                          })
                        }
                        aria-label={`طريقة احتساب عمولة ${order.id}`}
                        className="px-2 py-1 text-xs font-semibold bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-md"
                      >
                        <option value="percent">نسبة مئوية (%)</option>
                        <option value="per_kg">مبلغ لكل كجم (ج.م/كجم)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={rule.mode === 'percent' ? '0.5' : '1'}
                          min="0"
                          value={rule.value}
                          onChange={(e) =>
                            handleRowOverrideChange(order.id, rule, {
                              value: Number(e.target.value) || 0,
                            })
                          }
                          aria-label={`قيمة عمولة ${order.id}`}
                          className="w-20 px-2 py-1 text-xs font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-md focus:outline-none focus:border-[#C89B3C]"
                        />
                        <span className="text-[11px] font-mono text-[#4E342E]">
                          {rule.mode === 'percent' ? '%' : 'ج.م/كجم'}
                        </span>
                      </div>
                      {isOverridden && (
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          {clientPartner && (
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyRowRuleToPartner(
                                  order.id,
                                  clientPartner.id,
                                  rule
                                )
                              }
                              className="text-[#1E7E34] font-semibold hover:underline cursor-pointer"
                            >
                              اعتماد للعميل
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleClearRowOverride(order.id)}
                            className="text-[#4E342E]/75 hover:underline cursor-pointer"
                          >
                            استعادة
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#1E7E34] whitespace-nowrap">
                      <div>{formatMoney(comm, currency, true)}</div>
                      {rule.mode === 'per_kg' && currency !== 'EGP' && (
                        <div className="text-[10px] font-normal text-[#4E342E]">
                          ({formatMoney(rule.value, currency, true)}/كجم)
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Home Page Contact Inquiries Inbox */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#C89B3C]" />
            <h2 className="text-base font-bold text-[#2A1A11]">
              استفسارات التواصل الواردة من الصفحة الرئيسية ({contactInquiries.length})
            </h2>
          </div>
        </div>
        {contactInquiries.length === 0 ? (
          <div className="px-5 py-6 text-xs text-[#4E342E]">
            لا توجد رسائل تواصل مرسلة من الصفحة الرئيسية حتى الآن.
          </div>
        ) : (
          <div className="divide-y divide-[#2A1A11]/10">
            {contactInquiries.map((inq) => (
              <div key={inq.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#C89B3C]">{inq.id}</span>
                    <span className="font-bold text-[#2A1A11]">{inq.name}</span>
                    <span className="text-[#4E342E]">· {inq.topic}</span>
                  </div>
                  <p className="text-sm text-[#2A1A11]">{inq.message}</p>
                </div>
                <div className="text-xs text-[#4E342E] font-mono shrink-0 text-left">
                  <div dir="ltr">{inq.phone}</div>
                  <div>{inq.email}</div>
                  <div className="text-[11px] opacity-75">{inq.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
