import { DashboardShell } from '@/components/layout/DashboardShell';
import { AgentPanel } from '@/features/orchestrator/AgentPanel';
import { McpToolPanel } from '@/features/orchestrator/McpToolPanel';
import { DecisionSummary } from '@/features/orchestrator/DecisionSummary';

export default function OrchestratorPage() {
  return (
    <DashboardShell title="Mission Orchestrator" breadcrumb="Agents">
      <div className="space-y-6 animate-fade-in">
        <AgentPanel />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <McpToolPanel />
          <DecisionSummary />
        </div>
      </div>
    </DashboardShell>
  );
}
