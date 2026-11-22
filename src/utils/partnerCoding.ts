import { PartnerAccount } from '../types';

/**
 * Generates the next sequential coding ID in the format IMP-XXX (for importers)
 * or RST-XXX (for traders/roasters) without colliding with existing partners.
 */
export function generateNextPartnerCode(
  type: 'importer' | 'roaster',
  partners: PartnerAccount[]
): string {
  const prefix = type === 'importer' ? 'IMP' : 'RST';
  let maxNum = type === 'importer' ? 112 : 100;

  for (const p of partners) {
    const candidates = [p.codingCode, p.anonCode];
    for (const raw of candidates) {
      if (!raw) continue;
      const match = raw.trim().toUpperCase().match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const parsed = Number(match[1]);
        if (!Number.isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }
  }

  return `${prefix}-${maxNum + 1}`;
}

export function getSuggestedPartnerCodingDraft(
  partner: PartnerAccount,
  partners: PartnerAccount[]
): string {
  if (partner.codingCode && partner.codingCode.trim()) {
    return partner.codingCode.trim();
  }
  const prefix = partner.type === 'importer' ? 'IMP-' : 'RST-';
  if (partner.anonCode && partner.anonCode.toUpperCase().startsWith(prefix)) {
    return partner.anonCode.toUpperCase();
  }
  return generateNextPartnerCode(partner.type, partners);
}
