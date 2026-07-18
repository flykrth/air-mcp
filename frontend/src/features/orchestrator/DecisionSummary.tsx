'use client';

import { CheckCircle2, Star, Clock, Server, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { GlowCard } from '@/components/ui/GlowCard';
import { StatusBadge, statusToVariant } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={clsx(
            'h-3 w-3',
            i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
          )}
        />
      ))}
      <span className="text-[10px] text-zinc-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
      <p className="text-sm font-black text-zinc-200">{value}</p>
      {sub && <p className="text-[10px] text-zinc-500">{sub}</p>}
    </div>
  );
}

export function DecisionSummary() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <GlowCard accent="emerald" className="p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard accent="emerald" className="p-5">
        <p className="text-sm text-red-400">Failed to load decision summary.</p>
      </GlowCard>
    );
  }

  const recoveryVerified = data?.recovery_verified ?? false;
  const currentStep = data?.current_step ?? 'IDLE';
  const isComplete = currentStep === 'COMPLETED' || recoveryVerified;
  const isIdle = currentStep === 'IDLE' && (data?.step_history?.length ?? 0) === 0;

  const migrationsCount = data?.migrations_executed?.length ?? 0;
  const riskExposure = data?.risk_exposure_usd ?? 0;
  const totalCost = data?.order?.total_cost;
  const supplier = data?.selected_supplier;
  const technician = data?.selected_technician;
  const recoveryMessage = data?.recovery_message;

  return (
    <GlowCard accent="emerald" className="p-5 space-y-5">
      {/* Header badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-200">Mission Summary</h3>
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-widest',
            isComplete
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
              : isIdle
              ? 'bg-zinc-800/60 text-zinc-500 border-zinc-700'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          )}
        >
          <span
            className={clsx(
              'w-1.5 h-1.5 rounded-full',
              isComplete ? 'bg-emerald-400' : isIdle ? 'bg-zinc-600' : 'bg-amber-400 animate-beacon'
            )}
          />
          {isComplete ? 'Mission Complete' : isIdle ? 'Standby' : 'In Progress'}
        </span>
      </div>

      {/* 4 Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
        <Metric
          label="Risk Mitigated"
          value={
            riskExposure > 0 ? (
              <span className="text-red-400">{formatUSD(riskExposure)}</span>
            ) : (
              <span className="text-zinc-500">—</span>
            )
          }
          sub="financial exposure"
        />
        <Metric
          label="Procurement Cost"
          value={
            totalCost != null ? (
              <span className="text-amber-400">{formatUSD(totalCost)}</span>
            ) : (
              <span className="text-zinc-600">Pending</span>
            )
          }
          sub="order total"
        />
        <Metric
          label="Migrations"
          value={
            <span className="text-blue-400">{migrationsCount}</span>
          }
          sub="workloads moved"
        />
        <Metric
          label="Recovery"
          value={
            recoveryVerified ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Clock className="h-4 w-4" />
                Pending
              </span>
            )
          }
          sub="system status"
        />
      </div>

      {/* Supplier Card */}
      {supplier ? (
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3.5 w-3.5 text-zinc-600" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Selected Supplier
            </p>
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-zinc-200">{supplier.name}</p>
              <StarRating rating={supplier.rating} />
            </div>
            {data?.order && (
              <div className="text-right">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Order</p>
                <p className="text-xs font-semibold text-zinc-300">{data.order.item_name}</p>
                <p className="text-[10px] text-zinc-500">Qty: {data.order.quantity}</p>
              </div>
            )}
          </div>
          {data?.order && (
            <div className="flex items-center gap-2 pt-1">
              <StatusBadge
                variant={statusToVariant(data.order.status)}
                label={data.order.status}
              />
              {data.order.estimated_delivery && (
                <span className="text-[10px] text-zinc-600">
                  ETA: {new Date(data.order.estimated_delivery).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Technician Card */}
      {technician ? (
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Server className="h-3.5 w-3.5 text-zinc-600" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Assigned Technician
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-zinc-200">{technician.name}</p>
            <StatusBadge
              variant={statusToVariant(technician.status)}
              label={technician.status.replace('_', ' ')}
            />
          </div>
          {technician.skillset && technician.skillset.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {technician.skillset.map((skill) => (
                <span
                  key={skill}
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase tracking-wide"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Recovery message */}
      {recoveryMessage && (
        <div className="pt-3 border-t border-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">
            Recovery Note
          </p>
          <p className="text-xs text-zinc-400 italic leading-relaxed">{recoveryMessage}</p>
        </div>
      )}

      {/* Empty state */}
      {isIdle && !supplier && !technician && (
        <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
          <p className="text-xs text-zinc-600 italic">
            Run the orchestrator to populate mission data
          </p>
        </div>
      )}
    </GlowCard>
  );
}
