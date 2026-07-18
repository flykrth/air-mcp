'use client';

import {
  Flame,
  Activity,
  ShieldAlert,
  Server,
  Wrench,
  Truck,
  CheckCircle2,
  CheckCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { GlowCard } from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrchestratorStep } from '@/types';

interface RecoveryStep {
  id: number;
  label: string;
  icon: ReactNode;
  triggerStep: OrchestratorStep;
}

const RECOVERY_STEPS: RecoveryStep[] = [
  {
    id: 1,
    label: 'Anomaly Detected',
    icon: <Flame className="h-4 w-4" />,
    triggerStep: 'HEATWAVE_TRIGGERED',
  },
  {
    id: 2,
    label: 'Telemetry Scan',
    icon: <Activity className="h-4 w-4" />,
    triggerStep: 'THERMAL_ANALYSIS',
  },
  {
    id: 3,
    label: 'Risk Analysis',
    icon: <ShieldAlert className="h-4 w-4" />,
    triggerStep: 'RISK_ASSESSMENT',
  },
  {
    id: 4,
    label: 'Workload Migration',
    icon: <Server className="h-4 w-4" />,
    triggerStep: 'WORKLOAD_MIGRATION',
  },
  {
    id: 5,
    label: 'Maintenance Plan',
    icon: <Wrench className="h-4 w-4" />,
    triggerStep: 'MAINTENANCE_PLANNING',
  },
  {
    id: 6,
    label: 'Supplier Eval',
    icon: <Truck className="h-4 w-4" />,
    triggerStep: 'SUPPLIER_EVALUATION',
  },
  {
    id: 7,
    label: 'Recovery',
    icon: <CheckCircle className="h-4 w-4" />,
    triggerStep: 'COMPLETED',
  },
];

type StepStatus = 'completed' | 'active' | 'pending';

function getStepStatus(
  step: RecoveryStep,
  stepHistory: string[],
  currentStep: string
): StepStatus {
  if (stepHistory.includes(step.triggerStep) || currentStep === 'COMPLETED' && step.triggerStep === 'COMPLETED') {
    return 'completed';
  }
  if (currentStep === step.triggerStep) return 'active';
  return 'pending';
}

export function RecoveryProgress() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <GlowCard className="p-5 h-full">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard className="p-5">
        <p className="text-sm text-red-400">Failed to load recovery progress.</p>
      </GlowCard>
    );
  }

  const stepHistory = data?.step_history ?? [];
  const currentStep = data?.current_step ?? 'IDLE';
  const recoveryVerified = data?.recovery_verified ?? false;
  const completedCount = RECOVERY_STEPS.filter(
    (s) => getStepStatus(s, stepHistory, currentStep) === 'completed'
  ).length;
  const progressPct = Math.round((completedCount / RECOVERY_STEPS.length) * 100);

  return (
    <GlowCard className="p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-zinc-200">Recovery Pipeline</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">{completedCount} / {RECOVERY_STEPS.length} steps complete</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-emerald-400 tabular-nums">{progressPct}%</p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Progress</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex-1">
        {RECOVERY_STEPS.map((step, idx) => {
          const status = getStepStatus(step, stepHistory, currentStep);
          const isLast = idx === RECOVERY_STEPS.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4">
              {/* Left column: circle + connector line */}
              <div className="flex flex-col items-center flex-shrink-0 w-8">
                {/* Step circle */}
                <div
                  className={clsx(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500',
                    status === 'completed'
                      ? 'bg-emerald-500/20 border-2 border-emerald-500'
                      : status === 'active'
                      ? 'bg-amber-500/10 border-2 border-amber-400 ring-2 ring-amber-400/30 ring-offset-1 ring-offset-zinc-950 animate-glow-emerald'
                      : 'bg-zinc-900 border-2 border-zinc-700'
                  )}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <span
                      className={clsx(
                        status === 'active' ? 'text-amber-400' : 'text-zinc-600'
                      )}
                    >
                      {step.icon}
                    </span>
                  )}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={clsx(
                      'w-0.5 flex-1 my-0.5 transition-all duration-500',
                      status === 'completed' ? 'bg-emerald-500' : 'bg-zinc-800'
                    )}
                    style={{ minHeight: '24px' }}
                  />
                )}
              </div>

              {/* Right: label */}
              <div className={clsx('pb-4 min-w-0 flex-1', isLast && 'pb-0')}>
                <div className="flex items-center gap-2 h-8">
                  <span
                    className={clsx(
                      'text-xs font-semibold',
                      status === 'completed'
                        ? 'text-emerald-400'
                        : status === 'active'
                        ? 'text-amber-300'
                        : 'text-zinc-600'
                    )}
                  >
                    {step.label}
                  </span>
                  {status === 'active' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-beacon" />
                      Active
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="text-[9px] text-emerald-600 font-medium">✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recovery Verified Badge */}
      {recoveryVerified && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-400">Recovery Verified</p>
              <p className="text-[10px] text-emerald-600/80">{data?.recovery_message ?? 'System fully restored'}</p>
            </div>
          </div>
        </div>
      )}
    </GlowCard>
  );
}
