'use client';

import { clsx } from 'clsx';
import { CheckCircle2 } from 'lucide-react';
import type { JudgeModeStep, JudgeModeStepId } from '@/types';

interface JudgeStepIndicatorProps {
  steps: JudgeModeStep[];
  currentIndex: number;
  onStepClick: (id: JudgeModeStepId) => void;
}

export function JudgeStepIndicator({
  steps,
  currentIndex,
  onStepClick,
}: JudgeStepIndicatorProps) {
  return (
    <div className="px-6 py-3 border-b border-zinc-800/60 overflow-x-auto">
      <div className="flex items-center min-w-max mx-auto">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step node */}
              <button
                onClick={() => onStepClick(step.id)}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                {/* Circle */}
                <div
                  className={clsx(
                    'relative flex items-center justify-center transition-all duration-300',
                    isCurrent
                      ? 'w-8 h-8 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-zinc-950'
                      : isCompleted
                      ? 'w-8 h-8 rounded-full bg-emerald-500/80'
                      : 'w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 group-hover:border-zinc-500'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                  ) : (
                    <span
                      className={clsx(
                        'text-[11px] font-black tabular-nums',
                        isCurrent ? 'text-zinc-950' : 'text-zinc-500 group-hover:text-zinc-300'
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={clsx(
                    'text-[10px] font-semibold text-center leading-tight transition-colors duration-200 max-w-[72px]',
                    isCurrent
                      ? 'text-emerald-400'
                      : isCompleted
                      ? 'text-zinc-400'
                      : 'text-zinc-600 group-hover:text-zinc-500',
                    'hidden sm:block'
                  )}
                >
                  {step.title}
                </span>

                {/* Mobile: number only */}
                <span
                  className={clsx(
                    'text-[9px] font-bold sm:hidden',
                    isCurrent ? 'text-emerald-400' : isFuture ? 'text-zinc-600' : 'text-zinc-400'
                  )}
                >
                  {i + 1}
                </span>
              </button>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    'h-px transition-all duration-500 mx-1',
                    'w-8 sm:w-12 md:w-16',
                    i < currentIndex ? 'bg-emerald-500/60' : 'bg-zinc-800'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
