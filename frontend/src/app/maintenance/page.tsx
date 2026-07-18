import { DashboardShell } from '@/components/layout/DashboardShell';
import { TicketCard } from '@/features/maintenance/TicketCard';
import { TechnicianCard } from '@/features/maintenance/TechnicianCard';
import { ProcurementCard } from '@/features/maintenance/ProcurementCard';

export default function MaintenancePage() {
  return (
    <DashboardShell title="Maintenance Planner" breadcrumb="Operations">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <TicketCard />
        <TechnicianCard />
        <ProcurementCard />
      </div>
    </DashboardShell>
  );
}
