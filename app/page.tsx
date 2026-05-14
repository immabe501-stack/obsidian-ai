import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBalance } from "@/lib/balance";
import { LogoutButton } from "./logout-button";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }

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

  if (!user) {
    redirect("/login");
  }

  const balance = await getBalance(user.id);

  const recentRequests = await prisma.leaveRequest.findMany({
    where: { requesterId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">嗨，{user.name}</h1>
          <p className="text-sm text-slate-500">
            {user.department} · {user.jobTitle} · 員編 {user.employeeNo}
            {user.manager ? ` · 主管 ${user.manager.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            行事曆
          </Link>
          {(user.role === "MANAGER" || user.role === "ADMIN") && (
            <Link
              href="/approvals"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              待審
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              HR 後台
            </Link>
          )}
          <Link
            href="/profile"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            個人手冊
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">本年度特休</h2>
          {balance.year && (
            <span className="text-xs text-slate-500">
              週年度 {format(balance.year.start, "yyyy-MM-dd")} ~ {format(balance.year.end, "yyyy-MM-dd")}
            </span>
          )}
        </div>
        {balance.year ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="法定天數" value={balance.entitlement} />
            <Stat label="已核准使用" value={balance.used} />
            <Stat label="申請中" value={balance.pending} />
            <Stat label="尚可申請" value={balance.remaining} emphasis />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            到職 {format(user.hireDate, "yyyy-MM-dd")}，尚未滿 6 個月，目前無法定特休。
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近的申請</h2>
          {balance.year && (
            <Link
              href="/leave/new"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + 新增申請
            </Link>
          )}
        </div>
        {recentRequests.length === 0 ? (
          <p className="text-sm text-slate-500">沒有任何申請紀錄。</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentRequests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/leave/${r.id}`}
                  className="-mx-2 flex items-center justify-between rounded-md px-2 py-3 text-sm hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium">
                      {format(r.startDate, "yyyy-MM-dd")}
                      {r.startDate.getTime() !== r.endDate.getTime() && ` ~ ${format(r.endDate, "yyyy-MM-dd")}`}
                      <span className="ml-2 text-slate-500">（{r.days} 天）</span>
                    </div>
                    <div className="text-slate-500">{r.reason}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={emphasis ? "text-3xl font-bold text-blue-600" : "text-3xl font-semibold"}>
        {value}
        <span className="ml-1 text-sm font-normal text-slate-400">天</span>
      </div>
    </div>
  );
}
