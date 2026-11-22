import {
  CommissionRule,
  CommissionSettings,
  PartnerAccount,
  RetailOrder,
  RetailWeight,
  RfqRequest,
} from '../types';

export function weightToKg(weight: RetailWeight): number {
  if (weight === '250g') return 0.25;
  if (weight === '500g') return 0.5;
  return 1;
}

export function getRetailOrderWeightKg(order: RetailOrder): number {
  return order.items.reduce(
    (sum, item) => sum + weightToKg(item.weight) * item.quantity,
    0
  );
}

export function calculateCommissionAmountEgp(
  volumeEgp: number,
  weightKg: number,
  rule: CommissionRule
): number {
  const safeVal = Math.max(0, Number(rule.value) || 0);
  if (rule.mode === 'per_kg') {
    return weightKg * safeVal;
  }
  return volumeEgp * (safeVal / 100);
}

export function resolveB2BCommission(
  deal: RfqRequest,
  partners: PartnerAccount[],
  settings: CommissionSettings
): {
  rule: CommissionRule;
  clientPartner?: PartnerAccount;
  isOverridden: boolean;
} {
  const roasterPartner = partners.find(
    (p) => p.type === 'roaster' && p.name === deal.roasterName
  );
  const importerPartner = partners.find(
    (p) => p.type === 'importer' && p.id === deal.importerId
  );
  const clientPartner = roasterPartner || importerPartner;

  const override = settings.dealOverrides?.[deal.id];
  if (override) {
    return { rule: override, clientPartner, isOverridden: true };
  }

  if (roasterPartner && settings.partnerRules?.[roasterPartner.id]) {
    return {
      rule: settings.partnerRules[roasterPartner.id],
      clientPartner: roasterPartner,
      isOverridden: false,
    };
  }

  if (importerPartner && settings.partnerRules?.[importerPartner.id]) {
    return {
      rule: settings.partnerRules[importerPartner.id],
      clientPartner: importerPartner,
      isOverridden: false,
    };
  }

  return {
    rule: { mode: 'percent', value: settings.b2bRatePct },
    clientPartner,
    isOverridden: false,
  };
}

export function resolveB2CCommission(
  order: RetailOrder,
  partners: PartnerAccount[],
  settings: CommissionSettings
): {
  rule: CommissionRule;
  clientPartner?: PartnerAccount;
  isOverridden: boolean;
} {
  const primaryRoasterName = order.items[0]?.roasterName;
  const roasterPartner = partners.find(
    (p) => p.type === 'roaster' && p.name === primaryRoasterName
  );

  const override = settings.dealOverrides?.[order.id];
  if (override) {
    return { rule: override, clientPartner: roasterPartner, isOverridden: true };
  }

  if (roasterPartner && settings.partnerRules?.[roasterPartner.id]) {
    return {
      rule: settings.partnerRules[roasterPartner.id],
      clientPartner: roasterPartner,
      isOverridden: false,
    };
  }

  return {
    rule: { mode: 'percent', value: settings.b2cRatePct },
    clientPartner: roasterPartner,
    isOverridden: false,
  };
}
