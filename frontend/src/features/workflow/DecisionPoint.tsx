'use client';

import { BrainCircuit, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { GlowCard } from '@/components/ui/GlowCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Skeleton } from '@/components/ui/Skeleton';

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function deriveConfidence(
  recoveryVerified: boolean,
  stepHistory: string[],
  currentStep: string
): number {
  if (recoveryVerified) return 100;
  if (stepHistory.includes('COMPLETED') || currentStep === 'COMPLETED') return 100;
  if (stepHistory.length > 0) {
    return Math.min(75, Math.round((stepHistory.length / 8) * 80));
  }
  return 0;
}

export function DecisionPoint() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <GlowCard accent="amber" className="p-5">
        <Skeleton className="h-5 w-44 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard accent="amber" className="p-5">
        <p className="text-xs text-red-400">Failed to load decision data.</p>
      </GlowCard>
    );
  }

  const recoveryVerified = data?.recovery_verified ?? false;
  const stepHistory = data?.step_history ?? [];
  const currentStep = data?.current_step ?? 'IDLE';
  const confidence = deriveConfidence(recoveryVerified, stepHistory, currentStep);
  const totalCost = data?.order?.total_cost;
  const recoveryMessage = data?.recovery_message;

  const confidenceColor =
    confidence >= 80 ? '#34d399' : confidence >= 50 ? '#fbbf24' : '#f87171';

  return (
    <GlowCard accent="amber" className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <BrainCircuit className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-200">Mission Decision Record</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Orchestration Summary</p>
        </div>
      </div>

      {/* Confidence + Cost */}
      <div className="flex items-center gap-5">
        {/* Progress Ring */}
        <div className="flex-shrink-0">
          <ProgressRing
            value={confidence}
            size={72}
            strokeWidth={7}
            color={confidenceColor}
            label={`${confidence}%`}
            sublabel="confidence"
          />
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">
              Recovery Confidence
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${confidence}%`,
                    backgroundColor: confidenceColor,
                  }}
                />
              </div>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: confidenceColor }}
              >
                {confidence}%
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">
              Procurement Cost
            </p>
            <p className="text-sm font-black tabular-nums text-zinc-200">
              {totalCost != null ? (
                <span className="text-amber-400">{formatUSD(totalCost)}</span>
              ) : (
                <span className="text-zinc-600">Pending</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Recovery Strategy */}
      <div className="pt-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-1.5">
          Recovery Strategy
        </p>
        {recoveryMessage ? (
          <p className="text-xs text-zinc-400 italic leading-relaxed">{recoveryMessage}</p>
        ) : currentStep === 'IDLE' ? (
          <p className="text-xs text-zinc-600 italic">Awaiting orchestration trigger...</p>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-beacon"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-amber-400/80 italic">Orchestrating recovery...</p>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg border',
          recoveryVerified || currentStep === 'COMPLETED'
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
            : currentStep === 'IDLE'
            ? 'bg-zinc-800/40 border-zinc-700 text-zinc-500'
            : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
        )}
      >
        <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-widest">
          {recoveryVerified || currentStep === 'COMPLETED'
            ? 'Mission Complete'
            : currentStep === 'IDLE'
            ? 'Standby'
            : 'In Progress'}
        </span>
        <span
          className={clsx(
            'ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0',
            recoveryVerified || currentStep === 'COMPLETED'
              ? 'bg-emerald-400'
              : currentStep === 'IDLE'
              ? 'bg-zinc-500'
              : 'bg-amber-400 animate-beacon'
          )}
        />
      </div>
    </GlowCard>
  );
}
