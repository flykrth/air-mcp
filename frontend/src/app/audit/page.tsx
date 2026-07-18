import { DashboardShell } from '@/components/layout/DashboardShell';
import { AuditTimeline } from '@/features/audit/AuditTimeline';

export default function AuditPage() {
  return (
    <DashboardShell title="Audit History" breadcrumb="Compliance">
      <div className="animate-fade-in">
        <AuditTimeline />
      </div>
    </DashboardShell>
  );
}
