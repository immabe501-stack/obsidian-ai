import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { findPendingPayouts } from "@/lib/payout";
import { logAudit } from "@/lib/leave-actions";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const view = url.searchParams.get("view") ?? "history";
  if (view === "pending") {
    return NextResponse.json(await findPendingPayouts());
  }
  const history = await prisma.leavePayout.findMany({
    include: { user: { select: { name: true, employeeNo: true } } },
    orderBy: { processedAt: "desc" },
    take: 50,
  });
  return NextResponse.json(history);
}

const schema = z.object({
  userId: z.string(),
  anniversaryYearStart: z.string(), // ISO date
  unusedDays: z.number().nonnegative(),
  payoutAmount: z.number().nonnegative().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "輸入格式有誤";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const data = parsed.data;
  const start = new Date(data.anniversaryYearStart);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "週年日格式不正確" }, { status: 400 });
  }
  // 防重
  const exists = await prisma.leavePayout.findFirst({
    where: { userId: data.userId, anniversaryYearStart: start },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ error: "該週年度已結算過" }, { status: 409 });
  }

  // anniversaryYearEnd = start + 1 year - 1 day
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  end.setUTCDate(end.getUTCDate() - 1);

  const payout = await prisma.leavePayout.create({
    data: {
      userId: data.userId,
      anniversaryYearStart: start,
      anniversaryYearEnd: end,
      unusedDays: data.unusedDays,
      payoutAmount: data.payoutAmount ?? null,
      note: data.note ?? null,
      processedBy: session.userId,
    },
  });

  await logAudit(session.userId, "PAYOUT_PROCESSED", "User", data.userId, {
    anniversaryYearStart: start.toISOString(),
    unusedDays: data.unusedDays,
    payoutAmount: data.payoutAmount,
  });

  return NextResponse.json({ id: payout.id }, { status: 201 });
}
