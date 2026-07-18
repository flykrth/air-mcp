import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse bg-zinc-800 rounded-md', className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx("glass-card p-5 space-y-4 animate-pulse", className)}>
      <Skeleton className="h-4 w-1/3" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}
