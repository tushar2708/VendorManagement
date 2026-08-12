import { LINK_PROGRESS_RAIL, LINK_STATE_META } from "@vendor-management/shared";
import { getLinkStepIndex, getLinkStepState } from "../../lib/pipeline.js";
import { ProgressDot } from "../atoms/ProgressDot.js";

interface PipelineStepperProps {
  currentState: string;
}

export function PipelineStepper({ currentState }: PipelineStepperProps): React.ReactElement {
  const currentIndex = getLinkStepIndex(currentState);

  return (
    <div className="flex items-center gap-1">
      {LINK_PROGRESS_RAIL.map((state, i) => {
        const stepState = getLinkStepState(i, currentIndex);
        const meta = LINK_STATE_META[state];
        return (
          <div key={state} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <ProgressDot state={stepState} />
              <span className="mt-1 text-[10px] text-slate-400 leading-tight text-center max-w-[60px]">
                {meta?.label ?? state}
              </span>
            </div>
            {i < LINK_PROGRESS_RAIL.length - 1 && (
              <div className={`h-px w-4 ${stepState === "done" ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
