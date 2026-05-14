import { NextResponse } from "next/server";
import { z } from "zod";
import { Gender, MaritalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { maskPII, decryptPII } from "@/lib/crypto";
import { logAudit } from "@/lib/leave-actions";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
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
      manager: { select: { name: true, email: true } },
      profile: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 員工檢視自己的敏感欄位 → 解密後遮罩
  const profile = user.profile;
  const masked = profile
    ? {
        ...profile,
        nationalIdMasked: maskPII(decryptPII(profile.nationalIdEncrypted)),
        bankAccountMasked: maskPII(decryptPII(profile.bankAccountEncrypted)),
        // 不回傳密文
        nationalIdEncrypted: undefined,
        bankAccountEncrypted: undefined,
      }
    : null;

  return NextResponse.json({ ...user, profile: masked });
}

const editableSchema = z.object({
  phone: z.string().max(50).optional().nullable(),
  mobile: z.string().max(50).optional().nullable(),
  registeredAddress: z.string().max(200).optional().nullable(),
  mailingAddress: z.string().max(200).optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactRelation: z.string().max(50).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = editableSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "輸入格式有誤" }, { status: 400 });
  }

  // 將空字串轉為 null
  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v]),
  );

  await prisma.employeeProfile.upsert({
    where: { userId: session.userId },
    update: data,
    create: { userId: session.userId, ...data },
  });

  await logAudit(session.userId, "PROFILE_SELF_UPDATED", "EmployeeProfile", session.userId, {
    fields: Object.keys(data),
  });

  return NextResponse.json({ ok: true });
}
