import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getBalance } from "@/lib/balance";
import { GlassCard } from "@/components/glass-card";
import { Avatar } from "@/components/avatar";
import { AdjustForm } from "./adjust-form";

export const dynamic = "force-dynamic";

export default async function AdminBalancesPage() {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { employeeNo: "asc" },
    select: { id: true, employeeNo: true, name: true, department: true, hireDate: true },
  });

  const rows = await Promise.all(
    users.map(async (u) => ({
      ...u,
      balance: await getBalance(u.id),
    })),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">餘額調整</h1>
      <p className="mb-6 text-sm text-slate-500">每位員工本年度的特休狀況；可加減天數（會記錄稽核）</p>

      <GlassCard variant="strong" className="overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <Th>員編</Th>
                <Th>姓名</Th>
                <Th>到職日</Th>
                <Th>本年度週期</Th>
                <Th align="right">法定</Th>
                <Th align="right">調整</Th>
                <Th align="right">已用</Th>
                <Th align="right">申請中</Th>
                <Th align="right">剩餘</Th>
                <Th>動作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {rows.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/40">
                  <Td>{u.employeeNo}</Td>
                  <Td className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={u.name} size="sm" />
                      {u.name}
                    </span>
                  </Td>
                  <Td>{format(u.hireDate, "yyyy-MM-dd")}</Td>
                  <Td>
                    {u.balance.year ? (
                      <span className="text-xs">
                        {format(u.balance.year.start, "yyyy-MM-dd")}<br />
                        {format(u.balance.year.end, "yyyy-MM-dd")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td align="right">{u.balance.entitlement}</Td>
                  <Td align="right">{u.balance.adjustments || "—"}</Td>
                  <Td align="right">{u.balance.used}</Td>
                  <Td align="right">{u.balance.pending}</Td>
                  <Td align="right" className="font-bold text-gradient">
                    {u.balance.remaining}
                  </Td>
                  <Td>
                    {u.balance.year && <AdjustForm userId={u.id} userName={u.name} />}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
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
