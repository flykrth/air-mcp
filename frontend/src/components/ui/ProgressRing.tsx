import { clsx } from 'clsx';

interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 60,
  strokeWidth = 5,
  color = '#34d399',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          className="text-zinc-800"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Label Overlay */}
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label && (
            <span
              className={clsx(
                'font-black leading-none tabular-nums tracking-tighter text-zinc-100',
                size > 80 ? 'text-lg' : 'text-[11px]'
              )}
            >
              {label}
            </span>
          )}
          {sublabel && (
            <span
              className={clsx(
                'font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5',
                size > 80 ? 'text-[9px]' : 'text-[8px]'
              )}
            >
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
