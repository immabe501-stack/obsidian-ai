import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { BackfillForm } from "./backfill-form";

export const dynamic = "force-dynamic";

export default async function BackfillPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "MANAGER" && session.role !== "ADMIN") redirect("/");

  const subordinates = await prisma.user.findMany({
    where: session.role === "ADMIN"
      ? { active: true }
      : { active: true, managerId: session.userId },
    orderBy: { employeeNo: "asc" },
    select: { id: true, employeeNo: true, name: true, department: true, hireDate: true },
  });

  const sp = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="補登請假"
        subtitle="把員工已經休過、但尚未進系統的特休登入。這筆紀錄會直接記為「已核准」、扣除年度餘額。"
        back={{ href: "/manage", label: "回管理工具" }}
      />
      <GlassCard variant="strong" className="p-6">
        {subordinates.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">沒有可補登的員工。</p>
        ) : (
          <BackfillForm subordinates={subordinates} initialUserId={sp.userId} />
        )}
      </GlassCard>
    </main>
  );
}
