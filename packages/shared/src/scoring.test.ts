import { describe, expect, it } from 'vitest';
import {
  landedCostOf,
  scoreCandidates,
  weightedTotal,
  DEFAULT_CRITERION_WEIGHTS,
  type ScoringInput,
} from './scoring.js';

function input(overrides: Partial<ScoringInput> & { vendorId: string }): ScoringInput {
  return {
    prequalScore: 90,
    landedCost: 1000,
    leadTimeDays: 20,
    checksRun: 3,
    checksPassed: 3,
    ...overrides,
  };
}

describe('landedCostOf', () => {
  it('adds tooling and freight to the unit price', () => {
    expect(landedCostOf({ unitPrice: 1850, toolingPerUnit: 10, freightPerUnit: 50 })).toBe(1910);
  });
});

describe('scoreCandidates', () => {
  it('scores the cheapest quote highest and the dearest lowest', () => {
    const scores = scoreCandidates([
      input({ vendorId: 'a', landedCost: 1000 }),
      input({ vendorId: 'b', landedCost: 2000 }),
      input({ vendorId: 'c', landedCost: 1500 }),
    ]);

    expect(scores.a.cost).toBe(100);
    expect(scores.b.cost).toBe(0);
    expect(scores.c.cost).toBe(50);
  });

  it('scores the shortest lead time highest', () => {
    const scores = scoreCandidates([
      input({ vendorId: 'a', leadTimeDays: 15 }),
      input({ vendorId: 'b', leadTimeDays: 35 }),
    ]);

    expect(scores.a.delivery).toBe(100);
    expect(scores.b.delivery).toBe(0);
  });

  it('gives a lone quote full marks rather than an arbitrary middle', () => {
    const scores = scoreCandidates([input({ vendorId: 'a' })]);

    expect(scores.a.cost).toBe(100);
    expect(scores.a.delivery).toBe(100);
  });

  it('treats identical quotes as equally good', () => {
    const scores = scoreCandidates([
      input({ vendorId: 'a', landedCost: 1200 }),
      input({ vendorId: 'b', landedCost: 1200 }),
    ]);

    expect(scores.a.cost).toBe(100);
    expect(scores.b.cost).toBe(100);
  });

  it('leaves cost and delivery unscored for a candidate with no quote', () => {
    const scores = scoreCandidates([
      input({ vendorId: 'a', landedCost: 1000 }),
      input({ vendorId: 'b', landedCost: null, leadTimeDays: null }),
    ]);

    expect(scores.b.cost).toBeNull();
    expect(scores.b.delivery).toBeNull();
    // The quoted vendor is still scored against the quotes that do exist.
    expect(scores.a.cost).toBe(100);
  });

  it('scores risk on the share of checks that came back clean', () => {
    const scores = scoreCandidates([
      input({ vendorId: 'a', checksRun: 4, checksPassed: 3 }),
    ]);

    expect(scores.a.risk).toBe(75);
  });

  it('does not treat \'no checks run\' as failing them all', () => {
    const scores = scoreCandidates([input({ vendorId: 'a', checksRun: 0, checksPassed: 0 })]);

    expect(scores.a.risk).toBeNull();
  });

  it('passes the pre-qualification score through as quality', () => {
    const scores = scoreCandidates([input({ vendorId: 'a', prequalScore: 92 })]);

    expect(scores.a.quality).toBe(92);
  });
});

describe('weightedTotal', () => {
  it('weights the criteria as configured', () => {
    const total = weightedTotal(
      { quality: 96, cost: 85, delivery: 92, risk: 94 },
      DEFAULT_CRITERION_WEIGHTS,
    );

    // (96*45 + 85*30 + 92*15 + 94*10) / 100
    expect(total?.value).toBe(92);
  });

  it('renormalises over the criteria that have a score', () => {
    const total = weightedTotal(
      { quality: 80, cost: null, delivery: null, risk: null },
      DEFAULT_CRITERION_WEIGHTS,
    );

    expect(total?.value).toBe(80);
    expect(total?.scored).toEqual(['quality']);
  });

  it('moves the result when the weights change', () => {
    const scores = { quality: 100, cost: 0, delivery: 50, risk: 50 };

    const qualityLed = weightedTotal(scores, { quality: 90, cost: 10, delivery: 0, risk: 0 });
    const costLed = weightedTotal(scores, { quality: 10, cost: 90, delivery: 0, risk: 0 });

    expect(qualityLed?.value).toBe(90);
    expect(costLed?.value).toBe(10);
  });

  it('returns nothing when no criterion has a score', () => {
    expect(
      weightedTotal({ quality: null, cost: null, delivery: null, risk: null }, DEFAULT_CRITERION_WEIGHTS),
    ).toBeNull();
  });

  it('returns nothing when every weight is zero', () => {
    expect(
      weightedTotal(
        { quality: 90, cost: 90, delivery: 90, risk: 90 },
        { quality: 0, cost: 0, delivery: 0, risk: 0 },
      ),
    ).toBeNull();
  });
});
