import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  Search,
  UserCheck,
  LogOut,
  Building2,
  MapPin,
  ArrowRight,
  ChevronLeft,
  Coffee,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import {
  CartItem,
  ConsumerProfile,
  CurrencyCode,
  GrindType,
  PartnerAccount,
  RetailProduct,
  RetailWeight,
  RoastLevel,
  SpiceOption,
} from '../types';
import { ASSETS } from '../data/seedData';
import { SafeImage } from './SafeImage';
import { calculateRetailUnitPrice, formatMoney } from '../utils/formatters';

interface B2CStoreAndRoasterProps {
  products: RetailProduct[];
  partners: PartnerAccount[];
  currency: CurrencyCode;
  consumerProfile: ConsumerProfile | null;
  onSaveConsumerProfile: (profile: ConsumerProfile) => void;
  onLogoutConsumer: () => void;
  onAddToCart: (item: CartItem) => void;
}

const FAVORITE_STORES_KEY = 'bunntech_favorite_stores_v1';

function loadFavoriteStoreIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_STORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

const CATEGORIES: ('الكل' | RetailProduct['category'])[] = [
  'الكل',
  'تركي وتقليدي',
  'إسبريسو',
  'فلتر ومختصة',
];

const WEIGHTS: { value: RetailWeight; label: string }[] = [
  { value: '250g', label: '250 جم' },
  { value: '500g', label: '500 جم' },
  { value: '1kg', label: '1 كجم' },
];

const ROAST_LEVELS: RoastLevel[] = ['فاتح', 'وسط', 'غامق'];
const GRIND_TYPES: GrindType[] = ['تركي', 'إسبريسو', 'فلتر', 'حبوب كاملة'];
const SPICE_OPTIONS: SpiceOption[] = ['سادة', 'محوج حبهان'];

interface ProductSelection {
  weight: RetailWeight;
  roastLevel: RoastLevel;
  grindType: GrindType;
  spiceOption: SpiceOption;
}

interface BrandSummary {
  roasterId: string;
  roasterName: string;
  country: string;
  governorate: string;
  verified: boolean;
  primaryActivity: string;
  productCount: number;
  inStockCount: number;
  sealedCount: number;
  minPriceEgp: number;
  categories: RetailProduct['category'][];
  coverImage: string;
}

