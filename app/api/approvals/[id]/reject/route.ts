import { NextResponse } from "next/server";
import { z } from "zod";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/leave-actions";

const schema = z.object({ note: z.string().min(1, "請填寫退回原因").max(500) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "輸入格式有誤";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { id } = await ctx.params;
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { requester: { select: { managerId: true } } },
  });
  if (!request) {
    return NextResponse.json({ error: "申請不存在" }, { status: 404 });
  }
  if (request.status !== LeaveStatus.PENDING) {
    return NextResponse.json({ error: "此申請非待審狀態" }, { status: 400 });
  }

  const isApprover = request.requester.managerId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isApprover && !isAdmin) {
    return NextResponse.json({ error: "您不是這位員工的直屬主管" }, { status: 403 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: LeaveStatus.REJECTED,
      approverId: session.userId,
      decidedAt: new Date(),
      decisionNote: parsed.data.note,
    },
  });
  await logAudit(session.userId, "LEAVE_REJECTED", "LeaveRequest", id, {
    note: parsed.data.note,
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
