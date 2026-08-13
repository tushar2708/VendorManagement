import type { ApprovalStage } from './schemas/enums.js';

/**
 * Approval status values for review decisions.
 * Includes standard statuses and EDD_COMPLETE for Compliance-specific approvals.
 */
export type ApprovalStatus = 'PENDING' | 'IN_PROGRESS' | 'INFORMATION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'EDD_COMPLETE' | 'CHANGES_REQUESTED' | 'ESCALATED';

/**
 * Business Owner is a sign-off, not a check.
 *
 * The other seven are genuine control functions and run in parallel — Legal does
 * not wait for Tax. The owner's decision is different in kind: it confirms the
 * business still wants a vendor the controls have already passed, so it is the
 * one stage that gates on the rest. Asking an owner to sign off while Financial
 * Crime is unresolved is asking them to approve something nobody has checked.
 */
export const GATED_CONTROL: ApprovalStage = 'BUSINESS_OWNER';

/** The seven parallel controls that must clear before the sign-off opens. */
export const gatingControls: ApprovalStage[] = [
  'FINANCIAL_CRIME',
  'COMPLIANCE',
  'LEGAL',
  'IT_INFOSEC',
  'TAX',
  'PROCUREMENT',
  'DATA_PRIVACY',
];

export type StatusByStage = Partial<Record<ApprovalStage, ApprovalStatus>>;

/**
 * EDD_COMPLETE is Compliance's own way of clearing: Enhanced Due Diligence was
 * carried out and the lane is done. Only Compliance may set it — for every
 * other function it would be a claim about work they do not perform.
 */
export const EDD_STAGE: ApprovalStage = 'COMPLIANCE';

/** A lane is cleared by a plain approval or, for Compliance, by completing EDD. */
export function isCleared(status: ApprovalStatus | undefined): boolean {
  return status === 'APPROVED' || status === 'EDD_COMPLETE';
}

/** What a reviewer may choose for this function. */
export function decisionsFor(stage: ApprovalStage): ApprovalStatus[] {
  const base: ApprovalStatus[] = ['IN_PROGRESS', 'INFORMATION_REQUIRED', 'APPROVED', 'REJECTED'];
  return stage === EDD_STAGE ? [...base, 'EDD_COMPLETE'] : base;
}

/**
 * Which controls a stage is still waiting on. Empty for the seven parallel
 * controls, which wait for nothing, and for the sign-off once all seven clear.
 */
export function waitingOn(stage: ApprovalStage, statuses: StatusByStage): ApprovalStage[] {
  if (stage !== GATED_CONTROL) return [];
  return gatingControls.filter((gate) => !isCleared(statuses[gate]));
}

export function isGated(stage: ApprovalStage, statuses: StatusByStage): boolean {
  return waitingOn(stage, statuses).length > 0;
}

/**
 * When the sign-off became actionable: the moment the last of the seven cleared.
 *
 * The owner's SLA runs from here rather than from when the vendor arrived,
 * otherwise their allowance is spent waiting on other people's reviews.
 */
export function gateOpenedAt(completions: Partial<Record<ApprovalStage, Date | null>>): Date | null {
  const times: Date[] = [];

  for (const stage of gatingControls) {
    const completedAt = completions[stage];
    if (!completedAt) return null;
    times.push(completedAt);
  }

  return times.reduce((latest, time) => (time > latest ? time : latest));
}
