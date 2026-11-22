export type UserRole =
  | 'home'
  | 'b2b_marketplace'
  | 'importer_portal'
  | 'b2c_store'
  | 'super_admin';

export type CurrencyCode = 'USD' | 'EGP' | 'SAR' | 'AED' | 'EUR';

export type Incoterm = 'EXW (أرض المخزن)' | 'FOB (ميناء المنشأ)' | 'CIF (واصل للميناء)' | 'DDP (واصل للمستودع)';

export type CoffeeOrigin =
  | 'البرازيل'
  | 'إندونيسيا'
  | 'الهند'
  | 'إثيوبيا'
  | 'كولومبيا'
  | 'غواتيمالا'
  | 'فيتنام'
  | 'اليمن';

export type CoffeeSpecies = 'أرابيكا' | 'روبوستا';

export type PartnerCodingStatus =
  | 'بانتظار التكويد والاعتماد'
  | 'معتمد ومفعّل'
  | 'مرفوض';

export type TraderActivityType =
  | 'محمصة بن'
  | 'مطحنة'
  | 'موزع جملة'
  | 'كافيه / سلسلة';

export interface PartnerAccount {
  id: string;
  name: string;
  anonCode: string;
  type: 'importer' | 'roaster';
  country: string;
  governorate: string;
  phone: string;
  taxId?: string;
  verified: boolean;
  joinedAt: string;
  email?: string;
  username?: string;
  password?: string;
  contactPerson?: string;
  commercialReg?: string;
  primaryActivity?: string;
  warehouseAddress?: string;
  businessActivityType?: TraderActivityType;
  preferredOriginsAndVarieties?: string[];
  supplyCapacityOrActivity?: string;
  monthlyOrderVolume?: string;
  codingCode?: string;
  codingStatus?: PartnerCodingStatus;
  codingSubmittedAt?: string;
  codingReviewNote?: string;
}

export interface PriceHistoryEntry {
  id: string;
  timestamp: string;
  oldPrice: number;
  newPrice: number;
  oldTons: number;
  newTons: number;
  note: string;
}

export type LotApprovalStatus =
  | 'بانتظار الاعتماد'
  | 'معتمد'
  | 'مرفوض / مطلوب تعديل';

export interface GreenCoffeeLot {
  id: string;
  lotCode: string;
  title: string;
  origin: CoffeeOrigin;
  species: CoffeeSpecies;
  process: string;
  screen: string;
  moisturePct: number;
  scaScore: number;
  bagWeightKg: number;
  minOrderTons: number;
  incoterm: Incoterm;
  cropYear: string;
  availableTons: number;
  pricePerKgEgp: number;
  importerId: string;
  importerName: string;
  warehouseLocation: string;
  warehouseGovernorate: string;
  qualitySealed: boolean;
  approvalStatus: LotApprovalStatus;
  rejectionNote?: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  whiteBgStudio?: boolean;
  priceHistory: PriceHistoryEntry[];
}

export type RfqStatus =
  | 'بانتظار التسعير'
  | 'تم إرسال العرض'
  | 'تم الاتفاق / جاري التنفيذ'
  | 'مكتملة'
  | 'مرفوض';

export type RfqType = 'sample' | 'bulk_rfq';

export interface NegotiationMessage {
  id: string;
  senderRole: 'roaster' | 'importer' | 'system';
  senderLabel: string;
  text: string;
  proposedPricePerKgEgp?: number;
  timestamp: string;
}

export interface ContactViolationAttempt {
  id: string;
  senderRole: 'roaster' | 'importer';
  attemptedText: string;
  reason: string;
  timestamp: string;
}

export interface RfqRequest {
  id: string;
  lotId: string;
  lotCode: string;
  lotTitle: string;
  importerId: string;
  importerName: string;
  importerAnonCode: string;
  roasterName: string;
  roasterAnonCode: string;
  type: RfqType;
  sampleWeightGrams?: 250 | 500;
  requestedTons?: number;
  targetGovernorate: string;
  notes: string;
  status: RfqStatus;
  initialPricePerKgEgp: number;
  quotedPricePerKgEgp?: number;
  stockDeducted?: boolean;
  messages: NegotiationMessage[];
  contactViolations: ContactViolationAttempt[];
  createdAt: string;
  completedAt?: string;
}

export type RetailWeight = '250g' | '500g' | '1kg';
export type RoastLevel = 'فاتح' | 'وسط' | 'غامق';
export type GrindType = 'تركي' | 'إسبريسو' | 'فلتر' | 'حبوب كاملة';
export type SpiceOption = 'سادة' | 'محوج حبهان';

export interface RetailProduct {
  id: string;
  name: string;
  roasterId: string;
  roasterName: string;
  originLabel: string;
  category: 'تركي وتقليدي' | 'إسبريسو' | 'فلتر ومختصة';
  basePrice250gEgp: number;
  tastingNotes: string;
  inStock: boolean;
  qualitySealed: boolean;
  imageUrl: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  roasterName: string;
  imageUrl: string;
  weight: RetailWeight;
  roastLevel: RoastLevel;
  grindType: GrindType;
  spiceOption: SpiceOption;
  unitPriceEgp: number;
  quantity: number;
}

export type PaymentMethod =
  | 'الدفع عند الاستلام (COD)'
  | 'إنستاباي / تحويل فوري'
  | 'بطاقة ائتمان دولية (Visa / Mastercard)';

export type RetailOrderStatus = 'قيد التجهيز' | 'تم التحميص والتغليف' | 'تم التسليم';

export interface RetailOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  country: string;
  governorate: string;
  address: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  subtotalEgp: number;
  deliveryFeeEgp: number;
  totalEgp: number;
  platformCommissionEgp: number;
  status: RetailOrderStatus;
  createdAt: string;
}

export interface LocalTickerItem {
  id: string;
  name: string;
  grade: string;
  pricePerKgEgp: number;
  changePct: number;
}

export type CommissionMode = 'percent' | 'per_kg';

export interface CommissionRule {
  mode: CommissionMode;
  value: number;
}

export interface CommissionSettings {
  b2bRatePct: number;
  b2cRatePct: number;
  partnerRules: Record<string, CommissionRule>;
  dealOverrides: Record<string, CommissionRule>;
}

export interface ConsumerProfile {
  name: string;
  phone: string;
  email?: string;
  country: string;
  governorate: string;
  address: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
}

export interface AppState {
  partners: PartnerAccount[];
  lots: GreenCoffeeLot[];
  rfqs: RfqRequest[];
  retailProducts: RetailProduct[];
  retailOrders: RetailOrder[];
  localTicker: LocalTickerItem[];
  cart: CartItem[];
  commissionSettings: CommissionSettings;
  contactInquiries?: ContactInquiry[];
}
