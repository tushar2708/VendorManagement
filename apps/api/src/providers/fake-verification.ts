import type { VerificationCheckType } from '@vendor-management/shared';

import type { VerificationInput, VerificationOutcome, VerificationProvider } from './types.js';

/**
 * Stand-in for the PAN, GST, Udyam, penny-drop, filings and UBO lookups.
 *
 * Deterministic on purpose: the same input always produces the same verdict, so
 * a demo or a test can reach the "partial match, reviewer must decide" branch
 * that wireframe 2e is built around instead of hoping for it.
 */

/** Any identifier containing this marker fails. Gives fixtures a failure path. */
const FAILURE_MARKER = 'FAIL';

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

function normalise(name: string): string[] {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Token-overlap similarity as a percentage. "ABC Brakes" vs "ABC Brakes LLP"
 * scores below 100 without being a mismatch — the PRD's CV-07 case.
 */
export function nameMatchScore(left: string, right: string): number {
  const leftTokens = normalise(left);
  const rightTokens = normalise(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const rightSet = new Set(rightTokens);
  const shared = leftTokens.filter((token) => rightSet.has(token)).length;
  const total = new Set([...leftTokens, ...rightTokens]).size;
  return Math.round((shared / total) * 100);
}

function formatIsValid(type: VerificationCheckType, value: string): boolean {
  if (type === 'PAN') return PAN_PATTERN.test(value);
  if (type === 'GST') return GST_PATTERN.test(value);
  return value.length > 0;
}

function outcome(
  status: VerificationOutcome['status'],
  notes: string,
  extra: Partial<VerificationOutcome> = {},
): VerificationOutcome {
  return {
    status,
    notes,
    rawResponse: JSON.stringify({ simulated: true, status, notes }),
    ...extra,
  };
}

export const fakeVerificationProvider: VerificationProvider = {
  async check(type, input: VerificationInput): Promise<VerificationOutcome> {
    const value = input.value?.trim().toUpperCase() ?? '';

    if (value.includes(FAILURE_MARKER)) {
      return outcome('FAILED', `${type} was not found on the issuer record`);
    }

    if (!formatIsValid(type, value)) {
      return outcome('FAILED', `${type} is not in a valid format`);
    }

    // A penny drop takes time in reality; the first look is always pending.
    if (type === 'PENNY_DROP' && (input.attempt ?? 1) < 2) {
      return outcome('RUNNING', 'Penny drop sent; awaiting confirmation from the vendor');
    }

    if (input.legalName && input.documentName) {
      const score = nameMatchScore(input.legalName, input.documentName);
      if (score < 100) {
        return outcome(
          'NEEDS_REVIEW',
          `Name on record differs from the registered legal name (${score}% match)`,
          { matchScore: score },
        );
      }
    }

    return outcome('PASSED', `${type} verified against the issuer record`, { matchScore: 100 });
  },
};
