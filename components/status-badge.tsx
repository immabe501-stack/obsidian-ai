import type { LeaveStatus } from "@prisma/client";
import { cn } from "@/lib/cn";

const labels: Record<LeaveStatus, { label: string; cls: string; dot: string }> = {
  PENDING: { label: "待審", cls: "bg-amber-100/80 text-amber-800 border-amber-200/60", dot: "bg-amber-500" },
  APPROVED: { label: "已核准", cls: "bg-emerald-100/80 text-emerald-800 border-emerald-200/60", dot: "bg-emerald-500" },
  REJECTED: { label: "已退回", cls: "bg-rose-100/80 text-rose-800 border-rose-200/60", dot: "bg-rose-500" },
  CANCELLED: { label: "已取消", cls: "bg-slate-100/80 text-slate-600 border-slate-200/60", dot: "bg-slate-400" },
};

export function StatusBadge({ status, className }: { status: LeaveStatus; className?: string }) {
  const s = labels[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
