import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { ContactInquiry, UserRole } from '../types';
import { ASSETS } from '../data/seedData';
import { SafeImage } from './SafeImage';
import { getTimestampNow } from '../utils/formatters';
import { BrandLogo } from './BrandLogo';

interface LandingPageProps {
  approvedLotsCount: number;
  verifiedPartnersCount: number;
  retailProductsCount: number;
  onSelectRole: (role: UserRole) => void;
  onSubmitInquiry: (inquiry: ContactInquiry) => void;
}

const GOALS_AND_AMBITION = [
  {
    num: '01',
    span: 'lg:col-span-7',
    surface: 'bg-gradient-to-br from-white via-[#FFFDF8] to-[#FDF6E7] border-[#C89B3C]/30',
    numColor: 'text-[#C89B3C]',
    titleColor: 'text-[#1C110B]',
    textColor: 'text-[#4E342E]',
    title: 'شفافية التسعير والربط الفوري بالبورصة العالمية',
    summary:
      'توفير مرجعية سعرية واضحة لسوق البن المصري عبر ربط أسعار البن الأخضر بمؤشرات أرابيكا نيويورك وروبوستا لندن وسعر الصرف، مع حاسبة تكلفة استيراد فورية لكل منشأ عالمي.',
  },
  {
    num: '02',
    span: 'lg:col-span-5',
    surface: 'bg-gradient-to-br from-[#F4FAF5] to-[#E6F3EA] border-[#1E7E34]/25',
    numColor: 'text-[#1E7E34]',
    titleColor: 'text-[#132A1B]',
    textColor: 'text-[#2B4736]',
    title: 'التكويد التجاري وفحص الجودة الموثّق',
    summary:
      'إخضاع كافة المستوردين والتجار والمحامص لإجراءات تكويد بالسجل التجاري والبطاقة الضريبية، مع منح شارة الجودة المفحوصة للدفعات المطابقة للمواصفات القياسية.',
  },
  {
    num: '03',
    span: 'lg:col-span-5',
    surface: 'bg-gradient-to-br from-[#FFF7F3] to-[#FCECE4] border-[#B4532A]/25',
    numColor: 'text-[#B4532A]',
    titleColor: 'text-[#2E160C]',
    textColor: 'text-[#5D3728]',
    title: 'تسريع دورات التوريد (B2B) والبيع المباشر (B2C)',
    summary:
      'اختصار زمن طلب العينات وعروض الأسعار والتفاوض داخل المنصة مع حماية هوية الأطراف حتى إتمام الاتفاق، بالتكامل مع متجر تجزئة مباشر يربط المحمصة بالمستهلك.',
  },
  {
    num: '04',
    span: 'lg:col-span-7',
    surface: 'bg-gradient-to-br from-[#14251B] via-[#1C110B] to-[#2B1910] border-[#C89B3C]/35',
    numColor: 'text-[#F2C864]',
    titleColor: 'text-white',
    textColor: 'text-[#FBF9F6]/80',
    title: 'طموحنا: المنصة الرقمية الأولى لتجارة البن في مصر',
    summary:
      'تأسيس منظومة تجارية رقمية موحدة تنظم حركة استيراد البن الأخضر وتداوله محلياً وإقليمياً، وترتقي بجودة التحميص والتوزيع في السوق المصري عبر بيانات دقيقة وتعاقدات آمنة.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  approvedLotsCount,
  verifiedPartnersCount,
  retailProductsCount,
  onSelectRole,
  onSubmitInquiry,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('طلب تكويد تاجر / محمصة');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedInquiry, setSubmittedInquiry] = useState<ContactInquiry | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavigateRole = (role: UserRole) => {
    onSelectRole(role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setFormError('يرجى استيفاء الاسم ورقم الهاتف وتفاصيل الاستفسار.');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('يرجى إدخال صيغة بريد إلكتروني صحيحة.');
      return;
    }

    const inquiry: ContactInquiry = {
      id: `INQ-${Math.floor(1000 + Math.random() * 8999)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || 'غير محدد',
      topic,
      message: message.trim(),
      createdAt: getTimestampNow(),
    };

    onSubmitInquiry(inquiry);
    setSubmittedInquiry(inquiry);
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="bg-[#FBF9F6] text-[#2A1A11]">
      {/* 1. Brand Hero & About Us (نبذة عنا) */}
      <section className="bg-gradient-to-bl from-[#FDF6E7] via-[#FBF9F6] to-[#EEF6F0] border-b border-[#2A1A11]/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:pt-12 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8 py-2">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <BrandLogo size="lg" />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#4E342E]">
                  <span className="text-[#1E7E34]">منظومة تجارة البن في السوق المصري</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#B4532A]">تداول الجملة B2B</span>
                  <span aria-hidden="true">·</span>
                  <span>متجر المستهلك B2C</span>
                </div>

                <h1 className="text-[clamp(2rem,3.6vw,3.25rem)] font-black leading-[1.2] tracking-tight text-[#1C110B] max-w-2xl">
                  <span className="text-[#B4532A]">المنصة الرقمية الأولى</span> المتكاملة لتداول{' '}
                  <span className="text-[#1E7E34]">البن الأخضر</span> والقهوة المحمصة في مصر
                </h1>

                <p className="text-base sm:text-lg text-[#4E342E] leading-relaxed max-w-2xl">
                  تجمع <strong className="text-[#2A1A11]">بُنّ تك (BunnTech)</strong> مستوردي البن
                  الأخضر مع التجار والمحامص في سوق جملة شفاف ومكوّد (B2B)، وتربط المحامص المعتمدة
                  مباشرة بالمستهلك النهائي عبر متجر متخصص للقهوة الطازجة (B2C).
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToSection('role-selector')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-l from-[#1E7E34] to-[#155E27] hover:from-[#186A2B] hover:to-[#114D20] rounded-lg shadow-sm transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>اختر مسارك وابدأ التداول</span>
                    <ArrowLeft className="w-4 h-4 text-[#F2C864]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('contact-section')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#B4532A] bg-white hover:bg-[#FDF2EC] border border-[#B4532A]/30 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>وسائل التواصل معنا</span>
                  </button>
                </div>

                {/* Live catalog metrics strip with distinct domain color accents */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#2A1A11]/12">
                  <div>
                    <div className="text-2xl font-black font-mono tabular-nums text-[#1E7E34]">
                      {approvedLotsCount}
                    </div>
                    <div className="text-xs font-medium text-[#4E342E] mt-1">
                      منتج بن أخضر معتمد جاهز للتوريد في السوق
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black font-mono tabular-nums text-[#C89B3C]">
                      {verifiedPartnersCount}
                    </div>
                    <div className="text-xs font-medium text-[#4E342E] mt-1">
                      مستورد ومحمص مكوّد ومعتمد تجارياً
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black font-mono tabular-nums text-[#B4532A]">
                      {retailProductsCount}
                    </div>
                    <div className="text-xs font-medium text-[#4E342E] mt-1">
                      توليفة ومنتج محمص طازج متاح للمستهلك
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dominant Visual Asset */}
            <div className="lg:col-span-5">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-[#C89B3C]/35 bg-[#1C110B] shadow-md">
                <SafeImage
                  src={ASSETS.heroWarehouse}
                  alt="مستودع ومختبر فحص البن الأخضر في منصة بُنّ تك"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14251B]/90 via-[#1C110B]/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1.5">
                  <div className="text-xs font-bold text-[#F2C864]">
                    سوق الجملة والتجزئة في منظومة واحدة
                  </div>
                  <p className="text-sm sm:text-base font-bold leading-snug">
                    من ميناء الوصول والمستودع المعتمد إلى المحمصة، ومن المحمصة إلى فنجان المستهلك.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Us & Ecosystem Architecture */}
      <section className="bg-white py-14 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-[#B4532A]">نبذة عن بُنّ تك</div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1C110B]">
                جسر تجاري موثوق بين مستوردي البن والمحامص والمستهلكين
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-4 text-sm sm:text-base text-[#4E342E] leading-relaxed">
              <p>
                وُلدت منصة <strong className="text-[#2A1A11]">بُنّ تك</strong> لمعالجة تحديات
                تجارة البن في السوق المصري: تشتت عروض الأسعار، صعوبة التحقق من جودة العينات
                والمواصفات القياسية، وغياب آلية تكويد وتفاوض منضبطة تحمي مصالح المستورد والمحمصة.
              </p>
              <p>
                توفر المنصة دورة عمل متكاملة تبدأ بتكويد واعتماد الشركات المستوردة والتجار، مروراً
                بعرض منتجات البن الأخضر بشروط تسليم واضحة والتفاوض المحمي داخل التطبيق، وصولاً إلى
                تقديم منتجات المحامص الطازجة للمستهلك النهائي بمواصفات تخصيص دقيقة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-[#2A1A11]/10">
            <div className="rounded-xl p-5 bg-[#EEF6F0]/75 border border-[#1E7E34]/20 border-t-2 border-t-[#1E7E34] space-y-2">
              <div className="text-xs font-mono font-bold text-[#1E7E34]">حلقة التوريد الأولى</div>
              <h3 className="text-base font-bold text-[#132A1B]">المستوردون والموردون</h3>
              <p className="text-sm text-[#2B4736] leading-relaxed">
                طرح كميات البن الأخضر، تحديث الأسعار والمخزون لحظياً، وإرسال عروض الأسعار والعينات
                للمحامص المكوّدة.
              </p>
            </div>
            <div className="rounded-xl p-5 bg-[#FDF6E7]/85 border border-[#C89B3C]/25 border-t-2 border-t-[#C89B3C] space-y-2">
              <div className="text-xs font-mono font-bold text-[#9C721A]">حلقة التصنيع والتجارة</div>
              <h3 className="text-base font-bold text-[#1C110B]">التجار والمحامص</h3>
              <p className="text-sm text-[#4E342E] leading-relaxed">
                مقارنة المناشئ، حساب تكلفة الاستيراد، طلب عينات الفحص، التفاوض المباشر المحمي،
                وإدارة مبيعات التجزئة.
              </p>
            </div>
            <div className="rounded-xl p-5 bg-[#FDF2EC]/85 border border-[#B4532A]/20 border-t-2 border-t-[#B4532A] space-y-2">
              <div className="text-xs font-mono font-bold text-[#B4532A]">حلقة الوصول المباشر</div>
              <h3 className="text-base font-bold text-[#2E160C]">المستهلك النهائي</h3>
              <p className="text-sm text-[#5D3728] leading-relaxed">
                اختيار التوليفات والأصناف من المحامص المعتمدة حسب الوزن ودرجة التحميص ونوع الطحنة
                والتحويج.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Goals & Ambition (أهدافنا وطموحنا) */}
      <section className="border-t border-[#2A1A11]/10 bg-[#FBF9F6] py-14 lg:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold text-[#1E7E34]">أهدافنا وطموحنا</div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C110B]">
              نحو سوق بن مصري أكثر شفافية وكفاءة وجودة
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {GOALS_AND_AMBITION.map((item) => (
              <div
                key={item.num}
                className={`${item.span} ${item.surface} border rounded-2xl p-6 sm:p-7 space-y-3`}
              >
                <div className={`text-sm font-mono font-bold ${item.numColor}`}>
                  {item.num}.
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${item.titleColor}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${item.textColor}`}>{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Contact Channels & Inquiry Form (وسائل التواصل معنا) */}
      <section
        id="contact-section"
        className="border-t border-[#2A1A11]/10 bg-white py-14 lg:py-16 scroll-mt-20"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Direct Contact Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#B4532A]">وسائل التواصل معنا</div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1C110B]">
                  فريق التكويد والدعم التجاري في خدمتك
                </h2>
                <p className="text-sm text-[#4E342E] leading-relaxed">
                  للاستفسار عن إجراءات تكويد التجار والمستوردين، فحص العينات، أو الشراكات المؤسسية
                  في مصر والمنطقة، تواصل معنا مباشرة عبر القنوات التالية.
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-[#2A1A11]/10 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FDF6E7] border border-[#C89B3C]/30 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#9C721A]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#2A1A11]">الهاتف وخدمة التكويد</div>
                    <div className="font-mono tabular-nums text-[#4E342E]" dir="ltr">
                      +20 100 000 0000
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF6F0] border border-[#1E7E34]/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-[#1E7E34]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#2A1A11]">واتساب الأعمال</div>
                    <div className="font-mono tabular-nums text-[#4E342E]" dir="ltr">
                      +20 100 000 0001
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FDF2EC] border border-[#B4532A]/25 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#B4532A]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#2A1A11]">البريد الإلكتروني</div>
                    <div className="font-mono text-[#4E342E]">
                      support@bunntech.eg · onboarding@bunntech.eg
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF9F6] border border-[#2A1A11]/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#2A1A11]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#2A1A11]">المقر ومواعيد العمل</div>
                    <div className="text-[#4E342E]">
                      القاهرة الجديدة — التجمع الخامس، جمهورية مصر العربية
                    </div>
                    <div className="text-xs text-[#4E342E]/80 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>الأحد إلى الخميس: 9:00 صباحاً — 6:00 مساءً</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#FBF9F6] to-[#FDF6E7]/50 border border-[#C89B3C]/25 rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-[#1C110B] mb-1">أرسل استفسارك مباشرة</h3>
              <p className="text-xs text-[#4E342E] mb-5">
                تصل رسالتك فوراً إلى فريق الإدارة العليا وسيتم التواصل معك خلال يوم عمل واحد.
              </p>

              {submittedInquiry && (
                <div className="mb-5 bg-[#EEF6F0] border border-[#1E7E34]/30 text-[#1E7E34] rounded-xl p-4 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p>
                      تم استلام رسالتك بنجاح برقم مرجعي{' '}
                      <span className="font-mono">{submittedInquiry.id}</span>.
                    </p>
                    <p className="text-xs font-normal mt-0.5 text-[#2A1A11]">
                      سيتواصل معك فريق بُنّ تك على الرقم {submittedInquiry.phone}.
                    </p>
                  </div>
                </div>
              )}

              {formError && (
                <div
                  className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-semibold"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                      الاسم الكامل *
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="الاسم أو اسم المسؤول"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#1E7E34]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                      رقم الهاتف / واتساب *
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#1E7E34]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                      البريد الإلكتروني
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#1E7E34]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                      موضوع التواصل
                    </span>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#1E7E34]"
                    >
                      <option value="طلب تكويد تاجر / محمصة">طلب تكويد تاجر / محمصة</option>
                      <option value="طلب تكويد مستورد بن أخضر">طلب تكويد مستورد بن أخضر</option>
                      <option value="الاستفسار عن فحص الجودة والعينات">
                        الاستفسار عن فحص الجودة والعينات
                      </option>
                      <option value="دعم طلبات متجر المستهلك">دعم طلبات متجر المستهلك</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="block text-xs font-semibold text-[#2A1A11] mb-1.5">
                    الرسالة *
                  </span>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب تفاصيل استفسارك أو الكميات المطلوبة..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#1E7E34]"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-l from-[#2A1A11] to-[#4E342E] hover:from-[#1E7E34] hover:to-[#155E27] rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#F2C864]" />
                  <span>إرسال الاستفسار</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom Role Selector (اختيار المسار في أسفل الصفحة) */}
      <section
        id="role-selector"
        className="border-t border-[#2A1A11]/10 bg-gradient-to-b from-[#1C110B] via-[#1B1612] to-[#14251B] text-[#FBF9F6] py-14 lg:py-16 scroll-mt-20"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold text-[#F2C864]">ابدأ الآن حسب صفتك التجارية</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              اختر مسارك للدخول أو التكويد في بُنّ تك
            </h2>
            <p className="text-sm text-[#FBF9F6]/75">
              سواء كنت تاجراً أو محمصة تبحث عن بن أخضر موثوق، أو مستورداً يعرض منتجاته، أو
              مستهلكاً يبحث عن قهوة محمصة طازجة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Role 1: Trader / Roaster (Gold theme) */}
            <button
              type="button"
              onClick={() => handleNavigateRole('b2b_marketplace')}
              className="group text-right bg-white/7 hover:bg-[#C89B3C]/14 border border-[#C89B3C]/30 hover:border-[#F2C864] border-t-4 border-t-[#C89B3C] rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6 transition-colors duration-150 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Store className="w-6 h-6 text-[#F2C864]" />
                  <span className="text-xs font-mono text-[#F2C864]/80">01 · B2B</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">تاجر / محمصة</h3>
                <p className="text-sm text-[#FBF9F6]/80 leading-relaxed">
                  تسجيل الدخول أو تقديم طلب تكويد لتصفح سوق الجملة، طلب العينات، التفاوض المحمي
                  مع المستوردين، ومتابعة العقود.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[#F2C864] group-hover:translate-x-[-3px] transition-transform">
                <span>دخول وتكويد التجار والمحامص</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </button>

            {/* Role 2: Importer (Emerald green theme) */}
            <button
              type="button"
              onClick={() => handleNavigateRole('importer_portal')}
              className="group text-right bg-white/7 hover:bg-[#1E7E34]/18 border border-[#1E7E34]/35 hover:border-[#4ADE80] border-t-4 border-t-[#229944] rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6 transition-colors duration-150 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Building2 className="w-6 h-6 text-[#4ADE80]" />
                  <span className="text-xs font-mono text-[#4ADE80]/80">02 · B2B</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">مستورد</h3>
                <p className="text-sm text-[#FBF9F6]/80 leading-relaxed">
                  تسجيل الدخول أو طلب تكويد حساب مستورد لإضافة منتجات البن الأخضر، تحديث الأسعار
                  والمخزون لحظياً، وتقديم عروض الأسعار.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[#4ADE80] group-hover:translate-x-[-3px] transition-transform">
                <span>دخول وتكويد بوابة المستورد</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </button>

            {/* Role 3: Consumer (Warm copper-terracotta theme) */}
            <button
              type="button"
              onClick={() => handleNavigateRole('b2c_store')}
              className="group text-right bg-white/7 hover:bg-[#B4532A]/18 border border-[#D46A3E]/35 hover:border-[#F08C63] border-t-4 border-t-[#D46A3E] rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6 transition-colors duration-150 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <ShoppingBag className="w-6 h-6 text-[#F08C63]" />
                  <span className="text-xs font-mono text-[#F08C63]/80">03 · B2C</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">مستهلك</h3>
                <p className="text-sm text-[#FBF9F6]/80 leading-relaxed">
                  دخول مباشر إلى متجر القهوة المحمصة الطازجة، تخصيص الوزن ودرجة التحميص والطحن
                  والتحويج، والشراء كضيف أو بحساب شخصي.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[#F08C63] group-hover:translate-x-[-3px] transition-transform">
                <span>تصفح متجر المستهلك الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
