import Link from "next/link";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAnniversaryYear } from "@/lib/leave";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [userCount, pendingCount, allUsers, payoutCount] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
    prisma.user.findMany({ select: { id: true, hireDate: true } }),
    prisma.leavePayout.count(),
  ]);

  // 計算「待結算」人數：上一週年度已結束（今天已經跨過下個週年日）
  // 但無對應 LeavePayout 紀錄者
  const today = new Date();
  let pendingPayout = 0;
  for (const u of allUsers) {
    const cur = getCurrentAnniversaryYear(u.hireDate, today);
    if (!cur || cur.yearIndex < 1) continue;
    // 上一個週年度 start
    const prevStart = new Date(cur.start);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const has = await prisma.leavePayout.findFirst({
      where: { userId: u.id, anniversaryYearStart: prevStart },
      select: { id: true },
    });
    if (!has) pendingPayout += 1;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">HR 後台</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card href="/admin/users" label="在職員工" value={userCount} />
        <Card href="/approvals" label="待審申請" value={pendingCount} accent="warn" />
        <Card href="/admin/payouts" label="待結算折發" value={pendingPayout} accent={pendingPayout > 0 ? "warn" : undefined} />
        <Card href="/admin/payouts" label="已結算折發" value={payoutCount} />
      </div>
    </main>
  );
}

function Card({
  href,
  label,
  value,
  accent,
}: {
  href: string;
  label: string;
  value: number;
  accent?: "warn";
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50"
    >
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accent === "warn" ? "text-orange-600" : ""}`}>
        {value}
      </div>
    </Link>
  );
}
