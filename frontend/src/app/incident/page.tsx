import { DashboardShell } from '@/components/layout/DashboardShell';
import { ActiveIncidentBanner } from '@/features/incident/ActiveIncidentBanner';
import { AffectedAssetsList } from '@/features/incident/AffectedAssetsList';
import { RiskExposureCard } from '@/features/incident/RiskExposureCard';
import { RecoveryProgress } from '@/features/incident/RecoveryProgress';

export default function IncidentPage() {
  return (
    <DashboardShell title="Incident Center" breadcrumb="Operations">
      <div className="space-y-6 animate-fade-in">
        <ActiveIncidentBanner />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AffectedAssetsList />
            <RiskExposureCard />
          </div>
          <RecoveryProgress />
        </div>
      </div>
    </DashboardShell>
  );
}
