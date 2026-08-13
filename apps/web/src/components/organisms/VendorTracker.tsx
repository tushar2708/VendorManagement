import { LINK_PROGRESS_RAIL, LINK_STATE_META } from "@vendor-management/shared";
import { getLinkStepIndex, getLinkStepState } from "../../lib/pipeline.js";
import { ProgressDot } from "../atoms/ProgressDot.js";
import { Badge } from "../atoms/Badge.js";
import { Card } from "../ui.js";

interface VendorTrackerProps {
  state: string;
  tat: {
    vendorPendingDays: number;
    buyerPendingDays: number;
  };
  erpVendorCode: string | null;
  buyerContact: {
    name: string | null;
    email: string;
  };
}

const TERMINAL_STATES = [
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
  "ON_HOLD",
];

export function VendorTracker({
  state,
  tat,
  erpVendorCode,
  buyerContact,
}: VendorTrackerProps) {
  const isTerminal = TERMINAL_STATES.includes(state);
  const stepIndex = getLinkStepIndex(state);

  const stateMeta = LINK_STATE_META[state];
  const stateLabel = stateMeta?.label || state;

  return (
    <Card className="p-6 space-y-6">
      {/* Progress Rail or Terminal Banner */}
      {isTerminal ? (
        <div className={`
          rounded p-4
          ${state === "REJECTED" ? "bg-red-50 border border-red-200" : ""}
          ${state === "WITHDRAWN" ? "bg-gray-50 border border-gray-200" : ""}
          ${state === "EXPIRED" ? "bg-yellow-50 border border-yellow-200" : ""}
          ${state === "ON_HOLD" ? "bg-blue-50 border border-blue-200" : ""}
        `}>
          <p className={`
            text-sm font-medium
            ${state === "REJECTED" ? "text-red-900" : ""}
            ${state === "WITHDRAWN" ? "text-gray-900" : ""}
            ${state === "EXPIRED" ? "text-yellow-900" : ""}
            ${state === "ON_HOLD" ? "text-blue-900" : ""}
          `}>
            {stateLabel}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Progress rail header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Onboarding Progress
            </h3>
            <Badge variant="info">{stateLabel}</Badge>
          </div>

          {/* 9-dot rail */}
          <div className="flex items-center gap-2 overflow-x-auto pb-6">
            {LINK_PROGRESS_RAIL.map((milestone, idx) => {
              const dotState = getLinkStepState(idx, stepIndex);
              return (
                <div key={idx} className="flex flex-col items-center">
                  <ProgressDot state={dotState} size="sm" />
                  <span className="text-xs text-slate-500 mt-1">{LINK_STATE_META[milestone]?.label}</span>
                  {idx < LINK_PROGRESS_RAIL.length - 1 && (
                    <div className="w-6 h-0.5 bg-gray-300 mx-1 -mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAT Stats */}
      <div className="border-t pt-4">
        <h4 className="text-xs font-semibold text-gray-600 mb-3">
          Timeline
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Vendor Pending</p>
            <p className="text-sm font-medium">
              {tat.vendorPendingDays} {tat.vendorPendingDays === 1 ? "day" : "days"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Buyer Pending</p>
            <p className="text-sm font-medium">
              {tat.buyerPendingDays} {tat.buyerPendingDays === 1 ? "day" : "days"}
            </p>
          </div>
        </div>
      </div>

      {/* Buyer Contact Info */}
      <div className="border-t pt-4">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">
          Buyer Contact
        </h4>
        <div className="space-y-1">
          {buyerContact.name && (
            <p className="text-sm text-gray-900">{buyerContact.name}</p>
          )}
          <a
            href={`mailto:${buyerContact.email}`}
            className="text-sm text-blue-600 hover:underline"
          >
            {buyerContact.email}
          </a>
        </div>
      </div>

      {/* ERP Vendor Code (if onboarded) */}
      {state === "ONBOARDED" && erpVendorCode && (
        <div className="border-t pt-4 bg-green-50 p-3 rounded">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            Vendor Code
          </p>
          <p className="text-sm font-medium text-green-900">
            {erpVendorCode}
          </p>
        </div>
      )}
    </Card>
  );
}
