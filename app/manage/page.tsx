import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, CalendarPlus, ClipboardList, UserPlus, Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/glass-card";
import { Avatar } from "@/components/avatar";

export const dynamic = "force-dynamic";

export default async function ManageHome() {
  const session = await getSession();

  const subordinates = await prisma.user.findMany({
    where: session.role === "ADMIN" ? {} : { managerId: session.userId },
    orderBy: { employeeNo: "asc" },
    select: {
      id: true,
      employeeNo: true,
      name: true,
      department: true,
      jobTitle: true,
      hireDate: true,
      active: true,
    },
  });

  const pendingCount = await prisma.leaveRequest.count({
    where: {
      status: "PENDING",
      requester: session.role === "ADMIN" ? {} : { managerId: session.userId },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">管理工具</h1>
      <p className="mb-8 text-sm text-slate-500">
        {session.role === "ADMIN"
          ? "HR 模式 — 你可管理所有員工"
          : "主管模式 — 你可管理直屬員工"}
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActionCard
          href="/manage/users/new"
          icon={<UserPlus className="h-5 w-5" />}
          title="新增員工"
          desc="建立新員工帳號（直接指派為你的屬下）"
          tone="blue"
        />
        <ActionCard
          href="/manage/backfill"
          icon={<CalendarPlus className="h-5 w-5" />}
          title="補登請假"
          desc="將員工已經休過的特休登入系統"
          tone="purple"
        />
        <ActionCard
          href="/approvals"
          icon={<ClipboardList className="h-5 w-5" />}
          title="待審申請"
          desc={`${pendingCount} 筆等待核准`}
          tone={pendingCount > 0 ? "amber" : "green"}
        />
      </div>

      <GlassCard variant="strong" className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold">直屬員工（{subordinates.length} 人）</h2>
        </div>
        {subordinates.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">目前沒有屬下，可使用上方「新增員工」建立。</p>
        ) : (
          <ul className="space-y-2">
            {subordinates.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/manage/backfill?userId=${u.id}`}
                  className="glass-subtle glass-hoverable flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {u.name}
                        <span className="ml-2 text-xs font-normal text-slate-500">{u.employeeNo}</span>
                        {!u.active && (
                          <span className="ml-2 rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            已停用
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {u.department ?? "—"} · {u.jobTitle ?? "—"} · 到職 {format(u.hireDate, "yyyy-MM-dd")}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    補登請假 <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}

const tones = {
  blue: "bg-ios-blue/15 text-ios-blue",
  purple: "bg-ios-purple/15 text-ios-purple",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
};

function ActionCard({
  href,
  icon,
  title,
  desc,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: keyof typeof tones;
}) {
  return (
    <Link href={href}>
      <GlassCard variant="strong" hoverable className="p-5">
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {icon}
        </div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{desc}</div>
      </GlassCard>
    </Link>
  );
}
