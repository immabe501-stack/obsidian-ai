import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session.userId) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">員工特休系統</h1>
        <p className="mb-6 text-sm text-slate-500">請以公司 Email 登入</p>
        <LoginForm />
        <p className="mt-6 text-xs text-slate-400">
          測試帳號（密碼皆 password123）：hr@example.com、alice@example.com、carol@example.com
        </p>
      </div>
    </main>
  );
}
