/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Home,
  ShieldCheck,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import {
  AppState,
  CartItem,
  CommissionSettings,
  ConsumerProfile,
  ContactInquiry,
  CurrencyCode,
  GreenCoffeeLot,
  LocalTickerItem,
  PartnerAccount,
  RetailOrder,
  RetailOrderStatus,
  RetailProduct,
  RfqRequest,
  RfqStatus,
  RfqType,
  UserRole,
} from './types';
import { INITIAL_APP_STATE } from './data/seedData';
import { getTimestampNow } from './utils/formatters';
import { generateNextPartnerCode } from './utils/partnerCoding';
import {
  getMaskedImporterLabel,
  getMaskedRoasterLabel,
  isDealConfirmedStatus,
} from './utils/contentGuard';
import {
  calculateCommissionAmountEgp,
  getRetailOrderWeightKg,
  resolveB2CCommission,
} from './utils/commission';
import { Header } from './components/Header';
import { BrandLogo } from './components/BrandLogo';
import { LandingPage } from './components/LandingPage';
import { ExchangeBars } from './components/ExchangeBars';
import { B2BMarketplace } from './components/B2BMarketplace';
import { ImporterPortal } from './components/ImporterPortal';
import { B2CStoreAndRoaster } from './components/B2CStoreAndRoaster';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { NegotiationChatDrawer } from './components/NegotiationChatDrawer';
import { LotDetailModal } from './components/LotDetailModal';
import { ProformaInvoiceModal } from './components/ProformaInvoiceModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const MOBILE_NAV_ITEMS: { id: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'b2b_marketplace', label: 'التاجر', icon: Store },
  { id: 'importer_portal', label: 'المستورد', icon: Building2 },
  { id: 'b2c_store', label: 'المتجر', icon: ShoppingBag },
  { id: 'super_admin', label: 'الإدارة', icon: ShieldCheck },
];

const STORAGE_KEY = 'bunntech_app_state_v3';
const ROLE_STORAGE_KEY = 'bunntech_active_role_v2';
const CURRENCY_STORAGE_KEY = 'bunntech_currency_v1';
const IMPORTER_SESSION_KEY = 'bunntech_importer_session_v1';
const TRADER_SESSION_KEY = 'bunntech_trader_session_v1';
const CONSUMER_PROFILE_KEY = 'bunntech_consumer_profile_v1';

interface ToastMessage {
  id: number;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_APP_STATE;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.lots) || !Array.isArray(parsed.retailProducts)) {
      return INITIAL_APP_STATE;
    }
    return {
      ...INITIAL_APP_STATE,
      ...parsed,
      partners: (parsed.partners || INITIAL_APP_STATE.partners).map((p) => {
        const seedPartner = INITIAL_APP_STATE.partners.find((sp) => sp.id === p.id);
        return {
          ...p,
          country: p.country || seedPartner?.country || 'مصر',
          email: p.email || seedPartner?.email,
          username: p.username || seedPartner?.username,
          password: p.password || seedPartner?.password,
          contactPerson: p.contactPerson || seedPartner?.contactPerson,
          commercialReg: p.commercialReg || seedPartner?.commercialReg,
          primaryActivity: p.primaryActivity || seedPartner?.primaryActivity,
          codingCode: p.codingCode || seedPartner?.codingCode,
          codingStatus:
            p.codingStatus ||
            (p.verified ? 'معتمد ومفعّل' : seedPartner?.codingStatus || 'بانتظار التكويد والاعتماد'),
          codingSubmittedAt: p.codingSubmittedAt || seedPartner?.codingSubmittedAt || p.joinedAt,
        };
      }),
      lots: (parsed.lots || []).map((l, idx) => {
        const seedLot =
          INITIAL_APP_STATE.lots.find((sl) => sl.id === l.id) ||
          INITIAL_APP_STATE.lots[idx % INITIAL_APP_STATE.lots.length];
        return {
          ...seedLot,
          ...l,
          scaScore: l.scaScore ?? 82.5,
          bagWeightKg: l.bagWeightKg ?? 60,
          minOrderTons: l.minOrderTons ?? 0.6,
          incoterm: l.incoterm || 'EXW (أرض المخزن)',
          approvalStatus: l.approvalStatus || seedLot.approvalStatus || 'معتمد',
        };
      }),
      rfqs: (parsed.rfqs || []).map((r) => ({
        ...r,
        messages: r.messages || [],
        contactViolations: r.contactViolations || [],
      })),
      retailOrders: (parsed.retailOrders || INITIAL_APP_STATE.retailOrders).map((o) => ({
        ...o,
        country: o.country || 'مصر',
      })),
      commissionSettings: {
        ...INITIAL_APP_STATE.commissionSettings,
        ...(parsed.commissionSettings || {}),
        partnerRules: {
          ...INITIAL_APP_STATE.commissionSettings.partnerRules,
          ...(parsed.commissionSettings?.partnerRules || {}),
        },
        dealOverrides: {
          ...(parsed.commissionSettings?.dealOverrides || {}),
        },
      },
      contactInquiries: parsed.contactInquiries || [],
    };
  } catch {
    return INITIAL_APP_STATE;
  }
}

