"use client";

export function YearProgress({ progress }: { progress: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-slate-500">本年度週期進度</span>
        <span className="font-semibold text-slate-700">{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ios-blue via-ios-indigo to-ios-purple shadow-[0_0_12px_rgba(94,92,230,0.5)] transition-all duration-700"
          style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}
