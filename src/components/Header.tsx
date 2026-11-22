import React from 'react';
import { ShoppingBag, Globe } from 'lucide-react';
import { CurrencyCode, UserRole } from '../types';
import { CURRENCY_META } from '../utils/formatters';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  cartCount: number;
  onOpenCart: () => void;
}

const ROLE_TABS: { id: UserRole; label: string }[] = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'b2b_marketplace', label: 'تاجر / محمصة' },
  { id: 'importer_portal', label: 'بوابة المستورد' },
  { id: 'b2c_store', label: 'متجر المستهلك' },
  { id: 'super_admin', label: 'الإدارة العليا' },
];

const CURRENCY_OPTIONS: CurrencyCode[] = ['USD', 'EGP', 'SAR', 'AED', 'EUR'];

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onRoleChange,
  currency,
  onCurrencyChange,
  cartCount,
  onOpenCart,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#2A1A11]/12 shadow-[0_1px_14px_rgba(42,26,17,0.05)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Bespoke brand logo lockup */}
        <button
          type="button"
          onClick={() => {
            onRoleChange('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C89B3C] rounded-lg whitespace-nowrap shrink-0"
          aria-label="بُنّ تك — الصفحة الرئيسية"
        >
          <BrandLogo size="md" />
        </button>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav aria-label="التنقل الرئيسي في المنصة" className="hidden md:flex items-center gap-5 lg:gap-7">
          {ROLE_TABS.map((tab) => {
            const isActive = activeRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onRoleChange(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C89B3C] ${
                  isActive
                    ? 'text-[#1C110B]'
                    : 'text-[#4E342E]/75 hover:text-[#B4532A]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 inset-x-0 h-[2.5px] rounded-full bg-gradient-to-l from-[#1E7E34] via-[#C89B3C] to-[#B4532A]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Install App, Currency Switcher & Primary Cart Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <PWAInstallButton />

          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-[#FBF9F6] border border-[#2A1A11]/15 rounded-lg shrink-0">
            <Globe className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label="اختيار عملة العرض"
              className="text-xs font-bold text-[#2A1A11] bg-transparent focus:outline-none cursor-pointer whitespace-nowrap"
            >
              {CURRENCY_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code} ({CURRENCY_META[code].symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2A1A11] hover:bg-[#4E342E] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#C89B3C]" />
            <span className="hidden sm:inline">السلة</span>
            <span className="tabular-nums font-mono text-xs bg-[#C89B3C] text-[#2A1A11] font-bold px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
