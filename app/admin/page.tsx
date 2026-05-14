import Link from "next/link";
import { ArrowUpRight, ClipboardList, Users, Wallet } from "lucide-react";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAnniversaryYear } from "@/lib/leave";
import { GlassCard } from "@/components/glass-card";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [userCount, pendingCount, allUsers, payoutCount] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
    prisma.user.findMany({ select: { id: true, hireDate: true } }),
    prisma.leavePayout.count(),
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card
          href="/admin/users"
          label="在職員工"
          value={userCount}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
        />
        <Card
          href="/approvals"
          label="待審申請"
          value={pendingCount}
          icon={<ClipboardList className="h-5 w-5" />}
          tone={pendingCount > 0 ? "amber" : "blue"}
        />
        <Card
          href="/admin/payouts"
          label="待結算折發"
          value={pendingPayout}
          icon={<Wallet className="h-5 w-5" />}
          tone={pendingPayout > 0 ? "amber" : "blue"}
        />
        <Card
          href="/admin/payouts"
          label="已結算折發"
          value={payoutCount}
          icon={<Wallet className="h-5 w-5" />}
          tone="green"
        />
      </div>
    </main>
  );
}

const tones = {
  blue: { ring: "ring-ios-blue/30", icon: "bg-ios-blue/15 text-ios-blue", value: "text-slate-900" },
  amber: { ring: "ring-amber-300/40", icon: "bg-amber-100 text-amber-600", value: "text-amber-600" },
  green: { ring: "ring-emerald-300/40", icon: "bg-emerald-100 text-emerald-600", value: "text-slate-900" },
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
      <GlassCard variant="strong" hoverable className="p-5 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${t.icon}`}>
            {icon}
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <div className="mt-4 text-sm text-slate-500">{label}</div>
        <div className={`mt-1 text-4xl font-bold tracking-tight ${t.value}`}>{value}</div>
      </GlassCard>
    </Link>
  );
}
