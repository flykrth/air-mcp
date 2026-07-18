'use client';

import { clsx } from 'clsx';
import { GlowCard } from '@/components/ui/GlowCard';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { SkeletonCard } from '@/components/ui/Skeleton';

function EfficiencyBar({ efficiency }: { efficiency: number }) {
  const clamped = Math.min(100, Math.max(0, efficiency));
  const color =
    clamped > 70
      ? 'bg-emerald-400'
      : clamped >= 40
      ? 'bg-amber-400'
      : 'bg-red-400';

  const trackGlow =
    clamped > 70
      ? 'shadow-[0_0_8px_rgba(52,211,153,0.35)]'
      : clamped >= 40
      ? 'shadow-[0_0_8px_rgba(251,191,36,0.35)]'
      : 'shadow-[0_0_8px_rgba(248,113,113,0.4)]';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Cooling Efficiency
        </span>
        <span
          className={clsx(
            'text-sm font-black tabular-nums',
            clamped > 70
              ? 'text-emerald-400'
              : clamped >= 40
              ? 'text-amber-400'
              : 'text-red-400'
          )}
        >
          {clamped.toFixed(1)}%
        </span>
      </div>
      <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', color, trackGlow)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function CoolingLoopStatus() {
  const { data: state, isLoading } = useOrchestratorState();

  if (isLoading && !state) {
    return <SkeletonCard className="h-full" />;
  }

  const cooling = state?.cooling_loop;
  const isHealthy = cooling?.healthy ?? true;
  const accent = isHealthy ? 'emerald' : cooling?.efficiency !== undefined && cooling.efficiency < 40 ? 'red' : 'amber';

  return (
    <GlowCard accent={accent} className="p-5 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Cooling Loop
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={clsx(
                'w-2 h-2 rounded-full flex-shrink-0',
                isHealthy ? 'bg-emerald-400 animate-beacon' : 'bg-red-400 animate-beacon'
              )}
            />
            <span
              className={clsx(
                'text-sm font-bold',
                isHealthy ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {isHealthy ? 'Healthy' : 'Degraded'}
            </span>
          </div>
        </div>
        <div
          className={clsx(
            'px-2.5 py-1 rounded-full text-xs font-semibold border',
            isHealthy
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          )}
        >
          {cooling?.status ?? 'UNKNOWN'}
        </div>
      </div>

      {/* Ambient Temperature — large reading */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Ambient Temperature
        </span>
        <div className="flex items-baseline gap-1.5">
          <span
            className={clsx(
              'text-4xl font-black tabular-nums leading-none',
              (cooling?.ambient_temp ?? 0) > 35
                ? 'text-red-400'
                : (cooling?.ambient_temp ?? 0) > 28
                ? 'text-amber-400'
                : 'text-emerald-400'
            )}
          >
            {cooling?.ambient_temp?.toFixed(1) ?? '—'}
          </span>
          <span className="text-lg font-medium text-zinc-400">°C</span>
        </div>
      </div>

      {/* Efficiency Bar */}
      <EfficiencyBar efficiency={cooling?.efficiency ?? 0} />

      {/* Chiller Flow Rate */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Chiller Flow Rate
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black tabular-nums text-zinc-100">
            {cooling?.chiller_flow_lps?.toFixed(2) ?? '—'}
          </span>
          <span className="text-xs font-medium text-zinc-500">L/s</span>
        </div>
      </div>
    </GlowCard>
  );
}
