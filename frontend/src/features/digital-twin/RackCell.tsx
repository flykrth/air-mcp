'use client';

import { clsx } from 'clsx';

export type RackStatus = 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';

interface RackCellProps {
  rackId: string;
  name: string;
  rowId: number;
  colId: number;
  tempC: number;
  powerKw: number;
  flowLps: number;
  status: RackStatus;
  isSelected: boolean;
  onClick: () => void;
}

function getThermalAccent(tempC: number) {
  if (tempC < 30) {
    return {
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      glow: '',
    };
  } else if (tempC <= 40) {
    return {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      glow: '',
    };
  } else {
    return {
      border: 'border-red-500/40',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      glow: 'animate-glow-red',
    };
  }
}

export function RackCell({
  rackId,
  name,
  rowId,
  colId,
  tempC,
  powerKw,
  flowLps,
  status,
  isSelected,
  onClick,
}: RackCellProps) {
  const thermal = getThermalAccent(tempC);
  const isCritical = status === 'CRITICAL' || tempC > 40;

  return (
    <button
      onClick={onClick}
      aria-label={`Rack ${name}: ${tempC.toFixed(1)}°C, ${status}`}
      className={clsx(
        'glass-card p-4 flex flex-col gap-2 text-left w-full',
        'transition-all duration-250 cursor-pointer',
        'hover:scale-[1.02] active:scale-[0.98]',
        thermal.border,
        thermal.glow,
        isCritical && 'animate-pulse',
        isSelected && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-zinc-950'
      )}
      data-rack-id={rackId}
    >
      {/* Header row: name + status dot */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-zinc-100 truncate">{name}</span>
        <span
          className={clsx(
            'w-2 h-2 rounded-full flex-shrink-0',
            status === 'OPTIMAL'
              ? 'bg-emerald-400'
              : status === 'DEGRADED'
              ? 'bg-amber-400 animate-beacon'
              : 'bg-red-400 animate-beacon'
          )}
        />
      </div>

      {/* Temperature — large */}
      <div className="flex items-baseline gap-0.5">
        <span className={clsx('text-2xl font-black tabular-nums leading-none', thermal.text)}>
          {tempC.toFixed(1)}
        </span>
        <span className={clsx('text-sm font-semibold', thermal.text)}>°C</span>
      </div>

      {/* Power & Flow */}
      <div className="flex flex-col gap-0.5 border-t border-zinc-800 pt-2 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 font-medium">Power</span>
          <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
            {powerKw.toFixed(1)} kW
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 font-medium">Flow</span>
          <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
            {flowLps.toFixed(2)} L/s
          </span>
        </div>
      </div>
    </button>
  );
}
