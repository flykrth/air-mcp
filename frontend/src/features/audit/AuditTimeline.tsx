'use client';

import { useMemo, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  Download,
  Activity,
  Zap,
  Bot,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { Skeleton } from '@/components/ui/Skeleton';

// ─── Log classification ────────────────────────────────────────────────────────

interface LogMeta {
  colorClass: string;
  borderClass: string;
  bgClass: string;
  dotClass: string;
  icon: React.ReactNode;
  category: string;
}

function classifyLog(log: string): LogMeta {
  const upper = log.toUpperCase();

  if (upper.includes('ERROR') || upper.includes('FAIL') || upper.includes('CRITICAL')) {
    return {
      colorClass: 'text-red-300',
      borderClass: 'border-red-500/40',
      bgClass: 'bg-red-500/5',
      dotClass: 'bg-red-400',
      icon: <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />,
      category: 'ERROR',
    };
  }
  if (upper.includes('WARN') || upper.includes('DEGRADED')) {
    return {
      colorClass: 'text-amber-300',
      borderClass: 'border-amber-500/30',
      bgClass: 'bg-amber-500/5',
      dotClass: 'bg-amber-400',
      icon: <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />,
      category: 'WARN',
    };
  }
  if (
    upper.includes('SUCCESS') ||
    upper.includes('COMPLETE') ||
    upper.includes('VERIFIED') ||
    upper.includes('RECOVERY') ||
    upper.includes('RESOLVED')
  ) {
    return {
      colorClass: 'text-emerald-300',
      borderClass: 'border-emerald-500/30',
      bgClass: 'bg-emerald-500/5',
      dotClass: 'bg-emerald-400',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />,
      category: 'SUCCESS',
    };
  }
  if (upper.includes('MIGRAT') || upper.includes('PROCURE') || upper.includes('ORDER')) {
    return {
      colorClass: 'text-blue-300',
      borderClass: 'border-blue-500/30',
      bgClass: 'bg-blue-500/5',
      dotClass: 'bg-blue-400',
      icon: <ArrowRight className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />,
      category: 'MIGRATION',
    };
  }
  if (upper.includes('[') && upper.includes(']')) {
    return {
      colorClass: 'text-violet-300',
      borderClass: 'border-violet-500/30',
      bgClass: 'bg-violet-500/5',
      dotClass: 'bg-violet-400',
      icon: <Bot className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />,
      category: 'AGENT',
    };
  }

  return {
    colorClass: 'text-zinc-400',
    borderClass: 'border-zinc-700/40',
    bgClass: 'bg-zinc-900/40',
    dotClass: 'bg-zinc-600',
    icon: <Activity className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />,
    category: 'INFO',
  };
}

// ─── Stats Row ─────────────────────────────────────────────────────────────────

function StatsRow({
  total,
  errors,
  successes,
  agents,
}: {
  total: number;
  errors: number;
  successes: number;
  agents: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Total Events', value: total, cls: 'text-zinc-100', bg: 'bg-zinc-800/60 border-zinc-700' },
        { label: 'Errors', value: errors, cls: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
        { label: 'Successes', value: successes, cls: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
        { label: 'Agent Events', value: agents, cls: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20' },
      ].map((s) => (
        <div
          key={s.label}
          className={clsx('rounded-xl p-4 border flex flex-col gap-1', s.bg)}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {s.label}
          </span>
          <span className={clsx('text-2xl font-black tabular-nums', s.cls)}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── AuditTimeline ─────────────────────────────────────────────────────────────

export function AuditTimeline() {
  const { data: state, isLoading } = useOrchestratorState();
  const logs = state?.agent_logs ?? [];

  const stats = useMemo(() => {
    let errors = 0;
    let successes = 0;
    let agents = 0;
    for (const log of logs) {
      const upper = log.toUpperCase();
      if (upper.includes('ERROR') || upper.includes('FAIL') || upper.includes('CRITICAL')) errors++;
      if (
        upper.includes('SUCCESS') ||
        upper.includes('COMPLETE') ||
        upper.includes('VERIFIED') ||
        upper.includes('RECOVERY')
      )
        successes++;
      if (upper.includes('[') && upper.includes(']')) agents++;
    }
    return { total: logs.length, errors, successes, agents };
  }, [logs]);

  // Export handler
  const handleExport = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ exported_at: new Date().toISOString(), logs }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air-mcp-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
            <ClipboardList className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100">Workflow Audit Log</h2>
            <p className="text-[10px] text-zinc-500">
              Chronological record of all agent activity
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
            logs.length === 0
              ? 'opacity-40 cursor-not-allowed border-zinc-800 text-zinc-600'
              : 'border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600 cursor-pointer'
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Export JSON
        </button>
      </div>

      {/* Stats */}
      <StatsRow {...stats} />

      {/* Timeline */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center">
            <ClipboardList className="h-7 w-7 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-400">No workflow activity recorded yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Run the orchestrator to generate audit logs.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-zinc-800" />

          <div className="flex flex-col gap-1">
            {logs.map((log, i) => {
              const meta = classifyLog(log);
              return (
                <div
                  key={i}
                  className={clsx(
                    'relative flex items-start gap-3 pl-10 pr-3 py-3 rounded-lg border transition-all duration-150',
                    meta.bgClass,
                    meta.borderClass,
                    'hover:brightness-110'
                  )}
                >
                  {/* Dot on timeline line */}
                  <div
                    className={clsx(
                      'absolute left-[15px] top-[17px] w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-zinc-950',
                      meta.dotClass
                    )}
                  />

                  {/* Step number */}
                  <span className="absolute left-[28px] top-[12px] hidden">_</span>

                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0">{meta.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-zinc-600 tabular-nums">
                        Step {i + 1}
                      </span>
                      <span
                        className={clsx(
                          'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
                          {
                            'bg-red-500/10 text-red-400': meta.category === 'ERROR',
                            'bg-amber-500/10 text-amber-400': meta.category === 'WARN',
                            'bg-emerald-500/10 text-emerald-400': meta.category === 'SUCCESS',
                            'bg-blue-500/10 text-blue-400': meta.category === 'MIGRATION',
                            'bg-violet-500/10 text-violet-400': meta.category === 'AGENT',
                            'bg-zinc-800 text-zinc-500': meta.category === 'INFO',
                          }
                        )}
                      >
                        {meta.category}
                      </span>
                    </div>
                    <p className={clsx('text-xs leading-relaxed break-words', meta.colorClass)}>
                      {log}
                    </p>
                  </div>

                  {/* Zap for first entry */}
                  {i === 0 && (
                    <Zap className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
