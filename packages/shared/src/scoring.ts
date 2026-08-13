/**
 * Turning quotations into comparable scores.
 *
 * Buyers enter facts — a price, a lead time — never a score. Cost and delivery
 * are then scored *relative to the other quotes on the same request*, because
 * "is ₹1,850 good?" has no answer on its own; it only means something next to
 * ₹1,720. Quality and risk come from the vendor's own record.
 *
 * Every score is derived, so two buyers looking at the same quotes cannot
 * produce different numbers.
 */

export const SCORING_CRITERIA = ["quality", "cost", "delivery", "risk"] as const;
export type CriterionKey = (typeof SCORING_CRITERIA)[number];

export type CriterionWeights = Record<CriterionKey, number>;

export const DEFAULT_CRITERION_WEIGHTS: CriterionWeights = {
  quality: 45,
  cost: 30,
  delivery: 15,
  risk: 10,
};

export interface ScoringInput {
  vendorId: string;
  /** Pre-qualification score, 0–100. Null when the vendor has not been scored. */
  prequalScore: number | null;
  /** Total per-unit landed cost. Null when no quotation has been captured. */
  landedCost: number | null;
  leadTimeDays: number | null;
  /** Verification checks that resolved cleanly, over checks run. */
  checksPassed: number;
  checksRun: number;
}

export type CriterionScores = Record<CriterionKey, number | null>;

/**
 * Lower is better, so the cheapest quote scores 100 and the dearest 0.
 *
 * When every quote is identical — or there is only one — spreading them is
 * meaningless, so they all score 100 rather than an arbitrary middle.
 */
function scoreLowerIsBetter(value: number | null, all: number[]): number | null {
  if (value === null || all.length === 0) return null;

  const min = Math.min(...all);
  const max = Math.max(...all);
  if (max === min) return 100;

  return Math.round(((max - value) / (max - min)) * 100);
}

/** Total per-unit cost of a quotation: price plus tooling and freight. */
export function landedCostOf(quotation: {
  unitPrice: number;
  toolingPerUnit: number;
  freightPerUnit: number;
}): number {
  return quotation.unitPrice + quotation.toolingPerUnit + quotation.freightPerUnit;
}

/**
 * Score every candidate on a request together, since cost and delivery are
 * relative. Returns a map keyed by vendor id.
 */
export function scoreCandidates(inputs: ScoringInput[]): Record<string, CriterionScores> {
  const costs = inputs.map((input) => input.landedCost).filter((cost): cost is number => cost !== null);
  const leadTimes = inputs
    .map((input) => input.leadTimeDays)
    .filter((days): days is number => days !== null);

  return Object.fromEntries(
    inputs.map((input) => [
      input.vendorId,
      {
        quality: input.prequalScore,
        cost: scoreLowerIsBetter(input.landedCost, costs),
        delivery: scoreLowerIsBetter(input.leadTimeDays, leadTimes),
        // No checks run yet is not the same as failing them all.
        risk: input.checksRun === 0 ? null : Math.round((input.checksPassed / input.checksRun) * 100),
      },
    ]),
  );
}

/**
 * Weighted total over the criteria that actually have a score.
 *
 * Weights are renormalised across the scored criteria, so a vendor is never
 * dragged down by a figure nobody captured.
 */
export function weightedTotal(
  scores: CriterionScores,
  weights: CriterionWeights,
): { value: number; scored: CriterionKey[] } | null {
  const scored = SCORING_CRITERIA.filter((criterion) => scores[criterion] !== null);
  const totalWeight = scored.reduce((sum, criterion) => sum + weights[criterion], 0);
  if (scored.length === 0 || totalWeight === 0) return null;

  const value = scored.reduce(
    (sum, criterion) => sum + (scores[criterion] ?? 0) * weights[criterion],
    0,
  );

  return { value: Math.round(value / totalWeight), scored };
}
