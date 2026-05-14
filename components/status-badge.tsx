import type { LeaveStatus } from "@prisma/client";

const labels: Record<LeaveStatus, { label: string; cls: string }> = {
  PENDING: { label: "待審", cls: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "已核准", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "已退回", cls: "bg-red-100 text-red-800" },
  CANCELLED: { label: "已取消", cls: "bg-slate-100 text-slate-600" },
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const s = labels[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${s.cls}`}>{s.label}</span>;
}
