import { describe, expect, it } from 'vitest';

import { fakeVerificationProvider, nameMatchScore } from './fake-verification.js';

describe('fakeVerificationProvider', () => {
  it('passes a well-formed PAN', async () => {
    const result = await fakeVerificationProvider.check('PAN', { value: 'ABCDE1234F' });

    expect(result.status).toBe('PASSED');
  });

  it('fails a malformed PAN', async () => {
    const result = await fakeVerificationProvider.check('PAN', { value: 'NOTAPAN' });

    expect(result.status).toBe('FAILED');
  });

  it('fails an identifier carrying the failure marker', async () => {
    const result = await fakeVerificationProvider.check('GST', { value: '22FAILE1234F1Z5' });

    expect(result.status).toBe('FAILED');
  });

  it('returns a partial match when the legal name differs from the document', async () => {
    const result = await fakeVerificationProvider.check('GST', {
      value: '22ABCDE1234F1Z5',
      legalName: 'ABC Brakes',
      documentName: 'ABC Brakes LLP',
    });

    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.matchScore).toBeLessThan(100);
    expect(result.matchScore).toBeGreaterThan(0);
  });

  it('leaves a penny drop pending until it is checked again', async () => {
    const first = await fakeVerificationProvider.check('PENNY_DROP', {
      value: '50100123456789',
      attempt: 1,
    });
    const second = await fakeVerificationProvider.check('PENNY_DROP', {
      value: '50100123456789',
      attempt: 2,
    });

    expect(first.status).toBe('RUNNING');
    expect(second.status).toBe('PASSED');
  });

  it('is deterministic for the same input', async () => {
    const input = { value: '22ABCDE1234F1Z5', legalName: 'Acme', documentName: 'Acme Pvt Ltd' };

    const first = await fakeVerificationProvider.check('GST', input);
    const second = await fakeVerificationProvider.check('GST', input);

    expect(first).toEqual(second);
  });
});

describe('nameMatchScore', () => {
  it('scores an exact match at 100', () => {
    expect(nameMatchScore('ABC Brakes', 'abc  brakes')).toBe(100);
  });

  it('scores a suffix difference below 100 but above zero', () => {
    const score = nameMatchScore('ABC Brakes', 'ABC Brakes LLP');

    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(100);
  });

  it('scores unrelated names at zero', () => {
    expect(nameMatchScore('ABC Brakes', 'Zenith Tooling')).toBe(0);
  });
});
