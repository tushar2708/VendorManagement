import { LINK_PROGRESS_RAIL } from "@vendor-management/shared";
import { getLinkStepIndex, getLinkStepState } from "../../lib/pipeline.js";
import { ProgressDot } from "../atoms/ProgressDot.js";

interface MiniPipelineProps {
  currentState: string;
}

export function MiniPipeline({ currentState }: MiniPipelineProps): React.ReactElement {
  const currentIndex = getLinkStepIndex(currentState);

  return (
    <div className="flex items-center gap-0.5">
      {LINK_PROGRESS_RAIL.map((state, i) => (
        <ProgressDot key={state} state={getLinkStepState(i, currentIndex)} size="sm" />
      ))}
    </div>
  );
}
