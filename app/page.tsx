import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ClipboardList, Plus, Settings, User as UserIcon } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBalance } from "@/lib/balance";
import {
  getUpcomingAnniversaries,
  getUpcomingBirthdays,
  getUpcomingLeaves,
  yearProgress,
} from "@/lib/widgets";
import { LogoutButton } from "./logout-button";
import { GlassCard } from "@/components/glass-card";
import { StatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/avatar";
import { YearProgress } from "@/components/year-progress";
import {
  AnniversaryWidget,
  BirthdayWidget,
  UpcomingLeavesWidget,
} from "@/components/home-widgets";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      employeeNo: true,
      role: true,
      department: true,
      jobTitle: true,
      hireDate: true,
      manager: { select: { name: true } },
    },
  });
  if (!user) redirect("/login");

  const [balance, recentRequests, birthdays, anniversaries, upcomingLeaves] = await Promise.all([
    getBalance(user.id),
    prisma.leaveRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getUpcomingBirthdays(14),
    getUpcomingAnniversaries(14),
    getUpcomingLeaves(7),
  ]);

  const progress = balance.year ? yearProgress(balance.year.start, balance.year.end) : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="text-sm text-slate-500">嗨，歡迎回來</p>
            <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-slate-900">{user.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {user.department} · {user.jobTitle} · 員編 {user.employeeNo}
              {user.manager ? ` · 主管 ${user.manager.name}` : ""}
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <NavLink href="/calendar" icon={<Calendar className="h-4 w-4" />}>
            行事曆
          </NavLink>
          {(user.role === "MANAGER" || user.role === "ADMIN") && (
            <NavLink href="/approvals" icon={<ClipboardList className="h-4 w-4" />}>
              待審
            </NavLink>
          )}
          {user.role === "ADMIN" && (
            <NavLink href="/admin" icon={<Settings className="h-4 w-4" />}>
              HR 後台
            </NavLink>
          )}
          <NavLink href="/profile" icon={<UserIcon className="h-4 w-4" />}>
            個人手冊
          </NavLink>
          <ThemeToggle />
          <LogoutButton />
        </nav>
      </header>

      <GlassCard variant="strong" className="mb-6 p-7">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">本年度特休</h2>
          {balance.year && (
            <span className="text-xs text-slate-500">
              週年度 {format(balance.year.start, "yyyy-MM-dd")} ~ {format(balance.year.end, "yyyy-MM-dd")}
            </span>
          )}
        </div>
        {balance.year ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="法定天數" value={balance.entitlement} />
              <Stat label="已核准使用" value={balance.used} />
              <Stat label="申請中" value={balance.pending} />
              <Stat label="尚可申請" value={balance.remaining} emphasis />
            </div>
            <div className="mt-6">
              <YearProgress progress={progress} />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            到職 {format(user.hireDate, "yyyy-MM-dd")}，尚未滿 6 個月，目前無法定特休。
          </p>
        )}
      </GlassCard>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <UpcomingLeavesWidget items={upcomingLeaves} />
        <BirthdayWidget items={birthdays} />
        <AnniversaryWidget items={anniversaries} />
      </div>

      <GlassCard variant="strong" className="p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">最近的申請</h2>
          {balance.year && (
            <Link href="/leave/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              新增申請
            </Link>
          )}
        </div>
        {recentRequests.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">還沒有任何申請紀錄。</div>
        ) : (
          <ul className="space-y-2">
            {recentRequests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/leave/${r.id}`}
                  className="glass-subtle glass-hoverable flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {format(r.startDate, "yyyy-MM-dd")}
                      {r.startDate.getTime() !== r.endDate.getTime() &&
                        ` ~ ${format(r.endDate, "yyyy-MM-dd")}`}
                      <span className="ml-2 font-normal text-slate-500">（{r.days} 天）</span>
                    </div>
                    <div className="mt-0.5 text-slate-500">{r.reason}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="btn-ghost">
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className={
          emphasis
            ? "mt-1 text-4xl font-bold text-gradient animate-soft-pulse"
            : "mt-1 text-4xl font-semibold text-slate-900"
        }
      >
        {value}
        <span className="ml-1 text-sm font-normal text-slate-400">天</span>
      </div>
    </div>
  );
}
