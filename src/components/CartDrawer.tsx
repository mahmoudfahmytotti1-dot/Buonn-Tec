import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Trash2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { CartItem, ConsumerProfile, CurrencyCode, PaymentMethod, RetailOrder } from '../types';
import { SafeImage } from './SafeImage';
import { formatMoney, getTimestampNow } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: CurrencyCode;
  consumerProfile?: ConsumerProfile | null;
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onCompleteOrder: (order: RetailOrder) => void;
}

const COUNTRY_CITIES: Record<string, string[]> = {
  مصر: ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'بورسعيد'],
  السعودية: ['الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة المكرمة', 'المدينة المنورة'],
  الإمارات: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة'],
  الكويت: ['مدينة الكويت', 'حولي', 'السالمية', 'الأحمدي'],
  'أوروبا والمملكة المتحدة': ['لندن', 'روتردام', 'أمستردام', 'برلين', 'باريس'],
};

const COUNTRIES = Object.keys(COUNTRY_CITIES);

const PAYMENT_METHODS: PaymentMethod[] = [
  'الدفع عند الاستلام (COD)',
  'إنستاباي / تحويل فوري',
  'بطاقة ائتمان دولية (Visa / Mastercard)',
];

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  consumerProfile,
  onUpdateQty,
  onRemoveItem,
  onCompleteOrder,
}) => {
  const [customerName, setCustomerName] = useState(consumerProfile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(consumerProfile?.phone || '');
  const [country, setCountry] = useState(consumerProfile?.country || 'مصر');
  const [governorate, setGovernorate] = useState(consumerProfile?.governorate || 'القاهرة');
  const [address, setAddress] = useState(consumerProfile?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    'بطاقة ائتمان دولية (Visa / Mastercard)'
  );
  const [confirmedOrder, setConfirmedOrder] = useState<RetailOrder | null>(null);

  useEffect(() => {
    if (isOpen && consumerProfile) {
      setCustomerName((prev) => prev || consumerProfile.name);
      setCustomerPhone((prev) => prev || consumerProfile.phone);
      setCountry(consumerProfile.country || 'مصر');
      setGovernorate(consumerProfile.governorate || 'القاهرة');
      setAddress((prev) => prev || consumerProfile.address);
    }
  }, [isOpen, consumerProfile]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPriceEgp * item.quantity, 0);
  const freeShippingThreshold = 1000;
  const baseShippingFee = country === 'مصر' ? 55 : 180;
  const deliveryFee =
    cart.length === 0 ? 0 : subtotal >= freeShippingThreshold ? 0 : baseShippingFee;
  const total = subtotal + deliveryFee;

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    const cities = COUNTRY_CITIES[nextCountry] || ['المدينة الرئيسية'];
    setGovernorate(cities[0]);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrder: RetailOrder = {
      id: `BT-${Math.floor(5100 + Math.random() * 4800)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      country,
      governorate,
      address: address.trim(),
      paymentMethod,
      items: [...cart],
      subtotalEgp: subtotal,
      deliveryFeeEgp: deliveryFee,
      totalEgp: total,
      platformCommissionEgp: Math.round(subtotal * 0.1),
      status: 'قيد التجهيز',
      createdAt: getTimestampNow(),
    };

    onCompleteOrder(newOrder);
    setConfirmedOrder(newOrder);
    setCustomerName('');
    setCustomerPhone('');
    setAddress('');
  };

  const handleClose = () => {
    setConfirmedOrder(null);
    onClose();
  };

  const availableCities = COUNTRY_CITIES[country] || ['المدينة الرئيسية'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2A1A11]/55 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl border-r border-[#2A1A11]/15"
        role="dialog"
        aria-modal="true"
        aria-label="سلة التسوق"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2A1A11]/10 flex items-center justify-between bg-[#FBF9F6]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C89B3C]" />
            <h2 className="text-base font-bold text-[#2A1A11]">
              سلة المشتريات ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#4E342E] hover:text-[#2A1A11] rounded-lg cursor-pointer"
            aria-label="إغلاق السلة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {confirmedOrder ? (
            <div className="py-6 space-y-5 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#1E7E34] mx-auto" />
              <div>
                <h3 className="text-lg font-extrabold text-[#2A1A11]">
                  تم تأكيد طلبك رقم #{confirmedOrder.id}
                </h3>
                <p className="text-xs text-[#4E342E] mt-1">
                  جاري تحميص وتجهيز طلبك الطازج وإرساله إلى {confirmedOrder.country} (
                  {confirmedOrder.governorate}).
                </p>
              </div>

              <div className="text-right bg-[#FBF9F6] border border-[#2A1A11]/10 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4E342E]">العميل:</span>
                  <span className="font-semibold text-[#2A1A11]">
                    {confirmedOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4E342E]">وسيلة الدفع:</span>
                  <span className="font-semibold text-[#2A1A11]">
                    {confirmedOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#2A1A11]/10 font-bold text-sm">
                  <span>الإجمالي المطلوب:</span>
                  <span className="font-mono tabular-nums text-[#2A1A11]">
                    {formatMoney(confirmedOrder.totalEgp, currency)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg cursor-pointer"
              >
                متابعة التسوق
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-[#4E342E]/40 mx-auto" />
              <p className="text-sm font-semibold text-[#2A1A11]">سلة التسوق فارغة حالياً</p>
              <p className="text-xs text-[#4E342E]">
                اختر خلطات القهوة المفضلة لديك وحدد درجة الطحن والتحميص لإضافتها هنا.
              </p>
            </div>
          ) : (
            <>
              {/* Free shipping notice */}
              <div className="text-xs bg-[#FBF9F6] border border-[#2A1A11]/10 rounded-lg p-3 text-[#4E342E]">
                {subtotal >= freeShippingThreshold ? (
                  <span className="font-semibold text-[#1E7E34]">
                    ✔ طلبك مؤهل للشحن الدولي المجاني!
                  </span>
                ) : (
                  <span>
                    أضف منتجات بقيمة{' '}
                    <strong className="font-mono tabular-nums text-[#2A1A11]">
                      {formatMoney(freeShippingThreshold - subtotal, currency)}
                    </strong>{' '}
                    للحصول على شحن مجاني.
                  </span>
                )}
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex gap-3 p-3 rounded-xl border border-[#2A1A11]/10 bg-white"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F3EDE4] shrink-0">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#2A1A11] truncate">
                          {item.productName}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="text-[#4E342E]/60 hover:text-rose-700 cursor-pointer shrink-0"
                          aria-label={`حذف ${item.productName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#4E342E] mt-0.5">
                        {item.weight} · {item.roastLevel} · {item.grindType} · {item.spiceOption}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="inline-flex items-center gap-2 border border-[#2A1A11]/15 rounded-md px-1.5 py-0.5 bg-[#FBF9F6]">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartItemId, -1)}
                            className="p-0.5 text-[#2A1A11] cursor-pointer"
                            aria-label="إنقاص الكمية"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono tabular-nums font-bold px-1">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartItemId, 1)}
                            className="p-0.5 text-[#2A1A11] cursor-pointer"
                            aria-label="زيادة الكمية"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-mono tabular-nums font-bold text-[#2A1A11]">
                          {formatMoney(item.unitPriceEgp * item.quantity, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form id="b2c-checkout-form" onSubmit={handleCheckout} className="space-y-3 pt-4 border-t border-[#2A1A11]/10">
                <h3 className="text-sm font-bold text-[#2A1A11]">بيانات الشحن الدولي والدفع</h3>

                <label className="block">
                  <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                    الاسم الكامل
                  </span>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <label className="block">
                  <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                    رقم الهاتف الدولي
                  </span>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+966 5x xxx xxxx / +20 10x xxx xxxx"
                    className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                      الدولة
                    </span>
                    <select
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-2.5 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                      المدينة / المحافظة
                    </span>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full px-2.5 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                    >
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                    العنوان بالتفصيل
                  </span>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الحي، الشارع، رقم المبنى"
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg focus:outline-none focus:border-[#C89B3C]"
                  />
                </label>

                <div>
                  <span className="block text-[11px] font-semibold text-[#4E342E] mb-1">
                    طريقة الدفع
                  </span>
                  <div className="space-y-1.5">
                    {PAYMENT_METHODS.map((pm) => (
                      <label
                        key={pm}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                          paymentMethod === pm
                            ? 'border-[#2A1A11] bg-[#FBF9F6] text-[#2A1A11]'
                            : 'border-[#2A1A11]/10 text-[#4E342E]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === pm}
                          onChange={() => setPaymentMethod(pm)}
                          className="accent-[#2A1A11]"
                        />
                        <span>{pm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer Totals & Submit */}
        {cart.length > 0 && !confirmedOrder && (
          <div className="p-5 border-t border-[#2A1A11]/10 bg-[#FBF9F6] space-y-3">
            <div className="space-y-1 text-xs text-[#4E342E]">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-mono tabular-nums font-semibold text-[#2A1A11]">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>الشحن والتوصيل ({country}):</span>
                <span className="font-mono tabular-nums font-semibold text-[#2A1A11]">
                  {deliveryFee === 0 ? 'مجاني' : formatMoney(deliveryFee, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2A1A11]/10 text-sm font-bold text-[#2A1A11]">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono tabular-nums">{formatMoney(total, currency)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="b2c-checkout-form"
              className="w-full py-3 text-sm font-bold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg transition-colors cursor-pointer"
            >
              تأكيد وإتمام الطلب
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
