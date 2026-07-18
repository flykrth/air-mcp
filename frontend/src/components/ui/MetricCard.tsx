import { clsx } from 'clsx';
import { GlowCard } from './GlowCard';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: 'emerald' | 'amber' | 'red' | 'blue' | 'violet' | 'none';
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  unit,
  accent = 'none',
  delta,
  deltaPositive,
  icon,
}: MetricCardProps) {
  return (
    <GlowCard accent={accent} className="p-5 flex flex-col gap-3">
      {/* Top: Label + Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 truncate">
          {label}
        </span>
        {icon && (
          <div
            className={clsx(
              'p-1.5 rounded-lg flex-shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-400',
              accent === 'emerald' && 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10',
              accent === 'amber' && 'text-amber-400 bg-amber-500/5 border-amber-500/10',
              accent === 'red' && 'text-red-400 bg-red-500/5 border-red-500/10',
              accent === 'blue' && 'text-blue-400 bg-blue-500/5 border-blue-500/10',
              accent === 'violet' && 'text-violet-400 bg-violet-500/5 border-violet-500/10'
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Middle: Value + Unit */}
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-3xl font-black text-zinc-100 tabular-nums leading-none tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom: Delta explanation */}
      {delta && (
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-zinc-900">
          <span
            className={clsx(
              'text-[11px] font-medium leading-none truncate',
              deltaPositive === true
                ? 'text-emerald-400'
                : deltaPositive === false
                ? 'text-red-400'
                : 'text-zinc-400'
            )}
          >
            {delta}
          </span>
        </div>
      )}
    </GlowCard>
  );
}
