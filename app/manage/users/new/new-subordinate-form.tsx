"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Manager = {
  id: string;
  name: string;
  employeeNo: string;
  department: string | null;
};

export function NewSubordinateForm({ manager, isAdmin }: { manager: Manager; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    employeeNo: "",
    name: "",
    email: "",
    password: "",
    hireDate: today,
    department: manager.department ?? "",
    jobTitle: "",
    employmentType: "FULL_TIME" as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/manager/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          department: form.department || null,
          jobTitle: form.jobTitle || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "建立失敗");
        return;
      }
      toast.success(`已建立員工 ${form.name}`);
      router.replace("/manage");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-ios-blue/10 px-4 py-3 text-xs text-ios-blue dark:bg-ios-blue/20">
        新員工將自動隸屬於 <strong>{manager.name}（{manager.employeeNo}）</strong>。
        若要改派其他主管或設定角色為 HR/Admin，請聯絡 HR 後台。
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="員工編號 *">
          <input value={form.employeeNo} onChange={(e) => set("employeeNo", e.target.value)} className="input" required />
        </Field>
        <Field label="姓名 *">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" required />
        </Field>
        <Field label="Email *">
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" required />
        </Field>
        <Field label="初始密碼 *" hint="至少 8 字元，員工首次登入請改密碼">
          <input type="text" value={form.password} onChange={(e) => set("password", e.target.value)} className="input" required minLength={8} />
        </Field>
        <Field label="到職日 *">
          <input type="date" value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} className="input" required />
        </Field>
        <Field label="雇用類型">
          <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value as typeof form.employmentType)} className="input">
            <option value="FULL_TIME">正職</option>
            <option value="PART_TIME">兼職</option>
            <option value="CONTRACT">約聘</option>
            <option value="INTERN">工讀 / 實習</option>
          </select>
        </Field>
        <Field label="部門">
          <input value={form.department} onChange={(e) => set("department", e.target.value)} className="input" />
        </Field>
        <Field label="職稱">
          <input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} className="input" />
        </Field>
      </div>

      {isAdmin && (
        <p className="text-xs text-slate-500">
          ⓘ 你是 HR/Admin — 若需設更高權限或不同主管，請改至「HR 後台 → 員工管理」。
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {pending ? "建立中…" : "建立員工"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
