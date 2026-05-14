import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock, FileText, MessageSquare, User as UserIcon } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canCancel } from "@/lib/leave-actions";
import { GlassCard } from "@/components/glass-card";
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

      <GlassCard variant="strong" className="space-y-6 p-7 animate-fade-in">
        <div className="flex items-center justify-between">
          <StatusBadge status={request.status} />
          <span className="text-xs text-slate-500">
            提出於 {format(request.createdAt, "yyyy-MM-dd HH:mm")}
          </span>
        </div>

        <Field icon={<UserIcon className="h-4 w-4" />} label="申請人">
          {request.requester.name}
          <span className="ml-1 text-slate-500">（{request.requester.employeeNo}）</span>
        </Field>
        <Field icon={<Calendar className="h-4 w-4" />} label="日期">
          {dateRange}
          {request.isHalfDay && (
            <span className="ml-2 text-xs text-slate-500">
              半天 · {request.halfDayPeriod === "AM" ? "上午" : "下午"}
            </span>
          )}
        </Field>
        <Field icon={<Clock className="h-4 w-4" />} label="天數">
          <span className="text-gradient text-lg font-semibold">{request.days}</span> 天
        </Field>
        <Field icon={<FileText className="h-4 w-4" />} label="事由">
          {request.reason}
        </Field>

        {request.decidedAt && (
          <div className="glass-subtle rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <MessageSquare className="h-3.5 w-3.5" />
              {request.status === "APPROVED" ? "核准資訊" : "退回資訊"}
            </div>
            <div className="text-sm font-medium">{request.approver?.name ?? "—"}</div>
            <div className="text-xs text-slate-500">
              {format(request.decidedAt, "yyyy-MM-dd HH:mm")}
            </div>
            {request.decisionNote && (
              <div className="mt-2 text-sm text-slate-700">「{request.decisionNote}」</div>
            )}
          </div>
        )}

        {canCancel(request, session.userId) && (
          <div className="border-t border-white/40 pt-5">
            <CancelButton id={request.id} />
            <p className="mt-2 text-xs text-slate-500">
              取消後此申請不可恢復，需重新提出新申請。
            </p>
          </div>
        )}
      </GlassCard>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}
