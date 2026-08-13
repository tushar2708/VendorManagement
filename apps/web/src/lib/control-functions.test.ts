import { describe, expect, it } from "vitest";
import {
  controlFunctions,
  waitingOn,
  type ApprovalStatus,
  type ApprovalStage,
} from "@vendor-management/shared";
import { countByStatus, summariseControls } from "./control-functions.js";

/** All eight controls, with the leading ones overridden by the statuses given. */
function makeControls(...statuses: ApprovalStatus[]) {
  const byStage = Object.fromEntries(
    controlFunctions.map((stage, index) => [stage, statuses[index] ?? "IN_PROGRESS"]),
  );

  return controlFunctions.map((stage) => ({
    stage,
    status: (byStage[stage] ?? "IN_PROGRESS") as "PENDING" | "IN_PROGRESS" | "INFORMATION_REQUIRED" | "APPROVED" | "EDD_COMPLETE" | "CHANGES_REQUESTED",
    slaRisk: "ON_TRACK" as const,
    notes: null as string | null,
    enteredStageAt: null as string | null,
    completedAt: null as string | null,
    waitingOn: waitingOn(stage, byStage as Record<ApprovalStage, ApprovalStatus>),
  }));
}

const approved = (count: number): ApprovalStatus[] =>
  Array.from({ length: count }, () => "APPROVED");

describe("summariseControls", () => {
  it("counts cleared controls and reviews under way", () => {
    const summary = summariseControls(
      makeControls("APPROVED", "APPROVED", "IN_PROGRESS", "REJECTED"),
    );

    expect(summary.detail).toBe("2 of 8 controls cleared · 2 reviews outstanding");
  });

  it("excludes controls waiting on the vendor from the outstanding count", () => {
    const summary = summariseControls(
      makeControls(...approved(5), "IN_PROGRESS", "IN_PROGRESS", "INFORMATION_REQUIRED"),
    );

    expect(summary.detail).toBe("5 of 8 controls cleared · 2 reviews outstanding");
  });

  it("drops the outstanding clause when no review is under way", () => {
    const summary = summariseControls(makeControls(...approved(5), "INFORMATION_REQUIRED"));

    expect(summary.detail).toBe("5 of 8 controls cleared");
  });

  it("uses the singular when one review is outstanding", () => {
    const summary = summariseControls(makeControls(...approved(7), "IN_PROGRESS"));

    expect(summary.detail).toBe("7 of 8 controls cleared · 1 review outstanding");
  });

  it("drops the outstanding clause once everything has cleared", () => {
    const summary = summariseControls(makeControls(...approved(8)));

    expect(summary).toMatchObject({ tone: "cleared", label: "Cleared" });
    expect(summary.detail).toBe("8 of 8 controls cleared");
  });

  it("blocks the vendor when any single control is rejected", () => {
    const controls = makeControls(...approved(7), "REJECTED");

    expect(summariseControls(controls)).toMatchObject({ tone: "blocked", label: "Blocked" });
  });

  it("ranks a blocked control above one awaiting information", () => {
    const controls = makeControls("REJECTED", "INFORMATION_REQUIRED");

    expect(summariseControls(controls).label).toBe("Blocked");
  });

  it("reports information required ahead of reviews still in flight", () => {
    const controls = makeControls("APPROVED", "IN_PROGRESS", "INFORMATION_REQUIRED");

    expect(summariseControls(controls)).toMatchObject({
      tone: "info",
      label: "Information required",
    });
  });

  it("treats a rejected control as blocked", () => {
    expect(summariseControls(makeControls("REJECTED"))).toMatchObject({
      tone: "blocked",
      label: "Blocked",
    });
  });

  it("stays not started until someone touches a control", () => {
    expect(summariseControls(makeControls())).toMatchObject({
      tone: "idle",
      label: "Not started",
    });
  });
});

describe("countByStatus", () => {
  it("orders the queue worst-first, not by how many there are", () => {
    const counts = countByStatus([
      "PENDING",
      "PENDING",
      "PENDING",
      "IN_PROGRESS",
      "REJECTED",
    ]);

    expect(counts.map((entry) => [entry.label, entry.count])).toEqual([
      ["Blocked", 1],
      ["In review", 1],
      ["Not started", 3],
    ]);
  });

  it("omits states nothing is currently in", () => {
    const counts = countByStatus(["IN_PROGRESS"]);

    expect(counts.map((entry) => entry.label)).toEqual(["In review"]);
  });

  it("returns nothing for an empty queue", () => {
    expect(countByStatus([])).toEqual([]);
  });
});
