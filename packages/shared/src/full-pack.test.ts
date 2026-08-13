import { describe, expect, it } from 'vitest';
import { fullPackChecklistFor, isChecklistCode, FULL_PACK_CHECKLIST } from './full-pack.js';

describe('fullPackChecklistFor', () => {
  it('asks a manufacturer for the whole pack', () => {
    expect(fullPackChecklistFor('PRODUCTION_PART')).toHaveLength(FULL_PACK_CHECKLIST.length);
  });

  it('never asks a services supplier for plant or quality paperwork', () => {
    const codes = fullPackChecklistFor('INDIRECT_SERVICES').map((item) => item.code);

    expect(codes).toEqual([
      'cancelled_cheque',
      'bank_mandate',
      'beneficial_ownership',
      'anti_bribery',
    ]);
  });

  it('asks everyone for bank details and declarations', () => {
    for (const type of ['PRODUCTION_PART', 'INDIRECT_SERVICES'] as const) {
      const codes = fullPackChecklistFor(type).map((item) => item.code);
      expect(codes).toContain('cancelled_cheque');
      expect(codes).toContain('anti_bribery');
    }
  });

  it('falls back to the common items when the vendor type is unknown', () => {
    const codes = fullPackChecklistFor(null).map((item) => item.code);

    expect(codes).not.toContain('factory_licence');
    expect(codes).toContain('cancelled_cheque');
  });

  it('fixes each slot\'s category, so a cheque cannot be filed as a certificate', () => {
    const byCode = Object.fromEntries(FULL_PACK_CHECKLIST.map((i) => [i.code, i.category]));

    expect(byCode.cancelled_cheque).toBe('BANK_DETAILS');
    expect(byCode.iatf_certificate).toBe('CAPABILITY');
    expect(byCode.factory_licence).toBe('STATUTORY');
    expect(byCode.anti_bribery).toBe('LEGAL');
  });

  it('recognises only codes the template defines', () => {
    expect(isChecklistCode('cancelled_cheque')).toBe(true);
    expect(isChecklistCode('passport_scan')).toBe(false);
  });
});
