import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { EmploymentType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit, parseDateInput } from "@/lib/leave-actions";

async function requireAdmin() {
  const session = await getSession();
  if (!session.userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { employeeNo: "asc" }],
    select: {
      id: true,
      employeeNo: true,
      email: true,
      name: true,
      role: true,
      department: true,
      jobTitle: true,
      employmentType: true,
      hireDate: true,
      active: true,
      manager: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(users);
}

const createSchema = z.object({
  employeeNo: z.string().min(1).max(20),
  email: z.string().email(),
  name: z.string().min(1).max(50),
  password: z.string().min(8).max(100),
  role: z.nativeEnum(Role),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  department: z.string().max(50).optional().nullable(),
  jobTitle: z.string().max(50).optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  managerId: z.string().nullable().optional(),
  annualLeaveEnabled: z.boolean().optional(),
});

export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "輸入格式有誤";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const data = parsed.data;

  const dup = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { employeeNo: data.employeeNo }] },
    select: { id: true },
  });
  if (dup) {
    return NextResponse.json({ error: "員編或 Email 已存在" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  // 預設特休資格：正職 → 享有；其他 → 不享有；可被 explicit 設定覆寫
  const defaultAnnualLeave = data.employmentType === EmploymentType.FULL_TIME;
  const created = await prisma.user.create({
    data: {
      employeeNo: data.employeeNo,
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      hireDate: parseDateInput(data.hireDate),
      department: data.department ?? null,
      jobTitle: data.jobTitle ?? null,
      employmentType: data.employmentType,
      managerId: data.managerId ?? null,
      annualLeaveEnabled: data.annualLeaveEnabled ?? defaultAnnualLeave,
      profile: { create: { chineseName: data.name } },
    },
  });

  await logAudit(session!.userId!, "USER_CREATED", "User", created.id, {
    employeeNo: created.employeeNo,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
