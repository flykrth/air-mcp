import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: 'emerald' | 'amber' | 'red' | 'blue' | 'violet' | 'none';
  children: React.ReactNode;
}

export function GlowCard({
  accent = 'none',
  className,
  children,
  ...props
}: GlowCardProps) {
  return (
    <div
      className={clsx(
        'glass-card relative overflow-hidden transition-all duration-300 group',
        accent === 'emerald' && 'border-emerald-500/20 shadow-emerald-500/5 shadow-lg hover:border-emerald-500/40 hover:shadow-emerald-500/10',
        accent === 'amber' && 'border-amber-500/20 shadow-amber-500/5 shadow-lg hover:border-amber-500/40 hover:shadow-amber-500/10',
        accent === 'red' && 'border-red-500/20 shadow-red-500/5 shadow-lg hover:border-red-500/40 hover:shadow-red-500/10',
        accent === 'blue' && 'border-blue-500/20 shadow-blue-500/5 shadow-lg hover:border-blue-500/40 hover:shadow-blue-500/10',
        accent === 'violet' && 'border-violet-500/20 shadow-violet-500/5 shadow-lg hover:border-violet-500/40 hover:shadow-violet-500/10',
        accent === 'none' && 'border-zinc-800/60 hover:border-zinc-700',
        className
      )}
      {...props}
    >
      {/* Soft inner glow backplate overlay */}
      {accent !== 'none' && (
        <div
          className={clsx(
            'absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-5 pointer-events-none transition-opacity duration-300 group-hover:opacity-10',
            accent === 'emerald' && 'bg-emerald-500',
            accent === 'amber' && 'bg-amber-500',
            accent === 'red' && 'bg-red-500',
            accent === 'blue' && 'bg-blue-500',
            accent === 'violet' && 'bg-violet-500'
          )}
        />
      )}
      <div className="relative z-10 flex flex-col h-full w-full">{children}</div>
    </div>
  );
}
