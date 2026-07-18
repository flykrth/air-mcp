'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DataCenterGrid } from '@/features/digital-twin/DataCenterGrid';
import { RackDetailPanel } from '@/features/digital-twin/RackDetailPanel';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import type { HotspotRack } from '@/types';

export default function DigitalTwinPage() {
  const [selectedRack, setSelectedRack] = useState<HotspotRack | null>(null);
  // Ensure query is active for this page (DataCenterGrid also subscribes, this avoids flash)
  const { data: state } = useOrchestratorState();

  void state; // consumed by DataCenterGrid; declared here to prime cache

  return (
    <DashboardShell title="Digital Twin" breadcrumb="Infrastructure">
      <div className="flex gap-6 animate-fade-in">
        <div className="flex-1 min-w-0">
          <DataCenterGrid
            onRackSelect={setSelectedRack}
            selectedRackId={selectedRack?.rack_id ?? null}
          />
        </div>
        <RackDetailPanel rack={selectedRack} onClose={() => setSelectedRack(null)} />
      </div>
    </DashboardShell>
  );
}
