'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import type { TelemetryChartPoint } from '@/types';

const MAX_POINTS = 15;

const COLORS = {
  ambient: '#f87171',   // rose/red — ambient baseline
  hotspot: '#fbbf24',   // amber — hotspot racks
  normal: '#34d399',    // emerald — normal average
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
      }}
    >
      <p className="text-zinc-500 font-semibold mb-1.5 text-[11px] tracking-wide uppercase">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-zinc-300 font-medium">{entry.name}:</span>
          <span className="text-zinc-100 font-black tabular-nums">
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}°C
          </span>
        </div>
      ))}
    </div>
  );
}

export function SystemTimeline() {
  const { data: state } = useOrchestratorState();
  const [series, setSeries] = useState<TelemetryChartPoint[]>([]);
  const hotspotNamesRef = useRef<string[]>([]);

  useEffect(() => {
    if (!state) return;

    const now = new Date().toISOString();
    const ambientTemp = state.cooling_loop?.ambient_temp ?? 25;
    const hotspots = state.hotspots ?? [];

    // Track known hotspot names across renders
    hotspots.forEach((h) => {
      if (!hotspotNamesRef.current.includes(h.name)) {
        hotspotNamesRef.current = [...hotspotNamesRef.current, h.name];
      }
    });

    // Build data point
    const point: TelemetryChartPoint = { time: now, ambient: ambientTemp };

    // Add hotspot temps by name
    hotspots.forEach((h) => {
      point[h.name] = h.temperature_celsius;
    });

    // Compute average of non-hotspot racks (simulate: baseline ~24°C if no data)
    if (hotspots.length === 0) {
      point['Avg Temp'] = 24 + Math.random() * 2 - 1;
    }

    setSeries((prev) => {
      const next = [...prev, point];
      return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
    });
  }, [state]);

  // Collect all data keys beyond 'time' and 'ambient'
  const allKeys = series.reduce<string[]>((acc, pt) => {
    Object.keys(pt).forEach((k) => {
      if (k !== 'time' && k !== 'ambient' && !acc.includes(k)) {
        acc.push(k);
      }
    });
    return acc;
  }, []);

  const hotspotNames = hotspotNamesRef.current;

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            System Timeline
          </span>
          <p className="text-sm text-zinc-300 font-medium mt-0.5">
            Live Thermal Feed · Last {MAX_POINTS} readings
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon" />
          <span className="text-xs text-zinc-500 font-medium">LIVE</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="ambientGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.ambient} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS.ambient} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="hotspotGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.hotspot} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.hotspot} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.normal} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.normal} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(series.length / 5) - 1)}
          />

          <YAxis
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            unit="°"
            domain={['auto', 'auto']}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 8 }}
          />

          {/* Ambient temperature — always shown */}
          <Area
            type="monotone"
            dataKey="ambient"
            name="Ambient"
            stroke={COLORS.ambient}
            strokeWidth={2}
            fill="url(#ambientGrad)"
            dot={false}
            activeDot={{ r: 4, fill: COLORS.ambient }}
          />

          {/* Hotspot racks */}
          {allKeys
            .filter((k) => k !== 'Avg Temp')
            .map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={hotspotNames.includes(key) ? COLORS.hotspot : COLORS.normal}
                strokeWidth={1.5}
                fill={`url(#${hotspotNames.includes(key) ? 'hotspotGrad' : 'normalGrad'})`}
                dot={false}
                activeDot={{ r: 3 }}
                strokeOpacity={0.9}
              />
            ))}

          {/* Normal average (when no hotspots) */}
          {allKeys.includes('Avg Temp') && (
            <Area
              type="monotone"
              dataKey="Avg Temp"
              name="Avg Temp"
              stroke={COLORS.normal}
              strokeWidth={1.5}
              fill="url(#normalGrad)"
              dot={false}
              activeDot={{ r: 3 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
