'use client';

import { clsx } from 'clsx';
import { StatusBadge, statusToVariant } from '@/components/ui/StatusBadge';
import type { HotspotRack } from '@/types';

interface RackDetailPanelProps {
  rack: HotspotRack | null;
  onClose: () => void;
}

function SimulatedReadingRow({
  label,
  value,
  timestamp,
  delta,
  deltaPositive,
}: {
  label: string;
  value: string;
  timestamp: string;
  delta?: string;
  deltaPositive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-zinc-300">{value}</span>
        <span className="text-[10px] text-zinc-600">{label}</span>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[10px] text-zinc-600 tabular-nums">
          {new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}
        </span>
        {delta && (
          <span
            className={clsx(
              'text-[10px] font-semibold',
              deltaPositive ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {deltaPositive ? '↓ ' : '↑ '}{delta}
          </span>
        )}
      </div>
    </div>
  );
}

export function RackDetailPanel({ rack, onClose }: RackDetailPanelProps) {
  if (!rack) {
    return (
      <div className="w-80 flex-shrink-0">
        <div className="glass-card p-6 flex flex-col items-center justify-center gap-3 h-full min-h-[300px] text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-6 h-6 text-zinc-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-400">Select a rack to inspect</p>
            <p className="text-xs text-zinc-600 mt-1">
              Click any rack on the floor plan to view its telemetry and status details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tempColor =
    rack.temperature_celsius > 40
      ? 'text-red-400'
      : rack.temperature_celsius > 30
      ? 'text-amber-400'
      : 'text-emerald-400';

  // Simulate 3 historical readings slightly offset in time
  const baseTime = new Date(rack.recorded_at).getTime();
  const readings = [
    {
      label: 'Temperature',
      value: `${rack.temperature_celsius.toFixed(1)}°C`,
      timestamp: new Date(baseTime).toISOString(),
      delta: '0.0°C',
      deltaPositive: false,
    },
    {
      label: 'Temperature',
      value: `${(rack.temperature_celsius - 1.2).toFixed(1)}°C`,
      timestamp: new Date(baseTime - 30_000).toISOString(),
      delta: '1.2°C',
      deltaPositive: true,
    },
    {
      label: 'Temperature',
      value: `${(rack.temperature_celsius - 2.8).toFixed(1)}°C`,
      timestamp: new Date(baseTime - 60_000).toISOString(),
      delta: '1.6°C',
      deltaPositive: true,
    },
  ];

  return (
    <div className="w-80 flex-shrink-0 animate-slide-in-right">
      <div className="glass-card flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-zinc-800">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded tracking-wider uppercase">
                {rack.rack_id}
              </span>
              <StatusBadge variant={statusToVariant(rack.status)} />
            </div>
            <h3 className="text-sm font-black text-zinc-100">{rack.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close rack detail panel"
            className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5 text-zinc-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Temperature — hero reading */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Current Temperature
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={clsx('text-5xl font-black tabular-nums leading-none', tempColor)}>
              {rack.temperature_celsius.toFixed(1)}
            </span>
            <span className={clsx('text-xl font-bold', tempColor)}>°C</span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="px-4 py-3 border-b border-zinc-800 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
              Power Draw
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tabular-nums text-zinc-100">
                {rack.power_draw_kw.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500">kW</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
              Cooling Flow
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tabular-nums text-zinc-100">
                {rack.cooling_flow_rate_lps.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500">L/s</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
              Ambient Temp
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tabular-nums text-zinc-100">
                {rack.ambient_temperature.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500">°C</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
              Position
            </span>
            <span className="text-sm font-bold text-zinc-300 font-mono">
              R{rack.row_id} · C{rack.column_id}
            </span>
          </div>
        </div>

        {/* Recent telemetry */}
        <div className="px-4 py-3 flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">
            Recent Telemetry
          </span>
          {readings.map((r, i) => (
            <SimulatedReadingRow
              key={i}
              label={r.label}
              value={r.value}
              timestamp={r.timestamp}
              delta={r.delta}
              deltaPositive={r.deltaPositive}
            />
          ))}
        </div>

        {/* Footer timestamp */}
        <div className="px-4 py-2.5 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-700 text-center">
            Last recorded:{' '}
            {new Date(rack.recorded_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
