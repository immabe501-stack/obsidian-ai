import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, managerId: true } },
      approver: { select: { id: true, name: true } },
    },
  });
  if (!request) {
    return NextResponse.json({ error: "申請不存在" }, { status: 404 });
  }

  // 員工可看自己的；主管可看部屬的；admin 全看
  const isOwner = request.requesterId === session.userId;
  const isApprover = request.requester.managerId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isApprover && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(request);
}
