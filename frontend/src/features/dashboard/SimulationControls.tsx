'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { injectIncident } from '@/lib/api-client';
import { useRunOrchestrator, ORCHESTRATOR_KEY } from '@/hooks/useOrchestratorState';

interface IncidentButtonProps {
  label: string;
  description: string;
  accentClass: string;
  glowClass: string;
  iconPath: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

function IncidentButton({
  label,
  description,
  accentClass,
  glowClass,
  iconPath,
  disabled,
  loading,
  onClick,
}: IncidentButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'glass-card p-5 flex items-start gap-4 text-left w-full',
        'transition-all duration-250 group',
        glowClass,
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          accentClass
        )}
      >
        {loading ? (
          <svg
            className="w-5 h-5 animate-spin text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
          {loading ? 'Injecting…' : label}
        </span>
        <span className="text-xs text-zinc-500 leading-relaxed">{description}</span>
      </div>

      {/* Arrow indicator */}
      {!disabled && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5 group-hover:text-zinc-400 transition-colors"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

export function SimulationControls() {
  const queryClient = useQueryClient();
  const runOrchestrator = useRunOrchestrator();
  const [loadingHeatwave, setLoadingHeatwave] = useState(false);
  const [loadingCooling, setLoadingCooling] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const isBusy = loadingHeatwave || loadingCooling || runOrchestrator.isPending;

  async function handleInject(
    eventType: 'HEATWAVE' | 'COOLING_DEGRADATION',
    setLoading: (v: boolean) => void
  ) {
    setLoading(true);
    setLastFeedback(null);
    try {
      const result = await injectIncident(eventType);
      setLastFeedback(result.message ?? 'Incident injected.');
      // Invalidate query then auto-run orchestrator
      await queryClient.invalidateQueries({ queryKey: ORCHESTRATOR_KEY });
      await runOrchestrator.mutateAsync();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to inject incident.';
      setLastFeedback(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Simulation Controls
          </span>
          <p className="text-sm text-zinc-300 font-medium mt-0.5">
            Inject incidents to trigger orchestrator response
          </p>
        </div>
        {isBusy && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-beacon" />
            <span className="text-xs font-semibold text-amber-400">Running</span>
          </div>
        )}
      </div>

      {/* Buttons grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <IncidentButton
          label="Heatwave Trigger"
          description="Simulates a regional thermal event causing multiple rack temperature spikes and SLA breaches."
          accentClass="bg-red-500/15 text-red-400"
          glowClass={loadingHeatwave ? 'glow-red' : 'hover:border-red-500/30'}
          iconPath="M13 10V3L4 14h7v7l9-11h-7z"
          disabled={isBusy}
          loading={loadingHeatwave}
          onClick={() => handleInject('HEATWAVE', setLoadingHeatwave)}
        />

        <IncidentButton
          label="Cooling Degradation"
          description="Degrades the primary cooling loop efficiency, triggering thermal analysis and maintenance planning."
          accentClass="bg-amber-500/15 text-amber-400"
          glowClass={loadingCooling ? 'glow-amber' : 'hover:border-amber-500/30'}
          iconPath="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"
          disabled={isBusy}
          loading={loadingCooling}
          onClick={() => handleInject('COOLING_DEGRADATION', setLoadingCooling)}
        />
      </div>

      {/* Feedback message */}
      {lastFeedback && (
        <div
          className={clsx(
            'text-xs px-3 py-2 rounded-lg border font-medium animate-fade-in',
            lastFeedback.startsWith('Error')
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          )}
        >
          {lastFeedback}
        </div>
      )}
    </div>
  );
}
