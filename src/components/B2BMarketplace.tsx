import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Package,
  FileText,
  X,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Lock,
  Award,
  Eye,
  LogOut,
  Clock,
  AlertCircle,
  Truck,
  PackageCheck,
  Plus,
} from 'lucide-react';
import { PartnerAuthPortal } from './PartnerAuthPortal';
import {
  CoffeeOrigin,
  CoffeeSpecies,
  CurrencyCode,
  GreenCoffeeLot,
  Incoterm,
  PartnerAccount,
  RetailOrder,
  RetailOrderStatus,
  RetailProduct,
  RfqRequest,
  RfqStatus,
  RfqType,
} from '../types';
import { ASSETS } from '../data/seedData';
import { SafeImage } from './SafeImage';
import { formatMoney, formatNumber, getTimestampNow } from '../utils/formatters';
import {
  getMaskedImporterLabel,
  isDealConfirmedStatus,
} from '../utils/contentGuard';

interface B2BMarketplaceProps {
  lots: GreenCoffeeLot[];
  partners: PartnerAccount[];
  rfqs: RfqRequest[];
  retailProducts: RetailProduct[];
  retailOrders: RetailOrder[];
  currency: CurrencyCode;
  loggedInTraderId: string | null;
  onLoginTrader: (traderId: string) => void;
  onRegisterTrader: (partner: PartnerAccount) => void;
  onLogoutTrader: () => void;
  onBackHome: () => void;
  onSubmitRfq: (rfq: RfqRequest) => void;
  onUpdateRfqStatus: (rfqId: string, status: RfqStatus, quotedPrice?: number) => void;
  onOpenChat: (rfqId: string, viewerRole: 'roaster') => void;
  onOpenLotDetail: (lot: GreenCoffeeLot) => void;
  onOpenInvoice: (rfq: RfqRequest) => void;
  onAddRetailProduct: (product: RetailProduct) => void;
  onUpdateRetailProduct: (productId: string, basePrice: number, inStock: boolean) => void;
  onUpdateOrderStatus: (orderId: string, status: RetailOrderStatus) => void;
  pendingRfqTrigger?: { lot: GreenCoffeeLot; type: RfqType } | null;
  onConsumePendingRfq?: () => void;
}

const ORIGINS: ('الكل' | CoffeeOrigin)[] = [
  'الكل',
  'البرازيل',
  'إندونيسيا',
  'الهند',
  'إثيوبيا',
  'كولومبيا',
  'غواتيمالا',
  'فيتنام',
  'اليمن',
];

const SPECIES_LIST: ('الكل' | CoffeeSpecies)[] = ['الكل', 'أرابيكا', 'روبوستا'];

const INCOTERMS_FILTER: ('الكل' | Incoterm)[] = [
  'الكل',
  'EXW (أرض المخزن)',
  'FOB (ميناء المنشأ)',
  'CIF (واصل للميناء)',
  'DDP (واصل للمستودع)',
];

const GLOBAL_DESTINATIONS = [
  'القاهرة - مصر',
  'الإسكندرية - مصر',
  'بورسعيد - مصر',
  'دبي (جبل علي) - الإمارات',
  'جدة (الميناء الإسلامي) - السعودية',
  'الرياض - السعودية',
  'الدمام - السعودية',
  'روتردام - هولندا',
];

