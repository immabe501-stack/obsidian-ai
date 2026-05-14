import { NextResponse } from "next/server";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canCancel, logAudit } from "@/lib/leave-actions";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const request = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "申請不存在" }, { status: 404 });
  }
  if (!canCancel(request, session.userId)) {
    return NextResponse.json({ error: "無權限或狀態不允許取消" }, { status: 403 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: LeaveStatus.CANCELLED },
  });

  await logAudit(session.userId, "LEAVE_CANCELLED", "LeaveRequest", id);

  return NextResponse.json({ ok: true, status: updated.status });
}
