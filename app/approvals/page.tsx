import { redirect } from "next/navigation";
import { format } from "date-fns";
import { LeaveStatus } from "@prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DecideButtons } from "./decide-buttons";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "MANAGER" && session.role !== "ADMIN") redirect("/");

  // 主管：看自己部屬的待審；admin：看全部待審
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
          session.role === "ADMIN"
            ? "所有部門的待審申請（HR 模式）"
            : "您直屬部屬提出的待審申請"
        }
        back={{ href: "/", label: "回首頁" }}
      />

      <section className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        {pending.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">目前沒有待審申請。</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((r) => (
              <li key={r.id} className="px-6 py-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      {r.requester.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {r.requester.employeeNo} · {r.requester.department ?? "—"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">
                      {format(r.startDate, "yyyy-MM-dd")}
                      {r.startDate.getTime() !== r.endDate.getTime() &&
                        ` ~ ${format(r.endDate, "yyyy-MM-dd")}`}
                      <span className="ml-2 text-slate-500">（{r.days} 天）</span>
                      {r.isHalfDay && (
                        <span className="ml-2 text-xs text-slate-500">
                          半天 · {r.halfDayPeriod === "AM" ? "上午" : "下午"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">事由：{r.reason}</div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {format(r.createdAt, "MM-dd HH:mm")}
                  </span>
                </div>
                <DecideButtons id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">最近處理</h2>
        {recentDecided.length === 0 ? (
          <p className="text-sm text-slate-500">尚未處理任何申請。</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentDecided.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium">{r.requester.name}</span>
                  <span className="ml-2 text-slate-500">
                    {format(r.startDate, "yyyy-MM-dd")}（{r.days} 天）
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {r.decidedAt && (
                    <span className="text-xs text-slate-400">
                      {format(r.decidedAt, "MM-dd HH:mm")}
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
