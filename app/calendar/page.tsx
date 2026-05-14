import { redirect } from "next/navigation";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { LeaveStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/glass-card";
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
  const today = new Date();

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

      <GlassCard variant="strong" className="overflow-hidden p-2 animate-fade-in">
        <div className="flex items-center justify-between p-4">
          <Link href={`/calendar?month=${prev}`} className="btn-ghost">
            <ChevronLeft className="h-4 w-4" />
            上個月
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {format(cursor, "yyyy 年 MM 月")}
          </h2>
          <Link href={`/calendar?month=${next}`} className="btn-ghost">
            下個月
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-7 px-2 pb-1 pt-1 text-xs">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <div key={d} className="px-2 py-2 text-center font-medium text-slate-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 px-2 pb-2">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            const inMonth = isSameMonth(d, cursor);
            const isToday = isSameDay(d, today);
            return (
              <div
                key={key}
                className={`min-h-[96px] rounded-2xl p-2 text-xs transition-colors ${
                  inMonth ? "bg-white/40 hover:bg-white/60" : "bg-white/10 text-slate-400"
                } ${isToday ? "ring-2 ring-ios-blue/60" : ""}`}
              >
                <div className={`mb-1.5 flex items-center justify-between ${isToday ? "font-bold text-ios-blue" : ""}`}>
                  <span>{format(d, "d")}</span>
                  {items.length > 0 && (
                    <span className="rounded-full bg-white/70 px-1.5 text-[10px] text-slate-600 backdrop-blur">
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((it, i) => (
                    <div
                      key={i}
                      className={`truncate rounded-lg px-1.5 py-0.5 text-[11px] ${
                        it.status === "APPROVED"
                          ? "bg-emerald-100/80 text-emerald-800"
                          : "bg-amber-100/80 text-amber-800"
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
      </GlassCard>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> 已核准
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> 申請中
        </span>
      </div>
    </main>
  );
}
