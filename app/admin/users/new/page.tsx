import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { NewUserForm } from "./new-user-form";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const managers = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "ADMIN"] }, active: true },
    select: { id: true, name: true, employeeNo: true },
    orderBy: { employeeNo: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader title="新增員工" back={{ href: "/admin/users", label: "回員工列表" }} />
      <NewUserForm managers={managers} />
    </main>
  );
}
