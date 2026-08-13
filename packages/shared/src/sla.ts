import type { SlaRisk } from './schemas/enums.js';

/**
 * How far into its target a control gets before it is called at risk. A single
 * fraction rather than a stored per-rule threshold: the SlaRule model has no
 * field for it, and one predictable rule is easier to explain to an approver
 * than eight configurable ones.
 */
export const AT_RISK_FRACTION = 0.8;

const MS_PER_DAY = 86_400_000;

export function daysElapsed(since: string | Date, now: Date = new Date()): number {
  const start = typeof since === 'string' ? new Date(since) : since;
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY));
}

/**
 * Where a control stands against its SLA, worked out from how long it has been
 * waiting rather than read from a stored column — a stored value is only as
 * fresh as the last job that touched it, and there is no such job.
 *
 * Returns ON_TRACK when there is no target, or nothing has started waiting.
 */
export function slaRiskFor(
  waitingSince: string | Date | null,
  slaDays: number | null,
  now: Date = new Date(),
): SlaRisk {
  if (!waitingSince || !slaDays || slaDays <= 0) return 'ON_TRACK';

  const elapsed = daysElapsed(waitingSince, now);
  if (elapsed > slaDays) return 'OVERDUE';
  if (elapsed >= slaDays * AT_RISK_FRACTION) return 'AT_RISK';
  return 'ON_TRACK';
}
