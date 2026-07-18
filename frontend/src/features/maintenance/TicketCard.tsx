'use client';

import { Wrench, Clock, Package, Server } from 'lucide-react';
import { GlowCard } from '@/components/ui/GlowCard';
import { StatusBadge, statusToVariant } from '@/components/ui/StatusBadge';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function TicketCard() {
  const { data: state, isLoading } = useOrchestratorState();
  const ticket = state?.ticket ?? null;

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[260px]">
        <div className="w-14 h-14 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center">
          <Wrench className="h-6 w-6 text-zinc-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-400">No active maintenance ticket</p>
          <p className="text-xs text-zinc-600 mt-1">A ticket will be created when an incident is detected.</p>
        </div>
      </div>
    );
  }

  const scheduledDate = ticket.scheduled_time
    ? new Date(ticket.scheduled_time).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const partsEntries = Object.entries(ticket.parts_required ?? {});

  return (
    <GlowCard accent="amber" className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Wrench className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
              Maintenance Ticket
            </p>
            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{ticket.id}</p>
          </div>
        </div>
        <StatusBadge variant={statusToVariant(ticket.status)} />
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-amber-500/30 pl-3">
        {ticket.description}
      </p>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Target Rack */}
        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Server className="h-3 w-3" />
            Target Rack
          </p>
          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {ticket.target_rack_id}
          </span>
        </div>

        {/* Scheduled */}
        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Scheduled
          </p>
          <p className="text-xs text-zinc-300 font-medium">{scheduledDate}</p>
        </div>
      </div>

      {/* Parts Required */}
      {partsEntries.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Package className="h-3 w-3" />
            Parts Required
          </p>
          <div className="flex flex-wrap gap-1.5">
            {partsEntries.map(([item, qty]) => (
              <span
                key={item}
                className="text-[11px] font-medium px-2 py-0.5 bg-zinc-800/80 border border-zinc-700 rounded-full text-zinc-300"
              >
                {item}: <span className="text-amber-400 font-bold">{qty}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Resolved At */}
      {ticket.resolved_at && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Resolved:{' '}
          {new Date(ticket.resolved_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </GlowCard>
  );
}
