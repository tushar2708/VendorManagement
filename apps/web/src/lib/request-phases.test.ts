import { describe, expect, it } from "vitest";
import type { LinkState } from "@vendor-management/shared";
import { LINK_STATE_META } from "@vendor-management/shared";
import { courtOf } from "./request-phases.js";

/**
 * Courts taken from the team's workflow prototype, which tags every screen with
 * whose court the ball is in. Keeping these assertions literal means a state
 * added later cannot quietly default to the wrong side.
 */
describe("courtOf", () => {
  const expected: Record<LinkState, ReturnType<typeof courtOf>> = {
    INVITED: "VENDOR",
    PREQUAL_IN_PROGRESS: "VENDOR",
    PREQUAL_SUBMITTED: "BUYER",
    PREQUAL_UNDER_REVIEW: "BUYER",
    PREQUAL_CLEARED: "BUYER",
    AWARDED: "VENDOR",
    FULL_IN_PROGRESS: "VENDOR",
    FULL_SUBMITTED: "BUYER",
    FULL_UNDER_REVIEW: "BUYER",
    CONTRACTS_IN_PROGRESS: "BUYER",
    APPROVED: "BUYER",
    ERP_SYNCING: "PLATFORM",
    ONBOARDED: "DONE",
    REJECTED: "DONE",
    ON_HOLD: "DONE",
    WITHDRAWN: "DONE",
    ERP_FAILED: "PLATFORM",
    EXPIRED: "DONE",
  };

  for (const [state, court] of Object.entries(expected)) {
    it(`puts "${LINK_STATE_META[state as LinkState]?.label ?? state}" in the ${court} court`, () => {
      expect(courtOf(state as LinkState)).toBe(court);
    });
  }

  it("hands the ball back to the buyer the moment a vendor finishes prequal", () => {
    expect(courtOf("PREQUAL_IN_PROGRESS")).toBe("VENDOR");
    expect(courtOf("PREQUAL_SUBMITTED")).toBe("BUYER");
  });

  it("blames nobody while the platform is doing the work", () => {
    expect(courtOf("ERP_SYNCING")).toBe("PLATFORM");
    expect(courtOf("ERP_FAILED")).toBe("PLATFORM");
  });
});
