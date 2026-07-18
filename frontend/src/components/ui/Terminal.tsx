import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface TerminalProps {
  entries: string[];
  title?: string;
  maxHeight?: string;
  emptyMessage?: string;
}

export function Terminal({
  entries,
  title = 'Terminal',
  maxHeight = '240px',
  emptyMessage = 'No logs available.',
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-[11px] shadow-inner select-text">
      {/* Terminal Window Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
          {title}
        </span>
        <div className="w-10" />
      </div>

      {/* Terminal Console Output */}
      <div
        ref={containerRef}
        className="p-3 overflow-y-auto space-y-1 scroll-smooth"
        style={{ maxHeight }}
      >
        {entries.length === 0 ? (
          <p className="text-zinc-600 italic">{emptyMessage}</p>
        ) : (
          entries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 leading-relaxed">
              <span className="text-emerald-500/60 flex-shrink-0">›</span>
              <span className="text-zinc-300 break-all select-text">{entry}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
