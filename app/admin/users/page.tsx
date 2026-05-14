import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/glass-card";
import { Avatar } from "@/components/avatar";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = { EMPLOYEE: "員工", MANAGER: "主管", ADMIN: "Admin" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { employeeNo: "asc" },
    include: { manager: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">員工列表</h1>
          <p className="mt-1 text-sm text-slate-500">共 {users.length} 位</p>
        </div>
        <Link href="/admin/users/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          新增員工
        </Link>
      </div>
      <GlassCard variant="strong" className="overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <Th>員編</Th>
                <Th>姓名</Th>
                <Th>角色</Th>
                <Th>部門</Th>
                <Th>職稱</Th>
                <Th>主管</Th>
                <Th>到職日</Th>
                <Th>狀態</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/40">
                  <Td>
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-ios-blue hover:underline">
                      {u.employeeNo}
                    </Link>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={u.name} size="sm" />
                      {u.name}
                    </span>
                  </Td>
                  <Td>{roleLabels[u.role] ?? u.role}</Td>
                  <Td>{u.department ?? "—"}</Td>
                  <Td>{u.jobTitle ?? "—"}</Td>
                  <Td>{u.manager?.name ?? "—"}</Td>
                  <Td>{format(u.hireDate, "yyyy-MM-dd")}</Td>
                  <Td>
                    {u.active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 在職
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> 離職
                      </span>
                    )}
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3.5">{children}</td>;
}
