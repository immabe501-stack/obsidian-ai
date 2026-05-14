import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CalendarPlus, UserPlus } from "lucide-react";
import { getSession } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "MANAGER" && session.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-white/40 bg-white/40 backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <Link href="/manage" className="flex items-center gap-2 text-base font-bold text-gradient">
            <BriefcaseBusiness className="h-5 w-5 text-ios-indigo" />
            管理工具
          </Link>
          <nav className="ml-2 flex flex-wrap gap-1 text-sm">
            <NavLink href="/manage/users/new" icon={<UserPlus className="h-4 w-4" />}>
              新增員工
            </NavLink>
            <NavLink href="/manage/backfill" icon={<CalendarPlus className="h-4 w-4" />}>
              補登請假
            </NavLink>
          </nav>
          <div className="flex-1" />
          <ThemeToggle />
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
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
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-slate-700 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10">
      {icon}
      {children}
    </Link>
  );
}
