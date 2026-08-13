import { describe, expect, it } from 'vitest';
import { fakeVerificationProvider, nameMatchScore } from '../providers/fake-verification.js';

describe('fakeVerificationProvider', () => {
  it('passes a well-formed PAN', async () => {
    const result = await fakeVerificationProvider.check('PAN', {
      value: 'ABCDE1234F',
    });
    expect(result.status).toBe('PASSED');
    expect(result.matchScore).toBe(100);
  });

  it('fails a malformed PAN', async () => {
    const result = await fakeVerificationProvider.check('PAN', {
      value: 'NOTAPAN',
    });
    expect(result.status).toBe('FAILED');
  });

  it('returns NEEDS_REVIEW for a name mismatch', async () => {
    const result = await fakeVerificationProvider.check('PAN', {
      value: 'ABCDE1234F',
      legalName: 'ABC Brakes',
      documentName: 'ABC Brakes LLP',
    });
    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.matchScore).toBeLessThan(100);
    expect(result.matchScore).toBeGreaterThan(0);
  });

  it('returns RUNNING for PENNY_DROP on first attempt', async () => {
    const result = await fakeVerificationProvider.check('PENNY_DROP', {
      value: '50100123456789',
      attempt: 1,
    });
    expect(result.status).toBe('RUNNING');
  });

  it('returns PASSED for PENNY_DROP on second attempt', async () => {
    const result = await fakeVerificationProvider.check('PENNY_DROP', {
      value: '50100123456789',
      attempt: 2,
    });
    expect(result.status).toBe('PASSED');
  });

  it('fails an identifier with the FAIL marker', async () => {
    const result = await fakeVerificationProvider.check('GST', {
      value: '22FAILE1234F1Z5',
    });
    expect(result.status).toBe('FAILED');
  });

  it('is deterministic for the same inputs', async () => {
    const a = await fakeVerificationProvider.check('PAN', { value: 'ABCDE1234F' });
    const b = await fakeVerificationProvider.check('PAN', { value: 'ABCDE1234F' });
    expect(a.status).toBe(b.status);
    expect(a.matchScore).toBe(b.matchScore);
  });
});

describe('nameMatchScore', () => {
  it('scores identical names as 100', () => {
    expect(nameMatchScore('ABC Brakes', 'ABC Brakes')).toBe(100);
  });

  it('scores a partial overlap below 100', () => {
    const score = nameMatchScore('ABC Brakes', 'ABC Brakes LLP');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it('scores completely different names as 0', () => {
    expect(nameMatchScore('ABC', 'XYZ')).toBe(0);
  });
});
