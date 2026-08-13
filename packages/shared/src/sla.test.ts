import { describe, expect, it } from 'vitest';
import { slaRiskFor } from './sla.js';

const now = new Date('2026-08-11T12:00:00.000Z');

/** An ISO timestamp `days` before the fixed `now` above. */
function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

describe('slaRiskFor', () => {
  it('stays on track early in the target', () => {
    expect(slaRiskFor(daysAgo(3), 10, now)).toBe('ON_TRACK');
  });

  it('turns at risk once 80% of the target is used', () => {
    expect(slaRiskFor(daysAgo(7), 10, now)).toBe('ON_TRACK');
    expect(slaRiskFor(daysAgo(8), 10, now)).toBe('AT_RISK');
  });

  it('stays at risk on the final day rather than jumping to overdue', () => {
    expect(slaRiskFor(daysAgo(10), 10, now)).toBe('AT_RISK');
  });

  it('goes overdue only once the target is genuinely passed', () => {
    expect(slaRiskFor(daysAgo(11), 10, now)).toBe('OVERDUE');
  });

  it('never chases a control that has no target', () => {
    expect(slaRiskFor(daysAgo(400), null, now)).toBe('ON_TRACK');
  });

  it('never chases a control that has not started waiting', () => {
    expect(slaRiskFor(null, 5, now)).toBe('ON_TRACK');
  });

  it('treats a one day target as at risk on day one', () => {
    expect(slaRiskFor(daysAgo(1), 1, now)).toBe('AT_RISK');
    expect(slaRiskFor(daysAgo(2), 1, now)).toBe('OVERDUE');
  });

  it('does not report risk for a control that started in the future', () => {
    const future = new Date(now.getTime() + 86_400_000).toISOString();

    expect(slaRiskFor(future, 1, now)).toBe('ON_TRACK');
  });
});
