'use client';

import { Play } from 'lucide-react';

interface JudgeModeButtonProps {
  onClick: () => void;
}

export function JudgeModeButton({ onClick }: JudgeModeButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open Judge Mode"
      className="
        lg:hidden
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-emerald-500 hover:bg-emerald-400
        shadow-xl shadow-emerald-500/30
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110 active:scale-95
        cursor-pointer
      "
    >
      <Play className="h-6 w-6 text-zinc-950 fill-current" />
    </button>
  );
}
