import { NextResponse } from "next/server";
import { z } from "zod";
import { EmploymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit, parseDateInput } from "@/lib/leave-actions";

async function requireAdmin() {
  const session = await getSession();
  if (!session.userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const list = await prisma.employmentPeriod.findMany({
    where: { userId: id },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(list);
}

const periodSchema = z.object({
  type: z.nativeEnum(EmploymentType),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  countsTowardSeniority: z.boolean().default(true),
  note: z.string().max(200).nullable().optional(),
});

const bodySchema = z.object({
  periods: z.array(periodSchema).max(50),
});

/**
 * 整批覆寫該員工的工作經歷段（最容易維護的做法）
 */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入格式有誤" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 簡單檢查：start <= end（若有 end）
  for (const p of parsed.data.periods) {
    if (p.endDate && p.endDate < p.startDate) {
      return NextResponse.json({ error: "結束日不能早於起始日" }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.employmentPeriod.deleteMany({ where: { userId: id } }),
    prisma.employmentPeriod.createMany({
      data: parsed.data.periods.map((p) => ({
        userId: id,
        type: p.type,
        startDate: parseDateInput(p.startDate),
        endDate: p.endDate ? parseDateInput(p.endDate) : null,
        countsTowardSeniority: p.countsTowardSeniority,
        note: p.note ?? null,
      })),
    }),
  ]);

  await logAudit(session!.userId!, "EMPLOYMENT_PERIODS_UPDATED", "User", id, {
    count: parsed.data.periods.length,
  });

  return NextResponse.json({ ok: true });
}
