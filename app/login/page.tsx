import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSession } from "@/lib/session";
import { GlassCard } from "@/components/glass-card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session.userId) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <GlassCard variant="strong" className="w-full max-w-md p-10 animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ios-blue to-ios-indigo shadow-glow">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">員工特休系統</h1>
          <p className="mt-2 text-sm text-slate-500">請以公司 Email 登入</p>
        </div>
        <LoginForm />
      </GlassCard>
    </main>
  );
}
