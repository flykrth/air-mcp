'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  GitMerge,
  Layers,
  Wrench,
  History,
  Play,
  Activity,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useJudgeMode } from '@/hooks/useJudgeMode';
import { JudgeModeOverlay } from '@/features/judge/JudgeModeOverlay';
import { JudgeModeButton } from '@/features/judge/JudgeModeButton';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';

interface DashboardShellProps {
  title: string;
  breadcrumb: string;
  children: React.ReactNode;
}

const MENU_ITEMS = [
  { href: '/', label: 'Executive Overview', icon: LayoutDashboard },
  { href: '/digital-twin', label: 'Digital Twin', icon: Cpu },
  { href: '/incident', label: 'Incident Center', icon: AlertTriangle },
  { href: '/workflow', label: 'Workflow Timeline', icon: GitMerge },
  { href: '/orchestrator', label: 'Mission Orchestrator', icon: Layers },
  { href: '/maintenance', label: 'Maintenance Planner', icon: Wrench },
  { href: '/audit', label: 'Audit History', icon: History },
];

export function DashboardShell({ title, breadcrumb, children }: DashboardShellProps) {
  const pathname = usePathname();
  const judgeMode = useJudgeMode();
  const { data: state } = useOrchestratorState();

  const isIncident = (state?.hotspots?.length ?? 0) > 0;
  const isRunning = state?.status !== 'IDLE' && !state?.recovery_verified && state?.current_step !== 'COMPLETED';

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col flex-shrink-0 z-30">
        {/* Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-900/60 gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-zinc-100 uppercase leading-none mt-0.5">
              AIR-MCP
            </span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">
              Control Panel
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                    : 'text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-900/50 hover:border-zinc-800/40'
                )}
              >
                <Icon
                  className={clsx(
                    'h-4 w-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0',
                    isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'
                  )}
                />
                <span className="truncate">{item.label}</span>
                {item.href === '/incident' && isIncident && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-400 animate-beacon" />
                )}
                {item.href === '/orchestrator' && isRunning && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-beacon" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-900/60 bg-zinc-950 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full',
                isRunning
                  ? 'bg-amber-400 animate-beacon'
                  : isIncident
                  ? 'bg-red-400 animate-beacon'
                  : 'bg-emerald-400'
              )}
            />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {isRunning
                ? 'Orchestrator Active'
                : isIncident
                ? 'Incidents Active'
                : 'Telemetry Nominal'}
            </span>
          </div>
          <span className="text-[9px] text-zinc-600 font-mono">v1.2.0 · datacenter-cluster</span>
        </div>
      </aside>

      {/* ── Main Layout Wrapper ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900/60 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 z-20 sticky top-0">
          {/* Breadcrumbs */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
              <span>{breadcrumb}</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-400">{title}</span>
            </div>
            <h1 className="text-base font-black text-zinc-100 truncate leading-snug">{title}</h1>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* System Status Indicators */}
            <div className="hidden md:flex items-center gap-4 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-xl text-xs">
              {/* Telemetry Indicator */}
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[9px]">
                  Flow Rate:
                </span>
                <span className="font-bold tabular-nums text-zinc-300">
                  {state?.cooling_loop?.chiller_flow_lps?.toFixed(1) ?? '12.0'} L/s
                </span>
              </div>
              <div className="h-3 w-px bg-zinc-800" />
              {/* Temperature Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[9px]">
                  Ambient:
                </span>
                <span className="font-bold tabular-nums text-zinc-300">
                  {state?.cooling_loop?.ambient_temp?.toFixed(1) ?? '25.0'}°C
                </span>
              </div>
            </div>

            {/* Judge Mode Trigger */}
            <button
              onClick={judgeMode.open}
              className="
                flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black
                bg-emerald-500 hover:bg-emerald-400 text-zinc-950
                shadow-md shadow-emerald-500/20 transition-all duration-200
                hover:scale-105 active:scale-95 cursor-pointer
              "
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Judge Presentation</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* ── Judge Mode Presentation Overlays ── */}
      <JudgeModeOverlay judgeMode={judgeMode} />
      <JudgeModeButton onClick={judgeMode.open} />
    </div>
  );
}
