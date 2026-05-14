import { NextResponse } from "next/server";
import { z } from "zod";
import { HalfDayPeriod, LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit, parseDateInput, validateLeaveRequest } from "@/lib/leave-actions";

const schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.nativeEnum(HalfDayPeriod).nullable().optional(),
  reason: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "輸入格式有誤" }, { status: 400 });
  }

  const input = {
    startDate: parseDateInput(parsed.data.startDate),
    endDate: parseDateInput(parsed.data.endDate),
    isHalfDay: parsed.data.isHalfDay,
    halfDayPeriod: parsed.data.isHalfDay ? (parsed.data.halfDayPeriod ?? null) : null,
    reason: parsed.data.reason.trim(),
  };

  const result = await validateLeaveRequest(session.userId, input);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const created = await prisma.leaveRequest.create({
    data: {
      requesterId: session.userId,
      startDate: input.startDate,
      endDate: input.endDate,
      days: result.days,
      isHalfDay: input.isHalfDay,
      halfDayPeriod: input.halfDayPeriod,
      reason: input.reason,
      status: LeaveStatus.PENDING,
    },
  });

  await logAudit(session.userId, "LEAVE_REQUESTED", "LeaveRequest", created.id, {
    days: result.days,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
