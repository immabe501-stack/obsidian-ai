import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { decryptPII } from "@/lib/crypto";
import { getBalance } from "@/lib/balance";
import { logAudit } from "@/lib/leave-actions";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { EditUserForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [user, managers, balance] = await Promise.all([
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
  ]);
  if (!user) notFound();

  // 解密敏感欄位（admin 已 admin guard，紀錄 PII 檢視）
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
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm font-semibold">本年度特休</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <Stat label="法定" value={balance.entitlement} />
            <Stat label="已用" value={balance.used} />
            <Stat label="申請中" value={balance.pending} />
            <Stat label="剩餘" value={balance.remaining} highlight />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            週年度 {format(balance.year.start, "yyyy-MM-dd")} ~ {format(balance.year.end, "yyyy-MM-dd")}
          </p>
        </div>
      )}

      <EditUserForm
        managers={managers}
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
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${highlight ? "text-blue-600" : ""}`}>
        {value}
        <span className="ml-1 text-xs font-normal text-slate-400">天</span>
      </div>
    </div>
  );
}
