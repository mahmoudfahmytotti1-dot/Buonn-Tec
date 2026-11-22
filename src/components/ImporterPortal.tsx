import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  History,
  CheckCircle2,
  X,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Lock,
  FileText,
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  LogOut,
  Clock,
} from 'lucide-react';
import { PartnerAuthPortal } from './PartnerAuthPortal';
import {
  CoffeeOrigin,
  CoffeeSpecies,
  CurrencyCode,
  GreenCoffeeLot,
  Incoterm,
  PartnerAccount,
  RfqRequest,
  RfqStatus,
} from '../types';
import { ASSETS } from '../data/seedData';
import { formatMoney, formatNumber, getTimestampNow } from '../utils/formatters';
import {
  getMaskedRoasterLabel,
  isDealConfirmedStatus,
} from '../utils/contentGuard';

interface ImporterPortalProps {
  lots: GreenCoffeeLot[];
  partners: PartnerAccount[];
  rfqs: RfqRequest[];
  currency: CurrencyCode;
  loggedInImporterId: string | null;
  onLoginImporter: (importerId: string) => void;
  onRegisterImporter: (partner: PartnerAccount) => void;
  onLogoutImporter: () => void;
  onBackHome: () => void;
  onUpdateLotPriceStock: (lotId: string, newPrice: number, newTons: number) => void;
  onAddNewLot: (lot: GreenCoffeeLot) => void;
  onResubmitLot: (lotId: string) => void;
  onUpdateRfq: (rfqId: string, status: RfqStatus, quotedPrice?: number) => void;
  onOpenChat: (rfqId: string, viewerRole: 'importer') => void;
  onOpenInvoice: (rfq: RfqRequest) => void;
}

const ORIGINS: CoffeeOrigin[] = [
  'البرازيل',
  'إندونيسيا',
  'الهند',
  'إثيوبيا',
  'كولومبيا',
  'غواتيمالا',
  'فيتنام',
  'اليمن',
];
const SPECIES: CoffeeSpecies[] = ['أرابيكا', 'روبوستا'];
const INCOTERMS: Incoterm[] = [
  'EXW (أرض المخزن)',
  'FOB (ميناء المنشأ)',
  'CIF (واصل للميناء)',
  'DDP (واصل للمستودع)',
];

