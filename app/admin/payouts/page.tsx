import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { findPendingPayouts } from "@/lib/payout";
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
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold">待結算折發</h1>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            目前沒有待結算的員工。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <Th>員編</Th>
                  <Th>姓名</Th>
                  <Th>部門</Th>
                  <Th>週年度</Th>
                  <Th align="right">未休完天數</Th>
                  <Th>結算</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((p) => (
                  <tr key={`${p.userId}-${p.anniversaryYearStart.toISOString()}`}>
                    <Td>{p.employeeNo}</Td>
                    <Td>{p.name}</Td>
                    <Td>{p.department ?? "—"}</Td>
                    <Td>
                      {format(p.anniversaryYearStart, "yyyy-MM-dd")} ~{" "}
                      {format(p.anniversaryYearEnd, "yyyy-MM-dd")}
                    </Td>
                    <Td align="right" className="font-semibold text-orange-600">
                      {p.unusedDays}
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
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">已結算紀錄</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">尚無紀錄。</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <Th>結算日</Th>
                  <Th>員工</Th>
                  <Th>週年度</Th>
                  <Th align="right">天數</Th>
                  <Th align="right">折發金額</Th>
                  <Th>備註</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id}>
                    <Td>{format(h.processedAt, "yyyy-MM-dd")}</Td>
                    <Td>
                      {h.user.name}（{h.user.employeeNo}）
                    </Td>
                    <Td>{format(h.anniversaryYearStart, "yyyy-MM-dd")}</Td>
                    <Td align="right">{h.unusedDays}</Td>
                    <Td align="right">{h.payoutAmount != null ? `NT$ ${h.payoutAmount.toLocaleString()}` : "—"}</Td>
                    <Td>{h.note ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return <th className={`px-4 py-2 font-medium ${align === "right" ? "text-right" : ""}`}>{children}</th>;
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
    <td className={`px-4 py-3 ${align === "right" ? "text-right" : ""} ${className ?? ""}`}>{children}</td>
  );
}