export const B2BMarketplace: React.FC<B2BMarketplaceProps> = ({
  lots,
  partners,
  rfqs,
  retailProducts,
  retailOrders,
  currency,
  loggedInTraderId,
  onLoginTrader,
  onRegisterTrader,
  onLogoutTrader,
  onBackHome,
  onSubmitRfq,
  onUpdateRfqStatus,
  onOpenChat,
  onOpenLotDetail,
  onOpenInvoice,
  onAddRetailProduct,
  onUpdateRetailProduct,
  onUpdateOrderStatus,
  pendingRfqTrigger,
  onConsumePendingRfq,
}) => {
  const [selectedOrigin, setSelectedOrigin] = useState<'الكل' | CoffeeOrigin>('الكل');
  const [selectedSpecies, setSelectedSpecies] = useState<'الكل' | CoffeeSpecies>('الكل');
  const [selectedIncoterm, setSelectedIncoterm] = useState<'الكل' | Incoterm>('الكل');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubView, setActiveSubView] = useState<
    'lots' | 'my_rfqs' | 'order_tracker' | 'roaster_portal'
  >('lots');

  const roasters = useMemo(
    () => partners.filter((p) => p.type === 'roaster'),
    [partners]
  );

  const loggedInTrader = useMemo(
    () => roasters.find((r) => r.id === loggedInTraderId) || null,
    [roasters, loggedInTraderId]
  );

  // Modal state
  const [modalLot, setModalLot] = useState<GreenCoffeeLot | null>(null);
  const [modalType, setModalType] = useState<RfqType>('bulk_rfq');
  const [sampleGrams, setSampleGrams] = useState<250 | 500>(500);
  const [requestedTons, setRequestedTons] = useState<number>(1.5);
  const [targetGovernorate, setTargetGovernorate] = useState<string>('القاهرة - مصر');
  const [notes, setNotes] = useState<string>('');

  // Roaster B2C Portal state (protected behind Trader/Roaster login)
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>({});
  const [newProdName, setNewProdName] = useState('');
  const [newProdRoasterId, setNewProdRoasterId] = useState(
    loggedInTraderId || roasters[0]?.id || 'roa-1'
  );
  const [newProdOrigin, setNewProdOrigin] = useState('برازيلي سانتوس × إثيوبي');
  const [newProdCategory, setNewProdCategory] =
    useState<RetailProduct['category']>('تركي وتقليدي');
  const [newProdPrice, setNewProdPrice] = useState<number>(220);
  const [newProdNotes, setNewProdNotes] = useState('كاكاو، بندق محمص، قوام كريمي غني');
  const [newProdImage, setNewProdImage] = useState(ASSETS.turkishCardamom);

  useEffect(() => {
    if (!loggedInTraderId) {
      setActiveSubView('lots');
    } else {
      setNewProdRoasterId(loggedInTraderId);
    }
  }, [loggedInTraderId]);

  useEffect(() => {
    if (pendingRfqTrigger && loggedInTrader) {
      openModal(pendingRfqTrigger.lot, pendingRfqTrigger.type);
      onConsumePendingRfq?.();
    }
  }, [pendingRfqTrigger, loggedInTrader]);

  const verifiedImporterIds = useMemo(
    () => new Set(partners.filter((p) => p.type === 'importer' && p.verified).map((p) => p.id)),
    [partners]
  );

  const visibleRfqs = useMemo(() => {
    if (!loggedInTrader) return [];
    return rfqs.filter(
      (r) =>
        r.roasterAnonCode === loggedInTrader.anonCode ||
        r.roasterName === loggedInTrader.name
    );
  }, [rfqs, loggedInTrader]);

  const approvedLots = useMemo(
    () => lots.filter((l) => l.approvalStatus === 'معتمد'),
    [lots]
  );

  const filteredLots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return approvedLots.filter((lot) => {
      if (selectedOrigin !== 'الكل' && lot.origin !== selectedOrigin) return false;
      if (selectedSpecies !== 'الكل' && lot.species !== selectedSpecies) return false;
      if (selectedIncoterm !== 'الكل' && lot.incoterm !== selectedIncoterm) return false;
      if (verifiedOnly && !lot.qualitySealed) return false;
      if (q) {
        const maskedLabel = getMaskedImporterLabel(lot.importerId, partners);
        const haystack =
          `${lot.title} ${lot.lotCode} ${lot.origin} ${lot.incoterm} ${maskedLabel} ${lot.process} ${lot.warehouseGovernorate}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    approvedLots,
    partners,
    selectedOrigin,
    selectedSpecies,
    selectedIncoterm,
    verifiedOnly,
    searchQuery,
  ]);

  const totalAvailableTons = useMemo(
    () => approvedLots.reduce((sum, lot) => sum + lot.availableTons, 0),
    [approvedLots]
  );
  const sealedCount = useMemo(
    () => approvedLots.filter((l) => l.qualitySealed).length,
    [approvedLots]
  );
  const warehouseHubsCount = useMemo(
    () => new Set(approvedLots.map((l) => l.warehouseGovernorate)).size,
    [approvedLots]
  );

  const openModal = (lot: GreenCoffeeLot, type: RfqType) => {
    if (lot.availableTons <= 0) return;
    setModalLot(lot);
    setModalType(type);
    const minValid = Math.min(lot.availableTons, lot.minOrderTons || 0.5);
    setRequestedTons(Math.min(lot.availableTons, Math.max(minValid, 1)));
    setNotes('');
  };

  const handleRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalLot || modalLot.availableTons <= 0 || !loggedInTrader) return;

    const importerPartner = partners.find((p) => p.id === modalLot.importerId);

    const safeTons = Math.min(modalLot.availableTons, Math.max(0.1, requestedTons));
    const rfqId = `RFQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const noteText =
      notes.trim() ||
      (modalType === 'sample'
        ? 'طلب عينة للفحص المعملي'
        : `طلب عرض سعر للكمية وفق شرط ${modalLot.incoterm}`);

    const newRfq: RfqRequest = {
      id: rfqId,
      lotId: modalLot.id,
      lotCode: modalLot.lotCode,
      lotTitle: modalLot.title,
      importerId: modalLot.importerId,
      importerName: modalLot.importerName,
      importerAnonCode: importerPartner?.anonCode || 'IMP-100',
      roasterName: loggedInTrader.name,
      roasterAnonCode: loggedInTrader.anonCode,
      type: modalType,
      sampleWeightGrams: modalType === 'sample' ? sampleGrams : undefined,
      requestedTons: modalType === 'bulk_rfq' ? safeTons : undefined,
      targetGovernorate,
      notes: noteText,
      status: 'بانتظار التسعير',
      initialPricePerKgEgp: modalLot.pricePerKgEgp,
      stockDeducted: false,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderRole: 'roaster',
          senderLabel: `محمصة ${loggedInTrader.anonCode}`,
          text:
            modalType === 'sample'
              ? `تم إرسال طلب عينة (${sampleGrams} جم) إلى ${targetGovernorate}. ${noteText}`
              : `تم إرسال طلب عرض سعر لكمية ${safeTons} طن إلى ${targetGovernorate}. ${noteText}`,
          timestamp: getTimestampNow(),
        },
      ],
      contactViolations: [],
      createdAt: getTimestampNow(),
    };

    onSubmitRfq(newRfq);
    setModalLot(null);
    setActiveSubView('my_rfqs');
  };

  const handleCreateRetailProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const roaster =
      roasters.find((r) => r.id === newProdRoasterId) || loggedInTrader || roasters[0];
    if (!roaster) return;
    const created: RetailProduct = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      roasterId: roaster.id,
      roasterName: roaster.name,
      originLabel: newProdOrigin.trim(),
      category: newProdCategory,
      basePrice250gEgp: newProdPrice,
      tastingNotes: newProdNotes.trim(),
      inStock: true,
      qualitySealed: false,
      imageUrl: newProdImage,
    };
    onAddRetailProduct(created);
    setShowAddProductModal(false);
    setNewProdName('');
  };

  if (!loggedInTrader) {
    return (
      <PartnerAuthPortal
        roleType="roaster"
        partners={partners}
        onLoginPartner={onLoginTrader}
        onRegisterPartner={onRegisterTrader}
        onBackHome={onBackHome}
      />
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Logged-in Trader / Roaster Status Bar */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2A1A11]">
              {loggedInTrader.name}
            </h2>
            {loggedInTrader.verified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1E7E34] bg-[#1E7E34]/10 border border-[#1E7E34]/25 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>معتمد ومفعّل</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                <span>{loggedInTrader.codingStatus || 'بانتظار التكويد والاعتماد'}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#4E342E]">
            {loggedInTrader.businessActivityType ? `${loggedInTrader.businessActivityType} · ` : ''}
            {loggedInTrader.contactPerson ? `المسؤول: ${loggedInTrader.contactPerson} · ` : ''}
            {loggedInTrader.country} — {loggedInTrader.governorate}
            {loggedInTrader.codingCode ? (
              <>
                {' · '}كود التكويد:{' '}
                <span className="font-mono font-bold text-[#1E7E34]">
                  {loggedInTrader.codingCode}
                </span>
              </>
            ) : null}
            {' · '}رمز التفاوض:{' '}
            <span className="font-mono font-bold text-[#2A1A11]">#{loggedInTrader.anonCode}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveSubView((prev) =>
                prev === 'order_tracker' ? 'lots' : 'order_tracker'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              activeSubView === 'order_tracker'
                ? 'bg-[#2A1A11] text-white border-[#2A1A11]'
                : 'text-[#2A1A11] bg-[#FBF9F6] hover:bg-[#F3EDE4] border-[#2A1A11]/15'
            }`}
          >
            <Truck
              className={`w-4 h-4 ${
                activeSubView === 'order_tracker' ? 'text-[#F2C864]' : 'text-[#C89B3C]'
              }`}
            />
            <span>تتبع الطلبات ({retailOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSubView((prev) =>
                prev === 'roaster_portal' ? 'lots' : 'roaster_portal'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              activeSubView === 'roaster_portal'
                ? 'bg-[#2A1A11] text-white border-[#2A1A11]'
                : 'text-[#2A1A11] bg-[#FBF9F6] hover:bg-[#F3EDE4] border-[#2A1A11]/15'
            }`}
          >
            <PackageCheck
              className={`w-4 h-4 ${
                activeSubView === 'roaster_portal' ? 'text-[#F2C864]' : 'text-[#1E7E34]'
              }`}
            />
            <span>بوابة المحمصة ({retailOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={onLogoutTrader}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#4E342E] hover:text-rose-700 bg-[#FBF9F6] hover:bg-rose-50 border border-[#2A1A11]/15 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {!loggedInTrader.verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span>
              حساب <strong>{loggedInTrader.name}</strong> حالياً في حالة{' '}
              <strong>«{loggedInTrader.codingStatus || 'بانتظار التكويد والاعتماد'}»</strong>.
              {loggedInTrader.codingReviewNote
                ? ` ملاحظة الإدارة: ${loggedInTrader.codingReviewNote}. `
                : ' '}
              يمكنك تصفح عروض السوق ومؤشرات الأسعار، وبمجرد اعتماد الإدارة العليا سيتم إصدار كود
              التكويد الرسمي لحسابك.
            </span>
          </div>
        </div>
      )}

      {/* Editorial Commodity Exchange Hero */}
      <div className="bg-gradient-to-l from-[#1C110B] via-[#23150E] to-[#14251B] text-[#FBF9F6] border border-[#C89B3C]/25 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-[0_20px_50px_-24px_rgba(28,17,11,0.45)]">
        <div className="lg:col-span-6 p-7 sm:p-11 flex flex-col justify-between gap-8">
          <div className="space-y-4">
            <p className="text-xs font-bold tracking-wide text-[#F2C864]">
              منصة التداول المؤسسي للبن الأخضر · عقود EXW / FOB / CIF / DDP · حماية كاملة لهوية الأطراف
            </p>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-[1.2]">
              تداول البن الأخضر مباشرة من كبار المصدّرين والمستوردين إلى محمصتك
            </h1>
            <p className="text-sm sm:text-base text-[#FBF9F6]/80 leading-relaxed max-w-xl">
              قارن مواصفات التذوق (SCA) وشروط الشحن الدولية بعملات متعددة عبر أكواد موردين معتمدين، اطلب عينات الفحص، وتفاوض بأمان حتى تأكيد الاتفاق.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveSubView('lots')}
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeSubView === 'lots'
                  ? 'bg-[#C89B3C] text-[#1C110B] hover:bg-[#d8aa49]'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
              }`}
            >
              تصفح المنتجات المتاحة ({approvedLots.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('my_rfqs')}
              className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeSubView === 'my_rfqs'
                  ? 'bg-[#C89B3C] text-[#1C110B] hover:bg-[#d8aa49]'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
              }`}
            >
              طلباتي ومحادثات التفاوض ({visibleRfqs.length})
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 min-h-[250px] lg:min-h-[360px] relative">
          <SafeImage
            src={ASSETS.heroWarehouse}
            alt="مستودع البن الأخضر ومنصة بُنّ تك"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="hidden lg:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#1C110B] to-transparent pointer-events-none"
          />
        </div>
      </div>

      {/* 4-Column Market KPI Strip (Zero Commission Exposure) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#C89B3C] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">إجمالي المعروض الفوري</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#1C110B] mt-1.5">
            {formatNumber(totalAvailableTons, 1)} طن
          </p>
        </div>
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#1E7E34] rounded-xl p-5 hover:border-[#1E7E34]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">منتجات حائزة على شارة الجودة</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#1E7E34] mt-1.5">
            {sealedCount} من {approvedLots.length}
          </p>
        </div>
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#2A1A11] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">موردون ومستوردون موثقون</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#1C110B] mt-1.5">
            {verifiedImporterIds.size} شركاء دوليين
          </p>
        </div>
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#4E342E] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">موانئ ومراكز تخزين لوجستية</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#1C110B] mt-1.5">
            {warehouseHubsCount} مراكز رئيسية
          </p>
        </div>
      </div>

      {activeSubView === 'lots' && (
        <>
          {/* Filters & Search Toolbar */}
          <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Origin Segmented Filter */}
              <div className="flex flex-wrap items-center gap-1 bg-[#FBF9F6] p-1 rounded-lg border border-[#2A1A11]/10">
                {ORIGINS.map((origin) => (
                  <button
                    key={origin}
                    type="button"
                    onClick={() => setSelectedOrigin(origin)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      selectedOrigin === origin
                        ? 'bg-[#2A1A11] text-white'
                        : 'text-[#4E342E] hover:text-[#2A1A11]'
                    }`}
                  >
                    {origin}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#4E342E]/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالمنشأ، الميناء، كود المنتج، أو كود المورد..."
                  className="w-full pr-9 pl-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#2A1A11]/8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#4E342E]">الفصيلة:</span>
                  <div className="flex items-center gap-1 bg-[#FBF9F6] p-1 rounded-lg border border-[#2A1A11]/10">
                    {SPECIES_LIST.map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => setSelectedSpecies(sp)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          selectedSpecies === sp
                            ? 'bg-[#4E342E] text-white'
                            : 'text-[#4E342E] hover:text-[#2A1A11]'
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs">
                  <span className="font-medium text-[#4E342E]">شرط التسليم:</span>
                  <select
                    value={selectedIncoterm}
                    onChange={(e) =>
                      setSelectedIncoterm(e.target.value as 'الكل' | Incoterm)
                    }
                    className="px-2.5 py-1.5 text-xs font-semibold bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  >
                    {INCOTERMS_FILTER.map((inc) => (
                      <option key={inc} value={inc}>
                        {inc}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#1E7E34] rounded cursor-pointer"
                />
                <ShieldCheck className="w-4 h-4 text-[#1E7E34]" />
                <span className="text-xs font-semibold text-[#2A1A11]">
                  إظهار المنتجات الحائزة على شارة الجودة المفحوصة فقط
                </span>
              </label>
            </div>
          </div>

          {/* Lot Cards Grid */}
          {filteredLots.length === 0 ? (
            <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-12 text-center space-y-3">
              <p className="text-base font-bold text-[#2A1A11]">
                لا توجد منتجات مطابقة لمعايير البحث الحالية
              </p>
              <p className="text-sm text-[#4E342E]">
                جرّب تغيير دولة المنشأ أو شرط التسليم لعرض كافة المنتجات المتوفرة.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrigin('الكل');
                  setSelectedSpecies('الكل');
                  setSelectedIncoterm('الكل');
                  setVerifiedOnly(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2A1A11] rounded-lg hover:bg-[#4E342E] cursor-pointer"
              >
                إظهار جميع المنتجات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLots.map((lot) => {
                const isImporterVerified = verifiedImporterIds.has(lot.importerId);
                const maskedImporter = getMaskedImporterLabel(lot.importerId, partners);
                const isOutOfStock = lot.availableTons <= 0;

                return (
                  <article
                    key={lot.id}
                    className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C89B3C]/55 hover:shadow-[0_14px_34px_-14px_rgba(28,17,11,0.14)]"
                  >
                    <div>
                      {lot.mediaType === 'video' && lot.videoUrl ? (
                        <div className="aspect-[16/9] w-full bg-white border-b border-[#2A1A11]/10 overflow-hidden relative">
                          <video
                            src={lot.videoUrl}
                            controls
                            muted
                            playsInline
                            loop
                            className="w-full h-full object-contain bg-white"
                            aria-label={`فيديو توضيحي للمنتج ${lot.title}`}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenLotDetail(lot)}
                          className={`aspect-[16/9] w-full overflow-hidden relative block cursor-pointer group ${
                            lot.whiteBgStudio
                              ? 'bg-white border-b border-[#2A1A11]/10 p-2'
                              : 'bg-[#F3EDE4]'
                          }`}
                          aria-label={`عرض بطاقة الفحص الفني للمنتج ${lot.title}`}
                        >
                          <SafeImage
                            src={lot.imageUrl}
                            alt={lot.title}
                            className={`w-full h-full transition-transform duration-200 group-hover:scale-[1.02] ${
                              lot.whiteBgStudio ? 'object-contain bg-white' : 'object-cover'
                            }`}
                          />
                        </button>
                      )}

                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-[#4E342E] font-medium truncate">
                            <span>{lot.origin}</span>
                            <span aria-hidden="true">·</span>
                            <span>{lot.species}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-[11px]">{lot.lotCode}</span>
                          </div>
                          {lot.qualitySealed && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E7E34] shrink-0">
                              <ShieldCheck className="w-4 h-4" />
                              <span>✔ منتج مفحوص</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenLotDetail(lot)}
                              className="text-right text-base font-bold text-[#2A1A11] hover:text-[#C89B3C] leading-snug cursor-pointer"
                            >
                              {lot.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenLotDetail(lot)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4E342E] hover:text-[#2A1A11] shrink-0 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                              <span>الفحص</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[#4E342E] mt-1.5">
                            <Lock className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
                            <span className="font-semibold text-[#2A1A11]">
                              {maskedImporter}
                            </span>
                            {isImporterVerified && (
                              <CheckCircle2
                                className="w-3.5 h-3.5 text-[#1E7E34] shrink-0"
                                aria-label="مستورد موثق"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#4E342E]/75 mt-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {lot.warehouseGovernorate} · {lot.incoterm.split(' ')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-[#2A1A11]/10 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#4E342E]/75">المعالجة:</span>
                            <span className="font-semibold text-[#2A1A11]">{lot.process}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#4E342E]/75">تقييم SCA:</span>
                            <span className="font-mono tabular-nums font-semibold text-[#2A1A11] inline-flex items-center gap-1">
                              <Award className="w-3 h-3 text-[#C89B3C]" />
                              {lot.scaScore}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#4E342E]/75">السكرين:</span>
                            <span className="font-mono tabular-nums font-semibold text-[#2A1A11]">
                              {lot.screen}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#4E342E]/75">الرطوبة:</span>
                            <span className="font-mono tabular-nums font-semibold text-[#2A1A11]">
                              {lot.moisturePct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions Footer */}
                    <div className="px-5 pb-5 pt-3 border-t border-[#2A1A11]/10 bg-[#FBF9F6]/60 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="block text-[11px] text-[#4E342E]/75">
                            السعر الفوري ({lot.incoterm})
                          </span>
                          <span className="text-xl font-extrabold font-mono tabular-nums text-[#2A1A11]">
                            {formatMoney(lot.pricePerKgEgp, currency)}{' '}
                            <span className="text-xs font-sans font-normal text-[#4E342E]">
                              / كجم
                            </span>
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="block text-[11px] text-[#4E342E]/75">المتاح</span>
                          <span
                            className={`text-sm font-bold font-mono tabular-nums ${
                              isOutOfStock ? 'text-rose-700' : 'text-[#2A1A11]'
                            }`}
                          >
                            {isOutOfStock
                              ? 'نفذت الكمية'
                              : `${formatNumber(lot.availableTons, 1)} طن`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => openModal(lot, 'sample')}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#2A1A11] bg-white hover:bg-[#F3EDE4] border border-[#2A1A11]/20 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Package className="w-3.5 h-3.5 text-[#C89B3C]" />
                          <span>اطلب عينة (250-500 جم)</span>
                        </button>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => openModal(lot, 'bulk_rfq')}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C89B3C]" />
                          <span>{isOutOfStock ? 'نفذت الكمية' : 'اطلب عرض سعر (RFQ)'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeSubView === 'my_rfqs' && (
        /* Roaster Submitted RFQs & Samples Table */
        <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#2A1A11]">
                سجل طلبات العينات وعروض الأسعار والتفاوض
              </h2>
              <p className="text-xs text-[#4E342E] mt-0.5">
                تظل هوية المورد محمية برمز مشفّر أثناء التفاوض وتُكشف كاملة فور تأكيد الاتفاق.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                  <th className="py-3 px-4">رقم الطلب</th>
                  <th className="py-3 px-4">المنتج وهوية المستورد</th>
                  <th className="py-3 px-4">المحمصة والوجهة</th>
                  <th className="py-3 px-4">النوع / الكمية</th>
                  <th className="py-3 px-4">السعر</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">التفاوض والإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
                {visibleRfqs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 px-4 text-center text-sm text-[#4E342E]">
                      لا توجد طلبات عينات أو عروض أسعار مسجلة لهذا الحساب حتى الآن. تصفح المنتجات
                      المتاحة لإرسال أول طلب.
                    </td>
                  </tr>
                ) : (
                  visibleRfqs.map((rfq) => {
                  const dealConfirmed = isDealConfirmedStatus(rfq.status);
                  const maskedImporter = getMaskedImporterLabel(
                    rfq.importerId,
                    partners,
                    rfq.importerAnonCode
                  );
                  const importerPartner = partners.find((p) => p.id === rfq.importerId);

                  return (
                    <tr key={rfq.id} className="hover:bg-[#FBF9F6]/60">
                      <td className="py-3 px-4 font-mono tabular-nums text-xs font-semibold text-[#2A1A11] whitespace-nowrap">
                        <div>{rfq.id}</div>
                        <div className="text-[11px] font-normal text-[#4E342E]/70">
                          {rfq.lotCode}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#2A1A11]">{rfq.lotTitle}</p>
                        {dealConfirmed ? (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-xs font-bold text-[#1E7E34]">
                              {rfq.importerName} ({importerPartner?.phone})
                            </p>
                            <p className="text-[11px] font-semibold text-[#1E7E34]">
                              ✔ بيانات الطرفين مكتملة لإتمام التسليم
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-[#4E342E] flex items-center gap-1 mt-0.5">
                            <Lock className="w-3 h-3 text-[#C89B3C]" />
                            <span>{maskedImporter} (هوية محمية حتى إتمام الاتفاق)</span>
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#2A1A11]">
                        <p className="font-semibold">{rfq.roasterName}</p>
                        <p className="text-[#4E342E] mt-0.5">{rfq.targetGovernorate}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-[#2A1A11] whitespace-nowrap">
                        {rfq.type === 'sample'
                          ? `عينة ${rfq.sampleWeightGrams} جم`
                          : `${rfq.requestedTons} طن`}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#2A1A11] whitespace-nowrap">
                        {rfq.quotedPricePerKgEgp
                          ? formatMoney(rfq.quotedPricePerKgEgp, currency)
                          : `${formatMoney(rfq.initialPricePerKgEgp, currency)} (مبدئي)`}
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
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenChat(rfq.id, 'roaster')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2A1A11] bg-[#FBF9F6] hover:bg-[#F3EDE4] border border-[#2A1A11]/20 rounded-md cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#C89B3C]" />
                            <span>محادثة تفاوض ({rfq.messages.length})</span>
                          </button>

                          {rfq.status === 'تم إرسال العرض' && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateRfqStatus(
                                  rfq.id,
                                  'تم الاتفاق / جاري التنفيذ',
                                  rfq.quotedPricePerKgEgp ?? rfq.initialPricePerKgEgp
                                )
                              }
                              className="px-2.5 py-1.5 text-xs font-semibold bg-[#1E7E34] text-white rounded-md hover:bg-[#176429] cursor-pointer"
                            >
                              موافقة وتأكيد الاتفاق
                            </button>
                          )}

                          {dealConfirmed && (
                            <button
                              type="button"
                              onClick={() => onOpenInvoice(rfq)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[#2A1A11] text-white rounded-md hover:bg-[#4E342E] cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#C89B3C]" />
                              <span>الفاتورة المبدئية</span>
                            </button>
                          )}
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
      )}

      {activeSubView === 'order_tracker' && (
        <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A1A11]/10 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#2A1A11]">
                تتبع طلبات العملاء المباشرة ({retailOrders.length})
              </h2>
              <p className="text-xs text-[#4E342E] mt-0.5">
                متابعة لحظية لحالة التجهيز والتحميص والتسليم لجميع طلبات المستهلكين.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubView('roaster_portal')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2A1A11] bg-[#FBF9F6] hover:bg-[#F3EDE4] border border-[#2A1A11]/15 rounded-lg cursor-pointer"
              >
                <PackageCheck className="w-3.5 h-3.5 text-[#1E7E34]" />
                <span>إدارة الطلبات في بوابة المحمصة</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('lots')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
              >
                العودة لسوق الجملة
              </button>
            </div>
          </div>

          {retailOrders.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#4E342E]">
              لا توجد طلبات مسجلة لتتبعها حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {retailOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-[#FBF9F6] border border-[#2A1A11]/12 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#2A1A11]">#{ord.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        ord.status === 'تم التسليم'
                          ? 'bg-[#1E7E34]/12 text-[#1E7E34]'
                          : ord.status === 'تم التحميص والتغليف'
                          ? 'bg-[#C89B3C]/15 text-[#9A6F18]'
                          : 'bg-[#2A1A11]/10 text-[#4E342E]'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#2A1A11] font-bold">
                    {ord.customerName} — {ord.country} ({ord.governorate})
                  </p>
                  <p className="text-[#4E342E]">{ord.address}</p>
                  <div className="border-t border-[#2A1A11]/10 pt-2 space-y-1">
                    {ord.items.map((item) => (
                      <p key={item.cartItemId} className="text-[#2A1A11]">
                        {item.quantity}× {item.productName} ({item.weight} · {item.roastLevel} ·{' '}
                        {item.grindType})
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-[#2A1A11]/10 pt-2">
                    <span className="text-[#4E342E] font-mono tabular-nums font-bold">
                      {formatMoney(ord.totalEgp, currency)}
                    </span>
                    <span className="text-[#4E342E]/80">{ord.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubView === 'roaster_portal' && (
        <div className="space-y-8">
          <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#2A1A11]">
                بوابة المحمصة — إدارة منتجات التجزئة وطلبات المستهلكين
              </h2>
              <p className="text-xs text-[#4E342E] mt-0.5">
                إدارة منتجات متجر المستهلك، تحديث الأسعار والتوفر، وتحديث حالات تجهيز وشحن الطلبات.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubView('lots')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
            >
              العودة لسوق الجملة
            </button>
          </div>

          {/* 1. Retail Products Manager */}
          <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold text-[#2A1A11]">
                إدارة منتجات التجزئة ({retailProducts.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#C89B3C]" />
                <span>إضافة منتج محمص جديد</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                    <th className="py-3 px-4">المنتج والمحمصة</th>
                    <th className="py-3 px-4">التصنيف</th>
                    <th className="py-3 px-4">سعر 250 جم الأساسي (ج.م)</th>
                    <th className="py-3 px-4">حالة التوفر</th>
                    <th className="py-3 px-4">حفظ التعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
                  {retailProducts.map((p) => {
                    const draftPrice = priceDrafts[p.id] ?? p.basePrice250gEgp;
                    return (
                      <tr key={p.id} className="hover:bg-[#FBF9F6]/60">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#2A1A11]">{p.name}</p>
                          <p className="text-xs text-[#4E342E]">{p.roasterName}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#4E342E] whitespace-nowrap">
                          {p.category}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <input
                            type="number"
                            min={30}
                            value={draftPrice}
                            onChange={(e) =>
                              setPriceDrafts((prev) => ({
                                ...prev,
                                [p.id]: Number(e.target.value) || 0,
                              }))
                            }
                            aria-label={`سعر ${p.name}`}
                            className="w-24 px-2.5 py-1.5 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-md"
                          />
                          {currency !== 'EGP' && (
                            <span className="block text-[11px] font-mono text-[#4E342E]/75 mt-0.5">
                              {formatMoney(draftPrice, currency)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateRetailProduct(p.id, draftPrice, !p.inStock)
                            }
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                              p.inStock
                                ? 'bg-[#1E7E34]/10 text-[#1E7E34]'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {p.inStock ? 'متاح للطلب' : 'نفذت الكمية'}
                          </button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateRetailProduct(p.id, draftPrice, p.inStock);
                              setPriceDrafts((prev) => {
                                const next = { ...prev };
                                delete next[p.id];
                                return next;
                              });
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-md cursor-pointer"
                          >
                            تحديث السعر
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Incoming Consumer Orders */}
          <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#2A1A11]">
                طلبات المستهلكين الواردة ({retailOrders.length})
              </h3>
              <span className="text-xs text-[#4E342E]">
                تحديث الحالة ينعكس لحظياً في شاشة تتبع الطلبات
              </span>
            </div>

            {retailOrders.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#4E342E]">
                لا توجد طلبات مستهلكين حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                      <th className="py-3 px-4">رقم الطلب</th>
                      <th className="py-3 px-4">العميل والوجهة الدولية</th>
                      <th className="py-3 px-4">تفاصيل الطحن والتحميص</th>
                      <th className="py-3 px-4">الدفع والإجمالي</th>
                      <th className="py-3 px-4">حالة التنفيذ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
                    {retailOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FBF9F6]/60">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono tabular-nums text-xs font-bold text-[#2A1A11]">
                            #{order.id}
                          </span>
                          <div className="text-[11px] font-mono text-[#4E342E]/75 mt-0.5">
                            {order.createdAt}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#2A1A11]">
                            {order.customerName} ({order.customerPhone})
                          </p>
                          <p className="text-xs text-[#4E342E]">
                            {order.country} · {order.governorate} — {order.address}
                          </p>
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          {order.items.map((item) => (
                            <div key={item.cartItemId} className="text-xs text-[#2A1A11]">
                              <span className="font-semibold">
                                {item.quantity}× {item.productName}
                              </span>{' '}
                              <span className="text-[#4E342E]">
                                ({item.weight} · {item.roastLevel} · {item.grindType} ·{' '}
                                {item.spiceOption})
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-mono tabular-nums font-bold text-[#2A1A11]">
                            {formatMoney(order.totalEgp, currency)}
                          </p>
                          <p className="text-[11px] text-[#4E342E]">{order.paymentMethod}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(order.id, e.target.value as RetailOrderStatus)
                            }
                            aria-label={`تغيير حالة الطلب ${order.id}`}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-md focus:outline-none focus:border-[#C89B3C]"
                          >
                            <option value="قيد التجهيز">قيد التجهيز</option>
                            <option value="تم التحميص والتغليف">تم التحميص والتغليف</option>
                            <option value="تم التسليم">تم التسليم</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Retail Product Modal */}
      {showAddProductModal && (
        <div
          className="fixed inset-0 z-50 bg-[#2A1A11]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#2A1A11]/15 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#2A1A11]/10 flex items-center justify-between bg-[#FBF9F6]">
              <h3 className="text-base font-bold text-[#2A1A11]">إضافة منتج محمص جديد للمتجر</h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRetailProduct} className="p-6 space-y-4">
              <label className="block">
                <span className="block text-xs font-semibold text-[#2A1A11] mb-1">اسم المنتج</span>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="مثال: خلطة السعادة التركي الفاخرة"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">المحمصة</span>
                  <select
                    value={newProdRoasterId}
                    onChange={(e) => setNewProdRoasterId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg"
                  >
                    {roasters.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.country})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">التصنيف</span>
                  <select
                    value={newProdCategory}
                    onChange={(e) =>
                      setNewProdCategory(e.target.value as RetailProduct['category'])
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg"
                  >
                    <option value="تركي وتقليدي">تركي وتقليدي</option>
                    <option value="إسبريسو">إسبريسو</option>
                    <option value="فلتر ومختصة">فلتر ومختصة</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    الأصول المستخدمة
                  </span>
                  <input
                    type="text"
                    required
                    value={newProdOrigin}
                    onChange={(e) => setNewProdOrigin(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    السعر الأساسي لـ 250 جم (ج.م)
                  </span>
                  <input
                    type="number"
                    min={40}
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value) || 200)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg"
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                  صورة التغليف
                </span>
                <select
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg"
                >
                  <option value={ASSETS.turkishCardamom}>تغليف قهوة تركي مع كنكة نحاس</option>
                  <option value={ASSETS.espressoBlend}>تغليف إسبريسو أسود وذهبي</option>
                  <option value={ASSETS.ethiopiaSingle}>تغليف قهوة مختصة كريمي</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                  إيحاءات التذوق
                </span>
                <input
                  type="text"
                  required
                  value={newProdNotes}
                  onChange={(e) => setNewProdNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#4E342E] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
                >
                  نشر المنتج في المتجر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive RFQ / Sample Modal */}
      {modalLot && (
        <div
          className="fixed inset-0 z-50 bg-[#2A1A11]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#2A1A11]/15 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#2A1A11]/10 flex items-center justify-between bg-[#FBF9F6]">
              <div>
                <h3 className="text-base font-bold text-[#2A1A11]">
                  {modalType === 'sample'
                    ? 'طلب عينة فحص معملي (250 - 500 جم)'
                    : 'تقديم طلب عرض سعر للكمية (RFQ)'}
                </h3>
                <p className="text-xs text-[#4E342E] mt-0.5">
                  {modalLot.title} · {modalLot.lotCode} · {modalLot.incoterm}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalLot(null)}
                className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRfqSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs bg-[#FBF9F6] p-3 rounded-lg border border-[#2A1A11]/10">
                <span className="text-[#4E342E] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>{getMaskedImporterLabel(modalLot.importerId, partners)}</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-[#2A1A11]">
                  السعر المعلن: {formatMoney(modalLot.pricePerKgEgp, currency)} / كجم
                </span>
              </div>

              <div className="bg-[#FBF9F6] border border-[#2A1A11]/12 rounded-lg p-3 text-xs">
                <span className="block text-[#4E342E]/80 mb-0.5">الجهة الطالبة (حسابك):</span>
                <span className="font-bold text-[#2A1A11]">
                  {loggedInTrader.name} ({loggedInTrader.country} — #{loggedInTrader.anonCode})
                </span>
              </div>

              {modalType === 'sample' ? (
                <div>
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                    وزن العينة المطلوب
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {([250, 500] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSampleGrams(g)}
                        className={`py-2.5 text-sm font-semibold rounded-lg border cursor-pointer ${
                          sampleGrams === g
                            ? 'bg-[#2A1A11] text-white border-[#2A1A11]'
                            : 'bg-[#FBF9F6] text-[#2A1A11] border-[#2A1A11]/15'
                        }`}
                      >
                        عينة {g} جرام
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    الكمية المطلوبة بالطن (المتاح: {modalLot.availableTons} طن)
                  </span>
                  <input
                    type="number"
                    min={Math.min(0.2, modalLot.availableTons)}
                    max={modalLot.availableTons}
                    step="0.1"
                    required
                    value={requestedTons}
                    onChange={(e) => setRequestedTons(Number(e.target.value) || 0.2)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                  <span className="block text-[11px] text-[#4E342E]/75 mt-1 font-mono tabular-nums">
                    القيمة التقديرية المبدئية:{' '}
                    {formatMoney(requestedTons * 1000 * modalLot.pricePerKgEgp, currency)}
                  </span>
                </label>
              )}

              <label className="block">
                <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                  وجهة التسليم / الميناء
                </span>
                <select
                  value={targetGovernorate}
                  onChange={(e) => setTargetGovernorate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                >
                  {GLOBAL_DESTINATIONS.map((dest) => (
                    <option key={dest} value={dest}>
                      {dest}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                  ملاحظات المواصفات أو شروط الشحن الدولي
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: مطلوب شهادة فحص الرطوبة وشهادة المنشأ..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalLot(null)}
                  className="px-4 py-2 text-sm font-medium text-[#4E342E] hover:text-[#2A1A11] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
                >
                  إرسال الطلب وبدء التفاوض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
