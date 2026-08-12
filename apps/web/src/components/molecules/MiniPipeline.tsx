import { ProgressDot } from '../atoms/ProgressDot.js';
import { PIPELINE_STEPS, getCurrentStepIndex, getStepState } from '../../lib/pipeline.js';
import { cn } from '../ui.js';
import type { RequestStatus } from '@vendor-management/shared';

interface MiniPipelineProps {
  readonly status: RequestStatus;
  readonly className?: string;
}

export function MiniPipeline({ status, className }: MiniPipelineProps): React.ReactElement {
  const currentIndex = getCurrentStepIndex(status);

  return (
    <div className={cn('flex items-center gap-0', className)}>
      {PIPELINE_STEPS.map((step, i) => {
        const state = getStepState(i, currentIndex);
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <ProgressDot state={state} size="sm" />
              <span className={cn(
                'mt-1 text-[10px] leading-tight',
                state === 'active' ? 'font-semibold text-slate-900' : 'text-slate-400',
              )}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={cn(
                'mx-1 h-0.5 w-4 self-start mt-2',
                state === 'done' ? 'bg-emerald-500' : 'bg-slate-200',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