export const ImporterPortal: React.FC<ImporterPortalProps> = ({
  lots,
  partners,
  rfqs,
  currency,
  loggedInImporterId,
  onLoginImporter,
  onRegisterImporter,
  onLogoutImporter,
  onBackHome,
  onUpdateLotPriceStock,
  onAddNewLot,
  onResubmitLot,
  onUpdateRfq,
  onOpenChat,
  onOpenInvoice,
}) => {
  const importers = useMemo(
    () => partners.filter((p) => p.type === 'importer'),
    [partners]
  );

  const [draftEdits, setDraftEdits] = useState<Record<string, { price: number; tons: number }>>({});
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, number>>({});

  // Sync/clear stale drafts whenever underlying store data resets or changes externally
  useEffect(() => {
    setDraftEdits((prev) => {
      const next: Record<string, { price: number; tons: number }> = {};
      for (const lot of lots) {
        if (prev[lot.id]) {
          // Only retain unsaved draft if lot exists; cleared on save
          next[lot.id] = prev[lot.id];
        }
      }
      return next;
    });
  }, [lots]);

  // Modals
  const [historyLot, setHistoryLot] = useState<GreenCoffeeLot | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Add New Lot form state
  const [newTitle, setNewTitle] = useState('');
  const [newOrigin, setNewOrigin] = useState<CoffeeOrigin>('البرازيل');
  const [newSpecies, setNewSpecies] = useState<CoffeeSpecies>('أرابيكا');
  const [newIncoterm, setNewIncoterm] = useState<Incoterm>('EXW (أرض المخزن)');
  const [newProcess, setNewProcess] = useState('مجففة (Natural)');
  const [newScreen, setNewScreen] = useState('17/18');
  const [newMoisture, setNewMoisture] = useState<number>(11.0);
  const [newScaScore, setNewScaScore] = useState<number>(83.0);
  const [newBagWeight, setNewBagWeight] = useState<number>(60);
  const [newCropYear, setNewCropYear] = useState('2025/2026');
  const [newTons, setNewTons] = useState<number>(10);
  const [newPrice, setNewPrice] = useState<number>(380);
  const [newWarehouse, setNewWarehouse] = useState('منطقة جبل علي اللوجستية - دبي');
  const [newWarehouseGov, setNewWarehouseGov] = useState('دبي (جبل علي) - الإمارات');

  // Product white-background media (image or video, zero importer name)
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [newImageUrl, setNewImageUrl] = useState<string>(ASSETS.greenCoffeeLot);
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [newMediaLabel, setNewMediaLabel] = useState<string>('الصورة الافتراضية (خلفية بيضاء)');
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [mediaIdentityConfirmed, setMediaIdentityConfirmed] = useState<boolean>(true);

  const loggedInImporter = useMemo(
    () => importers.find((i) => i.id === loggedInImporterId) || null,
    [importers, loggedInImporterId]
  );

  // Strict per-importer isolation: each importer only sees their own lots & RFQs
  const visibleLots = useMemo(() => {
    if (!loggedInImporter) return [];
    return lots.filter((l) => l.importerId === loggedInImporter.id);
  }, [lots, loggedInImporter]);

  const visibleRfqs = useMemo(() => {
    if (!loggedInImporter) return [];
    return rfqs.filter((r) => r.importerId === loggedInImporter.id);
  }, [rfqs, loggedInImporter]);

  const inventoryStats = useMemo(() => {
    const totalTons = visibleLots.reduce((s, l) => s + l.availableTons, 0);
    const totalValue = visibleLots.reduce(
      (s, l) => s + l.availableTons * 1000 * l.pricePerKgEgp,
      0
    );
    const pendingRfqs = visibleRfqs.filter(
      (r) => r.status === 'بانتظار التسعير' || r.status === 'تم إرسال العرض'
    ).length;
    const confirmedDeals = visibleRfqs.filter((r) => isDealConfirmedStatus(r.status)).length;
    return { totalTons, totalValue, pendingRfqs, confirmedDeals };
  }, [visibleLots, visibleRfqs]);

  const getDraft = (lot: GreenCoffeeLot) =>
    draftEdits[lot.id] || { price: lot.pricePerKgEgp, tons: lot.availableTons };

  const handleDraftChange = (lot: GreenCoffeeLot, field: 'price' | 'tons', value: number) => {
    const current = getDraft(lot);
    setDraftEdits((prev) => ({
      ...prev,
      [lot.id]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const handleSaveInline = (lot: GreenCoffeeLot) => {
    const draft = getDraft(lot);
    onUpdateLotPriceStock(lot.id, Math.max(1, draft.price), Math.max(0, draft.tons));
    setDraftEdits((prev) => {
      const next = { ...prev };
      delete next[lot.id];
      return next;
    });
  };

  const handleRfqAction = (rfqId: string, status: RfqStatus, quotedPrice?: number) => {
    onUpdateRfq(rfqId, status, quotedPrice);
    setQuoteDrafts((prev) => {
      const next = { ...prev };
      delete next[rfqId];
      return next;
    });
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaNotice(null);
    const lowerName = file.name.toLowerCase();
    if (
      loggedInImporter &&
      (lowerName.includes(loggedInImporter.name.toLowerCase()) ||
        lowerName.includes(loggedInImporter.anonCode.toLowerCase()))
    ) {
      setMediaNotice(
        'تنبيه: يبدو أن اسم الملف يتضمن اسم المستورد — يُنصح بإعادة التسمية لضمان عدم ظهور اسم المستورد.'
      );
    }

    if (file.type.startsWith('video/')) {
      setNewMediaType('video');
      setNewMediaLabel(file.name);
      if (file.size <= 2.8 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setNewVideoUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const blobUrl = URL.createObjectURL(file);
        setNewVideoUrl(blobUrl);
        setMediaNotice(
          'تم إرفاق الفيديو للعرض الفوري على خلفية بيضاء (ملفات أكبر من 2.8 ميجابايت تُعرض خلال الجلسة الحالية).'
        );
      }
      return;
    }

    if (file.type.startsWith('image/')) {
      setNewMediaType('image');
      setNewVideoUrl('');
      setNewMediaLabel(file.name);

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 900;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const targetW = Math.max(1, Math.round(img.width * scale));
          const targetH = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Paint pure white studio background behind uploaded image
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0, targetW, targetH);
            setNewImageUrl(canvas.toDataURL('image/jpeg', 0.86));
          } else {
            setNewImageUrl(reader.result as string);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetMedia = () => {
    setNewMediaType('image');
    setNewImageUrl(ASSETS.greenCoffeeLot);
    setNewVideoUrl('');
    setNewMediaLabel('الصورة الافتراضية (خلفية بيضاء)');
    setMediaNotice(null);
  };

  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInImporter) return;
    if (!mediaIdentityConfirmed) {
      setMediaNotice('يرجى الإقرار بخلو الصورة أو الفيديو من اسم المستورد أو شعاره قبل النشر.');
      return;
    }
    const lotNumber = Math.floor(200 + Math.random() * 799);
    const created: GreenCoffeeLot = {
      id: `lot-${Date.now()}`,
      lotCode: `LOT-GL-${lotNumber}`,
      title: newTitle.trim(),
      origin: newOrigin,
      species: newSpecies,
      process: newProcess,
      screen: newScreen,
      moisturePct: newMoisture,
      scaScore: newScaScore,
      bagWeightKg: newBagWeight,
      minOrderTons: 0.6,
      incoterm: newIncoterm,
      cropYear: newCropYear,
      availableTons: newTons,
      pricePerKgEgp: newPrice,
      importerId: loggedInImporter.id,
      importerName: loggedInImporter.name,
      warehouseLocation: newWarehouse,
      warehouseGovernorate: newWarehouseGov,
      qualitySealed: false,
      approvalStatus: 'بانتظار الاعتماد',
      imageUrl: newImageUrl || ASSETS.greenCoffeeLot,
      videoUrl: newMediaType === 'video' && newVideoUrl ? newVideoUrl : undefined,
      mediaType: newMediaType,
      whiteBgStudio: true,
      priceHistory: [
        {
          id: `ph-${Date.now()}`,
          timestamp: getTimestampNow(),
          oldPrice: newPrice,
          newPrice: newPrice,
          oldTons: newTons,
          newTons: newTons,
          note: 'إرسال المنتج للمراجعة والاعتماد من الإدارة العليا',
        },
      ],
    };
    onAddNewLot(created);
    setShowAddModal(false);
    setNewTitle('');
    handleResetMedia();
  };

  if (!loggedInImporter) {
    return (
      <PartnerAuthPortal
        roleType="importer"
        partners={partners}
        onLoginPartner={onLoginImporter}
        onRegisterPartner={onRegisterImporter}
        onBackHome={onBackHome}
      />
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Top Workspace Header (Isolated to Logged-In Importer) */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2A1A11]">
              {loggedInImporter.name}
            </h1>
            {loggedInImporter.verified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1E7E34] bg-[#1E7E34]/10 border border-[#1E7E34]/25 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>معتمد ومفعّل</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                <span>{loggedInImporter.codingStatus || 'بانتظار التكويد والاعتماد'}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#4E342E]">
            {loggedInImporter.country} · {loggedInImporter.governorate}
            {loggedInImporter.warehouseAddress ? ` · المخزن: ${loggedInImporter.warehouseAddress}` : ''}
            {loggedInImporter.codingCode ? (
              <>
                {' · '}كود التكويد:{' '}
                <span className="font-mono font-bold text-[#1E7E34]">
                  {loggedInImporter.codingCode}
                </span>
              </>
            ) : null}
            {' · '}رمز التفاوض:{' '}
            <span className="font-mono font-bold text-[#2A1A11]">#{loggedInImporter.anonCode}</span>
            {loggedInImporter.taxId ? (
              <>
                {' · '}الضريبي: <span className="font-mono">{loggedInImporter.taxId}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C89B3C]" />
            <span>إضافة منتج بن أخضر جديد</span>
          </button>

          <button
            type="button"
            onClick={onLogoutImporter}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#4E342E] hover:text-rose-700 bg-[#FBF9F6] hover:bg-rose-50 border border-[#2A1A11]/15 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Importer Commercial Summary Strip (No Commission Info) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#2A1A11] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">إجمالي رصيد مخزونك المعروض</p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#1C110B] mt-1.5">
            {formatNumber(inventoryStats.totalTons, 1)} طن
          </p>
        </div>
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#C89B3C] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">القيمة السوقية لمخزونك ({currency})</p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#1C110B] mt-1.5">
            {formatMoney(inventoryStats.totalValue, currency)}
          </p>
        </div>
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#4E342E] rounded-xl p-5 hover:border-[#C89B3C]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">طلبات وعروض قيد التفاوض</p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#C89B3C] mt-1.5">
            {inventoryStats.pendingRfqs} طلبات
          </p>
        </div>
        <div className="bg-white border border-[#2A1A11]/12 border-t-2 border-t-[#1E7E34] rounded-xl p-5 hover:border-[#1E7E34]/55 transition-colors">
          <p className="text-xs font-medium text-[#4E342E]/75">اتفاقات توريد مؤكدة</p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#1E7E34] mt-1.5">
            {inventoryStats.confirmedDeals} صفقات
          </p>
        </div>
      </div>

      {!loggedInImporter.verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-sm text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            حساب <strong>{loggedInImporter.name}</strong> حالياً في حالة{' '}
            <strong>«{loggedInImporter.codingStatus || 'بانتظار التكويد والاعتماد'}»</strong>.
            {loggedInImporter.codingReviewNote
              ? ` ملاحظة الإدارة: ${loggedInImporter.codingReviewNote} — `
              : ' '}
            يمكنك تجهيز المنتجات وستخضع لمراجعة التكويد واعتماد الإدارة العليا قبل النشر في سوق الجملة.
          </span>
        </div>
      )}

      {/* 1. Live Price & Stock Manager Table */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#2A1A11]">
            جدول إدارة الأسعار والمخزون المباشر ({visibleLots.length} منتج)
          </h2>
          <span className="text-xs text-[#4E342E]">
            عدّل السعر الأساسي (ج.م) أو الكمية ثم اضغط «تحديث فوري»
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                <th className="py-3 px-4">المنتج والمورد</th>
                <th className="py-3 px-4">المواصفات وشرط التسليم</th>
                <th className="py-3 px-4">اعتماد النشر والجودة</th>
                <th className="py-3 px-4">السعر الأساسي (ج.م/كجم)</th>
                <th className="py-3 px-4">المتاح (طن)</th>
                <th className="py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
              {visibleLots.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#4E342E]">
                    لا توجد منتجات مضافة لهذا الحساب حتى الآن. اضغط على «إضافة منتج بن أخضر جديد» لإرسال أول منتج للمراجعة.
                  </td>
                </tr>
              )}
              {visibleLots.map((lot) => {
                const draft = getDraft(lot);
                const isModified =
                  draft.price !== lot.pricePerKgEgp || draft.tons !== lot.availableTons;

                return (
                  <tr key={lot.id} className="hover:bg-[#FBF9F6]/60">
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
                          <p className="text-xs text-[#4E342E] mt-0.5 truncate">
                            {lot.lotCode} · {lot.warehouseLocation}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4E342E] whitespace-nowrap">
                      <span>
                        {lot.origin} · {lot.species} · {lot.incoterm.split(' ')[0]}
                      </span>
                      <div className="font-mono tabular-nums mt-0.5">
                        SCA {lot.scaScore} · سكرين {lot.screen} · رطوبة {lot.moisturePct}%
                      </div>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <div>
                        {lot.approvalStatus === 'معتمد' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E7E34]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>منشور بالسوق</span>
                          </span>
                        ) : lot.approvalStatus === 'بانتظار الاعتماد' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>بانتظار الاعتماد</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>مرفوض / مطلوب تعديل</span>
                            </span>
                            {lot.rejectionNote && (
                              <p className="text-[11px] text-rose-700 max-w-[200px] leading-snug">
                                ملاحظة الإدارة: {lot.rejectionNote}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => onResubmitLot(lot.id)}
                              className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded cursor-pointer"
                            >
                              إعادة إرسال للاعتماد
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        {lot.qualitySealed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E7E34]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>شارة الجودة مفعّلة</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#4E342E]/70">بدون شارة فحص</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={draft.price}
                        onChange={(e) =>
                          handleDraftChange(lot, 'price', Number(e.target.value) || 0)
                        }
                        aria-label={`سعر الكيلو للمنتج ${lot.title}`}
                        className="w-28 px-2.5 py-1.5 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-md focus:outline-none focus:border-[#C89B3C]"
                      />
                      {currency !== 'EGP' && (
                        <div className="text-[11px] font-mono text-[#4E342E]/75 mt-0.5">
                          {formatMoney(draft.price, currency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={draft.tons}
                        onChange={(e) =>
                          handleDraftChange(lot, 'tons', Number(e.target.value) || 0)
                        }
                        aria-label={`الكمية المتاحة للمنتج ${lot.title}`}
                        className="w-24 px-2.5 py-1.5 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-md focus:outline-none focus:border-[#C89B3C]"
                      />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveInline(lot)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            isModified
                              ? 'bg-[#C89B3C] text-[#2A1A11] hover:bg-[#b58a30]'
                              : 'bg-[#2A1A11] text-white hover:bg-[#4E342E]'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>تحديث فوري</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryLot(lot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#4E342E] hover:text-[#2A1A11] bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>سجل الأسعار ({lot.priceHistory.length})</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Incoming RFQs & Samples Inbox (No Commission Column) */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#2A1A11]">
              صندوق طلبات العينات وعروض الأسعار الواردة ({visibleRfqs.length})
            </h2>
            <p className="text-xs text-[#4E342E] mt-0.5">
              تُكشف بيانات المحمصة الكاملة تلقائياً عند الوصول لحالة «تم الاتفاق / جاري التنفيذ» أو «مكتملة».
            </p>
          </div>
        </div>

        {visibleRfqs.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#4E342E]">
            لا توجد طلبات واردة لهذا المورد حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#2A1A11]/10 text-xs font-semibold text-[#4E342E]">
                  <th className="py-3 px-4">الطلب والتاريخ</th>
                  <th className="py-3 px-4">هوية المحمصة / الوجهة</th>
                  <th className="py-3 px-4">المنتج والكمية</th>
                  <th className="py-3 px-4">تسعير العرض (ج.م/كجم)</th>
                  <th className="py-3 px-4">إجمالي قيمة التوريد ({currency})</th>
                  <th className="py-3 px-4">الحالة والإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A1A11]/10 text-sm">
                {visibleRfqs.map((rfq) => {
                  const currentQuote =
                    quoteDrafts[rfq.id] ?? rfq.quotedPricePerKgEgp ?? rfq.initialPricePerKgEgp;
                  const dealTons = rfq.requestedTons || 0;
                  const estimatedTotal = dealTons * 1000 * currentQuote;
                  const dealConfirmed = isDealConfirmedStatus(rfq.status);
                  const maskedRoaster = getMaskedRoasterLabel(
                    rfq.roasterName,
                    partners,
                    rfq.roasterAnonCode
                  );
                  const roasterPartner = partners.find(
                    (p) => p.name === rfq.roasterName && p.type === 'roaster'
                  );

                  return (
                    <tr key={rfq.id} className="hover:bg-[#FBF9F6]/60">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono tabular-nums text-xs font-bold text-[#2A1A11]">
                          {rfq.id}
                        </span>
                        <div className="text-[11px] font-mono text-[#4E342E]/75 mt-0.5">
                          {rfq.createdAt}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {dealConfirmed ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#1E7E34]">
                              {rfq.roasterName} ({roasterPartner?.phone || 'معتمد'})
                            </p>
                            <p className="text-xs text-[#4E342E]">
                              التسليم: {rfq.targetGovernorate} · {rfq.notes}
                            </p>
                            <p className="text-[11px] font-semibold text-[#1E7E34]">
                              ✔ بيانات الطرفين مكتملة لإتمام التسليم
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-[#2A1A11] flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-[#C89B3C]" />
                              <span>{maskedRoaster}</span>
                            </p>
                            <p className="text-xs text-[#4E342E] mt-0.5">
                              الوجهة: {rfq.targetGovernorate} · {rfq.notes}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-semibold text-[#2A1A11]">{rfq.lotTitle}</p>
                        <p className="text-xs font-mono tabular-nums text-[#4E342E] mt-0.5">
                          {rfq.type === 'sample'
                            ? `عينة ${rfq.sampleWeightGrams} جم`
                            : `كمية ${formatNumber(dealTons, 1)} طن`}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {dealConfirmed || rfq.status === 'مرفوض' ? (
                          <span className="font-mono tabular-nums font-bold text-[#2A1A11]">
                            {rfq.quotedPricePerKgEgp
                              ? formatMoney(rfq.quotedPricePerKgEgp, currency)
                              : '—'}
                          </span>
                        ) : (
                          <div>
                            <input
                              type="number"
                              min={1}
                              value={currentQuote}
                              onChange={(e) =>
                                setQuoteDrafts((prev) => ({
                                  ...prev,
                                  [rfq.id]: Number(e.target.value) || 0,
                                }))
                              }
                              aria-label={`عرض السعر للطلب ${rfq.id}`}
                              className="w-24 px-2.5 py-1.5 text-sm font-mono tabular-nums bg-[#FBF9F6] border border-[#2A1A11]/20 rounded-md focus:outline-none focus:border-[#C89B3C]"
                            />
                            {currency !== 'EGP' && (
                              <div className="text-[11px] font-mono text-[#4E342E]/75 mt-0.5">
                                {formatMoney(currentQuote, currency)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-xs text-[#2A1A11] whitespace-nowrap">
                        {rfq.type === 'bulk_rfq' ? formatMoney(estimatedTotal, currency) : 'عينة فحص'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-2">
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

                          <button
                            type="button"
                            onClick={() => onOpenChat(rfq.id, 'importer')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2A1A11] bg-[#FBF9F6] hover:bg-[#F3EDE4] border border-[#2A1A11]/20 rounded-md cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#C89B3C]" />
                            <span>محادثة تفاوض ({rfq.messages.length})</span>
                          </button>

                          {dealConfirmed && (
                            <button
                              type="button"
                              onClick={() => onOpenInvoice(rfq)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#FBF9F6] text-[#2A1A11] border border-[#2A1A11]/20 rounded-md hover:bg-[#F3EDE4] cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#C89B3C]" />
                              <span>الفاتورة</span>
                            </button>
                          )}

                          {rfq.status === 'بانتظار التسعير' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRfqAction(rfq.id, 'تم إرسال العرض', currentQuote)
                              }
                              className="px-2.5 py-1 text-xs font-semibold bg-[#2A1A11] text-white rounded-md hover:bg-[#4E342E] cursor-pointer"
                            >
                              إرسال العرض
                            </button>
                          )}

                          {rfq.status === 'تم إرسال العرض' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRfqAction(
                                  rfq.id,
                                  'تم الاتفاق / جاري التنفيذ',
                                  currentQuote
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#1E7E34] text-white rounded-md hover:bg-[#176429] cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تأكيد الاتفاق وكشف البيانات</span>
                            </button>
                          )}

                          {rfq.status === 'تم الاتفاق / جاري التنفيذ' && (
                            <button
                              type="button"
                              onClick={() => handleRfqAction(rfq.id, 'مكتملة', currentQuote)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#2A1A11] text-white rounded-md hover:bg-[#4E342E] cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#C89B3C]" />
                              <span>إغلاق كمكتملة</span>
                            </button>
                          )}

                          {(rfq.status === 'بانتظار التسعير' ||
                            rfq.status === 'تم إرسال العرض') && (
                            <button
                              type="button"
                              onClick={() => handleRfqAction(rfq.id, 'مرفوض', currentQuote)}
                              className="px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
                            >
                              رفض
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Price History Modal */}
      {historyLot && (
        <div
          className="fixed inset-0 z-50 bg-[#2A1A11]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#2A1A11]/15 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#2A1A11]/10 flex items-center justify-between bg-[#FBF9F6]">
              <div>
                <h3 className="text-base font-bold text-[#2A1A11]">سجل تغيرات السعر والمخزون</h3>
                <p className="text-xs text-[#4E342E] mt-0.5">{historyLot.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryLot(null)}
                className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
              {historyLot.priceHistory.length === 0 ? (
                <p className="text-sm text-[#4E342E] text-center py-6">
                  لم يتم تسجيل أي تعديلات سعرية على هذا المنتج حتى الآن.
                </p>
              ) : (
                historyLot.priceHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-lg bg-[#FBF9F6] border border-[#2A1A11]/10 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[#4E342E]">
                      <span>{entry.timestamp}</span>
                      <span className="font-bold text-[#2A1A11]">
                        {formatMoney(entry.oldPrice, currency)} ←{' '}
                        {formatMoney(entry.newPrice, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#4E342E]">
                      <span>{entry.note}</span>
                      <span className="font-mono tabular-nums">
                        الرصيد: {entry.oldTons} ← {entry.newTons} طن
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Lot Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-[#2A1A11]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#2A1A11]/15 rounded-2xl w-full max-w-xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#2A1A11]/10 flex items-center justify-between bg-[#FBF9F6]">
              <h3 className="text-base font-bold text-[#2A1A11]">إضافة منتج بن أخضر جديد للبورصة</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    اسم المنتج والمواصفة
                  </span>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: غواتيمالا أنتيغوا بركاني SHB EP"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <div className="sm:col-span-2 bg-[#FBF9F6] border border-[#2A1A11]/12 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#4E342E]">
                    الحساب الناشر: <strong className="text-[#2A1A11]">{loggedInImporter.name}</strong>
                  </span>
                  <span className="font-semibold text-amber-700">
                    الحالة الأولية عند الإرسال: بانتظار الاعتماد من الإدارة العليا
                  </span>
                </div>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    بلد المنشأ
                  </span>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value as CoffeeOrigin)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  >
                    {ORIGINS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">الفصيلة</span>
                  <select
                    value={newSpecies}
                    onChange={(e) => setNewSpecies(e.target.value as CoffeeSpecies)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  >
                    {SPECIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    شرط التسليم الدولي (Incoterm)
                  </span>
                  <select
                    value={newIncoterm}
                    onChange={(e) => setNewIncoterm(e.target.value as Incoterm)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  >
                    {INCOTERMS.map((inc) => (
                      <option key={inc} value={inc}>
                        {inc}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    طريقة المعالجة
                  </span>
                  <input
                    type="text"
                    required
                    value={newProcess}
                    onChange={(e) => setNewProcess(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    مقاس السكرين (Screen)
                  </span>
                  <input
                    type="text"
                    required
                    value={newScreen}
                    onChange={(e) => setNewScreen(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    نسبة الرطوبة (%)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="8"
                    max="15"
                    required
                    value={newMoisture}
                    onChange={(e) => setNewMoisture(Number(e.target.value) || 11)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    تقييم التذوق (SCA)
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="75"
                    max="95"
                    required
                    value={newScaScore}
                    onChange={(e) => setNewScaScore(Number(e.target.value) || 82)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    وزن الشوال (كجم)
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="30"
                    max="70"
                    required
                    value={newBagWeight}
                    onChange={(e) => setNewBagWeight(Number(e.target.value) || 60)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    موسم المحصول
                  </span>
                  <input
                    type="text"
                    required
                    value={newCropYear}
                    onChange={(e) => setNewCropYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    الكمية المتاحة (طن)
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={newTons}
                    onChange={(e) => setNewTons(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    السعر الأساسي للكيلو (ج.م)
                  </span>
                  <input
                    type="number"
                    min="50"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value) || 300)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    المدينة / الميناء (يظهر بسوق الجملة)
                  </span>
                  <input
                    type="text"
                    required
                    value={newWarehouseGov}
                    onChange={(e) => setNewWarehouseGov(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                    عنوان المخزن أو الرصيف اللوجستي الكامل (يُكشف بعد الاتفاق)
                  </span>
                  <input
                    type="text"
                    required
                    value={newWarehouse}
                    onChange={(e) => setNewWarehouse(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#2A1A11]/20 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                {/* White-Background Image / Video Uploader (Zero Importer Name) */}
                <div className="sm:col-span-2 bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="block text-xs font-bold text-[#2A1A11]">
                        إرفاق صورة أو فيديو للمنتج (على خلفية بيضاء نقية بدون اسم المستورد)
                      </span>
                      <span className="block text-[11px] text-[#4E342E] mt-0.5">
                        يُعرض المنتج في السوق على خلفية بيضاء موحدة مع إخفاء هوية وشعار المستورد تماماً.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>رفع صورة أو فيديو</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaFileChange}
                          className="hidden"
                        />
                      </label>
                      {(newVideoUrl || newImageUrl !== ASSETS.greenCoffeeLot) && (
                        <button
                          type="button"
                          onClick={handleResetMedia}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>استعادة الافتراضي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pure White Studio Preview Frame */}
                  <div className="bg-white border border-[#2A1A11]/15 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-48 h-32 bg-white border border-[#2A1A11]/10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {newMediaType === 'video' && newVideoUrl ? (
                        <video
                          src={newVideoUrl}
                          controls
                          muted
                          playsInline
                          className="w-full h-full object-contain bg-white"
                        />
                      ) : (
                        <img
                          src={newImageUrl}
                          alt="معاينة المنتج على خلفية بيضاء"
                          className="w-full h-full object-contain bg-white"
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <div className="inline-flex items-center gap-1.5 font-bold text-[#1E7E34]">
                        {newMediaType === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                        <span>
                          {newMediaType === 'video'
                            ? 'فيديو منتج على خلفية بيضاء'
                            : 'صورة منتج على خلفية بيضاء (#FFFFFF)'}
                        </span>
                      </div>
                      <p className="text-[#4E342E] font-mono text-[11px] truncate">
                        الملف: {newMediaLabel}
                      </p>
                      <p className="text-[#4E342E]/80 text-[11px] leading-relaxed">
                        يتم إزالة أي نصوص أو بيانات تعريفية تلقائياً من بطاقة العرض؛ وتظهر الصورة/الفيديو بحواف بيضاء نظيفة بدون اسم المستورد.
                      </p>
                    </div>
                  </div>

                  {mediaNotice && (
                    <div className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {mediaNotice}
                    </div>
                  )}

                  <label className="flex items-start gap-2 text-xs text-[#2A1A11] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mediaIdentityConfirmed}
                      onChange={(e) => {
                        setMediaIdentityConfirmed(e.target.checked);
                        if (e.target.checked) setMediaNotice(null);
                      }}
                      className="w-4 h-4 mt-0.5 accent-[#1E7E34] rounded cursor-pointer"
                    />
                    <span>
                      أقر بأن الصورة أو الفيديو المرفق معروض على خلفية بيضاء وخالٍ تماماً من اسم المستورد أو شعاره أو أي بيانات تواصل.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A1A11]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#4E342E] hover:text-[#2A1A11] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
                >
                  نشر المنتج في البورصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
