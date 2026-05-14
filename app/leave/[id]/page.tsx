import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canCancel } from "@/lib/leave-actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { CancelButton } from "./cancel-button";

export const dynamic = "force-dynamic";

export default async function LeaveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const { id } = await params;
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, employeeNo: true, managerId: true } },
      approver: { select: { name: true } },
    },
  });
  if (!request) notFound();

  const isOwner = request.requesterId === session.userId;
  const isApprover = request.requester.managerId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isApprover && !isAdmin) {
    redirect("/");
  }

  const dateRange =
    request.startDate.getTime() === request.endDate.getTime()
      ? format(request.startDate, "yyyy-MM-dd")
      : `${format(request.startDate, "yyyy-MM-dd")} ~ ${format(request.endDate, "yyyy-MM-dd")}`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader title="特休申請詳情" back={{ href: "/", label: "回首頁" }} />

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <StatusBadge status={request.status} />
          <span className="text-xs text-slate-500">
            提出於 {format(request.createdAt, "yyyy-MM-dd HH:mm")}
          </span>
        </div>

        <Field label="申請人">
          {request.requester.name}（{request.requester.employeeNo}）
        </Field>
        <Field label="日期">
          {dateRange}
          {request.isHalfDay && (
            <span className="ml-2 text-xs text-slate-500">
              半天 · {request.halfDayPeriod === "AM" ? "上午" : "下午"}
            </span>
          )}
        </Field>
        <Field label="天數">{request.days} 天</Field>
        <Field label="事由">{request.reason}</Field>

        {request.decidedAt && (
          <Field label={request.status === "APPROVED" ? "核准資訊" : "退回資訊"}>
            <div>{request.approver?.name ?? "—"}</div>
            <div className="text-xs text-slate-500">
              {format(request.decidedAt, "yyyy-MM-dd HH:mm")}
            </div>
            {request.decisionNote && (
              <div className="mt-1 text-sm text-slate-700">「{request.decisionNote}」</div>
            )}
          </Field>
        )}

        {canCancel(request, session.userId) && (
          <div className="border-t border-slate-100 pt-4">
            <CancelButton id={request.id} />
            <p className="mt-1 text-xs text-slate-500">
              取消後此申請不可恢復，需重新提出新申請。
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs text-slate-500">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
