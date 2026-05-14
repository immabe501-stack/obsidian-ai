import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <Link href="/admin" className="text-sm font-semibold">
            HR 後台
          </Link>
          <nav className="flex gap-1 text-sm">
            <NavLink href="/admin/users">員工</NavLink>
            <NavLink href="/admin/balances">餘額調整</NavLink>
            <NavLink href="/admin/payouts">折發結算</NavLink>
            <NavLink href="/admin/export">匯出</NavLink>
          </nav>
          <div className="flex-1" />
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← 返回主站
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      {children}
    </Link>
  );
}
