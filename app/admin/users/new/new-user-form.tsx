"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Manager = { id: string; name: string; employeeNo: string };

export function NewUserForm({ managers }: { managers: Manager[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeNo: "",
    email: "",
    name: "",
    password: "",
    role: "EMPLOYEE",
    hireDate: new Date().toISOString().slice(0, 10),
    department: "",
    jobTitle: "",
    employmentType: "FULL_TIME",
    managerId: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          managerId: form.managerId || null,
          department: form.department || null,
          jobTitle: form.jobTitle || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "新增失敗");
        return;
      }
      router.replace(`/admin/users/${data.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="員工編號" required>
          <input value={form.employeeNo} onChange={(e) => set("employeeNo", e.target.value)} required className={input} />
        </Field>
        <Field label="姓名" required>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={input} />
        </Field>
        <Field label="Email" required>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className={input} />
        </Field>
        <Field label="初始密碼（員工首次登入）" required>
          <input
            type="text"
            minLength={8}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            className={input}
          />
        </Field>
        <Field label="角色">
          <select value={form.role} onChange={(e) => set("role", e.target.value)} className={input}>
            <option value="EMPLOYEE">員工</option>
            <option value="MANAGER">主管</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>
        <Field label="雇用類型">
          <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={input}>
            <option value="FULL_TIME">正職</option>
            <option value="PART_TIME">兼職</option>
            <option value="CONTRACT">約聘</option>
            <option value="INTERN">實習</option>
          </select>
        </Field>
        <Field label="到職日" required>
          <input
            type="date"
            value={form.hireDate}
            onChange={(e) => set("hireDate", e.target.value)}
            required
            className={input}
          />
        </Field>
        <Field label="直屬主管">
          <select value={form.managerId} onChange={(e) => set("managerId", e.target.value)} className={input}>
            <option value="">— 無 —</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（{m.employeeNo}）
              </option>
            ))}
          </select>
        </Field>
        <Field label="部門">
          <input value={form.department} onChange={(e) => set("department", e.target.value)} className={input} />
        </Field>
        <Field label="職稱">
          <input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} className={input} />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "建立中…" : "建立員工"}
        </button>
      </div>
    </form>
  );
}

const input =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
