import { format } from "date-fns";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/leave-actions";

const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: "待審",
  APPROVED: "已核准",
  REJECTED: "已退回",
  CANCELLED: "已取消",
};

function csvEscape(s: string): string {
  if (s == null) return "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session.userId) return new Response("Unauthorized", { status: 401 });
  if (session.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const where: Record<string, unknown> = {};
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) range.lte = new Date(`${to}T23:59:59.999Z`);
    where.startDate = range;
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      requester: { select: { employeeNo: true, name: true, department: true } },
      approver: { select: { name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const headers = [
    "員編",
    "姓名",
    "部門",
    "起始日",
    "結束日",
    "天數",
    "半天",
    "事由",
    "狀態",
    "核決人",
    "核決時間",
    "核決備註",
    "提出時間",
  ];
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of requests) {
    lines.push(
      [
        r.requester.employeeNo,
        r.requester.name,
        r.requester.department ?? "",
        format(r.startDate, "yyyy-MM-dd"),
        format(r.endDate, "yyyy-MM-dd"),
        r.days.toString(),
        r.isHalfDay ? (r.halfDayPeriod === "AM" ? "上午" : "下午") : "",
        r.reason,
        STATUS_LABEL[r.status],
        r.approver?.name ?? "",
        r.decidedAt ? format(r.decidedAt, "yyyy-MM-dd HH:mm") : "",
        r.decisionNote ?? "",
        format(r.createdAt, "yyyy-MM-dd HH:mm"),
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  // BOM for Excel UTF-8 readability
  const body = "﻿" + lines.join("\n");

  await logAudit(session.userId, "EXPORT_DOWNLOADED", "LeaveRequest", "all", {
    rowCount: requests.length,
    from,
    to,
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leave-requests-${format(new Date(), "yyyyMMdd-HHmmss")}.csv"`,
    },
  });
}
