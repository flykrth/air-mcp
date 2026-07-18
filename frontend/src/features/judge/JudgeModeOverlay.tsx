'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Play,
  Loader2,
  CheckCircle2,
  Thermometer,
  ShieldAlert,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { injectIncident, runOrchestrator } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { ORCHESTRATOR_KEY } from '@/hooks/useOrchestratorState';
import { JUDGE_STEPS } from '@/hooks/useJudgeMode';
import { JudgeStepIndicator } from './JudgeStepIndicator';
import { DataCenterGrid } from '@/features/digital-twin/DataCenterGrid';
import { SystemTimeline } from '@/features/dashboard/SystemTimeline';
import { AgentPanel } from '@/features/orchestrator/AgentPanel';
import { McpToolPanel } from '@/features/orchestrator/McpToolPanel';
import { DecisionSummary } from '@/features/orchestrator/DecisionSummary';
import { AuditTimeline } from '@/features/audit/AuditTimeline';
import { ProgressRing } from '@/components/ui/ProgressRing';
import type { JudgeModeStepId } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JudgeModeState {
  isOpen: boolean;
  currentStepId: JudgeModeStepId;
  currentStep: (typeof JUDGE_STEPS)[number];
  currentIndex: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  open: () => void;
  close: () => void;
  goToStep: (id: JudgeModeStepId) => void;
  goNext: () => void;
  goPrev: () => void;
  advanceIfReady: (stepHistory: string[]) => void;
}

interface JudgeModeOverlayProps {
  judgeMode: JudgeModeState;
}

// ─── Step 0: Overview ─────────────────────────────────────────────────────────

