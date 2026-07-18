'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { GlowCard } from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AtRiskWorkload } from '@/types';

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function getBarColor(probability: number): string {
  if (probability > 0.6) return '#f87171'; // red-400
  if (probability >= 0.3) return '#fbbf24'; // amber-400
  return '#34d399'; // emerald-400
}

function getRiskLabel(probability: number): string {
  if (probability > 0.6) return 'HIGH';
  if (probability >= 0.3) return 'MED';
  return 'LOW';
}

function getRiskColor(probability: number): string {
  if (probability > 0.6) return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (probability >= 0.3) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: AtRiskWorkload; value: number }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card px-3 py-2 text-xs space-y-1 min-w-[160px]">
      <p className="font-bold text-zinc-200 truncate">{d.workload_name}</p>
      <p className="text-zinc-400">
        Risk Cost: <span className="text-red-400 font-bold">{formatUSD(d.calculated_risk_cost_usd)}</span>
      </p>
      <p className="text-zinc-400">
        Failure Prob: <span className="font-bold" style={{ color: getBarColor(d.failure_probability) }}>
          {(d.failure_probability * 100).toFixed(0)}%
        </span>
      </p>
    </div>
  );
}

export function RiskExposureCard() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <GlowCard accent="red" className="p-5 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[200px] w-full" />
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard accent="red" className="p-5">
        <p className="text-sm text-red-400">Failed to load risk exposure data.</p>
      </GlowCard>
    );
  }

  const riskExposure = data?.risk_exposure_usd ?? 0;
  const workloads = data?.at_risk_workloads ?? [];
  const accentColor = riskExposure > 0 ? 'red' : 'emerald';

  return (
    <GlowCard accent={accentColor} className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Total Risk Exposure
          </p>
          <p
            className={clsx(
              'text-3xl font-black tabular-nums',
              riskExposure > 0 ? 'text-red-400' : 'text-emerald-400'
            )}
          >
            {formatUSD(riskExposure)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            across {workloads.length} at-risk workload{workloads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div
          className={clsx(
            'px-2.5 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-widest',
            riskExposure > 0
              ? 'text-red-400 bg-red-500/10 border-red-500/20'
              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          )}
        >
          {riskExposure > 0 ? 'At Risk' : 'Nominal'}
        </div>
      </div>

      {/* Bar Chart */}
      {workloads.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">
            Risk Cost by Workload
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={workloads}
              margin={{ top: 4, right: 4, left: 0, bottom: 24 }}
              barCategoryGap="25%"
            >
              <XAxis
                dataKey="workload_name"
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 10) + '…' : v)}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="calculated_risk_cost_usd" radius={[4, 4, 0, 0]}>
                {workloads.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.failure_probability)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-zinc-600 italic">No at-risk workloads</p>
        </div>
      )}

      {/* Workload Cards */}
      {workloads.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">
            Workload Risk Detail
          </p>
          {workloads.map((w) => (
            <div
              key={w.workload_id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{w.workload_name}</p>
                  <span
                    className={clsx(
                      'flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest',
                      getRiskColor(w.failure_probability)
                    )}
                  >
                    {getRiskLabel(w.failure_probability)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(w.failure_probability * 100).toFixed(0)}%`,
                      backgroundColor: getBarColor(w.failure_probability),
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-zinc-500">
                    Failure prob: {(w.failure_probability * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400">
                    {formatUSD(w.calculated_risk_cost_usd)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  );
}
