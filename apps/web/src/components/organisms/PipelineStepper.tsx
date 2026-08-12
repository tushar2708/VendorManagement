import { ProgressDot } from '../atoms/ProgressDot.js';
import { PIPELINE_STEPS, getCurrentStepIndex, getStepState } from '../../lib/pipeline.js';
import { cn } from '../ui.js';
import type { RequestStatus } from '@vendor-management/shared';

interface PipelineStepperProps {
  readonly status: RequestStatus;
  readonly className?: string;
}

export function PipelineStepper({ status, className }: PipelineStepperProps): React.ReactElement {
  const currentIndex = getCurrentStepIndex(status);

  return (
    <div className={cn('flex items-start', className)}>
      {PIPELINE_STEPS.map((step, i) => {
        const state = getStepState(i, currentIndex);
        const isLast = i === PIPELINE_STEPS.length - 1;
        return (
          <div key={step.key} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <ProgressDot state={state} size="md" />
              <p className={cn(
                'mt-2 text-xs text-center leading-tight max-w-[80px]',
                state === 'active' ? 'font-semibold text-slate-900' : state === 'done' ? 'text-emerald-700' : 'text-slate-400',
              )}>
                {step.label}
              </p>
            </div>
            {!isLast && (
              <div className={cn('mt-3 h-0.5 flex-1 mx-1', state === 'done' ? 'bg-emerald-500' : 'bg-slate-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