export const B2CStoreAndRoaster: React.FC<B2CStoreAndRoasterProps> = ({
  products,
  partners,
  currency,
  consumerProfile,
  onSaveConsumerProfile,
  onLogoutConsumer,
  onAddToCart,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [brandViewMode, setBrandViewMode] = useState<'all' | 'favorites'>('all');
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<string[]>(loadFavoriteStoreIds);
  const [selectedCategory, setSelectedCategory] = useState<'الكل' | RetailProduct['category']>('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_STORES_KEY, JSON.stringify(favoriteStoreIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteStoreIds]);

  const toggleFavoriteStore = (roasterId: string) => {
    setFavoriteStoreIds((prev) =>
      prev.includes(roasterId)
        ? prev.filter((id) => id !== roasterId)
        : [roasterId, ...prev]
    );
  };

  // Optional Consumer Quick Login / Guest Toggle
  const [showConsumerAuthForm, setShowConsumerAuthForm] = useState(false);
  const [cName, setCName] = useState(consumerProfile?.name || '');
  const [cPhone, setCPhone] = useState(consumerProfile?.phone || '');
  const [cEmail, setCEmail] = useState(consumerProfile?.email || '');
  const [cCountry, setCCountry] = useState(consumerProfile?.country || 'مصر');
  const [cGov, setCGov] = useState(consumerProfile?.governorate || 'القاهرة');
  const [cAddress, setCAddress] = useState(consumerProfile?.address || '');

  // Per-product configuration selections
  const [selections, setSelections] = useState<Record<string, ProductSelection>>({});

  // Build Brands / Companies directory grouped from retail products + partner metadata
  const brands = useMemo<BrandSummary[]>(() => {
    const map = new Map<string, RetailProduct[]>();
    products.forEach((prod) => {
      const existing = map.get(prod.roasterId) || [];
      existing.push(prod);
      map.set(prod.roasterId, existing);
    });

    const list: BrandSummary[] = [];
    map.forEach((brandProducts, roasterId) => {
      const partner = partners.find((p) => p.id === roasterId);
      const firstProd = brandProducts[0];
      const categories = Array.from(new Set(brandProducts.map((p) => p.category)));
      const minPriceEgp = Math.min(...brandProducts.map((p) => p.basePrice250gEgp));
      list.push({
        roasterId,
        roasterName: partner?.name || firstProd.roasterName,
        country: partner?.country || 'مصر',
        governorate: partner?.governorate || 'القاهرة',
        verified: Boolean(partner?.verified),
        primaryActivity:
          partner?.primaryActivity ||
          `توليفات ${categories.join(' · ')} المحمصة طازجاً`,
        productCount: brandProducts.length,
        inStockCount: brandProducts.filter((p) => p.inStock).length,
        sealedCount: brandProducts.filter((p) => p.qualitySealed).length,
        minPriceEgp,
        categories,
        coverImage: firstProd.imageUrl || ASSETS.espressoBlend,
      });
    });

    return list;
  }, [products, partners]);

  const favoriteBrands = useMemo(
    () =>
      favoriteStoreIds
        .map((id) => brands.find((b) => b.roasterId === id))
        .filter((b): b is BrandSummary => Boolean(b)),
    [brands, favoriteStoreIds]
  );

  const filteredBrands = useMemo(() => {
    const q = brandSearchQuery.trim().toLowerCase();
    return brands.filter((b) => {
      if (brandViewMode === 'favorites' && !favoriteStoreIds.includes(b.roasterId)) {
        return false;
      }
      if (!q) return true;
      return `${b.roasterName} ${b.country} ${b.governorate} ${b.primaryActivity} ${b.categories.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [brands, brandSearchQuery, brandViewMode, favoriteStoreIds]);

  const selectedBrand = useMemo(
    () => brands.find((b) => b.roasterId === selectedBrandId) || null,
    [brands, selectedBrandId]
  );

  const brandProducts = useMemo(() => {
    if (!selectedBrandId) return [];
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (p.roasterId !== selectedBrandId) return false;
      if (selectedCategory !== 'الكل' && p.category !== selectedCategory) return false;
      if (q) {
        const hay = `${p.name} ${p.originLabel} ${p.tastingNotes} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, selectedBrandId, selectedCategory, searchQuery]);

  const handleSelectBrand = (roasterId: string) => {
    setSelectedBrandId(roasterId);
    setSelectedCategory('الكل');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToBrands = () => {
    setSelectedBrandId(null);
    setSelectedCategory('الكل');
    setSearchQuery('');
  };

  const getSelection = (prod: RetailProduct): ProductSelection => {
    if (selections[prod.id]) return selections[prod.id];
    return {
      weight: '250g',
      roastLevel: prod.category === 'فلتر ومختصة' ? 'فاتح' : 'وسط',
      grindType:
        prod.category === 'تركي وتقليدي'
          ? 'تركي'
          : prod.category === 'إسبريسو'
          ? 'إسبريسو'
          : 'فلتر',
      spiceOption: 'سادة',
    };
  };

  const updateSelection = (
    prod: RetailProduct,
    patch: Partial<ProductSelection>
  ) => {
    const current = getSelection(prod);
    setSelections((prev) => ({
      ...prev,
      [prod.id]: { ...current, ...patch },
    }));
  };

  const handleAddClick = (prod: RetailProduct) => {
    if (!prod.inStock) return;
    const sel = getSelection(prod);
    const unitPrice = calculateRetailUnitPrice(
      prod.basePrice250gEgp,
      sel.weight,
      sel.spiceOption
    );
    onAddToCart({
      cartItemId: `${prod.id}-${sel.weight}-${sel.roastLevel}-${sel.grindType}-${sel.spiceOption}`,
      productId: prod.id,
      productName: prod.name,
      roasterName: prod.roasterName,
      imageUrl: prod.imageUrl,
      weight: sel.weight,
      roastLevel: sel.roastLevel,
      grindType: sel.grindType,
      spiceOption: sel.spiceOption,
      unitPriceEgp: unitPrice,
      quantity: 1,
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Consumer Storefront Header */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2A1A11]">
            {selectedBrand
              ? `متجر ${selectedBrand.roasterName}`
              : 'متجر بُنّ تك للقهوة المحمصة الطازجة'}
          </h1>
          <p className="text-sm text-[#4E342E] mt-0.5">
            {selectedBrand
              ? `تصفح جميع منتجات وخلطات ${selectedBrand.roasterName} — اختر الوزن ودرجة التحميص والطحنة المناسبة لك.`
              : 'اختر البراند أو المحمصة أولاً لاستعراض المنتجات المعروضة من الشركة والشراء مباشرة.'}
          </p>
        </div>

        {selectedBrand && (
          <button
            type="button"
            onClick={handleBackToBrands}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <ArrowRight className="w-4 h-4 text-[#C89B3C]" />
            <span>العودة إلى قائمة الشركات والبراندات</span>
          </button>
        )}
      </div>

      {/* Optional Simple Consumer Login / Guest Checkout Strip */}
      <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-4 sm:px-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#4E342E]">
            <UserCheck className="w-4 h-4 text-[#C89B3C] shrink-0" />
            {consumerProfile ? (
              <span>
                مسجّل كـ{' '}
                <strong className="text-[#2A1A11]">{consumerProfile.name}</strong> (
                <span className="font-mono">{consumerProfile.phone}</span> ·{' '}
                {consumerProfile.country} — {consumerProfile.governorate}) — سيتم تعبئة بيانات
                الشحن تلقائياً عند إتمام الطلب.
              </span>
            ) : (
              <span>
                تتسوق الآن بوضع <strong className="text-[#2A1A11]">الضيف السريع</strong> — يمكنك
                الطلب مباشرة أو حفظ بياناتك لتسهيل الشراء.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (consumerProfile) {
                  setCName(consumerProfile.name);
                  setCPhone(consumerProfile.phone);
                  setCEmail(consumerProfile.email || '');
                  setCCountry(consumerProfile.country);
                  setCGov(consumerProfile.governorate);
                  setCAddress(consumerProfile.address);
                }
                setShowConsumerAuthForm((prev) => !prev);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#2A1A11] bg-[#FBF9F6] hover:bg-[#F3EDE4] border border-[#2A1A11]/15 rounded-lg cursor-pointer whitespace-nowrap"
            >
              {consumerProfile
                ? showConsumerAuthForm
                  ? 'إغلاق التعديل'
                  : 'تعديل بياناتي'
                : showConsumerAuthForm
                ? 'متابعة كضيف'
                : 'تسجيل دخول / حفظ بياناتي'}
            </button>
            {consumerProfile && (
              <button
                type="button"
                onClick={() => {
                  onLogoutConsumer();
                  setShowConsumerAuthForm(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>العودة كضيف</span>
              </button>
            )}
          </div>
        </div>

        {showConsumerAuthForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!cName.trim() || !cPhone.trim() || !cAddress.trim()) return;
              onSaveConsumerProfile({
                name: cName.trim(),
                phone: cPhone.trim(),
                email: cEmail.trim() || undefined,
                country: cCountry.trim() || 'مصر',
                governorate: cGov.trim() || 'القاهرة',
                address: cAddress.trim(),
              });
              setShowConsumerAuthForm(false);
            }}
            className="pt-4 border-t border-[#2A1A11]/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <input
              type="text"
              required
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="الاسم الكامل *"
              className="px-3 py-2 text-xs bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
            />
            <input
              type="tel"
              required
              value={cPhone}
              onChange={(e) => setCPhone(e.target.value)}
              placeholder="رقم الهاتف / واتساب *"
              className="px-3 py-2 text-xs font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
            />
            <input
              type="email"
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="البريد الإلكتروني (اختياري)"
              className="px-3 py-2 text-xs font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
            />
            <input
              type="text"
              required
              value={cCountry}
              onChange={(e) => setCCountry(e.target.value)}
              placeholder="الدولة (مثال: مصر)"
              className="px-3 py-2 text-xs bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
            />
            <input
              type="text"
              required
              value={cGov}
              onChange={(e) => setCGov(e.target.value)}
              placeholder="المحافظة (مثال: القاهرة)"
              className="px-3 py-2 text-xs bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
            />
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={cAddress}
                onChange={(e) => setCAddress(e.target.value)}
                placeholder="العنوان بالتفصيل *"
                className="flex-1 px-3 py-2 text-xs bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer whitespace-nowrap"
              >
                حفظ
              </button>
            </div>
          </form>
        )}
      </div>

      {!selectedBrand ? (
        /* STEP 1: BRANDS / COMPANIES DIRECTORY */
        <>
          {/* Storefront Campaign Banner */}
          <div className="bg-gradient-to-l from-[#1C110B] via-[#2B160E] to-[#3B1E12] text-[#FBF9F6] border border-[#D46A3E]/30 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-[0_18px_40px_-20px_rgba(28,17,11,0.4)]">
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-3">
              <span className="text-xs font-bold text-[#F2C864]">
                دليل البراندات والمحامص المعتمدة · شحن دولي مجاني للطلبات فوق{' '}
                {formatMoney(1000, currency)}
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-snug">
                تسوّق مباشرة من براندات ومحامص القهوة المعتمدة على منصة بُنّ تك
              </h2>
              <p className="text-sm text-[#FBF9F6]/80 max-w-xl leading-relaxed">
                اضغط على اسم الشركة أو البراند للدخول إلى واجهة منتجاتها الخاصة واختيار الوزن
                ودرجة التحميص والطحن على ذوقك.
              </p>
            </div>
            <div className="lg:col-span-5 min-h-[200px] lg:min-h-[240px] relative">
              <SafeImage
                src={ASSETS.espressoBlend}
                alt="براندات القهوة المحمصة في منصة بُنّ تك"
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="hidden lg:block absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1C110B] to-transparent pointer-events-none"
              />
            </div>
          </div>

          {/* Favorite Stores Quick-Access Panel */}
          {favoriteBrands.length > 0 && (
            <section
              aria-label="قائمة المتاجر المفضلة للوصول السريع"
              className="bg-white border border-rose-200/80 rounded-xl p-4 sm:p-5 space-y-3 shadow-[0_8px_24px_-16px_rgba(180,83,42,0.2)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-[#2A1A11]">
                      المتاجر المفضلة — وصول سريع ({favoriteBrands.length})
                    </h2>
                    <p className="text-xs text-[#4E342E]">
                      اضغط على أي شركة للدخول مباشرة إلى منتجاتها المحفوظة
                    </p>
                  </div>
                </div>
                {brandViewMode !== 'favorites' && (
                  <button
                    type="button"
                    onClick={() => setBrandViewMode('favorites')}
                    className="text-xs font-bold text-rose-700 hover:text-rose-800 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    عرض المفضلة فقط
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteBrands.map((favBrand) => (
                  <div
                    key={favBrand.roasterId}
                    onClick={() => handleSelectBrand(favBrand.roasterId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectBrand(favBrand.roasterId);
                      }
                    }}
                    className="group flex items-center justify-between gap-3 p-3 bg-[#FBF9F6] hover:bg-[#F3EDE4] border border-[#2A1A11]/12 hover:border-[#C89B3C] rounded-xl transition-all cursor-pointer text-right"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#1C110B] shrink-0 border border-[#2A1A11]/10">
                        <SafeImage
                          src={favBrand.coverImage}
                          alt={favBrand.roasterName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#2A1A11] truncate group-hover:text-[#B4532A] transition-colors">
                          {favBrand.roasterName}
                        </p>
                        <p className="text-[11px] text-[#4E342E] truncate">
                          {favBrand.governorate} · {favBrand.productCount} منتجات
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteStore(favBrand.roasterId);
                        }}
                        aria-label={`إزالة ${favBrand.roasterName} من المتاجر المفضلة`}
                        title="إزالة من المفضلة"
                        className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-rose-600" />
                      </button>
                      <ChevronLeft className="w-4 h-4 text-[#4E342E]/70 group-hover:text-[#2A1A11]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Brand Directory Search & Header */}
          <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#C89B3C] shrink-0" />
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#2A1A11]">
                  {brandViewMode === 'favorites'
                    ? `المتاجر المفضلة (${filteredBrands.length})`
                    : `الشركات والبراندات المشاركة (${filteredBrands.length})`}
                </h2>
                <p className="text-xs text-[#4E342E]">
                  اضغط على أي شركة لعرض منتجاتها أو على القلب لحفظها في المفضلة
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 lg:justify-end">
              <div className="inline-flex items-center gap-1 bg-[#FBF9F6] p-1 rounded-lg border border-[#2A1A11]/12 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBrandViewMode('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    brandViewMode === 'all'
                      ? 'bg-[#2A1A11] text-white'
                      : 'text-[#4E342E] hover:text-[#2A1A11]'
                  }`}
                >
                  جميع المتاجر ({brands.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBrandViewMode('favorites')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    brandViewMode === 'favorites'
                      ? 'bg-rose-600 text-white'
                      : 'text-[#4E342E] hover:text-rose-700'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      brandViewMode === 'favorites' ? 'fill-white text-white' : 'text-rose-600'
                    }`}
                  />
                  <span>المفضلة ({favoriteBrands.length})</span>
                </button>
              </div>

              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-[#4E342E]/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  placeholder="ابحث باسم البراند، الشركة، أو المدينة..."
                  className="w-full pr-9 pl-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                />
              </div>
            </div>
          </div>

          {/* Brands / Companies Cards Grid */}
          {filteredBrands.length === 0 ? (
            <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-12 text-center space-y-3">
              {brandViewMode === 'favorites' && favoriteBrands.length === 0 ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                  <p className="text-base font-bold text-[#2A1A11]">
                    قائمة المتاجر المفضلة فارغة حالياً
                  </p>
                  <p className="text-xs sm:text-sm text-[#4E342E] max-w-md mx-auto">
                    اضغط على أيقونة القلب بجانب اسم أي شركة أو براند لحفظه هنا للوصول السريع لاحقاً.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBrandViewMode('all')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#2A1A11] rounded-lg cursor-pointer"
                  >
                    تصفح جميع المتاجر
                  </button>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-[#2A1A11]">
                    لا توجد شركات أو براندات مطابقة لبحثك
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandSearchQuery('');
                      setBrandViewMode('all');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#2A1A11] rounded-lg cursor-pointer"
                  >
                    عرض جميع الشركات
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBrands.map((brand) => {
                const isFavorite = favoriteStoreIds.includes(brand.roasterId);
                return (
                <article
                  key={brand.roasterId}
                  onClick={() => handleSelectBrand(brand.roasterId)}
                  className="group bg-white border border-[#2A1A11]/12 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#C89B3C]/65 hover:shadow-[0_18px_38px_-16px_rgba(28,17,11,0.18)] cursor-pointer"
                >
                  <div>
                    <div className="relative aspect-[16/9] bg-[#1C110B] overflow-hidden">
                      <SafeImage
                        src={brand.coverImage}
                        alt={brand.roasterName}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#1C110B] via-[#1C110B]/35 to-transparent"
                      />
                      <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5">
                        {brand.verified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#1E7E34]/95 rounded-md shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>براند معتمد</span>
                          </span>
                        )}
                        {brand.sealedCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#1C110B] bg-[#F2C864] rounded-md shadow-xs">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>جودة مفحوصة</span>
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-black text-white leading-snug truncate">
                            {brand.roasterName}
                          </h3>
                          <p className="text-xs text-[#F2C864] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {brand.country} — {brand.governorate}
                            </span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteStore(brand.roasterId);
                          }}
                          aria-pressed={isFavorite}
                          aria-label={
                            isFavorite
                              ? `إزالة ${brand.roasterName} من المتاجر المفضلة`
                              : `حفظ ${brand.roasterName} في المتاجر المفضلة`
                          }
                          title={isFavorite ? 'محفوظ في المتاجر المفضلة' : 'إضافة إلى المتاجر المفضلة'}
                          className={`p-2 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                            isFavorite
                              ? 'bg-white text-rose-600 border-rose-200 shadow-sm'
                              : 'bg-[#1C110B]/70 text-white/90 border-white/25 hover:bg-white hover:text-rose-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs sm:text-sm text-[#4E342E] leading-relaxed">
                        {brand.primaryActivity}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {brand.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#2A1A11] bg-[#FBF9F6] border border-[#2A1A11]/12 rounded-md"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-[#2A1A11]/10 bg-[#FBF9F6]/75 flex items-center justify-between gap-3">
                    <div className="text-xs space-y-0.5">
                      <span className="block font-bold text-[#2A1A11]">
                        {brand.productCount} منتجات معروضة
                      </span>
                      <span className="block text-[#4E342E]/80 font-mono tabular-nums">
                        تبدأ من {formatMoney(brand.minPriceEgp, currency)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBrand(brand.roasterId);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2A1A11] group-hover:bg-[#B4532A] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Coffee className="w-4 h-4 text-[#F2C864]" />
                      <span>عرض المنتجات</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* STEP 2: SELECTED BRAND'S PRODUCTS STOREFRONT */
        <>
          {/* Selected Brand Hero Card */}
          <div className="bg-gradient-to-l from-[#1C110B] via-[#2B160E] to-[#14251B] text-[#FBF9F6] border border-[#C89B3C]/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_18px_40px_-20px_rgba(28,17,11,0.4)]">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#F2C864] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>الصفحة الرسمية للشركة</span>
                </span>
                {selectedBrand.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-[#D9F9E3] bg-[#1E7E34]/40 border border-[#1E7E34] rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>معتمد ومفعّل</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {selectedBrand.roasterName}
                </h2>
                <button
                  type="button"
                  onClick={() => toggleFavoriteStore(selectedBrand.roasterId)}
                  aria-pressed={favoriteStoreIds.includes(selectedBrand.roasterId)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                    favoriteStoreIds.includes(selectedBrand.roasterId)
                      ? 'bg-white text-rose-600 border-rose-200'
                      : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favoriteStoreIds.includes(selectedBrand.roasterId)
                        ? 'fill-rose-600 text-rose-600'
                        : ''
                    }`}
                  />
                  <span>
                    {favoriteStoreIds.includes(selectedBrand.roasterId)
                      ? 'في المفضلة'
                      : 'حفظ في المفضلة'}
                  </span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#FBF9F6]/80 max-w-2xl leading-relaxed">
                {selectedBrand.primaryActivity} · {selectedBrand.country} —{' '}
                {selectedBrand.governorate}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-center min-w-[110px]">
                <span className="block text-[11px] text-[#FBF9F6]/70">المنتجات المعروضة</span>
                <span className="text-xl font-black font-mono text-[#F2C864]">
                  {selectedBrand.productCount}
                </span>
              </div>
              <div className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-center min-w-[110px]">
                <span className="block text-[11px] text-[#FBF9F6]/70">تبدأ الأسعار من</span>
                <span className="text-base font-black font-mono text-white">
                  {formatMoney(selectedBrand.minPriceEgp, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Filters & Search inside Selected Brand */}
          <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-[#FBF9F6] p-1 rounded-lg border border-[#2A1A11]/10">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#2A1A11] text-white'
                      : 'text-[#4E342E] hover:text-[#2A1A11]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#4E342E]/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`ابحث داخل منتجات ${selectedBrand.roasterName}...`}
                className="w-full pr-9 pl-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
              />
            </div>
          </div>

          {/* Selected Brand Product Grid */}
          {brandProducts.length === 0 ? (
            <div className="bg-white border border-[#2A1A11]/12 rounded-xl p-12 text-center space-y-3">
              <p className="text-base font-bold text-[#2A1A11]">
                لا توجد منتجات مطابقة لبحثك داخل {selectedBrand.roasterName}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('الكل');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2A1A11] rounded-lg cursor-pointer"
              >
                عرض جميع منتجات الشركة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {brandProducts.map((prod) => {
                const sel = getSelection(prod);
                const livePrice = calculateRetailUnitPrice(
                  prod.basePrice250gEgp,
                  sel.weight,
                  sel.spiceOption
                );

                return (
                  <article
                    key={prod.id}
                    className="bg-white border border-[#2A1A11]/12 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C89B3C]/55 hover:shadow-[0_14px_34px_-14px_rgba(28,17,11,0.14)]"
                  >
                    <div>
                      <div className="aspect-[4/3] w-full bg-[#F3EDE4] overflow-hidden">
                        <SafeImage
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="text-[#4E342E] font-medium truncate">
                            <span>{prod.roasterName}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{prod.category}</span>
                          </div>
                          {prod.qualitySealed && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E7E34] shrink-0">
                              <ShieldCheck className="w-4 h-4" />
                              <span>✔ مفحوص</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#2A1A11] leading-snug">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#4E342E]/80 mt-1">
                            {prod.originLabel} — {prod.tastingNotes}
                          </p>
                        </div>

                        {/* Interactive Selectors directly on card */}
                        <div className="pt-3 border-t border-[#2A1A11]/10 space-y-3">
                          <div>
                            <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                              الوزن
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {WEIGHTS.map((w) => (
                                <button
                                  key={w.value}
                                  type="button"
                                  onClick={() => updateSelection(prod, { weight: w.value })}
                                  className={`py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                                    sel.weight === w.value
                                      ? 'bg-[#2A1A11] text-white border-[#2A1A11]'
                                      : 'bg-[#FBF9F6] text-[#2A1A11] border-[#2A1A11]/15 hover:bg-[#F3EDE4]'
                                  }`}
                                >
                                  {w.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <label className="block">
                              <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                                التحميص
                              </span>
                              <select
                                value={sel.roastLevel}
                                onChange={(e) =>
                                  updateSelection(prod, {
                                    roastLevel: e.target.value as RoastLevel,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs font-medium bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md focus:outline-none focus:border-[#C89B3C]"
                              >
                                {ROAST_LEVELS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                                درجة الطحن
                              </span>
                              <select
                                value={sel.grindType}
                                onChange={(e) =>
                                  updateSelection(prod, {
                                    grindType: e.target.value as GrindType,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs font-medium bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-md focus:outline-none focus:border-[#C89B3C]"
                              >
                                {GRIND_TYPES.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div>
                            <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                              التحويج
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {SPICE_OPTIONS.map((sp) => (
                                <button
                                  key={sp}
                                  type="button"
                                  onClick={() => updateSelection(prod, { spiceOption: sp })}
                                  className={`py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                                    sel.spiceOption === sp
                                      ? 'bg-[#4E342E] text-white border-[#4E342E]'
                                      : 'bg-[#FBF9F6] text-[#2A1A11] border-[#2A1A11]/15 hover:bg-[#F3EDE4]'
                                  }`}
                                >
                                  {sp} {sp === 'محوج حبهان' ? '(+هيل)' : ''}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-[#2A1A11]/10 bg-[#FBF9F6]/70 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[11px] text-[#4E342E]/75">السعر</span>
                        <span className="text-xl font-extrabold font-mono tabular-nums text-[#2A1A11]">
                          {formatMoney(livePrice, currency)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!prod.inStock}
                        onClick={() => handleAddClick(prod)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          prod.inStock
                            ? 'bg-[#2A1A11] text-white hover:bg-[#4E342E] cursor-pointer'
                            : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4 text-[#C89B3C]" />
                        <span>{prod.inStock ? 'أضف إلى السلة' : 'نفذت الكمية'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
