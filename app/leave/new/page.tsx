import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getBalance } from "@/lib/balance";
import { PageHeader } from "@/components/page-header";
import { LeaveForm } from "./leave-form";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function NewLeavePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const balance = await getBalance(session.userId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <PageHeader
        title="新增特休申請"
        subtitle={
          balance.year
            ? `本年度尚可申請 ${balance.remaining} 天（週年度 ${format(balance.year.start, "yyyy-MM-dd")} ~ ${format(balance.year.end, "yyyy-MM-dd")}）`
            : "目前無可用特休"
        }
        back={{ href: "/", label: "回首頁" }}
      />
      {balance.year ? (
        <LeaveForm remaining={balance.remaining} />
      ) : (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
          您目前尚未滿 6 個月，無法定特休可申請。
        </div>
      )}
    </main>
  );
}
