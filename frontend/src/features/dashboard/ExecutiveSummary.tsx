'use client';

import { ProgressRing } from '@/components/ui/ProgressRing';
import { MetricCard } from '@/components/ui/MetricCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';

export function ExecutiveSummary() {
  const { data: state, isLoading } = useOrchestratorState();

  // Compute health score
  const criticalCount = state?.hotspots?.filter((h) => h.status === 'CRITICAL').length ?? 0;
  const degradedCount = state?.hotspots?.filter((h) => h.status === 'DEGRADED').length ?? 0;
  const coolingPenalty = state?.cooling_loop?.healthy === false ? 20 : 0;
  const healthScore = state
    ? Math.max(0, Math.round(100 - criticalCount * 20 - degradedCount * 10 - coolingPenalty))
    : null;

  // Derived values
  const activeHotspots = state?.hotspots?.length ?? 0;
  const riskExposure = state?.risk_exposure_usd ?? 0;
  const recoveryVerified = state?.recovery_verified ?? false;

  // Health ring color
  const ringColor =
    healthScore === null
      ? '#34d399'
      : healthScore >= 70
      ? '#34d399'
      : healthScore >= 40
      ? '#fbbf24'
      : '#f87171';

  if (isLoading && !state) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* System Health Score — ProgressRing */}
      <div className="glass-card p-5 flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          System Health Score
        </span>
        <div className="flex items-center gap-4">
          <ProgressRing
            value={healthScore ?? 0}
            size={72}
            strokeWidth={6}
            color={ringColor}
            label={healthScore !== null ? `${healthScore}` : '—'}
            sublabel="/ 100"
          />
          <div className="flex flex-col gap-1">
            <span
              className="text-sm font-bold"
              style={{ color: ringColor }}
            >
              {healthScore === null
                ? 'Loading…'
                : healthScore >= 70
                ? 'Healthy'
                : healthScore >= 40
                ? 'Degraded'
                : 'Critical'}
            </span>
            <span className="text-xs text-zinc-500">
              {criticalCount > 0
                ? `${criticalCount} critical rack${criticalCount > 1 ? 's' : ''}`
                : degradedCount > 0
                ? `${degradedCount} degraded rack${degradedCount > 1 ? 's' : ''}`
                : 'All systems nominal'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Hotspots */}
      <MetricCard
        label="Active Hotspots"
        value={activeHotspots}
        unit="racks"
        accent={activeHotspots === 0 ? 'emerald' : criticalCount > 0 ? 'red' : 'amber'}
        delta={
          activeHotspots === 0
            ? 'No incidents detected'
            : `${criticalCount} critical · ${degradedCount} degraded`
        }
        deltaPositive={activeHotspots === 0}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        }
      />

      {/* Risk Exposure */}
      <MetricCard
        label="Risk Exposure"
        value={`$${riskExposure.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        unit="USD"
        accent={riskExposure === 0 ? 'emerald' : riskExposure > 5000 ? 'red' : 'amber'}
        delta={
          riskExposure === 0
            ? 'No financial exposure'
            : `${state?.at_risk_workloads?.length ?? 0} workload${(state?.at_risk_workloads?.length ?? 0) !== 1 ? 's' : ''} at risk`
        }
        deltaPositive={riskExposure === 0}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />

      {/* Recovery Status */}
      <MetricCard
        label="Recovery Status"
        value={recoveryVerified ? 'Verified' : state?.status === 'IDLE' ? 'Idle' : 'Pending'}
        accent={recoveryVerified ? 'emerald' : state?.status === 'IDLE' ? 'emerald' : 'amber'}
        delta={
          state?.recovery_message ??
          (state?.current_step === 'IDLE' ? 'System at rest' : `Step: ${state?.current_step ?? '—'}`)
        }
        deltaPositive={recoveryVerified}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}
