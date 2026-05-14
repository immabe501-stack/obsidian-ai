import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { NewSubordinateForm } from "./new-subordinate-form";

export const dynamic = "force-dynamic";

export default async function NewSubordinatePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "MANAGER" && session.role !== "ADMIN") redirect("/");

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, employeeNo: true, department: true },
  });
  if (!me) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="新增員工"
        subtitle={`建立新員工帳號 · 自動指派 ${me.name} 為直屬主管`}
        back={{ href: "/manage", label: "回管理工具" }}
      />
      <GlassCard variant="strong" className="p-6">
        <NewSubordinateForm
          manager={{ id: me.id, name: me.name, employeeNo: me.employeeNo, department: me.department }}
          isAdmin={session.role === "ADMIN"}
        />
      </GlassCard>
    </main>
  );
}
