import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCurrentAnniversaryYear } from "@/lib/leave";
import { logAudit } from "@/lib/leave-actions";

const schema = z.object({
  userId: z.string(),
  days: z.number().refine((n) => n !== 0, "天數不能為 0"),
  reason: z.string().min(1).max(500),
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
  const { userId, days, reason } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { hireDate: true },
  });
  if (!target) return NextResponse.json({ error: "目標員工不存在" }, { status: 404 });

  const year = getCurrentAnniversaryYear(target.hireDate);
  if (!year) {
    return NextResponse.json(
      { error: "該員工目前無特休年度可調整（尚未滿 6 個月）" },
      { status: 400 },
    );
  }

  const adj = await prisma.balanceAdjustment.create({
    data: {
      userId,
      anniversaryYearStart: year.start,
      days,
      reason,
      createdBy: session.userId,
    },
  });

  await logAudit(session.userId, "BALANCE_ADJUSTED", "User", userId, { days, reason });

  return NextResponse.json({ id: adj.id }, { status: 201 });
}
