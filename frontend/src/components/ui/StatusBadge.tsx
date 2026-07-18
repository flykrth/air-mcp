import { clsx } from 'clsx';

interface StatusBadgeProps {
  variant: 'idle' | 'running' | 'completed' | 'success' | 'warning' | 'danger' | 'info';
  label?: string;
  showDot?: boolean;
}

export function StatusBadge({
  variant,
  label = variant,
  showDot = false,
}: StatusBadgeProps) {
  const isPulse = variant === 'running' || variant === 'warning' || variant === 'danger';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
        variant === 'success' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        variant === 'completed' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        variant === 'warning' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        variant === 'running' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        variant === 'danger' && 'bg-red-500/10 text-red-400 border-red-500/20',
        variant === 'info' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        variant === 'idle' && 'bg-zinc-800 text-zinc-400 border-zinc-700'
      )}
    >
      {(showDot || isPulse) && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            (variant === 'success' || variant === 'completed') && 'bg-emerald-400',
            (variant === 'warning' || variant === 'running') && 'bg-amber-400 animate-beacon',
            variant === 'danger' && 'bg-red-400 animate-beacon',
            variant === 'info' && 'bg-blue-400',
            variant === 'idle' && 'bg-zinc-500'
          )}
        />
      )}
      <span>{label}</span>
    </span>
  );
}

export function statusToVariant(
  status: string
): 'idle' | 'running' | 'completed' | 'success' | 'warning' | 'danger' | 'info' {
  const s = (status || '').toUpperCase();
  if (
    ['OPTIMAL', 'DELIVERED', 'RESOLVED', 'AVAILABLE', 'RUNNING', 'COMPLETED', 'SUCCESS', 'HEALTHY'].includes(
      s
    )
  ) {
    return 'success';
  }
  if (
    [
      'DEGRADED',
      'ORDERED',
      'ASSIGNED',
      'IN_PROGRESS',
      'MIGRATING',
      'WARNING',
      'PENDING',
      'ON_DUTY',
    ].includes(s)
  ) {
    return 'warning';
  }
  if (
    ['CRITICAL', 'FAILED', 'ERROR', 'TERMINATED', 'DANGER', 'OFF_LINE', 'OFFLINE'].includes(s)
  ) {
    return 'danger';
  }
  if (['OPEN', 'INFO', 'IDLE'].includes(s)) {
    return 'info';
  }
  return 'idle';
}
