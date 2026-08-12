import type { RequestStatus } from '@vendor-management/shared';

export type PipelineStep = 'INTAKE_AND_INVITE' | 'VERIFICATION' | 'AWARD_AND_FULL_PACK' | 'GOVERNANCE' | 'CONTRACT' | 'ACTIVATED';

export interface PipelineStepConfig {
  readonly key: PipelineStep;
  readonly label: string;
  readonly statuses: readonly RequestStatus[];
}

export const PIPELINE_STEPS: readonly PipelineStepConfig[] = [
  { key: 'INTAKE_AND_INVITE', label: 'Intake & invite', statuses: ['DRAFT', 'CANDIDATES_SELECTED', 'INVITES_DISPATCHED'] },
  { key: 'VERIFICATION', label: 'Verification', statuses: ['PREQUAL_IN_PROGRESS', 'PREQUAL_COMPLETE'] },
  { key: 'AWARD_AND_FULL_PACK', label: 'Award & full pack', statuses: ['AWARDED', 'FULL_PACK_SUBMITTED'] },
  { key: 'GOVERNANCE', label: 'Governance', statuses: ['DEEP_VERIFICATION', 'APPROVALS_IN_PROGRESS'] },
  { key: 'CONTRACT', label: 'Contract', statuses: ['CONTRACT_REVIEW'] },
  { key: 'ACTIVATED', label: 'Activated', statuses: ['ERP_PUSH', 'COMPLETED'] },
];

export function getPipelineStep(status: RequestStatus): PipelineStep {
  for (const step of PIPELINE_STEPS) {
    if ((step.statuses as readonly string[]).includes(status)) return step.key;
  }
  return 'INTAKE_AND_INVITE';
}

export type WhoseCourt = 'Buyer' | 'Vendor' | 'Done';

const VENDOR_STATUSES: readonly RequestStatus[] = [
  'PREQUAL_IN_PROGRESS',
  'FULL_PACK_SUBMITTED',
  'CONTRACT_REVIEW',
];

const DONE_STATUSES: readonly RequestStatus[] = ['COMPLETED', 'CANCELLED'];

export function getWhoseCourt(status: RequestStatus): WhoseCourt {
  if ((DONE_STATUSES as readonly string[]).includes(status)) return 'Done';
  if ((VENDOR_STATUSES as readonly string[]).includes(status)) return 'Vendor';
  return 'Buyer';
}

export function getStepState(
  stepIndex: number,
  currentStepIndex: number,
): 'done' | 'active' | 'pending' {
  if (stepIndex < currentStepIndex) return 'done';
  if (stepIndex === currentStepIndex) return 'active';
  return 'pending';
}

export function getCurrentStepIndex(status: RequestStatus): number {
  return PIPELINE_STEPS.findIndex((step) =>
    (step.statuses as readonly string[]).includes(status),
  );
}

export function getOpenDays(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
}
