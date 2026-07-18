'use client';

import { useState, useMemo } from 'react';
import { Zap, Database, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useOrchestratorState } from '@/hooks/useOrchestratorState';
import { GlowCard } from '@/components/ui/GlowCard';
import { Terminal } from '@/components/ui/Terminal';
import { Skeleton } from '@/components/ui/Skeleton';

type TabId = 'tools' | 'resources' | 'prompts';

interface ParsedLogEntry {
  text: string;
  category: 'tools' | 'resources' | 'prompts' | 'general';
  isSuccess: boolean;
}

function parseLogEntries(logs: string[]): ParsedLogEntry[] {
  return logs.map((log) => {
    const lower = log.toLowerCase();
    const isSuccess =
      !lower.includes('error') &&
      !lower.includes('fail') &&
      !lower.includes('exception');

    let category: ParsedLogEntry['category'] = 'general';

    if (
      lower.includes('calling') ||
      lower.includes('tool') ||
      lower.includes('execute') ||
      lower.includes('invoke') ||
      lower.includes('function')
    ) {
      category = 'tools';
    } else if (
      lower.includes('reading') ||
      lower.includes('resource') ||
      lower.includes('fetch') ||
      lower.includes('query') ||
      lower.includes('database') ||
      lower.includes('select')
    ) {
      category = 'resources';
    } else if (
      lower.includes('prompt') ||
      lower.includes('template') ||
      lower.includes('instruction') ||
      lower.includes('system message')
    ) {
      category = 'prompts';
    } else if (log.startsWith('[') && log.includes(']')) {
      // Lines like [AGENT_NAME] some action — treat as tool calls
      category = 'tools';
    }

    return { text: log, category, isSuccess };
  });
}

const SIMULATED_TIMINGS = ['~45ms', '~87ms', '~120ms', '~210ms', '~340ms', '~55ms', '~178ms'];

function getSimulatedTiming(index: number): string {
  return SIMULATED_TIMINGS[index % SIMULATED_TIMINGS.length];
}

function getCategoryIcon(category: TabId) {
  switch (category) {
    case 'tools':
      return Zap;
    case 'resources':
      return Database;
    case 'prompts':
      return MessageSquare;
  }
}

function getCategoryLabel(category: TabId): string {
  switch (category) {
    case 'tools':
      return 'Tool Calls';
    case 'resources':
      return 'Resources';
    case 'prompts':
      return 'Prompts';
  }
}

export function McpToolPanel() {
  const { data, isLoading, isError } = useOrchestratorState();
  const [activeTab, setActiveTab] = useState<TabId>('tools');

  const logs = data?.agent_logs ?? [];

  const parsedEntries = useMemo(() => parseLogEntries(logs), [logs]);

  const categorized = useMemo(() => ({
    tools: parsedEntries.filter((e) => e.category === 'tools'),
    resources: parsedEntries.filter((e) => e.category === 'resources'),
    prompts: parsedEntries.filter((e) => e.category === 'prompts'),
  }), [parsedEntries]);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'tools', label: 'Tool Calls', count: categorized.tools.length },
    { id: 'resources', label: 'Resources', count: categorized.resources.length },
    { id: 'prompts', label: 'Prompts', count: categorized.prompts.length },
  ];

  if (isLoading) {
    return (
      <GlowCard className="p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </GlowCard>
    );
  }

  if (isError) {
    return (
      <GlowCard className="p-5">
        <p className="text-sm text-red-400">Failed to load MCP tool panel.</p>
      </GlowCard>
    );
  }

  const activeEntries = categorized[activeTab];
  const CategoryIcon = getCategoryIcon(activeTab);

  return (
    <GlowCard className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-200">MCP Tool Activity</h3>
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
          {parsedEntries.length} log entries
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
        {tabs.map((tab) => {
          const TabIcon = getCategoryIcon(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer',
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-200 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded-full text-[9px] font-bold',
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-700 text-zinc-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Entries list */}
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
        {activeEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CategoryIcon className="h-6 w-6 text-zinc-700" />
            <p className="text-xs text-zinc-600 italic">
              No {getCategoryLabel(activeTab).toLowerCase()} recorded yet
            </p>
          </div>
        ) : (
          activeEntries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
            >
              {/* Status icon */}
              {entry.isSuccess ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              )}

              {/* Category icon */}
              <CategoryIcon className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0 mt-0.5" />

              {/* Text */}
              <p className="flex-1 text-[11px] text-zinc-400 leading-relaxed break-words min-w-0">
                {entry.text}
              </p>

              {/* Timing badge */}
              <span className="flex-shrink-0 text-[9px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                {getSimulatedTiming(idx)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Terminal */}
      <Terminal
        entries={logs}
        title="Agent Console"
        maxHeight="200px"
        emptyMessage="Awaiting agent activity..."
      />
    </GlowCard>
  );
}
