import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  KeyRound,
  LogIn,
  Store,
  UserPlus,
  Warehouse,
} from 'lucide-react';
import { PartnerAccount, TraderActivityType } from '../types';
import { getTimestampNow } from '../utils/formatters';
import { generateNextPartnerCode } from '../utils/partnerCoding';

interface PartnerAuthPortalProps {
  roleType: 'importer' | 'roaster';
  partners: PartnerAccount[];
  onLoginPartner: (partnerId: string) => void;
  onRegisterPartner: (partner: PartnerAccount) => void;
  onBackHome: () => void;
}

const COUNTRIES = ['مصر', 'السعودية', 'الإمارات', 'الكويت', 'الأردن', 'هولندا', 'أخرى'];

const ORIGIN_AND_SPECIES_OPTIONS = [
  'البرازيل',
  'إثيوبيا',
  'كولومبيا',
  'إندونيسيا',
  'الهند',
  'أرابيكا',
  'روبوستا',
];

const TRADER_ACTIVITY_TYPES: TraderActivityType[] = [
  'محمصة بن',
  'مطحنة',
  'موزع جملة',
  'كافيه / سلسلة',
];

const MONTHLY_VOLUME_PRESETS = [
  'أقل من 500 كجم شهرياً',
  '500 كجم - 2 طن شهرياً',
  '2 - 10 طن شهرياً',
  'أكثر من 10 طن شهرياً',
];

const IMPORTER_SUPPLY_PRESETS = [
  '5 - 20 طن شهرياً (توريد منتظم)',
  '20 - 50 طن شهرياً (مستودعات إقليمية)',
  'أكثر من 50 طن شهرياً (حاويات كاملة FCL)',
];

