import Link from "next/link";
import { addMonths, format, startOfMonth } from "date-fns";
import { ArrowUpRight, ClipboardList, Users, Wallet } from "lucide-react";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAnniversaryYear } from "@/lib/leave";
import { GlassCard } from "@/components/glass-card";
import { DeptPieChart, MonthlyApprovedChart } from "@/components/admin-charts";

export const dynamic = "force-dynamic";

async function getMonthlyApproved(): Promise<{ month: string; days: number }[]> {
  const now = new Date();
  const months: { start: Date; end: Date; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(addMonths(now, -i));
    const end = startOfMonth(addMonths(start, 1));
    months.push({ start, end, label: format(start, "yyyy-MM") });
  }

  const results = await Promise.all(
    months.map(async (m) => {
      const agg = await prisma.leaveRequest.aggregate({
        where: { status: LeaveStatus.APPROVED, startDate: { gte: m.start, lt: m.end } },
        _sum: { days: true },
      });
      return { month: m.label.slice(5), days: agg._sum.days ?? 0 };
    }),
  );
  return results;
}

async function getDeptBreakdown(): Promise<{ department: string; days: number }[]> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const requests = await prisma.leaveRequest.findMany({
    where: { status: LeaveStatus.APPROVED, startDate: { gte: yearStart } },
    include: { requester: { select: { department: true } } },
  });
  const map = new Map<string, number>();
  for (const r of requests) {
    const dept = r.requester.department ?? "未分配";
    map.set(dept, (map.get(dept) ?? 0) + r.days);
  }
  return Array.from(map.entries())
    .map(([department, days]) => ({ department, days }))
    .sort((a, b) => b.days - a.days);
}

export default async function AdminHome() {
  const [userCount, pendingCount, allUsers, payoutCount, monthly, dept] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
    prisma.user.findMany({ select: { id: true, hireDate: true } }),
    prisma.leavePayout.count(),
    getMonthlyApproved(),
    getDeptBreakdown(),
  ]);

  const today = new Date();
  let pendingPayout = 0;
  for (const u of allUsers) {
    const cur = getCurrentAnniversaryYear(u.hireDate, today);
    if (!cur || cur.yearIndex < 1) continue;
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
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">總覽</h1>
      <p className="mb-8 text-sm text-slate-500">公司目前的員工與請假狀況</p>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card href="/admin/users" label="在職員工" value={userCount} icon={<Users className="h-5 w-5" />} tone="blue" />
        <Card href="/approvals" label="待審申請" value={pendingCount} icon={<ClipboardList className="h-5 w-5" />} tone={pendingCount > 0 ? "amber" : "blue"} />
        <Card href="/admin/payouts" label="待結算折發" value={pendingPayout} icon={<Wallet className="h-5 w-5" />} tone={pendingPayout > 0 ? "amber" : "blue"} />
        <Card href="/admin/payouts" label="已結算折發" value={payoutCount} icon={<Wallet className="h-5 w-5" />} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard variant="strong" className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">近 6 個月已核准請假天數</h2>
          <p className="mb-4 text-xs text-slate-500">依「起始日」歸月份</p>
          <MonthlyApprovedChart data={monthly} />
        </GlassCard>
        <GlassCard variant="strong" className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">本年度部門請假分佈</h2>
          <p className="mb-4 text-xs text-slate-500">{format(new Date(), "yyyy")} 年已核准</p>
          <DeptPieChart data={dept} />
        </GlassCard>
      </div>
    </main>
  );
}

const tones = {
  blue: { icon: "bg-ios-blue/15 text-ios-blue", value: "text-slate-900" },
  amber: { icon: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400", value: "text-amber-600 dark:text-amber-400" },
  green: { icon: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", value: "text-slate-900" },
};

function Card({
  href,
  label,
  value,
  icon,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: keyof typeof tones;
}) {
  const t = tones[tone];
  return (
    <Link href={href} className="group">
      <GlassCard variant="strong" hoverable className="p-5">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${t.icon}`}>{icon}</div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <div className="mt-4 text-sm text-slate-500">{label}</div>
        <div className={`mt-1 text-4xl font-bold tracking-tight ${t.value}`}>{value}</div>
      </GlassCard>
    </Link>
  );
}
