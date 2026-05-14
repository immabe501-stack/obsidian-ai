import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = { EMPLOYEE: "員工", MANAGER: "主管", ADMIN: "Admin" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { employeeNo: "asc" }],
    include: { manager: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">員工列表</h1>
        <Link
          href="/admin/users/new"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 新增員工
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-600">
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
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <Td>
                  <Link href={`/admin/users/${u.id}`} className="text-blue-600 hover:underline">
                    {u.employeeNo}
                  </Link>
                </Td>
                <Td>{u.name}</Td>
                <Td>{roleLabels[u.role] ?? u.role}</Td>
                <Td>{u.department ?? "—"}</Td>
                <Td>{u.jobTitle ?? "—"}</Td>
                <Td>{u.manager?.name ?? "—"}</Td>
                <Td>{format(u.hireDate, "yyyy-MM-dd")}</Td>
                <Td>
                  {u.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      在職
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      離職
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
