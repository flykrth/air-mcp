'use client';

import { Server, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { GlowCard } from '@/components/ui/GlowCard';
import { StatusBadge, statusToVariant } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';

export function MigrationLog() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <GlowCard className="p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard className="p-4">
        <p className="text-xs text-red-400">Failed to load migration log.</p>
      </GlowCard>
    );
  }

  const migrations = data?.migrations_executed ?? [];

  return (
    <GlowCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-200">Migration Log</h3>
        <span className="text-[11px] text-zinc-500">
          {migrations.length} migration{migrations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {migrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2.5">
          <div className="p-2.5 bg-zinc-800/60 rounded-full">
            <Server className="h-5 w-5 text-zinc-600" />
          </div>
          <p className="text-xs text-zinc-500">No migrations executed yet</p>
          <p className="text-[10px] text-zinc-700">Workloads remain on current racks</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-2 text-zinc-600 font-semibold uppercase tracking-wide">
                  Workload
                </th>
                <th className="text-left px-3 py-2 text-zinc-600 font-semibold uppercase tracking-wide">
                  Target Rack
                </th>
                <th className="text-right px-4 py-2 text-zinc-600 font-semibold uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {migrations.map((m, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-zinc-200 truncate block max-w-[110px]">
                      {m.workload_name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <ArrowRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                      <span className="font-terminal text-[11px]">{m.target_rack}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <StatusBadge
                      variant={statusToVariant(m.status)}
                      label={m.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlowCard>
  );
}