export const PartnerAuthPortal: React.FC<PartnerAuthPortalProps> = ({
  roleType,
  partners,
  onLoginPartner,
  onRegisterPartner,
  onBackHome,
}) => {
  const isImporter = roleType === 'importer';
  const rolePartners = useMemo(
    () => partners.filter((p) => p.type === roleType),
    [partners, roleType]
  );

  const previewSystemCode = useMemo(
    () => generateNextPartnerCode(roleType, partners),
    [roleType, partners]
  );

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Common Required & Optional Fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('مصر');
  const [governorate, setGovernorate] = useState('');
  const [commercialReg, setCommercialReg] = useState('');
  const [taxId, setTaxId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Importer-Specific Fields
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [supplyCapacityOrActivity, setSupplyCapacityOrActivity] = useState('');

  // Trader / Roaster-Specific Fields
  const [businessActivityType, setBusinessActivityType] =
    useState<TraderActivityType>('محمصة بن');
  const [monthlyOrderVolume, setMonthlyOrderVolume] = useState('');

  // Shared Optional Origin/Variety Selections
  const [selectedOriginsAndVarieties, setSelectedOriginsAndVarieties] = useState<string[]>([]);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const toggleOriginOrVariety = (item: string) => {
    setSelectedOriginsAndVarieties((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idQuery = loginIdentifier.trim().toLowerCase();
    const pwd = loginPassword.trim();
    const matched = rolePartners.find(
      (p) =>
        ((p.email && p.email.toLowerCase() === idQuery) ||
          (p.username && p.username.toLowerCase() === idQuery) ||
          (p.codingCode && p.codingCode.toLowerCase() === idQuery) ||
          p.anonCode.toLowerCase() === idQuery) &&
        (p.password || '123456') === pwd
    );

    if (!matched) {
      setLoginError(
        'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني أو اسم المستخدم أو كود التكويد وكلمة المرور، أو استخدم أزرار الدخول التجريبي.'
      );
      return;
    }

    setLoginError(null);
    setLoginIdentifier('');
    setLoginPassword('');
    onLoginPartner(matched.id);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername =
      username.trim().toLowerCase() ||
      cleanEmail.split('@')[0]?.replace(/[^a-z0-9_]/gi, '') ||
      `user_${Date.now().toString().slice(-4)}`;

    if (
      !companyName.trim() ||
      !contactPerson.trim() ||
      !phone.trim() ||
      !cleanEmail ||
      !governorate.trim()
    ) {
      setRegisterError('يرجى استيفاء جميع الحقول الأساسية المطلوبة (*).');
      return;
    }

    if (isImporter && !warehouseAddress.trim()) {
      setRegisterError('يرجى إدخال عنوان / منطقة المخزن الرئيسي للمستورد.');
      return;
    }

    if (!isImporter && !businessActivityType) {
      setRegisterError('يرجى تحديد نوع النشاط التجاري.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setRegisterError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    if (password.length < 6) {
      setRegisterError('يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
      return;
    }

    const emailOrUserExists = partners.some(
      (p) =>
        (p.email && p.email.toLowerCase() === cleanEmail) ||
        (p.username && p.username.toLowerCase() === cleanUsername)
    );
    if (emailOrUserExists) {
      setRegisterError('هذا البريد الإلكتروني أو اسم المستخدم مسجل بالفعل في المنصة.');
      return;
    }

    const assignedAnonCode = generateNextPartnerCode(roleType, partners);
    const originsSummary =
      selectedOriginsAndVarieties.length > 0
        ? selectedOriginsAndVarieties.join('، ')
        : '';

    const primaryActivitySummary = isImporter
      ? [
          `المخزن: ${warehouseAddress.trim()}`,
          originsSummary ? `المناشئ: ${originsSummary}` : '',
          supplyCapacityOrActivity.trim(),
        ]
          .filter(Boolean)
          .join(' · ')
      : [
          businessActivityType,
          originsSummary ? `المطلوب: ${originsSummary}` : '',
          monthlyOrderVolume.trim(),
        ]
          .filter(Boolean)
          .join(' · ');

    const newPartner: PartnerAccount = {
      id: `${isImporter ? 'imp' : 'roa'}-${Date.now()}`,
      name: companyName.trim(),
      anonCode: assignedAnonCode,
      type: roleType,
      country,
      governorate: governorate.trim(),
      phone: phone.trim(),
      taxId: taxId.trim() || undefined,
      verified: false,
      joinedAt: new Date().toISOString().slice(0, 10),
      email: cleanEmail,
      username: cleanUsername,
      password,
      contactPerson: contactPerson.trim(),
      commercialReg: commercialReg.trim() || undefined,
      primaryActivity: primaryActivitySummary,
      warehouseAddress: isImporter ? warehouseAddress.trim() : undefined,
      businessActivityType: !isImporter ? businessActivityType : undefined,
      preferredOriginsAndVarieties:
        selectedOriginsAndVarieties.length > 0 ? selectedOriginsAndVarieties : undefined,
      supplyCapacityOrActivity:
        isImporter && supplyCapacityOrActivity.trim()
          ? supplyCapacityOrActivity.trim()
          : undefined,
      monthlyOrderVolume:
        !isImporter && monthlyOrderVolume.trim() ? monthlyOrderVolume.trim() : undefined,
      codingStatus: 'بانتظار التكويد والاعتماد',
      codingSubmittedAt: getTimestampNow(),
    };

    onRegisterPartner(newPartner);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E342E] hover:text-[#2A1A11] cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى الصفحة الرئيسية</span>
        </button>

        <div className="text-xs text-[#4E342E]">
          {isImporter ? 'مسار المستوردين والمورّدين (B2B)' : 'مسار التجار والمحامص (B2B)'}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Auth / Coding Form Column */}
        <div className="lg:col-span-7 bg-white border border-[#2A1A11]/12 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-[#2A1A11]/10 pb-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#C89B3C]">
                {isImporter ? <Building2 className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                <span>
                  {isImporter
                    ? 'بوابة المستورد — دخول وتكويد الشركات المستوردة'
                    : 'بوابة التاجر والمحمصة — دخول وتكويد المحامص وتجار الجملة'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C110B]">
                {authTab === 'login'
                  ? isImporter
                    ? 'تسجيل الدخول إلى بوابة المستورد'
                    : 'تسجيل الدخول إلى سوق الجملة والمحمصة'
                  : isImporter
                  ? 'طلب تكويد وإنشاء حساب مستورد جديد'
                  : 'طلب تكويد وإنشاء حساب تاجر / محمصة'}
              </h1>
              <p className="text-xs sm:text-sm text-[#4E342E]">
                {authTab === 'login'
                  ? isImporter
                    ? 'أدر منتجاتك المعروضة، حدّث الأسعار والكميات، وتابع عروض الأسعار الواردة لحسابك فقط.'
                    : 'تصفح منتجات البن الأخضر المعتمدة، اطلب العينات وعروض الأسعار، وتابع مفاوضاتك.'
                  : 'سجّل بيانات منشأتك لإصدار كود التكويد الرسمي ومراجعته وتفعيله من الإدارة العليا.'}
              </p>
            </div>

            {/* Segmented Switch: Login vs Coding Registration */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FBF9F6] border border-[#2A1A11]/12 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setLoginError(null);
                  setRegisterError(null);
                }}
                className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-[#2A1A11] text-white'
                    : 'text-[#4E342E] hover:text-[#2A1A11]'
                }`}
              >
                <KeyRound className="w-4 h-4 text-[#C89B3C]" />
                <span>تسجيل دخول</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setLoginError(null);
                  setRegisterError(null);
                }}
                className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  authTab === 'register'
                    ? 'bg-[#2A1A11] text-white'
                    : 'text-[#4E342E] hover:text-[#2A1A11]'
                }`}
              >
                <UserPlus className="w-4 h-4 text-[#C89B3C]" />
                <span>طلب تكويد وحساب جديد</span>
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div
                    className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                    البريد الإلكتروني أو اسم المستخدم أو كود التكويد
                  </span>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder={
                      isImporter
                        ? 'مثال: nile@bunntech.com أو nile_imp أو IMP-104'
                        : 'مثال: khan@bunntech.com أو khan_roaster أو RST-101'
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                    كلمة المرور
                  </span>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[#C89B3C]" />
                  <span>
                    {isImporter ? 'دخول إلى بوابة المستورد' : 'دخول إلى سوق الجملة والتفاوض'}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {registerError && (
                  <div
                    className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{registerError}</span>
                  </div>
                )}

                {/* Coding Preview Banner */}
                <div className="bg-[#FBF9F6] border border-[#C89B3C]/35 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-[#2A1A11]">
                      {isImporter
                        ? 'كود المستورد التعريفي المقترح عند الاعتماد:'
                        : 'كود التاجر / المحمصة المقترح عند الاعتماد:'}
                    </p>
                    <p className="text-[11px] text-[#4E342E] mt-0.5">
                      {isImporter
                        ? 'يُعتمد من الإدارة العليا ويُستخدم لإخفاء اسم شركتك في سوق الجملة حتى إتمام الصفقة.'
                        : 'يُصدر ويُؤكّد فور مراجعة واعتماد الإدارة العليا لملف التكويد.'}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-[#1C110B] text-[#F2C864] font-mono font-black text-sm">
                    {previewSystemCode}
                  </span>
                </div>

                {/* Section 1: Common Required Data */}
                <div className="space-y-3.5">
                  <h2 className="text-xs font-extrabold text-[#B4532A] border-b border-[#2A1A11]/10 pb-1.5">
                    1. البيانات الأساسية المطلوبة (*)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        اسم الشركة / النشاط التجاري *
                      </span>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={
                          isImporter ? 'شركة الدلتا لاستيراد البن' : 'محمصة الواحة للقهوة'
                        }
                        className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        اسم المسؤول عن الحساب *
                      </span>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="الاسم الكامل للمفوض"
                        className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        رقم الهاتف / واتساب *
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 10x xxx xxxx"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        البريد الإلكتروني *
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@company.com"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        اسم المستخدم (اختياري)
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="delta_coffee"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        الدولة *
                      </span>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        المحافظة والمنطقة *
                      </span>
                      <input
                        type="text"
                        required
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        placeholder="القاهرة — مدينة نصر"
                        className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        كلمة المرور (6 أحرف فأكثر) *
                      </span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        تأكيد كلمة المرور *
                      </span>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>
                  </div>
                </div>

                {/* Section 2: Role-Specific Coding & Profile Fields */}
                <div className="space-y-3.5">
                  <h2 className="text-xs font-extrabold text-[#1E7E34] border-b border-[#2A1A11]/10 pb-1.5">
                    {isImporter
                      ? '2. بيانات التكويد الخاصة بالمستورد'
                      : '2. بيانات التكويد الخاصة بالتاجر / المحمصة'}
                  </h2>

                  {isImporter ? (
                    <>
                      <label className="block">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2A1A11] mb-1">
                          <Warehouse className="w-3.5 h-3.5 text-[#C89B3C]" />
                          <span>عنوان / منطقة المخزن الرئيسي *</span>
                        </span>
                        <input
                          type="text"
                          required
                          value={warehouseAddress}
                          onChange={(e) => setWarehouseAddress(e.target.value)}
                          placeholder="مثال: المنطقة الحرة بالعامرية - الإسكندرية / العاشر من رمضان"
                          className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                        />
                      </label>

                      <div>
                        <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                          المناشئ والأصناف الرئيسية (اختياري)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ORIGIN_AND_SPECIES_OPTIONS.map((opt) => {
                            const selected = selectedOriginsAndVarieties.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleOriginOrVariety(opt)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                                  selected
                                    ? 'bg-[#2A1A11] text-[#F2C864] border-[#2A1A11]'
                                    : 'bg-[#FBF9F6] text-[#4E342E] border-[#2A1A11]/15 hover:border-[#C89B3C]'
                                }`}
                              >
                                {selected ? `✔ ${opt}` : opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label className="block">
                        <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                          متوسط القدرة التوريدية أو طبيعة النشاط (اختياري)
                        </span>
                        <input
                          type="text"
                          list="importer-supply-presets"
                          value={supplyCapacityOrActivity}
                          onChange={(e) => setSupplyCapacityOrActivity(e.target.value)}
                          placeholder="مثال: 25 طن شهرياً — استيراد مباشر وبيع EXW / CIF"
                          className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                        />
                        <datalist id="importer-supply-presets">
                          {IMPORTER_SUPPLY_PRESETS.map((preset) => (
                            <option key={preset} value={preset} />
                          ))}
                        </datalist>
                      </label>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                          نوع النشاط *
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {TRADER_ACTIVITY_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setBusinessActivityType(type)}
                              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                businessActivityType === type
                                  ? 'bg-[#2A1A11] text-white border-[#2A1A11]'
                                  : 'bg-[#FBF9F6] text-[#2A1A11] border-[#2A1A11]/15 hover:bg-[#F3EDE4]'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                          الأصناف والمناشئ المطلوبة غالباً (اختياري)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ORIGIN_AND_SPECIES_OPTIONS.map((opt) => {
                            const selected = selectedOriginsAndVarieties.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleOriginOrVariety(opt)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                                  selected
                                    ? 'bg-[#2A1A11] text-[#F2C864] border-[#2A1A11]'
                                    : 'bg-[#FBF9F6] text-[#4E342E] border-[#2A1A11]/15 hover:border-[#C89B3C]'
                                }`}
                              >
                                {selected ? `✔ ${opt}` : opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label className="block">
                        <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                          متوسط حجم الطلب الشهري (اختياري)
                        </span>
                        <input
                          type="text"
                          list="trader-volume-presets"
                          value={monthlyOrderVolume}
                          onChange={(e) => setMonthlyOrderVolume(e.target.value)}
                          placeholder="مثال: 2 - 5 طن شهرياً"
                          className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                        />
                        <datalist id="trader-volume-presets">
                          {MONTHLY_VOLUME_PRESETS.map((preset) => (
                            <option key={preset} value={preset} />
                          ))}
                        </datalist>
                      </label>
                    </>
                  )}
                </div>

                {/* Section 3: Optional Commercial & Tax Documentation */}
                <div className="space-y-3">
                  <h2 className="text-xs font-extrabold text-[#4E342E] border-b border-[#2A1A11]/10 pb-1.5">
                    3. المستندات الضريبية والتجارية (اختياري)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        رقم السجل التجاري (اختياري)
                      </span>
                      <input
                        type="text"
                        value={commercialReg}
                        onChange={(e) => setCommercialReg(e.target.value)}
                        placeholder="CR-xxxxxx"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs font-semibold text-[#2A1A11] mb-1">
                        البطاقة الضريبية / الرقم الضريبي (اختياري)
                      </span>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="xxx-xxx-xxx"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg transition-colors cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4 text-[#C89B3C]" />
                  <span>إرسال طلب التكويد وإنشاء الحساب الشخصي</span>
                </button>
              </form>
            )}
          </div>

          <p className="text-[11px] text-[#4E342E]/75 mt-6 pt-4 border-t border-[#2A1A11]/10">
            يبدأ الحساب الجديد بحالة «بانتظار التكويد والاعتماد» وتُراجع البيانات في لوحة الإدارة
            العليا لإصدار وتفعيل كود{' '}
            <span className="font-mono font-bold text-[#2A1A11]">
              {isImporter ? 'IMP-XXX' : 'RST-XXX'}
            </span>
            .
          </p>
        </div>

        {/* Quick Demo Logins Side Panel */}
        <div className="lg:col-span-5 bg-[#1C110B] text-[#FBF9F6] border border-[#2A1A11] rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#C89B3C]">
              حسابات اختبار جاهزة (دخول بنقرة واحدة)
            </span>
            <h2 className="text-lg font-extrabold text-white">
              {isImporter
                ? 'اختبار سريع لحسابات المستوردين'
                : 'اختبار سريع لحسابات التجار والمحامص'}
            </h2>
            <p className="text-xs text-[#FBF9F6]/75 leading-relaxed">
              اختر حساباً معتمداً أو حساباً بانتظار التكويد والاعتماد لاختبار تجربة الدخول والعزل
              وموافقة الإدارة العليا مباشرة.
            </p>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pl-1">
            {rolePartners.map((partner) => (
              <button
                key={partner.id}
                type="button"
                onClick={() => {
                  setLoginError(null);
                  onLoginPartner(partner.id);
                }}
                className="w-full text-right p-3.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/12 hover:border-[#C89B3C]/60 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                    {isImporter ? (
                      <Building2 className="w-4 h-4 text-[#C89B3C] shrink-0" />
                    ) : (
                      <Store className="w-4 h-4 text-[#C89B3C] shrink-0" />
                    )}
                    <span className="truncate">{partner.name}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold shrink-0 ${
                      partner.verified ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {partner.verified ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {partner.verified
                        ? 'معتمد ومفعّل'
                        : partner.codingStatus || 'بانتظار التكويد والاعتماد'}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#FBF9F6]/75">
                  <span>
                    {partner.email || partner.anonCode} · {partner.username || partner.anonCode}
                  </span>
                  <span>كلمة المرور: {partner.password || '123456'}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#C89B3C] font-semibold">
                  <span>
                    {partner.country} — {partner.governorate}
                  </span>
                  <span>
                    {partner.codingCode ? `كود: ${partner.codingCode}` : `#${partner.anonCode}`} ←
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white/6 border border-white/10 rounded-xl p-3.5 text-[11px] text-[#FBF9F6]/80 space-y-1">
            <p className="font-bold text-[#C89B3C]">حالة الحساب الشخصي بعد التسجيل:</p>
            <p>
              الحساب الجديد يبدأ بحالة «بانتظار التكويد والاعتماد» ويصل طلبه فوراً إلى لوحة الإدارة
              العليا لإصدار كود التكويد وتفعيل الحساب بالكامل.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
