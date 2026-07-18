import { DashboardShell } from '@/components/layout/DashboardShell';
import { ExecutiveSummary } from '@/features/dashboard/ExecutiveSummary';
import { CoolingLoopStatus } from '@/features/dashboard/CoolingLoopStatus';
import { SystemTimeline } from '@/features/dashboard/SystemTimeline';
import { SimulationControls } from '@/features/dashboard/SimulationControls';

export default function DashboardPage() {
  return (
    <DashboardShell title="Executive Overview" breadcrumb="AIR-MCP">
      <div className="space-y-6 animate-fade-in">
        <ExecutiveSummary />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SystemTimeline />
          </div>
          <CoolingLoopStatus />
        </div>
        <SimulationControls />
      </div>
    </DashboardShell>
  );
}
