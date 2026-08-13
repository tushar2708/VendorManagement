import type { DocumentCategory, VendorType } from './schemas/enums.js';

/**
 * The full document pack, as a fixed template expanded by conditional rules —
 * not a form builder.
 *
 * Every vendor owes bank details and legal declarations. Plant paperwork and
 * quality certification only make sense for someone who manufactures a part, so
 * an indirect-services supplier is never asked for a factory licence.
 */
export interface ChecklistItem {
  code: string;
  label: string;
  category: DocumentCategory;
  /** Section heading, since one category can span two headings in the UI. */
  group: string;
  /** Vendor types this item applies to. Absent means all of them. */
  onlyFor?: VendorType[];
}

export const FULL_PACK_CHECKLIST: ChecklistItem[] = [
  { code: 'cancelled_cheque', label: 'Cancelled cheque', category: 'BANK_DETAILS', group: 'Bank' },
  { code: 'bank_mandate', label: 'Bank mandate form', category: 'BANK_DETAILS', group: 'Bank' },

  {
    code: 'factory_licence',
    label: 'Factory licence',
    category: 'STATUTORY',
    group: 'Statutory · plant',
    onlyFor: ['PRODUCTION_PART'],
  },
  {
    code: 'pollution_consent',
    label: 'Pollution consent',
    category: 'STATUTORY',
    group: 'Statutory · plant',
    onlyFor: ['PRODUCTION_PART'],
  },

  {
    code: 'iatf_certificate',
    label: 'IATF 16949 certificate',
    category: 'CAPABILITY',
    group: 'Quality',
    onlyFor: ['PRODUCTION_PART'],
  },
  {
    code: 'process_capability',
    label: 'Process capability summary',
    category: 'CAPABILITY',
    group: 'Quality',
    onlyFor: ['PRODUCTION_PART'],
  },

  {
    code: 'beneficial_ownership',
    label: 'Beneficial ownership declaration',
    category: 'LEGAL',
    group: 'Legal declarations',
  },
  {
    code: 'anti_bribery',
    label: 'Anti-bribery declaration',
    category: 'LEGAL',
    group: 'Legal declarations',
  },
];

/**
 * The checklist this vendor actually owes. An unknown vendor type gets the
 * common items only — asking for plant paperwork we are not sure applies is
 * worse than asking for it later.
 */
export function fullPackChecklistFor(vendorType: VendorType | null): ChecklistItem[] {
  return FULL_PACK_CHECKLIST.filter(
    (item) => !item.onlyFor || (vendorType !== null && item.onlyFor.includes(vendorType)),
  );
}

export function isChecklistCode(code: string): boolean {
  return FULL_PACK_CHECKLIST.some((item) => item.code === code);
}

/** Largest original binary we accept, before Base64 expands it by about a third. */
export const MAX_DOCUMENT_BYTES = 1_048_576;
