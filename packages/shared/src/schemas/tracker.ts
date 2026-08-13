import { z } from 'zod';

import { linkStateSchema } from './enums.js';

export const milestoneStateSchema = z.enum(['DONE', 'CURRENT', 'PENDING']);
export type MilestoneState = z.infer<typeof milestoneStateSchema>;

/** Who moved a milestone — the vendor, the buyer, or the platform itself. */
export const milestoneActorSchema = z.enum(['YOU', 'BUYER', 'PLATFORM']);
export type MilestoneActor = z.infer<typeof milestoneActorSchema>;

export const trackerMilestoneSchema = z.object({
  key: z.string(),
  label: z.string(),
  state: milestoneStateSchema,
  actor: milestoneActorSchema,
  at: z.string().datetime().nullable(),
  /**
   * The fact the milestone produced, when there is one worth reading back — the
   * issued vendor code, for instance. A date and an actor say when something
   * happened and who did it, not what came out of it.
   */
  detail: z.string().nullable(),
});
export type TrackerMilestone = z.infer<typeof trackerMilestoneSchema>;

/**
 * What a vendor sees during what the workflow prototype calls "the silent
 * stretch" — the period between submitting and being asked for anything else,
 * where the record keeps moving but nothing visible happens on their side.
 *
 * The honest version of a transparency promise: current stage, whose court the
 * ball is in, a named human to chase, and turnaround split by side.
 */
export const vendorTrackerResponseSchema = z.object({
  requestId: z.string(),
  requestNumber: z.string(),
  category: z.string(),
  status: linkStateSchema,
  /**
   * Named contact on the buyer side, so the vendor knows who to chase. There is
   * no organisation model yet, so this is the person who raised the request
   * rather than a company name.
   */
  contactName: z.string().nullable(),
  contactRole: z.string().nullable(),
  /** Days the vendor held the ball before submitting. */
  youWaitedDays: z.number().int(),
  /** Days the buyer has held it since. */
  buyerPendingDays: z.number().int(),
  milestones: z.array(trackerMilestoneSchema),
  /** How many of the control functions have cleared, for the governance step. */
  controlsCleared: z.number().int(),
  controlsTotal: z.number().int(),
});
export type VendorTrackerResponse = z.infer<typeof vendorTrackerResponseSchema>;
