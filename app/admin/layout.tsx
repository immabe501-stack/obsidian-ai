import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calculator, Download, LayoutDashboard, Users, Wallet } from "lucide-react";
import { getSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-white/40 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <Link href="/admin" className="flex items-center gap-2 text-base font-bold text-gradient">
            <LayoutDashboard className="h-5 w-5 text-ios-indigo" />
            HR 後台
          </Link>
          <nav className="ml-2 flex flex-wrap gap-1 text-sm">
            <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />}>
              員工
            </NavLink>
            <NavLink href="/admin/balances" icon={<Calculator className="h-4 w-4" />}>
              餘額調整
            </NavLink>
            <NavLink href="/admin/payouts" icon={<Wallet className="h-4 w-4" />}>
              折發結算
            </NavLink>
            <NavLink href="/admin/export" icon={<Download className="h-4 w-4" />}>
              匯出
            </NavLink>
          </nav>
          <div className="flex-1" />
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            返回主站
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-slate-600 transition-all hover:bg-white/70 hover:text-slate-900"
    >
      {icon}
      {children}
    </Link>
  );
}
