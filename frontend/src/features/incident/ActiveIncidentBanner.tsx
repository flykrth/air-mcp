'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';

export function ActiveIncidentBanner() {
  const { data, isLoading } = useOrchestratorState();

  if (isLoading) {
    return (
      <div className="w-full h-14 rounded-xl skeleton" />
    );
  }

  const hotspots = data?.hotspots ?? [];
  const hasCritical = hotspots.some((h) => h.status === 'CRITICAL');
  const hasDegraded = hotspots.some((h) => h.status === 'DEGRADED');
  const hasIncident = hotspots.length > 0;

  if (!hasIncident) {
    return (
      <div className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 glow-emerald">
        <div className="flex-shrink-0 p-1.5 bg-emerald-500/20 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-black tracking-widest text-emerald-400 uppercase">
            All Systems Nominal
          </span>
          <span className="text-xs text-emerald-500/70 font-medium">
            No active incidents — infrastructure operating within safe parameters
          </span>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="text-[10px] font-semibold text-emerald-500/60 uppercase tracking-widest">
            Healthy
          </span>
        </div>
      </div>
    );
  }

  const firstHotspot = hotspots[0];
  const incidentSince = firstHotspot?.recorded_at
    ? new Date(firstHotspot.recorded_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Unknown';

  return (
    <div
      className={clsx(
        'w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border',
        hasCritical
          ? 'bg-red-500/10 border-red-500/30 glow-red'
          : 'bg-amber-500/10 border-amber-500/30 glow-amber'
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          'flex-shrink-0 p-1.5 rounded-lg',
          hasCritical ? 'bg-red-500/20' : 'bg-amber-500/20'
        )}
      >
        <AlertTriangle
          className={clsx(
            'h-5 w-5',
            hasCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0 flex-1">
        <span
          className={clsx(
            'text-sm font-black tracking-widest uppercase',
            hasCritical ? 'text-red-400' : 'text-amber-400'
          )}
        >
          Thermal Incident Active
        </span>

        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border',
              hasCritical
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            )}
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full animate-beacon',
                hasCritical ? 'bg-red-400' : 'bg-amber-400'
              )}
            />
            {hotspots.length} Affected Rack{hotspots.length !== 1 ? 's' : ''}
          </span>

          {hasCritical && hasDegraded && (
            <span className="text-xs text-zinc-500">
              ({hotspots.filter((h) => h.status === 'CRITICAL').length} critical,{' '}
              {hotspots.filter((h) => h.status === 'DEGRADED').length} degraded)
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-right">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">since</p>
        <p
          className={clsx(
            'text-xs font-bold font-terminal',
            hasCritical ? 'text-red-400' : 'text-amber-400'
          )}
        >
          {incidentSince}
        </p>
      </div>
    </div>
  );
}
