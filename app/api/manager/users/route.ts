import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { EmploymentType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit, parseDateInput } from "@/lib/leave-actions";

const schema = z.object({
  employeeNo: z.string().min(1).max(20),
  email: z.string().email(),
  name: z.string().min(1).max(50),
  password: z.string().min(8).max(100),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  department: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(50).nullable().optional(),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "輸入格式有誤" }, { status: 400 });
  }
  const data = parsed.data;

  const dup = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { employeeNo: data.employeeNo }] },
    select: { id: true },
  });
  if (dup) return NextResponse.json({ error: "員編或 Email 已存在" }, { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const created = await prisma.user.create({
    data: {
      employeeNo: data.employeeNo,
      email: data.email,
      name: data.name,
      passwordHash,
      role: Role.EMPLOYEE, // 主管建立的員工強制為一般員工
      hireDate: parseDateInput(data.hireDate),
      department: data.department ?? null,
      jobTitle: data.jobTitle ?? null,
      employmentType: data.employmentType,
      managerId: session.userId, // 強制指派為自己
      annualLeaveEnabled: data.employmentType === EmploymentType.FULL_TIME, // 預設依雇用類型
      profile: { create: { chineseName: data.name } },
    },
  });

  await logAudit(session.userId, "USER_CREATED_BY_MANAGER", "User", created.id, {
    employeeNo: created.employeeNo,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
