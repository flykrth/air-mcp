import { DashboardShell } from '@/components/layout/DashboardShell';
import { WorkflowTimeline } from '@/features/workflow/WorkflowTimeline';
import { MigrationLog } from '@/features/workflow/MigrationLog';
import { DecisionPoint } from '@/features/workflow/DecisionPoint';

export default function WorkflowPage() {
  return (
    <DashboardShell title="Workflow Timeline" breadcrumb="Operations">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
        <div className="xl:col-span-2">
          <WorkflowTimeline />
        </div>
        <div className="space-y-6">
          <DecisionPoint />
          <MigrationLog />
        </div>
      </div>
    </DashboardShell>
  );
}
