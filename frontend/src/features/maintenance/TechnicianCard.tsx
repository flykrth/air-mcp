'use client';

import { UserCheck } from 'lucide-react';
import { GlowCard } from '@/components/ui/GlowCard';
import { StatusBadge, statusToVariant } from '@/components/ui/StatusBadge';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function TechnicianCard() {
  const { data: state, isLoading } = useOrchestratorState();
  const technician = state?.selected_technician ?? null;

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[260px]">
        <div className="w-14 h-14 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center">
          <UserCheck className="h-6 w-6 text-zinc-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-400">No technician assigned</p>
          <p className="text-xs text-zinc-600 mt-1">A technician will be selected during maintenance planning.</p>
        </div>
      </div>
    );
  }

  const initials = technician.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <GlowCard accent="blue" className="p-6 flex flex-col gap-5">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 flex items-center gap-1.5">
          <UserCheck className="h-3 w-3" />
          Assigned Technician
        </p>
        <StatusBadge variant={statusToVariant(technician.status)} />
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/10">
          <span className="text-lg font-black text-blue-400">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-zinc-100 leading-tight">{technician.name}</p>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{technician.id}</p>
        </div>
      </div>

      {/* Skillset */}
      {technician.skillset && technician.skillset.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Skillset</p>
          <div className="flex flex-wrap gap-1.5">
            {technician.skillset.map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-medium px-2.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current Ticket */}
      {technician.current_ticket_id && (
        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Current Ticket</p>
          <p className="font-mono text-xs text-blue-400 font-semibold">
            {technician.current_ticket_id}
          </p>
        </div>
      )}
    </GlowCard>
  );
}
