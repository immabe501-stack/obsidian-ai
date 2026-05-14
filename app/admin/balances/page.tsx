import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getBalance } from "@/lib/balance";
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
      <h1 className="mb-6 text-2xl font-bold">餘額調整</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-600">
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
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr key={u.id}>
                <Td>{u.employeeNo}</Td>
                <Td>{u.name}</Td>
                <Td>{format(u.hireDate, "yyyy-MM-dd")}</Td>
                <Td>
                  {u.balance.year
                    ? `${format(u.balance.year.start, "yyyy-MM-dd")} ~ ${format(u.balance.year.end, "yyyy-MM-dd")}`
                    : "—"}
                </Td>
                <Td align="right">{u.balance.entitlement}</Td>
                <Td align="right">{u.balance.adjustments || "—"}</Td>
                <Td align="right">{u.balance.used}</Td>
                <Td align="right">{u.balance.pending}</Td>
                <Td align="right" className="font-semibold text-blue-600">
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
      <p className="mt-3 text-xs text-slate-500">
        調整為加減該員工本年度的特休天數（可正可負）。所有調整都會記錄稽核。
      </p>
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
