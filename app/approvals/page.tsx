import { redirect } from "next/navigation";
import { format } from "date-fns";
import { LeaveStatus } from "@prisma/client";
import { Inbox } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DecideButtons } from "./decide-buttons";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "MANAGER" && session.role !== "ADMIN") redirect("/");

  const where =
    session.role === "ADMIN"
      ? { status: LeaveStatus.PENDING }
      : { status: LeaveStatus.PENDING, requester: { managerId: session.userId } };

  const pending = await prisma.leaveRequest.findMany({
    where,
    include: {
      requester: { select: { name: true, employeeNo: true, department: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const recentDecided = await prisma.leaveRequest.findMany({
    where:
      session.role === "ADMIN"
        ? { status: { in: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] }, approverId: { not: null } }
        : { approverId: session.userId, status: { in: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] } },
    include: { requester: { select: { name: true, employeeNo: true } } },
    orderBy: { decidedAt: "desc" },
    take: 5,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        title="待審申請"
        subtitle={
          session.role === "ADMIN" ? "所有部門的待審申請（HR 模式）" : "您直屬部屬提出的待審申請"
        }
        back={{ href: "/", label: "回首頁" }}
      />

      <GlassCard variant="strong" className="mb-8 overflow-hidden animate-fade-in">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/50">
              <Inbox className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">目前沒有待審申請。</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/40">
            {pending.map((r) => (
              <li key={r.id} className="px-6 py-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-slate-900">
                      {r.requester.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {r.requester.employeeNo} · {r.requester.department ?? "—"}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm text-slate-700">
                      {format(r.startDate, "yyyy-MM-dd")}
                      {r.startDate.getTime() !== r.endDate.getTime() &&
                        ` ~ ${format(r.endDate, "yyyy-MM-dd")}`}
                      <span className="ml-2 text-gradient font-semibold">{r.days} 天</span>
                      {r.isHalfDay && (
                        <span className="ml-2 text-xs text-slate-500">
                          半天 · {r.halfDayPeriod === "AM" ? "上午" : "下午"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-sm text-slate-600">事由：{r.reason}</div>
                  </div>
                  <span className="text-xs text-slate-400">{format(r.createdAt, "MM-dd HH:mm")}</span>
                </div>
                <DecideButtons id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard variant="strong" className="p-7 animate-fade-in">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">最近處理</h2>
        {recentDecided.length === 0 ? (
          <p className="text-sm text-slate-500">尚未處理任何申請。</p>
        ) : (
          <ul className="space-y-2">
            {recentDecided.map((r) => (
              <li
                key={r.id}
                className="glass-subtle flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-900">{r.requester.name}</span>
                  <span className="ml-2 text-slate-500">
                    {format(r.startDate, "yyyy-MM-dd")}（{r.days} 天）
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {r.decidedAt && (
                    <span className="text-xs text-slate-400">{format(r.decidedAt, "MM-dd HH:mm")}</span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}
