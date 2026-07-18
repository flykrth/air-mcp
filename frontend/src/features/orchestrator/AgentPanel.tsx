'use client';

import {
  Activity,
  ShieldAlert,
  Server,
  Wrench,
  Truck,
  Package,
  Cpu,
} from 'lucide-react';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { AgentCard } from './AgentCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrchestratorStep } from '@/types';

type AgentStatus = 'idle' | 'active' | 'completed';

function getAgentStatus(
  triggerStep: OrchestratorStep | OrchestratorStep[],
  stepHistory: string[],
  currentStep: string
): AgentStatus {
  const steps = Array.isArray(triggerStep) ? triggerStep : [triggerStep];
  const isCompleted = steps.some((s) => stepHistory.includes(s));
  const isActive = steps.some((s) => s === currentStep);
  if (isCompleted) return 'completed';
  if (isActive) return 'active';
  return 'idle';
}

function getMissionOrchestratorStatus(
  stepHistory: string[],
  currentStep: string
): AgentStatus {
  if (currentStep === 'COMPLETED') return 'completed';
  if (currentStep !== 'IDLE') return 'active';
  if (stepHistory.length > 0) return 'completed';
  return 'idle';
}

function getConfidence(status: AgentStatus, stepHistory: OrchestratorStep[]): number {
  if (status === 'completed') return 100;
  if (status === 'active') return Math.round(40 + Math.random() * 30); // 40-70% while running
  return 0;
}

// Stable confidence — avoid recalculation on re-render for active agents
const ACTIVE_CONFIDENCE: Record<string, number> = {};
function stableConfidence(key: string, status: AgentStatus): number {
  if (status === 'completed') return 100;
  if (status === 'idle') return 0;
  if (!ACTIVE_CONFIDENCE[key]) {
    ACTIVE_CONFIDENCE[key] = Math.floor(55 + Math.random() * 30);
  }
  return ACTIVE_CONFIDENCE[key];
}

interface AgentDef {
  key: string;
  name: string;
  icon: React.ReactNode;
  triggerStep: OrchestratorStep | OrchestratorStep[];
  getTask: (data: ReturnType<typeof useOrchestratorState>['data']) => string;
  lastActionText: (status: AgentStatus) => string;
}

const AGENT_DEFS: AgentDef[] = [
  {
    key: 'orchestrator',
    name: 'Mission Orchestrator',
    icon: <Cpu />,
    triggerStep: 'HEATWAVE_TRIGGERED',
    getTask: (data) => {
      const step = data?.current_step ?? 'IDLE';
      if (step === 'IDLE') return 'Standby — awaiting incident trigger';
      if (step === 'COMPLETED') return 'Mission complete — system recovered';
      return `Coordinating ${step.replace(/_/g, ' ').toLowerCase()}`;
    },
    lastActionText: (status) =>
      status === 'completed'
        ? 'Recovery workflow completed'
        : status === 'active'
        ? 'Dispatching sub-agents'
        : 'Monitoring system health',
  },
  {
    key: 'health',
    name: 'Health Agent',
    icon: <Activity />,
    triggerStep: 'THERMAL_ANALYSIS',
    getTask: (data) => {
      const step = data?.current_step;
      if (step === 'THERMAL_ANALYSIS') {
        return `Scanning ${data?.hotspots?.length ?? 0} rack sensors`;
      }
      return 'Idle — rack telemetry standby';
    },
    lastActionText: (status) =>
      status === 'completed'
        ? 'Thermal analysis complete'
        : status === 'active'
        ? 'Querying rack telemetry'
        : 'Awaiting trigger',
  },
  {
    key: 'risk',
    name: 'Risk Agent',
    icon: <ShieldAlert />,
    triggerStep: 'RISK_ASSESSMENT',
    getTask: (data) => {
      const step = data?.current_step;
      if (step === 'RISK_ASSESSMENT') {
        return `Calculating financial exposure across ${data?.at_risk_workloads?.length ?? 0} workloads`;
      }
      return 'Idle — risk models standby';
    },
    lastActionText: (status) =>
      status === 'completed'
        ? 'Risk assessment finalized'
        : status === 'active'
        ? 'Computing SLA penalties'
        : 'Awaiting telemetry',
  },
  {
    key: 'workload',
    name: 'Workload Agent',
    icon: <Server />,
    triggerStep: 'WORKLOAD_MIGRATION',
    getTask: (data) => {
      const step = data?.current_step;
      if (step === 'WORKLOAD_MIGRATION') {
        return `Executing live migration for ${data?.at_risk_workloads?.length ?? 0} workloads`;
      }
      return 'Idle — scheduler standby';
    },
    lastActionText: (status) =>
      status === 'completed'
        ? 'All migrations executed'
        : status === 'active'
        ? 'Live migrating workloads'
        : 'Awaiting risk assessment',
  },
  {
    key: 'maintenance',
    name: 'Maintenance Agent',
    icon: <Wrench />,
    triggerStep: 'MAINTENANCE_PLANNING',
    getTask: (data) => {
      const step = data?.current_step;
      if (step === 'MAINTENANCE_PLANNING') {
        return 'Filing repair ticket for affected rack';
      }
      return 'Idle — maintenance queue empty';
    },
    lastActionText: (status) =>
      status === 'completed'
        ? 'Ticket filed and technician assigned'
        : status === 'active'
        ? 'Scheduling technician dispatch'
        : 'Awaiting migration completion',
  },
  {
    key: 'supplier',
    name: 'Supplier Agent',
    icon: <Truck />,
    triggerStep: 'SUPPLIER_EVALUATION',
    getTask: (data) => {
      const step = data?.current_step;
      if (step === 'SUPPLIER_EVALUATION') {
        return 'Evaluating supplier catalog and lead times';
      }
      return 'Idle — supplier catalog standby';
    },
    lastActionText: (status) =>
      status === 'completed'
        ? 'Optimal supplier selected'
        : status === 'active'
        ? 'Querying supplier inventory'
        : 'Awaiting maintenance ticket',
  },
  {
    key: 'procurement',
    name: 'Procurement Agent',
    icon: <Package />,
    triggerStep: 'PROCUREMENT_AND_RECOVERY',
    getTask: (data) => {
      const step = data?.current_step;
      if (step === 'PROCUREMENT_AND_RECOVERY') {
        return 'Generating PO and verifying recovery';
      }
      return 'Idle — awaiting supplier selection';
    },
    lastActionText: (status) =>
      status === 'completed'
        ? 'Purchase order issued, recovery verified'
        : status === 'active'
        ? 'Generating purchase order'
        : 'Awaiting supplier evaluation',
  },
];

export function AgentPanel() {
  const { data, isLoading, isError } = useOrchestratorState();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25">
        <p className="text-sm text-red-400">Failed to load agent panel.</p>
      </div>
    );
  }

  const stepHistory = data?.step_history ?? [];
  const currentStep = data?.current_step ?? 'IDLE';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {AGENT_DEFS.map((agent) => {
        const status =
          agent.key === 'orchestrator'
            ? getMissionOrchestratorStatus(stepHistory, currentStep)
            : getAgentStatus(agent.triggerStep, stepHistory, currentStep);

        return (
          <AgentCard
            key={agent.key}
            name={agent.name}
            icon={agent.icon}
            status={status}
            currentTask={agent.getTask(data)}
            confidence={stableConfidence(agent.key + (status === 'active' ? '-active' : ''), status)}
            lastAction={agent.lastActionText(status)}
          />
        );
      })}
    </div>
  );
}
