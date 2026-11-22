import { PartnerAccount, RfqStatus } from '../types';

export function isDealConfirmedStatus(status: RfqStatus): boolean {
  return status === 'تم الاتفاق / جاري التنفيذ' || status === 'مكتملة';
}

export function getMaskedImporterLabel(
  importerId: string,
  partners: PartnerAccount[],
  fallbackAnonCode?: string
): string {
  const partner = partners.find((p) => p.id === importerId);
  const code = partner?.anonCode || fallbackAnonCode || 'IMP-100';
  const prefix = partner?.verified ? 'مورد / مستورد معتمد' : 'مورد مسجل';
  return `${prefix} #${code}`;
}

export function getMaskedRoasterLabel(
  roasterName: string,
  partners: PartnerAccount[],
  fallbackAnonCode?: string
): string {
  const partner = partners.find((p) => p.name === roasterName && p.type === 'roaster');
  const code = partner?.anonCode || fallbackAnonCode || 'ROA-200';
  const prefix = partner?.verified ? 'محمصة معتمدة' : 'محمصة مسجلة';
  return `${prefix} #${code}`;
}

export interface ContentGuardResult {
  blocked: boolean;
  reason: string;
}

const ARABIC_INDIC_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (ch) => ARABIC_INDIC_MAP[ch] ?? ch);
}

const CONTACT_KEYWORDS = [
  'واتساب',
  'واتس',
  'whatsapp',
  'تيليجرام',
  'تليجرام',
  'telegram',
  'wechat',
  'skype',
  'تليفون',
  'تلفون',
  'موبايل',
  'هاتف',
  'جوال',
  'رقم',
  'اتصل',
  'كلمني',
  'كاش',
  'انستا باي',
  'انستاباي',
  'instapay',
  'iban',
  'swift',
  'paypal',
  'wise',
  'عنوان',
  'مخزن',
  'مستودع',
  'لوكيشن',
];

const NUMBER_WORDS = [
  'صفر',
  'زيرو',
  'واحد',
  'اتنين',
  'اثنين',
  'تلاتة',
  'ثلاثة',
  'اربعة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'تمانية',
  'ثمانية',
  'تسعة',
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
];

export function detectContactViolation(
  rawText: string,
  partnerNames: string[] = []
): ContentGuardResult {
  const text = rawText.trim();
  if (!text) {
    return { blocked: false, reason: '' };
  }

  const normalized = normalizeDigits(text);
  const lower = normalized.toLowerCase();

  // 1. Check email addresses
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(normalized)) {
    return {
      blocked: true,
      reason: 'تم حظر الرسالة: يُمنع إرسال عناوين البريد الإلكتروني قبل إتمام الصفقة.',
    };
  }

  // 2. Check URLs / domains / social handles
  if (
    /(https?:\/\/|www\.|wa\.me|t\.me|fb\.com|linkedin\.com|[a-z0-9-]+\.(com|net|org|eg|ae|sa|io))/i.test(
      normalized
    )
  ) {
    return {
      blocked: true,
      reason: 'تم حظر الرسالة: يُمنع إرسال الروابط أو المواقع الإلكترونية قبل إتمام الصفقة.',
    };
  }

  // 3. Check international & regional phone numbers (even with spaces/dashes/dots)
  const strippedSeparators = normalized.replace(/[\s\-._()]+/g, '');
  if (
    /(?:\+?2?01[0125]\d{8}|\+?(?:966|971|965|974|44|1)\d{7,10}|0\d{8,}|\d{7,})/.test(
      strippedSeparators
    )
  ) {
    return {
      blocked: true,
      reason: 'تم حظر الرسالة: تم رصد تسلسل أرقام قد يمثل رقم هاتف أو حساب تواصل خارجي.',
    };
  }

  // 4. Check sequences of Arabic/English number words (3+ number words in one message)
  let numberWordHits = 0;
  for (const word of NUMBER_WORDS) {
    const regex = new RegExp(`(?:^|\\s)${word}(?:\\s|$)`, 'i');
    if (regex.test(lower)) {
      numberWordHits += 1;
    }
  }
  if (numberWordHits >= 3) {
    return {
      blocked: true,
      reason: 'تم حظر الرسالة: تم رصد كتابة أرقام بالكلمات للالتفاف على سياسة التواصل.',
    };
  }

  // 5. Check prohibited contact keywords
  for (const kw of CONTACT_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        blocked: true,
        reason: `تم حظر الرسالة: ذِكر «${kw}» غير مسموح به قبل تأكيد الصفقة وإتمامها عبر المنصة.`,
      };
    }
  }

  // 6. Check if real partner / company names are explicitly typed
  for (const name of partnerNames) {
    const cleanName = name.trim();
    if (!cleanName) continue;
    const words = cleanName.split(/\s+/).filter((w) => w.length >= 3);
    if (lower.includes(cleanName.toLowerCase())) {
      return {
        blocked: true,
        reason: 'تم حظر الرسالة: يُحظر ذكر أسماء الشركات أو الجهات المشاركة قبل إتمام الصفقة.',
      };
    }
    if (words.length >= 2 && lower.includes(`${words[0]} ${words[1]}`.toLowerCase())) {
      return {
        blocked: true,
        reason: 'تم حظر الرسالة: يُحظر الإفصاح عن اسم الشركة أو الطرف الآخر قبل تأكيد الصفقة.',
      };
    }
  }

  return { blocked: false, reason: '' };
}
