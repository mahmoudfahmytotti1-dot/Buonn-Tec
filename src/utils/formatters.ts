import { CurrencyCode, RetailWeight, SpiceOption } from '../types';

export const CURRENCY_META: Record<
  CurrencyCode,
  { label: string; symbol: string; egpPerUnit: number }
> = {
  EGP: { label: 'الجنيه المصري', symbol: 'ج.م', egpPerUnit: 1 },
  USD: { label: 'الدولار الأمريكي', symbol: '$', egpPerUnit: 49.65 },
  SAR: { label: 'الريال السعودي', symbol: 'ر.س', egpPerUnit: 13.24 },
  AED: { label: 'الدرهم الإماراتي', symbol: 'د.إ', egpPerUnit: 13.52 },
  EUR: { label: 'اليورو الأوروبي', symbol: '€', egpPerUnit: 52.8 },
};

export function convertFromEgp(amountEgp: number, currency: CurrencyCode): number {
  const rate = CURRENCY_META[currency]?.egpPerUnit || 1;
  return amountEgp / rate;
}

export function formatMoney(
  amountEgp: number,
  currency: CurrencyCode = 'EGP',
  showDecimals?: boolean
): string {
  const converted = convertFromEgp(amountEgp, currency);
  const decimals =
    showDecimals !== undefined ? (showDecimals ? 2 : 0) : currency === 'EGP' ? 0 : 2;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(converted);
  return `${formatted} ${CURRENCY_META[currency].symbol}`;
}

export function formatEgp(amount: number, showDecimals = false): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
  return `${formatted} ج.م`;
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function getTimestampNow(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function calculateRetailUnitPrice(
  base250g: number,
  weight: RetailWeight,
  spice: SpiceOption
): number {
  const weightFactor = weight === '250g' ? 1 : weight === '500g' ? 1.92 : 3.7;
  const spicePer250 = spice === 'محوج حبهان' ? 25 : 0;
  const spiceMultiplier = weight === '250g' ? 1 : weight === '500g' ? 2 : 4;
  return Math.round(base250g * weightFactor + spicePer250 * spiceMultiplier);
}
