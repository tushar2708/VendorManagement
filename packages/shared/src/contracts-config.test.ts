import { describe, expect, it } from 'vitest';
import { contractSetFor, contractTemplate, CONTRACT_SET } from './contracts-config.js';

describe('contractSetFor', () => {
  it('gives a manufacturer the whole set', () => {
    expect(contractSetFor('PRODUCTION_PART')).toHaveLength(CONTRACT_SET.length);
  });

  it('drops tooling and quality agreements for a services supplier', () => {
    const codes = contractSetFor('INDIRECT_SERVICES').map((contract) => contract.code);

    expect(codes).toEqual(['mpa', 'nda', 'code_of_conduct', 'anti_bribery_contract']);
  });

  it('always includes the master agreement and the NDA', () => {
    for (const type of ['PRODUCTION_PART', 'INDIRECT_SERVICES'] as const) {
      const codes = contractSetFor(type).map((contract) => contract.code);
      expect(codes).toContain('mpa');
      expect(codes).toContain('nda');
    }
  });

  it('falls back to the common set when the vendor type is unknown', () => {
    expect(contractSetFor(null).map((contract) => contract.code)).not.toContain(
      'tooling_bailment',
    );
  });

  it('resolves a template by code, and nothing by an unknown one', () => {
    expect(contractTemplate('nda')?.title).toBe('NDA');
    expect(contractTemplate('side_letter')).toBeUndefined();
  });
});
