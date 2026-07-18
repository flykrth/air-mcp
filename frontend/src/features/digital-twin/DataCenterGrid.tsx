'use client';

import { useState } from 'react';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { RackCell, type RackStatus } from './RackCell';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { HotspotRack } from '@/types';

// ─── Static DC Floor Layout ─────────────────────────────────────────────────

interface StaticRack {
  rackId: string;
  name: string;
  rowId: number;
  colId: number;
}

const STATIC_RACKS: StaticRack[] = [
  { rackId: 'rack-a1', name: 'Rack-A1', rowId: 1, colId: 1 },
  { rackId: 'rack-a2', name: 'Rack-A2', rowId: 1, colId: 2 },
  { rackId: 'rack-a3', name: 'Rack-A3', rowId: 1, colId: 3 },
  { rackId: 'rack-b1', name: 'Rack-B1', rowId: 2, colId: 1 },
  { rackId: 'rack-b2', name: 'Rack-B2', rowId: 2, colId: 2 },
  { rackId: 'rack-c1', name: 'Rack-C1', rowId: 3, colId: 1 },
  { rackId: 'rack-c2', name: 'Rack-C2', rowId: 3, colId: 2 },
];

interface MergedRack {
  rackId: string;
  name: string;
  rowId: number;
  colId: number;
  tempC: number;
  powerKw: number;
  flowLps: number;
  status: RackStatus;
  hotspot: HotspotRack | null;
}

function mergeRacks(
  statics: StaticRack[],
  hotspots: HotspotRack[],
  ambientTemp: number
): MergedRack[] {
  return statics.map((s) => {
    // Match by name (case-insensitive) or by rack_id
    const hotspot = hotspots.find(
      (h) =>
        h.name.toLowerCase() === s.name.toLowerCase() ||
        h.rack_id.toLowerCase() === s.rackId.toLowerCase()
    ) ?? null;

    return {
      rackId: s.rackId,
      name: s.name,
      rowId: s.rowId,
      colId: s.colId,
      tempC: hotspot?.temperature_celsius ?? ambientTemp + 2 + Math.random() * 1.5,
      powerKw: hotspot?.power_draw_kw ?? 2.5 + Math.random() * 0.5,
      flowLps: hotspot?.cooling_flow_rate_lps ?? 1.8 + Math.random() * 0.4,
      status: (hotspot?.status ?? 'OPTIMAL') as RackStatus,
      hotspot,
    };
  });
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DataCenterGridProps {
  onRackSelect?: (rack: HotspotRack | null) => void;
  selectedRackId?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataCenterGrid({ onRackSelect, selectedRackId }: DataCenterGridProps) {
  const { data: state, isLoading } = useOrchestratorState();
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const activeSelectedId = selectedRackId !== undefined ? selectedRackId : internalSelectedId;

  const hotspots = state?.hotspots ?? [];
  const ambientTemp = state?.cooling_loop?.ambient_temp ?? 25;
  const mergedRacks = mergeRacks(STATIC_RACKS, hotspots, ambientTemp);

  function handleRackClick(merged: MergedRack) {
    if (activeSelectedId === merged.rackId) {
      // Deselect
      setInternalSelectedId(null);
      onRackSelect?.(null);
    } else {
      setInternalSelectedId(merged.rackId);
      // If there's a real hotspot, pass it; otherwise construct a synthetic one
      const hotspotData: HotspotRack = merged.hotspot ?? {
        rack_id: merged.rackId,
        name: merged.name,
        status: merged.status,
        row_id: merged.rowId,
        column_id: merged.colId,
        temperature_celsius: merged.tempC,
        power_draw_kw: merged.powerKw,
        cooling_flow_rate_lps: merged.flowLps,
        ambient_temperature: ambientTemp,
        recorded_at: new Date().toISOString(),
      };
      onRackSelect?.(hotspotData);
    }
  }

  const hotspotCount = hotspots.length;
  const criticalCount = mergedRacks.filter((r) => r.status === 'CRITICAL').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-100">
            Data Center Floor —{' '}
            <span className="text-emerald-400">Digital Twin</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {STATIC_RACKS.length} racks monitored ·{' '}
            <span
              className={
                hotspotCount > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'
              }
            >
              {hotspotCount} hotspot{hotspotCount !== 1 ? 's' : ''}
            </span>
            {criticalCount > 0 && (
              <span className="text-red-400 font-semibold ml-1">
                · {criticalCount} critical
              </span>
            )}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            &lt;30°C
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            30–40°C
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            &gt;40°C
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading && !state ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STATIC_RACKS.map((r) => (
            <SkeletonCard key={r.rackId} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mergedRacks.map((rack) => (
            <RackCell
              key={rack.rackId}
              rackId={rack.rackId}
              name={rack.name}
              rowId={rack.rowId}
              colId={rack.colId}
              tempC={rack.tempC}
              powerKw={rack.powerKw}
              flowLps={rack.flowLps}
              status={rack.status}
              isSelected={activeSelectedId === rack.rackId}
              onClick={() => handleRackClick(rack)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
