import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { findPendingPayouts } from "@/lib/payout";
import { GlassCard } from "@/components/glass-card";
import { ProcessForm } from "./process-form";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const [pending, history] = await Promise.all([
    findPendingPayouts(),
    prisma.leavePayout.findMany({
      include: { user: { select: { name: true, employeeNo: true } } },
      orderBy: { processedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <section>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">待結算折發</h1>
        <p className="mb-6 text-sm text-slate-500">員工週年日已過，但仍有未休完的特休</p>

        {pending.length === 0 ? (
          <GlassCard variant="strong" className="flex flex-col items-center px-6 py-14 text-center animate-fade-in">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600">目前沒有待結算的員工。</p>
          </GlassCard>
        ) : (
          <GlassCard variant="strong" className="overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <Th>員編</Th>
                    <Th>姓名</Th>
                    <Th>部門</Th>
                    <Th>週年度</Th>
                    <Th align="right">未休完</Th>
                    <Th>結算</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {pending.map((p) => (
                    <tr
                      key={`${p.userId}-${p.anniversaryYearStart.toISOString()}`}
                      className="transition-colors hover:bg-white/40"
                    >
                      <Td>{p.employeeNo}</Td>
                      <Td className="font-medium">{p.name}</Td>
                      <Td>{p.department ?? "—"}</Td>
                      <Td className="text-xs">
                        {format(p.anniversaryYearStart, "yyyy-MM-dd")} ~{" "}
                        {format(p.anniversaryYearEnd, "yyyy-MM-dd")}
                      </Td>
                      <Td align="right" className="font-bold text-amber-600">
                        {p.unusedDays} 天
                      </Td>
                      <Td>
                        <ProcessForm
                          userId={p.userId}
                          userName={p.name}
                          anniversaryYearStart={p.anniversaryYearStart.toISOString()}
                          unusedDays={p.unusedDays}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">已結算紀錄</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">尚無紀錄。</p>
        ) : (
          <GlassCard variant="strong" className="overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <Th>結算日</Th>
                    <Th>員工</Th>
                    <Th>週年度</Th>
                    <Th align="right">天數</Th>
                    <Th align="right">折發金額</Th>
                    <Th>備註</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {history.map((h) => (
                    <tr key={h.id} className="transition-colors hover:bg-white/40">
                      <Td>{format(h.processedAt, "yyyy-MM-dd")}</Td>
                      <Td>
                        {h.user.name}
                        <span className="ml-1 text-xs text-slate-500">（{h.user.employeeNo}）</span>
                      </Td>
                      <Td className="text-xs">{format(h.anniversaryYearStart, "yyyy-MM-dd")}</Td>
                      <Td align="right">{h.unusedDays}</Td>
                      <Td align="right" className="font-mono">
                        {h.payoutAmount != null ? `NT$ ${h.payoutAmount.toLocaleString()}` : "—"}
                      </Td>
                      <Td>{h.note ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </section>
    </main>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return <th className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""}`}>{children}</th>;
}
function Td({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <td className={`px-4 py-3.5 ${align === "right" ? "text-right" : ""} ${className ?? ""}`}>{children}</td>
  );
}
