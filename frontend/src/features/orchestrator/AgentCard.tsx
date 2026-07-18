'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { GlowCard } from '@/components/ui/GlowCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';

export interface AgentCardProps {
  name: string;
  icon: ReactNode;
  status: 'idle' | 'active' | 'completed';
  currentTask: string;
  confidence: number;
  lastAction: string;
}

const statusConfig = {
  idle: {
    accent: 'none' as const,
    ringColor: '#52525b',
    badgeVariant: 'idle' as const,
    iconBg: 'bg-zinc-800/60',
    iconColor: 'text-zinc-500',
  },
  active: {
    accent: 'emerald' as const,
    ringColor: '#34d399',
    badgeVariant: 'running' as const,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  completed: {
    accent: 'none' as const,
    ringColor: '#34d399',
    badgeVariant: 'completed' as const,
    iconBg: 'bg-zinc-800/60',
    iconColor: 'text-zinc-400',
  },
};

export function AgentCard({
  name,
  icon,
  status,
  currentTask,
  confidence,
  lastAction,
}: AgentCardProps) {
  const cfg = statusConfig[status];

  return (
    <GlowCard
      accent={cfg.accent}
      className={clsx(
        'p-4 flex flex-col gap-3 transition-all duration-300',
        status === 'active' && 'animate-glow-emerald'
      )}
    >
      {/* Top: icon + name + badge */}
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'p-2 rounded-lg flex-shrink-0 transition-all duration-300',
            cfg.iconBg
          )}
        >
          <span className={clsx('block [&>svg]:h-4 [&>svg]:w-4', cfg.iconColor)}>
            {icon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-200 truncate leading-snug">{name}</p>
          <div className="mt-1">
            <StatusBadge
              variant={cfg.badgeVariant}
              label={status.toUpperCase()}
              showDot={status === 'active'}
            />
          </div>
        </div>
      </div>

      {/* Current task */}
      <div className="min-h-[36px]">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">
          Current Task
        </p>
        <p
          className={clsx(
            'text-xs leading-snug',
            status === 'active' ? 'text-zinc-300' : 'text-zinc-500'
          )}
        >
          {currentTask}
        </p>
      </div>

      {/* Bottom: confidence ring + last action */}
      <div className="flex items-end gap-3 pt-1 border-t border-zinc-800/80">
        <div className="flex-shrink-0">
          <ProgressRing
            value={confidence}
            size={52}
            strokeWidth={5}
            color={cfg.ringColor}
            label={`${confidence}`}
            sublabel="%"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold mb-0.5">
            Last Action
          </p>
          <p className="text-[10px] text-zinc-500 leading-snug break-words">{lastAction}</p>
        </div>
      </div>
    </GlowCard>
  );
}
