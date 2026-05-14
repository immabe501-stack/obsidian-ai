import { NextResponse } from "next/server";
import { z } from "zod";
import { isBefore, startOfDay } from "date-fns";
import { HalfDayPeriod, LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit, parseDateInput } from "@/lib/leave-actions";
import { countLeaveDays, getCurrentAnniversaryYear } from "@/lib/leave";
import { getBalance } from "@/lib/balance";

const schema = z.object({
  userId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.nativeEnum(HalfDayPeriod).nullable().optional(),
  reason: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MANAGER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "輸入格式有誤" }, { status: 400 });
  }
  const data = parsed.data;

  // 對象必須是自己屬下（ADMIN 不受此限）
  const target = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, name: true, hireDate: true, managerId: true, active: true, annualLeaveEnabled: true },
  });
  if (!target) return NextResponse.json({ error: "員工不存在" }, { status: 404 });
  if (session.role === "MANAGER" && target.managerId !== session.userId) {
    return NextResponse.json({ error: "你不是這位員工的直屬主管" }, { status: 403 });
  }
  if (!target.annualLeaveEnabled) {
    return NextResponse.json(
      { error: `${target.name} 目前不享有特休，無法補登。如需開通請至員工編輯頁勾選「享有特休」。` },
      { status: 400 },
    );
  }

  const start = startOfDay(parseDateInput(data.startDate));
  const end = startOfDay(parseDateInput(data.endDate));
  if (isBefore(end, start)) {
    return NextResponse.json({ error: "結束日不能早於起始日" }, { status: 400 });
  }
  const isHalfDay = data.isHalfDay;
  if (isHalfDay) {
    if (start.getTime() !== end.getTime()) {
      return NextResponse.json({ error: "半天假的起訖日必須相同" }, { status: 400 });
    }
    if (!data.halfDayPeriod) {
      return NextResponse.json({ error: "半天假請選擇上午或下午" }, { status: 400 });
    }
  }

  const days = countLeaveDays(start, end, isHalfDay);

  // 必須在同一週年度內
  const startYear = getCurrentAnniversaryYear(target.hireDate, start);
  const endYear = getCurrentAnniversaryYear(target.hireDate, end);
  if (!startYear || !endYear) {
    return NextResponse.json(
      { error: "日期不在員工可請假的特休年度（可能尚未滿 6 個月）" },
      { status: 400 },
    );
  }
  if (startYear.start.getTime() !== endYear.start.getTime()) {
    return NextResponse.json({ error: "補登不可跨越特休週年度" }, { status: 400 });
  }

  // 餘額檢查（依該年度）
  const balance = await getBalance(target.id, start);
  if (days > balance.remaining) {
    return NextResponse.json(
      { error: `特休不足：可補登 ${balance.remaining} 天，本次需 ${days} 天` },
      { status: 400 },
    );
  }

  // 重疊檢查
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      requesterId: target.id,
      status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      AND: [{ endDate: { gte: start } }, { startDate: { lte: end } }],
    },
  });
  if (overlap) {
    return NextResponse.json({ error: "與既有請假紀錄日期重疊" }, { status: 400 });
  }

  const created = await prisma.leaveRequest.create({
    data: {
      requesterId: target.id,
      startDate: start,
      endDate: end,
      days,
      isHalfDay,
      halfDayPeriod: isHalfDay ? data.halfDayPeriod ?? null : null,
      reason: data.reason.trim(),
      status: LeaveStatus.APPROVED,
      approverId: session.userId,
      decidedAt: new Date(),
      decisionNote: `補登（由 ${session.userId === target.managerId ? "直屬主管" : "HR"}）`,
    },
  });

  await logAudit(session.userId, "LEAVE_BACKFILLED", "LeaveRequest", created.id, {
    targetUserId: target.id,
    days,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
