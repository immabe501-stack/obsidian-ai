import { NextResponse } from "next/server";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "missing from/to" }, { status: 400 });
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const requests = await prisma.leaveRequest.findMany({
    where: {
      status: { in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
      // 區間重疊
      AND: [{ startDate: { lte: toDate } }, { endDate: { gte: fromDate } }],
    },
    include: {
      requester: { select: { id: true, name: true, department: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(requests);
}