function loadInitialRole(): UserRole {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (
      raw === 'home' ||
      raw === 'b2b_marketplace' ||
      raw === 'importer_portal' ||
      raw === 'b2c_store' ||
      raw === 'super_admin'
    ) {
      return raw;
    }
    return 'home';
  } catch {
    return 'home';
  }
}

function loadInitialCurrency(): CurrencyCode {
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
    if (raw === 'USD' || raw === 'EGP' || raw === 'SAR' || raw === 'AED' || raw === 'EUR') {
      return raw;
    }
    return 'USD';
  } catch {
    return 'USD';
  }
}

function loadInitialSession(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

function loadInitialConsumerProfile(): ConsumerProfile | null {
  try {
    const raw = localStorage.getItem(CONSUMER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsumerProfile;
    return parsed && parsed.name ? parsed : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadInitialState);
  const [activeRole, setActiveRole] = useState<UserRole>(loadInitialRole);
  const [currency, setCurrency] = useState<CurrencyCode>(loadInitialCurrency);
  const [loggedInImporterId, setLoggedInImporterId] = useState<string | null>(() =>
    loadInitialSession(IMPORTER_SESSION_KEY)
  );
  const [loggedInTraderId, setLoggedInTraderId] = useState<string | null>(() =>
    loadInitialSession(TRADER_SESSION_KEY)
  );
  const [consumerProfile, setConsumerProfile] = useState<ConsumerProfile | null>(
    loadInitialConsumerProfile
  );
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Modals & Drawers
  const [chatRfqId, setChatRfqId] = useState<string | null>(null);
  const [chatViewerRole, setChatViewerRole] = useState<'roaster' | 'importer' | 'admin'>(
    'roaster'
  );
  const [detailLot, setDetailLot] = useState<GreenCoffeeLot | null>(null);
  const [invoiceRfq, setInvoiceRfq] = useState<RfqRequest | null>(null);
  const [pendingRfqTrigger, setPendingRfqTrigger] = useState<{
    lot: GreenCoffeeLot;
    type: RfqType;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch {
      // Ignore storage quota errors
    }
  }, [appState]);

  useEffect(() => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, activeRole);
    } catch {
      // Ignore storage errors
    }
  }, [activeRole]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // Ignore storage errors
    }
  }, [currency]);

  useEffect(() => {
    try {
      if (loggedInImporterId) {
        localStorage.setItem(IMPORTER_SESSION_KEY, loggedInImporterId);
      } else {
        localStorage.removeItem(IMPORTER_SESSION_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [loggedInImporterId]);

  useEffect(() => {
    try {
      if (loggedInTraderId) {
        localStorage.setItem(TRADER_SESSION_KEY, loggedInTraderId);
      } else {
        localStorage.removeItem(TRADER_SESSION_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [loggedInTraderId]);

  useEffect(() => {
    try {
      if (consumerProfile) {
        localStorage.setItem(CONSUMER_PROFILE_KEY, JSON.stringify(consumerProfile));
      } else {
        localStorage.removeItem(CONSUMER_PROFILE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [consumerProfile]);

  const showToast = (
    text: string,
    actionLabel?: string,
    onAction?: () => void
  ) => {
    const id = Date.now();
    setToast({ id, text, actionLabel, onAction });
    setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 4000);
  };

  const handleResetDemo = () => {
    setAppState(INITIAL_APP_STATE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APP_STATE));
    setLoggedInImporterId(null);
    localStorage.removeItem(IMPORTER_SESSION_KEY);
    setLoggedInTraderId(null);
    localStorage.removeItem(TRADER_SESSION_KEY);
    setConsumerProfile(null);
    localStorage.removeItem(CONSUMER_PROFILE_KEY);
    setChatRfqId(null);
    setDetailLot(null);
    setInvoiceRfq(null);
    showToast('تمت إعادة ضبط كافة بيانات المنصة إلى الوضع التجريبي الافتراضي.');
  };

  // B2B Actions
  const handleSubmitRfq = (rfq: RfqRequest) => {
    setAppState((prev) => ({
      ...prev,
      rfqs: [rfq, ...prev.rfqs],
    }));
    showToast(
      `تم إرسال ${rfq.type === 'sample' ? 'طلب العينة' : 'طلب عرض السعر'} (${rfq.id}).`,
      'فتح المحادثة',
      () => {
        setChatViewerRole('roaster');
        setChatRfqId(rfq.id);
      }
    );
  };

  const handleUpdateLotPriceStock = (
    lotId: string,
    newPrice: number,
    newTons: number
  ) => {
    setAppState((prev) => ({
      ...prev,
      lots: prev.lots.map((lot) => {
        if (lot.id !== lotId) return lot;
        const entry = {
          id: `ph-${Date.now()}`,
          timestamp: getTimestampNow(),
          oldPrice: lot.pricePerKgEgp,
          newPrice,
          oldTons: lot.availableTons,
          newTons,
          note: 'تحديث فوري من بوابة المستورد',
        };
        return {
          ...lot,
          pricePerKgEgp: newPrice,
          availableTons: newTons,
          priceHistory: [entry, ...lot.priceHistory],
        };
      }),
    }));
    showToast('تم تحديث السعر والكمية في سوق الجملة فوراً.');
  };

  const handleAddNewLot = (lot: GreenCoffeeLot) => {
    setAppState((prev) => ({
      ...prev,
      lots: [lot, ...prev.lots],
    }));
    showToast(
      `تم إرسال المنتج الجديد «${lot.title}» للمراجعة والاعتماد من الإدارة العليا قبل النشر في السوق.`
    );
  };

  const handleLoginImporter = (importerId: string) => {
    const importer = appState.partners.find(
      (p) => p.id === importerId && p.type === 'importer'
    );
    setLoggedInImporterId(importerId);
    showToast(
      importer
        ? `تم تسجيل الدخول إلى حساب «${importer.name}».`
        : 'تم تسجيل الدخول إلى بوابة المستورد.'
    );
  };

  const handleLogoutImporter = () => {
    setLoggedInImporterId(null);
    showToast('تم تسجيل الخروج من بوابة المستورد.');
  };

  const handleResubmitLot = (lotId: string) => {
    setAppState((prev) => ({
      ...prev,
      lots: prev.lots.map((l) =>
        l.id === lotId
          ? { ...l, approvalStatus: 'بانتظار الاعتماد', rejectionNote: undefined }
          : l
      ),
    }));
    showToast('تمت إعادة إرسال المنتج لمراجعة واعتماد الإدارة العليا.');
  };

  const handleUpdateRfq = (
    rfqId: string,
    status: RfqStatus,
    quotedPrice?: number
  ) => {
    setAppState((prev) => {
      const targetRfq = prev.rfqs.find((r) => r.id === rfqId);
      let updatedLots = prev.lots;
      const becomingConfirmed =
        targetRfq &&
        isDealConfirmedStatus(status) &&
        !targetRfq.stockDeducted;

      if (
        targetRfq &&
        becomingConfirmed &&
        targetRfq.type === 'bulk_rfq' &&
        targetRfq.requestedTons
      ) {
        updatedLots = prev.lots.map((lot) => {
          if (lot.id !== targetRfq.lotId) return lot;
          const remaining = Math.max(
            0,
            Number((lot.availableTons - (targetRfq.requestedTons || 0)).toFixed(2))
          );
          return {
            ...lot,
            availableTons: remaining,
            priceHistory: [
              {
                id: `ph-${Date.now()}`,
                timestamp: getTimestampNow(),
                oldPrice: lot.pricePerKgEgp,
                newPrice: lot.pricePerKgEgp,
                oldTons: lot.availableTons,
                newTons: remaining,
                note: `حجز كمية اتفاق ${targetRfq.id} (${targetRfq.requestedTons} طن)`,
              },
              ...lot.priceHistory,
            ],
          };
        });
      }

      const justEnteredConfirmed =
        targetRfq &&
        !isDealConfirmedStatus(targetRfq.status) &&
        isDealConfirmedStatus(status);

      return {
        ...prev,
        lots: updatedLots,
        rfqs: prev.rfqs.map((r) => {
          if (r.id !== rfqId) return r;
          const nextMessages = justEnteredConfirmed
            ? [
                ...r.messages,
                {
                  id: `sys-${Date.now()}`,
                  senderRole: 'system' as const,
                  senderLabel: 'إدارة المنصة',
                  text: 'بيانات الطرفين مكتملة لإتمام التسليم — تم تأكيد الاتفاق وكشف هوية الطرفين المعتمدة.',
                  timestamp: getTimestampNow(),
                },
              ]
            : r.messages;

          return {
            ...r,
            status,
            quotedPricePerKgEgp: quotedPrice ?? r.quotedPricePerKgEgp,
            stockDeducted: r.stockDeducted || Boolean(becomingConfirmed),
            messages: nextMessages,
            completedAt: isDealConfirmedStatus(status)
              ? r.completedAt || getTimestampNow()
              : r.completedAt,
          };
        }),
      };
    });

    showToast(
      isDealConfirmedStatus(status)
        ? 'تم تأكيد الاتفاق وكشف بيانات الطرفين لإتمام التسليم.'
        : `تم تحديث حالة الطلب ${rfqId} إلى «${status}».`
    );
  };

  // Negotiation Chat Handlers
  const handleOpenChat = (
    rfqId: string,
    viewerRole: 'roaster' | 'importer' | 'admin'
  ) => {
    setChatViewerRole(viewerRole);
    setChatRfqId(rfqId);
  };

  const handleSendNegotiationMessage = (
    rfqId: string,
    senderRole: 'roaster' | 'importer',
    text: string,
    proposedPricePerKgEgp?: number
  ) => {
    setAppState((prev) => ({
      ...prev,
      rfqs: prev.rfqs.map((r) => {
        if (r.id !== rfqId) return r;
        const senderLabel =
          senderRole === 'importer'
            ? getMaskedImporterLabel(r.importerId, prev.partners, r.importerAnonCode)
            : getMaskedRoasterLabel(r.roasterName, prev.partners, r.roasterAnonCode);

        return {
          ...r,
          quotedPricePerKgEgp:
            senderRole === 'importer' && proposedPricePerKgEgp
              ? proposedPricePerKgEgp
              : r.quotedPricePerKgEgp,
          messages: [
            ...r.messages,
            {
              id: `msg-${Date.now()}`,
              senderRole,
              senderLabel,
              text,
              proposedPricePerKgEgp,
              timestamp: getTimestampNow(),
            },
          ],
        };
      }),
    }));
  };

  const handleLogContactViolation = (
    rfqId: string,
    senderRole: 'roaster' | 'importer',
    attemptedText: string,
    reason: string
  ) => {
    setAppState((prev) => ({
      ...prev,
      rfqs: prev.rfqs.map((r) => {
        if (r.id !== rfqId) return r;
        return {
          ...r,
          contactViolations: [
            ...(r.contactViolations || []),
            {
              id: `viol-${Date.now()}`,
              senderRole,
              attemptedText,
              reason,
              timestamp: getTimestampNow(),
            },
          ],
        };
      }),
    }));
  };

  // B2C Actions
  const handleAddToCart = (newItem: CartItem) => {
    setAppState((prev) => {
      const existing = prev.cart.find((c) => c.cartItemId === newItem.cartItemId);
      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map((c) =>
            c.cartItemId === newItem.cartItemId
              ? { ...c, quantity: c.quantity + 1 }
              : c
          ),
        };
      }
      return {
        ...prev,
        cart: [...prev.cart, newItem],
      };
    });
    showToast(`تمت إضافة «${newItem.productName}» إلى السلة.`, 'عرض السلة', () =>
      setIsCartOpen(true)
    );
  };

  const handleUpdateCartQty = (cartItemId: string, delta: number) => {
    setAppState((prev) => ({
      ...prev,
      cart: prev.cart
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0),
    }));
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setAppState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.cartItemId !== cartItemId),
    }));
  };

  const handleCompleteOrder = (order: RetailOrder) => {
    const weightKg = getRetailOrderWeightKg(order);
    const { rule } = resolveB2CCommission(
      order,
      appState.partners,
      appState.commissionSettings
    );
    const computedCommission = Math.round(
      calculateCommissionAmountEgp(order.subtotalEgp, weightKg, rule)
    );
    setAppState((prev) => ({
      ...prev,
      retailOrders: [
        { ...order, platformCommissionEgp: computedCommission },
        ...prev.retailOrders,
      ],
      cart: [],
    }));
    showToast(`تم تسجيل الطلب #${order.id} وإرساله إلى المحمصة.`);
  };

  const handleAddRetailProduct = (product: RetailProduct) => {
    setAppState((prev) => ({
      ...prev,
      retailProducts: [product, ...prev.retailProducts],
    }));
    showToast(`تمت إضافة المنتج «${product.name}» إلى المتجر.`);
  };

  const handleUpdateRetailProduct = (
    productId: string,
    basePrice: number,
    inStock: boolean
  ) => {
    setAppState((prev) => ({
      ...prev,
      retailProducts: prev.retailProducts.map((p) =>
        p.id === productId
          ? { ...p, basePrice250gEgp: Math.max(20, basePrice), inStock }
          : p
      ),
    }));
    showToast('تم تحديث بيانات المنتج في المتجر.');
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: RetailOrderStatus
  ) => {
    setAppState((prev) => ({
      ...prev,
      retailOrders: prev.retailOrders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
    }));
    showToast(`تم تحديث حالة الطلب #${orderId} إلى «${status}».`);
  };

  // Partner Registration & Trader Auth
  const handleRegisterPartner = (partner: PartnerAccount) => {
    setAppState((prev) => ({
      ...prev,
      partners: [partner, ...prev.partners],
    }));
    if (partner.type === 'importer') {
      setLoggedInImporterId(partner.id);
    } else {
      setLoggedInTraderId(partner.id);
    }
    showToast(
      `تم إرسال طلب تكويد «${partner.name}» بنجاح بحالة «بانتظار التكويد والاعتماد» للمراجعة من الإدارة العليا.`
    );
  };

  const handleLoginTrader = (traderId: string) => {
    const trader = appState.partners.find(
      (p) => p.id === traderId && p.type === 'roaster'
    );
    setLoggedInTraderId(traderId);
    showToast(
      trader
        ? `تم تسجيل الدخول إلى حساب «${trader.name}».`
        : 'تم تسجيل الدخول إلى بوابة التاجر والمحمصة.'
    );
  };

  const handleLogoutTrader = () => {
    setLoggedInTraderId(null);
    showToast('تم تسجيل الخروج من حساب التاجر / المحمصة.');
  };

  const handleSaveConsumerProfile = (profile: ConsumerProfile) => {
    setConsumerProfile(profile);
    showToast(`تم حفظ بيانات المستهلك «${profile.name}» لتسهيل إتمام الطلبات.`);
  };

  const handleLogoutConsumer = () => {
    setConsumerProfile(null);
    showToast('تم التبديل إلى وضع الضيف السريع.');
  };

  const handleAddContactInquiry = (inquiry: ContactInquiry) => {
    setAppState((prev) => ({
      ...prev,
      contactInquiries: [inquiry, ...(prev.contactInquiries || [])],
    }));
    showToast(`تم إرسال رسالتك (${inquiry.id}) إلى فريق الإدارة العليا.`);
  };

  // Super Admin Actions
  const handleTogglePartnerVerified = (partnerId: string) => {
    setAppState((prev) => ({
      ...prev,
      partners: prev.partners.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              verified: !p.verified,
              codingStatus: !p.verified ? 'معتمد ومفعّل' : 'بانتظار التكويد والاعتماد',
            }
          : p
      ),
    }));
    showToast('تم تحديث حالة اعتماد الشريك بنجاح.');
  };

  const handleApprovePartnerCoding = (partnerId: string, codingCode: string) => {
    setAppState((prev) => ({
      ...prev,
      partners: prev.partners.map((p) => {
        if (p.id !== partnerId) return p;
        const resolvedCode =
          codingCode.trim() ||
          p.codingCode ||
          (p.anonCode.startsWith('IMP-') || p.anonCode.startsWith('RST-')
            ? p.anonCode
            : generateNextPartnerCode(p.type, prev.partners));
        return {
          ...p,
          verified: true,
          codingStatus: 'معتمد ومفعّل',
          codingCode: resolvedCode,
          anonCode:
            p.type === 'importer' && resolvedCode.toUpperCase().startsWith('IMP-')
              ? resolvedCode.toUpperCase()
              : p.type === 'roaster' && resolvedCode.toUpperCase().startsWith('RST-')
              ? resolvedCode.toUpperCase()
              : p.anonCode,
          codingReviewNote: undefined,
        };
      }),
    }));
    showToast('تم اعتماد وتكويد الحساب بنجاح وتفعيله في المنصة.');
  };

  const handleRejectPartnerCoding = (partnerId: string, note?: string) => {
    setAppState((prev) => ({
      ...prev,
      partners: prev.partners.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              verified: false,
              codingStatus: 'مرفوض',
              codingReviewNote: note?.trim() || 'يرجى مراجعة بيانات السجل التجاري والبطاقة الضريبية.',
            }
          : p
      ),
    }));
    showToast('تم تسجيل ملاحظة الرفض وإخطار مقدم طلب التكويد.');
  };

  const handleApproveLot = (lotId: string) => {
    setAppState((prev) => ({
      ...prev,
      lots: prev.lots.map((l) =>
        l.id === lotId
          ? { ...l, approvalStatus: 'معتمد', rejectionNote: undefined }
          : l
      ),
    }));
    showToast('تم اعتماد المنتج ونشره في سوق الجملة فوراً.');
  };

  const handleRejectLot = (lotId: string, note?: string) => {
    setAppState((prev) => ({
      ...prev,
      lots: prev.lots.map((l) =>
        l.id === lotId
          ? {
              ...l,
              approvalStatus: 'مرفوض / مطلوب تعديل',
              rejectionNote: note?.trim() || undefined,
            }
          : l
      ),
    }));
    showToast('تم تحديث حالة المنتج إلى «مرفوض / مطلوب تعديل» وإخطار المستورد.');
  };

  const handleToggleLotSeal = (lotId: string) => {
    setAppState((prev) => ({
      ...prev,
      lots: prev.lots.map((l) =>
        l.id === lotId ? { ...l, qualitySealed: !l.qualitySealed } : l
      ),
    }));
    showToast('تم تحديث شارة الجودة المفحوصة لمنتج البن الأخضر.');
  };

  const handleToggleProductSeal = (productId: string) => {
    setAppState((prev) => ({
      ...prev,
      retailProducts: prev.retailProducts.map((p) =>
        p.id === productId ? { ...p, qualitySealed: !p.qualitySealed } : p
      ),
    }));
    showToast('تم تحديث شارة الجودة المفحوصة لمنتج التجزئة.');
  };

  const handleSaveLocalTicker = (items: LocalTickerItem[]) => {
    setAppState((prev) => ({
      ...prev,
      localTicker: items,
    }));
    showToast('تم تحديث مؤشر الأسعار العالمي اليومي في الشريط العلوي.');
  };

  const handleUpdateCommissionSettings = (settings: CommissionSettings) => {
    setAppState((prev) => ({
      ...prev,
      commissionSettings: settings,
    }));
    showToast('تم تحديث إعدادات العمولات اليدوية والمستقلة في دفتر الإدارة العليا.');
  };

  const totalCartCount = appState.cart.reduce((s, i) => s + i.quantity, 0);
  const activeChatRfq = appState.rfqs.find((r) => r.id === chatRfqId) || null;
  const activeChatLot = activeChatRfq
    ? appState.lots.find((l) => l.id === activeChatRfq.lotId)
    : undefined;
  const activeInvoiceLot = invoiceRfq
    ? appState.lots.find((l) => l.id === invoiceRfq.lotId)
    : undefined;

  const approvedLotsCount = appState.lots.filter((l) => l.approvalStatus === 'معتمد').length;
  const verifiedPartnersCount = appState.partners.filter((p) => p.verified).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F6] text-[#2A1A11] pb-20 md:pb-0">
      {/* Sticky Top Header */}
      <Header
        activeRole={activeRole}
        onRoleChange={(role) => setActiveRole(role)}
        currency={currency}
        onCurrencyChange={setCurrency}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Global Commodity Ticker, Live Chart, Calculator & Spot Index on Role Workspaces */}
      {activeRole !== 'home' && (
        <ExchangeBars
          localTicker={appState.localTicker}
          activeRole={activeRole}
          currency={currency}
        />
      )}

      {/* Active Role Perspective Viewport */}
      <main className="flex-1">
        {activeRole === 'home' && (
          <LandingPage
            approvedLotsCount={approvedLotsCount}
            verifiedPartnersCount={verifiedPartnersCount}
            retailProductsCount={appState.retailProducts.length}
            onSelectRole={(role) => setActiveRole(role)}
            onSubmitInquiry={handleAddContactInquiry}
          />
        )}

        {activeRole === 'b2b_marketplace' && (
          <B2BMarketplace
            lots={appState.lots}
            partners={appState.partners}
            rfqs={appState.rfqs}
            retailProducts={appState.retailProducts}
            retailOrders={appState.retailOrders}
            currency={currency}
            loggedInTraderId={loggedInTraderId}
            onLoginTrader={handleLoginTrader}
            onRegisterTrader={handleRegisterPartner}
            onLogoutTrader={handleLogoutTrader}
            onBackHome={() => setActiveRole('home')}
            onSubmitRfq={handleSubmitRfq}
            onUpdateRfqStatus={handleUpdateRfq}
            onOpenChat={(rfqId, role) => handleOpenChat(rfqId, role)}
            onOpenLotDetail={(lot) => setDetailLot(lot)}
            onOpenInvoice={(rfq) => setInvoiceRfq(rfq)}
            onAddRetailProduct={handleAddRetailProduct}
            onUpdateRetailProduct={handleUpdateRetailProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            pendingRfqTrigger={pendingRfqTrigger}
            onConsumePendingRfq={() => setPendingRfqTrigger(null)}
          />
        )}

        {activeRole === 'importer_portal' && (
          <ImporterPortal
            lots={appState.lots}
            partners={appState.partners}
            rfqs={appState.rfqs}
            currency={currency}
            loggedInImporterId={loggedInImporterId}
            onLoginImporter={handleLoginImporter}
            onRegisterImporter={handleRegisterPartner}
            onLogoutImporter={handleLogoutImporter}
            onBackHome={() => setActiveRole('home')}
            onUpdateLotPriceStock={handleUpdateLotPriceStock}
            onAddNewLot={handleAddNewLot}
            onResubmitLot={handleResubmitLot}
            onUpdateRfq={handleUpdateRfq}
            onOpenChat={(rfqId, role) => handleOpenChat(rfqId, role)}
            onOpenInvoice={(rfq) => setInvoiceRfq(rfq)}
          />
        )}

        {activeRole === 'b2c_store' && (
          <B2CStoreAndRoaster
            products={appState.retailProducts}
            partners={appState.partners}
            currency={currency}
            consumerProfile={consumerProfile}
            onSaveConsumerProfile={handleSaveConsumerProfile}
            onLogoutConsumer={handleLogoutConsumer}
            onAddToCart={handleAddToCart}
          />
        )}

        {activeRole === 'super_admin' && (
          <SuperAdminDashboard
            partners={appState.partners}
            lots={appState.lots}
            retailProducts={appState.retailProducts}
            rfqs={appState.rfqs}
            retailOrders={appState.retailOrders}
            localTicker={appState.localTicker}
            commissionSettings={appState.commissionSettings}
            contactInquiries={appState.contactInquiries || []}
            currency={currency}
            onUpdateCommissionSettings={handleUpdateCommissionSettings}
            onTogglePartnerVerified={handleTogglePartnerVerified}
            onApprovePartnerCoding={handleApprovePartnerCoding}
            onRejectPartnerCoding={handleRejectPartnerCoding}
            onApproveLot={handleApproveLot}
            onRejectLot={handleRejectLot}
            onToggleLotSeal={handleToggleLotSeal}
            onToggleProductSeal={handleToggleProductSeal}
            onSaveLocalTicker={handleSaveLocalTicker}
            onOpenChat={(rfqId, role) => handleOpenChat(rfqId, role)}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-[#2A1A11]/10 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4E342E]">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span aria-hidden="true">·</span>
            <span>منصة تداول البن الأخضر وسوق القهوة المحمصة في مصر</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveRole('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#2A1A11] cursor-pointer"
            >
              الرئيسية
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('b2b_marketplace');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#2A1A11] cursor-pointer"
            >
              تاجر / محمصة
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('importer_portal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#2A1A11] cursor-pointer"
            >
              بوابة المستورد
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('b2c_store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#2A1A11] cursor-pointer"
            >
              متجر المستهلك
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('super_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#2A1A11] cursor-pointer"
            >
              الإدارة العليا
            </button>
          </div>
        </div>
      </footer>

      {/* Technical Lot Inspection Modal */}
      <LotDetailModal
        lot={detailLot}
        partners={appState.partners}
        currency={currency}
        onClose={() => setDetailLot(null)}
        onRequestAction={(lot, type) => {
          setDetailLot(null);
          setPendingRfqTrigger({ lot, type });
        }}
      />

      {/* Commercial Proforma Invoice Modal */}
      <ProformaInvoiceModal
        rfq={invoiceRfq}
        lot={activeInvoiceLot}
        partners={appState.partners}
        currency={currency}
        onClose={() => setInvoiceRfq(null)}
      />

      {/* Negotiation Chat Drawer */}
      <NegotiationChatDrawer
        rfq={activeChatRfq}
        lot={activeChatLot}
        partners={appState.partners}
        currency={currency}
        viewerRole={chatViewerRole}
        onClose={() => setChatRfqId(null)}
        onSendMessage={handleSendNegotiationMessage}
        onLogViolation={handleLogContactViolation}
        onUpdateRfqStatus={handleUpdateRfq}
        onOpenInvoice={(rfq) => setInvoiceRfq(rfq)}
      />

      {/* Slide-Over Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={appState.cart}
        currency={currency}
        consumerProfile={consumerProfile}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCompleteOrder={handleCompleteOrder}
      />

      {/* Non-blocking Toast Feedback */}
      {toast && (
        <div
          className="fixed bottom-20 md:bottom-5 left-4 sm:left-5 z-50 bg-[#2A1A11] text-white px-4 py-3 rounded-xl shadow-lg border border-[#C89B3C]/40 flex items-center gap-3 max-w-md"
          role="status"
        >
          <CheckCircle2 className="w-4 h-4 text-[#C89B3C] shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toast.text}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              className="px-2.5 py-1 text-xs font-bold bg-[#C89B3C] text-[#2A1A11] rounded-md whitespace-nowrap cursor-pointer"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/70 hover:text-white cursor-pointer"
            aria-label="إغلاق الإشعار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* Mobile App Bottom Navigation Bar (< md) */}
      <nav
        aria-label="شريط التنقل السريع للتطبيق"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#2A1A11]/12 shadow-[0_-4px_20px_rgba(28,17,11,0.08)]"
      >
        <div className="grid grid-cols-5 h-16">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRole === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveRole(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#1C110B]'
                    : 'text-[#4E342E]/70 hover:text-[#B4532A]'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 inset-x-3 h-[2.5px] rounded-b-full bg-gradient-to-l from-[#1E7E34] via-[#C89B3C] to-[#B4532A]"
                  />
                )}
                <Icon
                  className={`w-4.5 h-4.5 transition-transform ${
                    isActive ? 'text-[#B4532A] scale-110' : ''
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
