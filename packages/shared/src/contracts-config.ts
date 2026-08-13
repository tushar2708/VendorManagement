import type { VendorType } from './schemas/enums.js';

/**
 * The fixed contract set, expanded by the same conditional rules as the document
 * pack. Tooling bailment and the quality agreement only mean something for a
 * vendor who makes a part, so a services supplier signs four rather than six.
 */
export interface ContractTemplate {
  code: string;
  title: string;
  onlyFor?: VendorType[];
}

export const CONTRACT_SET: ContractTemplate[] = [
  { code: 'mpa', title: 'MPA / General T&Cs' },
  { code: 'nda', title: 'NDA' },
  { code: 'tooling_bailment', title: 'Tooling bailment', onlyFor: ['PRODUCTION_PART'] },
  {
    code: 'quality_assurance',
    title: 'Quality assurance agreement',
    onlyFor: ['PRODUCTION_PART'],
  },
  { code: 'code_of_conduct', title: 'Code of conduct' },
  { code: 'anti_bribery_contract', title: 'Anti-bribery' },
];

export function contractSetFor(vendorType: VendorType | null): ContractTemplate[] {
  return CONTRACT_SET.filter(
    (contract) =>
      !contract.onlyFor || (vendorType !== null && contract.onlyFor.includes(vendorType)),
  );
}

export function contractTemplate(code: string): ContractTemplate | undefined {
  return CONTRACT_SET.find((contract) => contract.code === code);
}
