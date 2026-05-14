import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { EmploymentType, Gender, MaritalStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { decryptPII, encryptPII } from "@/lib/crypto";
import { logAudit, parseDateInput } from "@/lib/leave-actions";

async function requireAdmin() {
  const session = await getSession();
  if (!session.userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true } },
      profile: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 解密敏感欄位（admin 看明碼）
  const profile = user.profile;
  const decrypted = profile
    ? {
        ...profile,
        nationalId: decryptPII(profile.nationalIdEncrypted) ?? "",
        bankAccount: decryptPII(profile.bankAccountEncrypted) ?? "",
        nationalIdEncrypted: undefined,
        bankAccountEncrypted: undefined,
      }
    : null;

  await logAudit(session!.userId!, "PII_VIEWED", "User", id);

  // 不洩漏 passwordHash
  const { passwordHash: _ph, ...safeUser } = user;
  return NextResponse.json({ ...safeUser, profile: decrypted });
}

const patchSchema = z.object({
  // User 基本欄位
  name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  department: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(50).nullable().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  managerId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  // Profile 欄位
  profile: z
    .object({
      chineseName: z.string().nullable().optional(),
      englishName: z.string().nullable().optional(),
      birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
      gender: z.nativeEnum(Gender).nullable().optional(),
      maritalStatus: z.nativeEnum(MaritalStatus).nullable().optional(),
      phone: z.string().nullable().optional(),
      mobile: z.string().nullable().optional(),
      registeredAddress: z.string().nullable().optional(),
      mailingAddress: z.string().nullable().optional(),
      emergencyContactName: z.string().nullable().optional(),
      emergencyContactRelation: z.string().nullable().optional(),
      emergencyContactPhone: z.string().nullable().optional(),
      bankName: z.string().nullable().optional(),
      // 敏感欄位 — 明碼進來；若為空字串保留原值（避免誤覆蓋為空）
      nationalId: z.string().optional(),
      bankAccount: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "輸入格式有誤";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const data = parsed.data;

  // 檢查目標存在
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 重複檢查
  if (data.email && data.email !== existing.email) {
    const dup = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
    if (dup) return NextResponse.json({ error: "Email 已存在" }, { status: 409 });
  }

  const userPatch: Record<string, unknown> = {};
  if (data.name !== undefined) userPatch.name = data.name;
  if (data.email !== undefined) userPatch.email = data.email;
  if (data.password !== undefined) userPatch.passwordHash = await bcrypt.hash(data.password, 12);
  if (data.role !== undefined) userPatch.role = data.role;
  if (data.hireDate !== undefined) userPatch.hireDate = parseDateInput(data.hireDate);
  if (data.department !== undefined) userPatch.department = data.department;
  if (data.jobTitle !== undefined) userPatch.jobTitle = data.jobTitle;
  if (data.employmentType !== undefined) userPatch.employmentType = data.employmentType;
  if (data.managerId !== undefined) userPatch.managerId = data.managerId || null;
  if (data.active !== undefined) userPatch.active = data.active;

  const profilePatch: Record<string, unknown> = {};
  if (data.profile) {
    const p = data.profile;
    for (const key of [
      "chineseName",
      "englishName",
      "gender",
      "maritalStatus",
      "phone",
      "mobile",
      "registeredAddress",
      "mailingAddress",
      "emergencyContactName",
      "emergencyContactRelation",
      "emergencyContactPhone",
      "bankName",
    ] as const) {
      if (p[key] !== undefined) profilePatch[key] = p[key];
    }
    if (p.birthDate !== undefined) {
      profilePatch.birthDate = p.birthDate ? parseDateInput(p.birthDate) : null;
    }
    // 敏感欄位：只有當提供且非空字串時才更新
    if (p.nationalId !== undefined && p.nationalId !== "") {
      profilePatch.nationalIdEncrypted = encryptPII(p.nationalId);
    }
    if (p.bankAccount !== undefined && p.bankAccount !== "") {
      profilePatch.bankAccountEncrypted = encryptPII(p.bankAccount);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userPatch).length > 0) {
      await tx.user.update({ where: { id }, data: userPatch });
    }
    if (Object.keys(profilePatch).length > 0) {
      await tx.employeeProfile.upsert({
        where: { userId: id },
        update: profilePatch,
        create: { userId: id, ...profilePatch },
      });
    }
  });

  await logAudit(session!.userId!, "USER_UPDATED", "User", id, {
    fields: { user: Object.keys(userPatch), profile: Object.keys(profilePatch) },
  });

  return NextResponse.json({ ok: true });
}
