import { describe, expect, it } from 'vitest';
import { gateOpenedAt, gatingControls, isGated, waitingOn, type ApprovalStatus } from './controls.js';
import type { ApprovalStage } from './schemas/enums.js';

const allCleared = Object.fromEntries(
  gatingControls.map((stage) => [stage, 'APPROVED' as ApprovalStatus]),
) as Partial<Record<ApprovalStage, ApprovalStatus>>;

describe('waitingOn', () => {
  it('never gates the seven parallel controls', () => {
    for (const stage of gatingControls) {
      expect(waitingOn(stage, {})).toEqual([]);
    }
  });

  it('gates the sign-off on every control nobody has cleared', () => {
    expect(waitingOn('BUSINESS_OWNER', {})).toEqual(gatingControls);
  });

  it('counts a control down only once it is cleared, not merely started', () => {
    const outstanding = waitingOn('BUSINESS_OWNER', {
      ...allCleared,
      LEGAL: 'IN_PROGRESS',
    });

    expect(outstanding).toEqual(['LEGAL']);
  });

  it('keeps gating while a control is blocked', () => {
    expect(waitingOn('BUSINESS_OWNER', { ...allCleared, TAX: 'REJECTED' })).toEqual(['TAX']);
  });

  it('opens the sign-off once all seven have cleared', () => {
    expect(waitingOn('BUSINESS_OWNER', allCleared)).toEqual([]);
    expect(isGated('BUSINESS_OWNER', allCleared)).toBe(false);
  });

  it('ignores the sign-off\'s own status when deciding whether it is gated', () => {
    expect(isGated('BUSINESS_OWNER', { ...allCleared, BUSINESS_OWNER: 'IN_PROGRESS' })).toBe(false);
  });
});

describe('gateOpenedAt', () => {
  it('opens at the moment the last control cleared, not the first', () => {
    const completions = Object.fromEntries(
      gatingControls.map((stage, index) => [stage, new Date(2026, 0, index + 1)]),
    );

    expect(gateOpenedAt(completions)).toEqual(new Date(2026, 0, gatingControls.length));
  });

  it('stays shut while any control is missing a completion', () => {
    const completions = Object.fromEntries(
      gatingControls.map((stage) => [stage, new Date(2026, 0, 1)]),
    );
    completions.LEGAL = null as unknown as Date;

    expect(gateOpenedAt(completions)).toBeNull();
  });

  it('stays shut when nothing has cleared at all', () => {
    expect(gateOpenedAt({})).toBeNull();
  });
});
