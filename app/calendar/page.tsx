import { redirect } from "next/navigation";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { LeaveStatus } from "@prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

function parseMonth(s: string | undefined): Date {
  if (s && /^\d{4}-\d{2}$/.test(s)) {
    return new Date(`${s}-01T00:00:00.000Z`);
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const { month } = await searchParams;
  const cursor = parseMonth(month);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const requests = await prisma.leaveRequest.findMany({
    where: {
      status: { in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
      AND: [{ startDate: { lte: gridEnd } }, { endDate: { gte: gridStart } }],
    },
    include: {
      requester: { select: { id: true, name: true, department: true } },
    },
  });

  const byDay = new Map<
    string,
    { name: string; dept: string | null; status: LeaveStatus; isHalfDay: boolean }[]
  >();
  for (const r of requests) {
    eachDayOfInterval({ start: r.startDate, end: r.endDate }).forEach((d) => {
      if (!isWithinInterval(d, { start: gridStart, end: gridEnd })) return;
      const key = format(d, "yyyy-MM-dd");
      const arr = byDay.get(key) ?? [];
      arr.push({
        name: r.requester.name,
        dept: r.requester.department,
        status: r.status,
        isHalfDay: r.isHalfDay,
      });
      byDay.set(key, arr);
    });
  }

  const prev = format(subMonths(cursor, 1), "yyyy-MM");
  const next = format(addMonths(cursor, 1), "yyyy-MM");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        title="團隊請假行事曆"
        subtitle="顯示已核准與申請中的請假"
        back={{ href: "/", label: "回首頁" }}
      />

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/calendar?month=${prev}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          ← 上個月
        </Link>
        <h2 className="text-lg font-semibold">{format(cursor, "yyyy 年 MM 月")}</h2>
        <Link
          href={`/calendar?month=${next}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          下個月 →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <div key={d} className="px-2 py-2 text-center font-medium text-slate-600">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            const inMonth = isSameMonth(d, cursor);
            return (
              <div
                key={key}
                className={`min-h-[92px] border-b border-r border-slate-100 p-1.5 text-xs ${
                  inMonth ? "bg-white" : "bg-slate-50 text-slate-400"
                }`}
              >
                <div className="mb-1 font-medium">{format(d, "d")}</div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((it, i) => (
                    <div
                      key={i}
                      className={`truncate rounded px-1.5 py-0.5 text-[11px] ${
                        it.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                      title={`${it.name}${it.dept ? ` · ${it.dept}` : ""}${
                        it.status === "PENDING" ? "（待審）" : ""
                      }`}
                    >
                      {it.name}
                      {it.isHalfDay && "½"}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px] text-slate-500">+{items.length - 3} 更多</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        <span className="mr-2 inline-block rounded bg-green-100 px-1.5 py-0.5 text-green-800">已核准</span>
        <span className="inline-block rounded bg-yellow-100 px-1.5 py-0.5 text-yellow-800">申請中</span>
      </p>
    </main>
  );
}
