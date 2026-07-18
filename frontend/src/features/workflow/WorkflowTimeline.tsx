'use client';

import {
  Flame,
  Activity,
  ShieldAlert,
  Server,
  Wrench,
  Truck,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { GlowCard } from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrchestratorStep } from '@/types';

interface TimelineNode {
  id: number;
  label: string;
  agentName: string;
  description: string;
  icon: ReactNode;
  triggerStep: OrchestratorStep;
  completedDataKey?: string;
}

const TIMELINE_NODES: TimelineNode[] = [
  {
    id: 1,
    label: 'Anomaly Detected',
    agentName: 'Mission Orchestrator',
    description: 'Heatwave alert received. Thermal thresholds breached across one or more racks.',
    icon: <Flame className="h-5 w-5" />,
    triggerStep: 'HEATWAVE_TRIGGERED',
  },
  {
    id: 2,
    label: 'Health Telemetry Scan',
    agentName: 'Health Agent',
    description: 'Scanning all rack sensors. Collecting temperature, power draw, and cooling flow data.',
    icon: <Activity className="h-5 w-5" />,
    triggerStep: 'THERMAL_ANALYSIS',
  },
  {
    id: 3,
    label: 'Financial Risk Analysis',
    agentName: 'Risk Agent',
    description: 'Computing financial exposure and SLA penalty risk for all affected workloads.',
    icon: <ShieldAlert className="h-5 w-5" />,
    triggerStep: 'RISK_ASSESSMENT',
  },
  {
    id: 4,
    label: 'Workload Hot Migration',
    agentName: 'Workload Agent',
    description: 'Live migration of at-risk workloads to cooler racks with available capacity.',
    icon: <Server className="h-5 w-5" />,
    triggerStep: 'WORKLOAD_MIGRATION',
    completedDataKey: 'migrations_executed',
  },
  {
    id: 5,
    label: 'Maintenance Planning',
    agentName: 'Maintenance Agent',
    description: 'Filing maintenance ticket and scheduling technician dispatch for affected rack.',
    icon: <Wrench className="h-5 w-5" />,
    triggerStep: 'MAINTENANCE_PLANNING',
  },
  {
    id: 6,
    label: 'Supplier & Procurement',
    agentName: 'Supplier Agent → Procurement Agent',
    description: 'Evaluating supplier catalog, selecting optimal vendor, and generating purchase order.',
    icon: <Truck className="h-5 w-5" />,
    triggerStep: 'SUPPLIER_EVALUATION',
  },
  {
    id: 7,
    label: 'Recovery Complete',
    agentName: 'Mission Orchestrator',
    description: 'All recovery actions verified. System restored to nominal operating state.',
    icon: <CheckCircle2 className="h-5 w-5" />,
    triggerStep: 'COMPLETED',
  },
];

type StepStatus = 'completed' | 'active' | 'pending';

function getNodeStatus(
  node: TimelineNode,
  stepHistory: string[],
  currentStep: string
): StepStatus {
  if (stepHistory.includes(node.triggerStep)) return 'completed';
  if (node.triggerStep === 'COMPLETED' && currentStep === 'COMPLETED') return 'completed';
  if (currentStep === node.triggerStep) return 'active';
  // Special: PROCUREMENT_AND_RECOVERY also activates node 6
  if (node.triggerStep === 'SUPPLIER_EVALUATION' && currentStep === 'PROCUREMENT_AND_RECOVERY') return 'active';
  return 'pending';
}

export function WorkflowTimeline() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-6">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="flex-1 h-24" />
            </div>
          ))}
        </div>
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard className="p-6">
        <p className="text-sm text-red-400">Failed to load workflow timeline.</p>
      </GlowCard>
    );
  }

  const stepHistory = data?.step_history ?? [];
  const currentStep = data?.current_step ?? 'IDLE';
  const migrationsExecuted = data?.migrations_executed ?? [];
  const atRiskWorkloads = data?.at_risk_workloads ?? [];

  return (
    <GlowCard className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <Cpu className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-200">Orchestration Workflow</h2>
          <p className="text-[11px] text-zinc-500">
            Current step:{' '}
            <span className="text-emerald-400 font-semibold">{currentStep}</span>
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {TIMELINE_NODES.map((node, idx) => {
          const status = getNodeStatus(node, stepHistory, currentStep);
          const isLast = idx === TIMELINE_NODES.length - 1;
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div key={node.id} className="relative flex gap-6">
              {/* Left column: circle + line */}
              <div className="flex flex-col items-center flex-shrink-0 w-8">
                {/* Step circle */}
                <div
                  className={clsx(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500',
                    isCompleted
                      ? 'bg-emerald-500/20 border-2 border-emerald-500'
                      : isActive
                      ? 'bg-amber-500/10 border-2 border-amber-400 ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950 animate-glow-emerald'
                      : 'bg-zinc-900 border-2 border-zinc-700'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <span
                      className={clsx(
                        isActive ? 'text-amber-400' : 'text-zinc-600'
                      )}
                    >
                      {node.icon}
                    </span>
                  )}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={clsx(
                      'w-0.5 transition-all duration-700',
                      isCompleted ? 'bg-emerald-500' : 'bg-zinc-800'
                    )}
                    style={{ minHeight: '100%', flex: 1, marginTop: 2, marginBottom: 2 }}
                  />
                )}
              </div>

              {/* Right: detail card */}
              <div className={clsx('flex-1 pb-6', isLast && 'pb-0')}>
                <div
                  className={clsx(
                    'glass-card p-4 transition-all duration-300',
                    isCompleted && 'border-emerald-500/20',
                    isActive && 'border-amber-400/30 glow-amber',
                    !isCompleted && !isActive && 'opacity-60'
                  )}
                >
                  {/* Node header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                          Step {node.id}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1 h-1 rounded-full bg-amber-400 animate-beacon" />
                            In Progress
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] text-emerald-500 font-semibold">✓ Done</span>
                        )}
                      </div>
                      <h3
                        className={clsx(
                          'text-sm font-bold',
                          isCompleted
                            ? 'text-emerald-400'
                            : isActive
                            ? 'text-amber-300'
                            : 'text-zinc-500'
                        )}
                      >
                        {node.label}
                      </h3>
                    </div>
                  </div>

                  {/* Agent */}
                  <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest mb-1.5">
                    Agent: <span className="text-zinc-500 normal-case tracking-normal font-medium">{node.agentName}</span>
                  </p>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {node.description}
                  </p>

                  {/* Step-specific data */}
                  {isCompleted && node.triggerStep === 'WORKLOAD_MIGRATION' && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Migrations executed:</span>
                      <span className="text-xs font-bold text-emerald-400">{migrationsExecuted.length}</span>
                    </div>
                  )}
                  {isCompleted && node.triggerStep === 'RISK_ASSESSMENT' && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Workloads assessed:</span>
                      <span className="text-xs font-bold text-amber-400">{atRiskWorkloads.length}</span>
                    </div>
                  )}
                  {isCompleted && node.triggerStep === 'COMPLETED' && data?.recovery_verified && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Recovery verified
                    </div>
                  )}
                  {isActive && (
                    <div className="mt-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-beacon" />
                        {currentStep}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlowCard>
  );
}