function OverviewStep() {
  const { data: state } = useOrchestratorState();

  const metrics = [
    {
      label: 'System Health',
      value: '100%',
      icon: <ShieldAlert className="h-5 w-5" />,
      color: 'emerald',
    },
    {
      label: 'Active Hotspots',
      value: state?.hotspots?.length ?? 0,
      icon: <Thermometer className="h-5 w-5" />,
      color: (state?.hotspots?.length ?? 0) > 0 ? 'red' : 'emerald',
    },
    {
      label: 'Cooling Loop',
      value: state?.cooling_loop?.healthy !== false ? 'HEALTHY' : 'DEGRADED',
      icon: <FlaskConical className="h-5 w-5" />,
      color: state?.cooling_loop?.healthy !== false ? 'emerald' : 'amber',
    },
    {
      label: 'Orchestrator',
      value: state?.current_step ?? 'IDLE',
      icon: <Zap className="h-5 w-5" />,
      color: 'blue',
    },
    {
      label: 'Agent Logs',
      value: state?.agent_logs?.length ?? 0,
      icon: <Sparkles className="h-5 w-5" />,
      color: 'violet',
    },
    {
      label: 'Migrations',
      value: state?.migrations_executed?.length ?? 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'blue',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    emerald: {
      bg: 'bg-emerald-500/5',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-500/5',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10',
    },
    red: {
      bg: 'bg-red-500/5',
      text: 'text-red-400',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/10',
    },
    blue: {
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10',
    },
    violet: {
      bg: 'bg-violet-500/5',
      text: 'text-violet-400',
      border: 'border-violet-500/20',
      iconBg: 'bg-violet-500/10',
    },
  };

  return (
    <div className="space-y-8 animate-step-enter">
      {/* Hero heading */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
          <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
            System Status: All Nominal
          </span>
        </div>
        <p className="text-zinc-400 text-sm max-w-xl mx-auto">
          AIR-MCP is monitoring{' '}
          <span className="text-zinc-100 font-bold">6 racks</span>,{' '}
          <span className="text-zinc-100 font-bold">7 specialist agents</span>, and{' '}
          <span className="text-zinc-100 font-bold">real-time MCP tooling</span>.
          All systems are operating within normal parameters.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const c = colorMap[m.color] ?? colorMap.emerald;
          return (
            <div
              key={m.label}
              className={clsx(
                'rounded-xl border p-4 flex items-center gap-3',
                c.bg,
                c.border
              )}
            >
              <div className={clsx('p-2 rounded-lg flex-shrink-0', c.iconBg, c.text)}>
                {m.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{m.label}</p>
                <p className={clsx('text-lg font-black tabular-nums', c.text)}>{m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Rack Grid */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
          Data Center Floor — Digital Twin
        </p>
        <DataCenterGrid />
      </div>
    </div>
  );
}

// ─── Step 1: Trigger ──────────────────────────────────────────────────────────

function TriggerStep() {
  const { data: state } = useOrchestratorState();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<'HEATWAVE' | 'COOLING_DEGRADATION' | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recentLogs = state?.agent_logs?.slice(-5) ?? [];

  const handleTrigger = async (type: 'HEATWAVE' | 'COOLING_DEGRADATION') => {
    setLoading(type);
    setError(null);
    try {
      await injectIncident(type);
      const result = await runOrchestrator();
      queryClient.setQueryData(ORCHESTRATOR_KEY, result);
      setTriggered(true);
    } catch (err) {
      setError('Failed to trigger incident. Check that the API is running.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-step-enter">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-zinc-100">Initiate Incident Scenario</h3>
        <p className="text-zinc-500 text-sm">
          Choose a scenario to activate the autonomous orchestrator. All specialist agents will engage automatically.
        </p>
      </div>

      {/* Scenario Buttons */}
      {!triggered ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Heatwave */}
          <button
            onClick={() => handleTrigger('HEATWAVE')}
            disabled={loading !== null}
            className={clsx(
              'group relative overflow-hidden rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-6 text-left',
              'hover:border-red-500/60 hover:bg-red-500/10 transition-all duration-250',
              'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-red-500/30'
            )}
          >
            <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="w-20 h-20 rounded-full bg-red-500 blur-2xl" />
            </div>

            <div className="flex items-center gap-3 mb-4">
              {loading === 'HEATWAVE' ? (
                <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
              ) : (
                <span className="text-4xl">🌡️</span>
              )}
              <div>
                <p className="text-sm font-black text-red-400 uppercase tracking-widest">
                  Heatwave Event
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  HEATWAVE_TRIGGERED
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Spikes ambient temperature, causing multiple racks to breach thermal thresholds and triggering the full orchestration pipeline.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-red-400 font-semibold">
              <Play className="h-3.5 w-3.5 fill-current" />
              {loading === 'HEATWAVE' ? 'Triggering…' : 'Launch Scenario'}
            </div>
          </button>

          {/* Cooling Failure */}
          <button
            onClick={() => handleTrigger('COOLING_DEGRADATION')}
            disabled={loading !== null}
            className={clsx(
              'group relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-6 text-left',
              'hover:border-amber-500/60 hover:bg-amber-500/10 transition-all duration-250',
              'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/30'
            )}
          >
            <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="w-20 h-20 rounded-full bg-amber-500 blur-2xl" />
            </div>

            <div className="flex items-center gap-3 mb-4">
              {loading === 'COOLING_DEGRADATION' ? (
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
              ) : (
                <span className="text-4xl">❄️</span>
              )}
              <div>
                <p className="text-sm font-black text-amber-400 uppercase tracking-widest">
                  Cooling Failure
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  COOLING_DEGRADATION
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Simulates severe cooling loop failure with chiller valve restriction to 20% of normal flow rate.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 font-semibold">
              <Play className="h-3.5 w-3.5 fill-current" />
              {loading === 'COOLING_DEGRADATION' ? 'Triggering…' : 'Launch Scenario'}
            </div>
          </button>
        </div>
      ) : (
        /* Mission Running state */
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
            <Loader2 className="h-6 w-6 text-emerald-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-400">Mission Running…</p>
              <p className="text-xs text-zinc-400">
                The autonomous orchestrator has engaged all specialist agents.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
              <span className="text-xs text-emerald-400 font-semibold">LIVE</span>
            </div>
          </div>

          {/* Recent Logs */}
          {recentLogs.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] space-y-1.5">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-2">
                Live Agent Console
              </p>
              {recentLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-zinc-700">›</span>
                  <span className="text-emerald-400/80">{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-400 mt-2">{error}</p>
      )}

      {/* Explainer note */}
      <p className="text-center text-xs text-zinc-600 max-w-lg mx-auto">
        The autonomous orchestrator will now engage all specialist agents — Health, Risk, Workload, Maintenance, Supplier, and Procurement — in sequence via MCP.
      </p>
    </div>
  );
}

// ─── Step 2: Telemetry ────────────────────────────────────────────────────────

function TelemetryStep() {
  const { data: state } = useOrchestratorState();
  const hotspotCount = state?.hotspots?.length ?? 0;

  return (
    <div className="space-y-6 animate-step-enter">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-zinc-100">Live Telemetry</h3>
          <p className="text-sm text-zinc-500">Real-time thermal sensors, rack health, and cooling data.</p>
        </div>
        <div
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold',
            hotspotCount > 0
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          )}
        >
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              hotspotCount > 0 ? 'bg-red-400 animate-beacon' : 'bg-emerald-400'
            )}
          />
          {hotspotCount} Hotspot{hotspotCount !== 1 ? 's' : ''} Detected
        </div>
      </div>

      <DataCenterGrid />
      <SystemTimeline />
    </div>
  );
}

// ─── Step 3: Agents ───────────────────────────────────────────────────────────

function AgentsStep() {
  const { data: state } = useOrchestratorState();
  const stepHistory = state?.step_history ?? [];

  const activeAgents = [
    'HEATWAVE_TRIGGERED',
    'THERMAL_ANALYSIS',
    'RISK_ASSESSMENT',
    'WORKLOAD_MIGRATION',
    'MAINTENANCE_PLANNING',
    'SUPPLIER_EVALUATION',
    'PROCUREMENT_AND_RECOVERY',
  ].filter((s) => stepHistory.includes(s as never)).length;

  return (
    <div className="space-y-5 animate-step-enter">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-zinc-100">Agent Activity</h3>
          <p className="text-sm text-zinc-500">Specialist agents activating in coordinated sequence.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-beacon" />
          <span className="text-sm font-bold text-violet-400">
            {activeAgents} AGENTS ENGAGED
          </span>
        </div>
      </div>

      <AgentPanel />
    </div>
  );
}

// ─── Step 4: MCP ─────────────────────────────────────────────────────────────

function McpStep() {
  return (
    <div className="space-y-5 animate-step-enter">
      <div>
        <h3 className="text-lg font-black text-zinc-100">MCP Protocol Activity</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Tool invocations, resource reads, and prompt templates executing across all agents.
        </p>
      </div>

      {/* MCP explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: '⚡',
            title: 'Tool Calls',
            desc: 'Structured function invocations — get_hotspots, migrate_workload, create_order, and more.',
            color: 'emerald',
          },
          {
            icon: '🗄️',
            title: 'Resource Reads',
            desc: 'Agents read live rack data, telemetry logs, supplier catalogs, and inventory via MCP resources.',
            color: 'blue',
          },
          {
            icon: '📝',
            title: 'Prompt Templates',
            desc: 'Reusable MCP prompt templates define agent reasoning patterns and decision boundaries.',
            color: 'violet',
          },
        ].map((item) => (
          <div
            key={item.title}
            className={clsx(
              'p-4 rounded-xl border',
              item.color === 'emerald' && 'bg-emerald-500/5 border-emerald-500/20',
              item.color === 'blue' && 'bg-blue-500/5 border-blue-500/20',
              item.color === 'violet' && 'bg-violet-500/5 border-violet-500/20'
            )}
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <p
              className={clsx(
                'text-sm font-bold mb-1',
                item.color === 'emerald' && 'text-emerald-400',
                item.color === 'blue' && 'text-blue-400',
                item.color === 'violet' && 'text-violet-400'
              )}
            >
              {item.title}
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <McpToolPanel />
    </div>
  );
}

// ─── Step 5: Decision ─────────────────────────────────────────────────────────

function DecisionStep() {
  const { data: state } = useOrchestratorState();
  const recoveryMessage = state?.recovery_message;
  const isComplete = state?.current_step === 'COMPLETED' || state?.recovery_verified;

  const confidence = state?.recovery_verified
    ? 100
    : state?.step_history?.length
    ? Math.min(95, Math.round((state.step_history.length / 8) * 100))
    : 0;

  const confidenceColor = confidence >= 80 ? '#34d399' : confidence >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="space-y-6 animate-step-enter">
      <div>
        <h3 className="text-lg font-black text-zinc-100">Decision Summary</h3>
        <p className="text-sm text-zinc-500 mt-1">Orchestrated recovery plan — cost analysis, confidence score, and ETA.</p>
      </div>

      {/* Confidence Hero */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <div className="flex-shrink-0">
          <ProgressRing
            value={confidence}
            size={120}
            strokeWidth={10}
            color={confidenceColor}
            label={`${confidence}%`}
            sublabel="confidence"
          />
        </div>
        <div className="flex-1 space-y-2 text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Recovery Confidence Score
          </p>
          <p
            className="text-4xl font-black tabular-nums"
            style={{ color: confidenceColor }}
          >
            {confidence}%
          </p>
          <div
            className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${confidence}%`, backgroundColor: confidenceColor }}
            />
          </div>
        </div>
      </div>

      {/* Recovery Message */}
      {recoveryMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 mb-2">
            Recovery Directive
          </p>
          <p className="text-sm text-emerald-300 leading-relaxed font-medium">
            "{recoveryMessage}"
          </p>
        </div>
      )}

      <DecisionSummary />
    </div>
  );
}

// ─── Step 6: Recovery ─────────────────────────────────────────────────────────

function RecoveryStep() {
  const { data: state } = useOrchestratorState();
  const recoveryVerified = state?.recovery_verified ?? false;
  const migrations = state?.migrations_executed ?? [];

  return (
    <div className="space-y-6 animate-step-enter">
      {/* Recovery Banner */}
      {recoveryVerified ? (
        <div className="relative overflow-hidden flex items-center gap-4 p-6 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 animate-glow-emerald">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">✓ SYSTEM RECOVERED</p>
              <p className="text-sm text-emerald-300/70 mt-0.5">
                All systems verified. Infrastructure returned to nominal state.
              </p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-beacon" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin flex-shrink-0" />
          <div>
            <p className="text-lg font-black text-amber-400">Recovery In Progress</p>
            <p className="text-sm text-zinc-400">Waiting for system verification…</p>
          </div>
        </div>
      )}

      {/* Current State Grid */}
      <DataCenterGrid />

      {/* Migrations Table */}
      {migrations.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Workload Migrations Executed ({migrations.length})
          </p>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-900/60 border-b border-zinc-800">
                  <th className="text-left px-4 py-2.5 font-bold uppercase tracking-widest text-zinc-500 text-[10px]">
                    Workload
                  </th>
                  <th className="text-left px-4 py-2.5 font-bold uppercase tracking-widest text-zinc-500 text-[10px]">
                    Target Rack
                  </th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase tracking-widest text-zinc-500 text-[10px]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {migrations.map((m, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-300">{m.workload_name}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{m.target_rack}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 7: Audit ────────────────────────────────────────────────────────────

function AuditStep() {
  const { data: state } = useOrchestratorState();
  const stepCount = state?.step_history?.length ?? 0;

  return (
    <div className="space-y-5 animate-step-enter">
      <div>
        <h3 className="text-lg font-black text-zinc-100">Audit & Explainability</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Full workflow execution record — every decision logged and auditable.
        </p>
      </div>

      {/* Explainability callout */}
      <div className="p-4 rounded-xl border border-violet-500/25 bg-violet-500/5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-violet-300 mb-1">Complete Reasoning Transparency</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every decision made by AIR-MCP is logged, auditable, and explainable.
              The orchestrator records each agent action, tool call, and reasoning step —
              providing full traceability for compliance and post-incident review.
            </p>
          </div>
        </div>
      </div>

      {/* Step history count */}
      {stepCount > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="text-3xl font-black text-zinc-100 tabular-nums">{stepCount}</div>
          <div>
            <p className="text-sm font-bold text-zinc-300">Orchestration Steps Completed</p>
            <p className="text-xs text-zinc-500">
              {state?.step_history?.join(' → ')}
            </p>
          </div>
        </div>
      )}

      <AuditTimeline />
    </div>
  );
}

// ─── Step Router ─────────────────────────────────────────────────────────────

function StepContent({ stepId }: { stepId: JudgeModeStepId }) {
  switch (stepId) {
    case 'overview':
      return <OverviewStep />;
    case 'trigger':
      return <TriggerStep />;
    case 'telemetry':
      return <TelemetryStep />;
    case 'agents':
      return <AgentsStep />;
    case 'mcp':
      return <McpStep />;
    case 'decision':
      return <DecisionStep />;
    case 'recovery':
      return <RecoveryStep />;
    case 'audit':
      return <AuditStep />;
    default:
      return null;
  }
}

// ─── JudgeModeOverlay ─────────────────────────────────────────────────────────

export function JudgeModeOverlay({ judgeMode }: JudgeModeOverlayProps) {
  const { data: state } = useOrchestratorState();

  // Auto-advance based on backend state
  useEffect(() => {
    if (judgeMode.isOpen && state?.step_history) {
      judgeMode.advanceIfReady(state.step_history);
    }
  }, [judgeMode.isOpen, state?.step_history, judgeMode]);

  if (!judgeMode.isOpen) return null;

  const { currentStep, currentIndex, canGoNext, canGoPrev, close, goNext, goPrev, goToStep } =
    judgeMode;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col judge-overlay-backdrop animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Judge Mode Presentation"
    >
      {/* ── Header ── */}
      <header className="flex-shrink-0 h-16 flex items-center px-6 border-b border-zinc-800/60 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-sm font-black text-zinc-100 tracking-tight">AIR-MCP</span>
        </div>

        {/* Judge Mode Badge */}
        <div className="flex-shrink-0 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Judge Mode
          </span>
        </div>

        {/* Step Title */}
        <div className="flex-1 min-w-0 text-center hidden sm:block">
          <p className="text-sm font-bold text-zinc-200 truncate">{currentStep.title}</p>
          <p className="text-[10px] text-zinc-500 truncate">{currentStep.subtitle}</p>
        </div>

        {/* Close */}
        <button
          onClick={close}
          className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-150 cursor-pointer"
          aria-label="Close Judge Mode"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* ── Step Indicator ── */}
      <JudgeStepIndicator
        steps={JUDGE_STEPS}
        currentIndex={currentIndex}
        onStepClick={goToStep}
      />

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <StepContent key={currentStep.id} stepId={currentStep.id} />
        </div>
      </main>

      {/* ── Footer Nav ── */}
      <footer className="flex-shrink-0 border-t border-zinc-800/60 px-6 py-4 flex items-center gap-4">
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150',
            canGoPrev
              ? 'border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600 cursor-pointer'
              : 'border-zinc-800 text-zinc-700 cursor-not-allowed opacity-40'
          )}
          aria-label="Previous step"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Step Counter */}
        <div className="flex-1 text-center">
          <p className="text-xs font-bold text-zinc-400">
            Step{' '}
            <span className="text-zinc-100 tabular-nums">{currentIndex + 1}</span>
            {' '}of{' '}
            <span className="text-zinc-100 tabular-nums">{JUDGE_STEPS.length}</span>
          </p>
          <p className="text-[10px] text-zinc-600 hidden sm:block mt-0.5">
            ← → arrow keys to navigate · Esc to close
          </p>
        </div>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={!canGoNext}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150',
            canGoNext
              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/60 cursor-pointer'
              : 'border-zinc-800 text-zinc-700 cursor-not-allowed opacity-40'
          )}
          aria-label="Next step"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}
