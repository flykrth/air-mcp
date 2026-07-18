'use client';

import { CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { StatusBadge, statusToVariant } from '@/components/ui/StatusBadge';
import { GlowCard } from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/Skeleton';

export function AffectedAssetsList() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <GlowCard className="p-5">
        <h3 className="text-sm font-bold text-zinc-200 mb-4">Affected Assets</h3>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard className="p-5">
        <p className="text-sm text-red-400">Failed to load affected assets.</p>
      </GlowCard>
    );
  }

  const hotspots = data?.hotspots ?? [];
  const atRiskWorkloads = data?.at_risk_workloads ?? [];

  if (hotspots.length === 0) {
    return (
      <GlowCard accent="emerald" className="p-5">
        <h3 className="text-sm font-bold text-zinc-200 mb-4">Affected Assets</h3>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm text-zinc-400">No affected assets detected</p>
          <p className="text-xs text-zinc-600">All rack telemetry within safe thresholds</p>
        </div>
      </GlowCard>
    );
  }

  return (
    <GlowCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-200">Affected Assets</h3>
        <span className="text-[11px] text-zinc-500">{hotspots.length} rack{hotspots.length !== 1 ? 's' : ''} impacted</span>
      </div>

      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-2.5 text-zinc-500 font-semibold uppercase tracking-wider">
                Rack Name
              </th>
              <th className="text-left px-3 py-2.5 text-zinc-500 font-semibold uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold uppercase tracking-wider">
                Temp (°C)
              </th>
              <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold uppercase tracking-wider">
                Power (kW)
              </th>
              <th className="text-right px-3 py-2.5 text-zinc-500 font-semibold uppercase tracking-wider">
                Flow (L/s)
              </th>
              <th className="text-right px-5 py-2.5 text-zinc-500 font-semibold uppercase tracking-wider">
                At-Risk Workloads
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {hotspots.map((rack) => {
              const riskCount = atRiskWorkloads.filter(
                (w) => w.current_rack === rack.name
              ).length;

              const isCritical = rack.status === 'CRITICAL';
              const isDegraded = rack.status === 'DEGRADED';

              return (
                <tr
                  key={rack.rack_id}
                  className={clsx(
                    'transition-colors',
                    isCritical
                      ? 'bg-red-500/5 hover:bg-red-500/10'
                      : isDegraded
                      ? 'bg-amber-500/5 hover:bg-amber-500/10'
                      : 'hover:bg-zinc-800/30'
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={clsx(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          isCritical ? 'bg-red-400 animate-beacon' : isDegraded ? 'bg-amber-400 animate-beacon' : 'bg-zinc-500'
                        )}
                      />
                      <span
                        className={clsx(
                          'font-semibold',
                          isCritical ? 'text-red-300' : isDegraded ? 'text-amber-300' : 'text-zinc-200'
                        )}
                      >
                        {rack.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge variant={statusToVariant(rack.status)} label={rack.status} />
                  </td>
                  <td className="px-3 py-3 text-right font-terminal">
                    <span
                      className={clsx(
                        'font-bold',
                        rack.temperature_celsius >= 85
                          ? 'text-red-400'
                          : rack.temperature_celsius >= 75
                          ? 'text-amber-400'
                          : 'text-zinc-300'
                      )}
                    >
                      {rack.temperature_celsius.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-terminal text-zinc-300">
                    {rack.power_draw_kw.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right font-terminal text-zinc-300">
                    {rack.cooling_flow_rate_lps.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {riskCount > 0 ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold border border-red-500/20">
                        {riskCount}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlowCard>
  );
}
