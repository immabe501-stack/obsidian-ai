import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { decryptPII } from "@/lib/crypto";
import { getBalance } from "@/lib/balance";
import { logAudit } from "@/lib/leave-actions";
import { getSession } from "@/lib/session";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { EditUserForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [user, managers, balance, periods] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { profile: true, manager: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where: { role: { in: ["MANAGER", "ADMIN"] }, active: true, NOT: { id } },
      select: { id: true, name: true, employeeNo: true },
      orderBy: { employeeNo: "asc" },
    }),
    getBalance(id).catch(() => null),
    prisma.employmentPeriod.findMany({
      where: { userId: id },
      orderBy: { startDate: "asc" },
    }),
  ]);
  if (!user) notFound();

  if (session.userId) {
    await logAudit(session.userId, "PII_VIEWED", "User", id);
  }
  const nationalId = decryptPII(user.profile?.nationalIdEncrypted) ?? "";
  const bankAccount = decryptPII(user.profile?.bankAccountEncrypted) ?? "";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        title={`${user.name}（${user.employeeNo}）`}
        subtitle="可編輯所有欄位（含敏感資料）"
        back={{ href: "/admin/users", label: "回員工列表" }}
      />

      {balance && balance.year && (
        <GlassCard variant="strong" className="mb-6 p-6 animate-fade-in">
          <div className="mb-3 text-sm font-semibold text-slate-900">本年度特休</div>
          <div className="grid grid-cols-4 gap-4">
            <Stat label="法定" value={balance.entitlement} />
            <Stat label="已用" value={balance.used} />
            <Stat label="申請中" value={balance.pending} />
            <Stat label="剩餘" value={balance.remaining} highlight />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            週年度 {format(balance.year.start, "yyyy-MM-dd")} ~ {format(balance.year.end, "yyyy-MM-dd")}
          </p>
        </GlassCard>
      )}

      <EditUserForm
        managers={managers}
        periods={periods.map((p) => ({
          type: p.type,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate?.toISOString() ?? null,
          countsTowardSeniority: p.countsTowardSeniority,
          note: p.note,
        }))}
        user={{
          id: user.id,
          employeeNo: user.employeeNo,
          email: user.email,
          name: user.name,
          role: user.role,
          hireDate: format(user.hireDate, "yyyy-MM-dd"),
          department: user.department ?? "",
          jobTitle: user.jobTitle ?? "",
          employmentType: user.employmentType,
          managerId: user.manager?.id ?? "",
          active: user.active,
        }}
        profile={{
          chineseName: user.profile?.chineseName ?? "",
          englishName: user.profile?.englishName ?? "",
          birthDate: user.profile?.birthDate ? format(user.profile.birthDate, "yyyy-MM-dd") : "",
          gender: user.profile?.gender ?? "",
          maritalStatus: user.profile?.maritalStatus ?? "",
          phone: user.profile?.phone ?? "",
          mobile: user.profile?.mobile ?? "",
          registeredAddress: user.profile?.registeredAddress ?? "",
          mailingAddress: user.profile?.mailingAddress ?? "",
          emergencyContactName: user.profile?.emergencyContactName ?? "",
          emergencyContactRelation: user.profile?.emergencyContactRelation ?? "",
          emergencyContactPhone: user.profile?.emergencyContactPhone ?? "",
          bankName: user.profile?.bankName ?? "",
          nationalId,
          bankAccount,
        }}
      />
    </main>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold tracking-tight ${highlight ? "text-gradient" : "text-slate-900"}`}>
        {value}
        <span className="ml-1 text-xs font-normal text-slate-400">天</span>
      </div>
    </div>
  );
}
