"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "PREFER_NOT_TO_SAY";

type Initial = {
  chineseName: string;
  englishName: string;
  birthDate: string;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  phone: string;
  mobile: string;
  registeredAddress: string;
  mailingAddress: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          mobile: form.mobile,
          registeredAddress: form.registeredAddress,
          mailingAddress: form.mailingAddress,
          emergencyContactName: form.emergencyContactName,
          emergencyContactRelation: form.emergencyContactRelation,
          emergencyContactPhone: form.emergencyContactPhone,
          gender: form.gender,
          maritalStatus: form.maritalStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error ?? "更新失敗" });
        return;
      }
      setMessage({ type: "ok", text: "已儲存" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReadOnly label="中文姓名" value={form.chineseName || "—"} />
        <ReadOnly label="英文姓名" value={form.englishName || "—"} />
        <ReadOnly label="出生日期" value={form.birthDate || "—"} />

        <Select
          label="性別"
          value={form.gender ?? ""}
          onChange={(v) => set("gender", (v || null) as Gender | null)}
          options={[
            { value: "", label: "—" },
            { value: "MALE", label: "男" },
            { value: "FEMALE", label: "女" },
            { value: "OTHER", label: "其他" },
            { value: "PREFER_NOT_TO_SAY", label: "不願透露" },
          ]}
        />

        <Select
          label="婚姻狀況"
          value={form.maritalStatus ?? ""}
          onChange={(v) => set("maritalStatus", (v || null) as MaritalStatus | null)}
          options={[
            { value: "", label: "—" },
            { value: "SINGLE", label: "未婚" },
            { value: "MARRIED", label: "已婚" },
            { value: "DIVORCED", label: "離婚" },
            { value: "WIDOWED", label: "喪偶" },
            { value: "PREFER_NOT_TO_SAY", label: "不願透露" },
          ]}
        />

        <Text label="市話" value={form.phone} onChange={(v) => set("phone", v)} />
        <Text label="手機" value={form.mobile} onChange={(v) => set("mobile", v)} />
        <Text
          label="戶籍地址"
          value={form.registeredAddress}
          onChange={(v) => set("registeredAddress", v)}
          className="md:col-span-2"
        />
        <Text
          label="通訊地址"
          value={form.mailingAddress}
          onChange={(v) => set("mailingAddress", v)}
          className="md:col-span-2"
        />
      </div>

      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-2 text-xs text-slate-500">緊急聯絡人</legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Text
            label="姓名"
            value={form.emergencyContactName}
            onChange={(v) => set("emergencyContactName", v)}
          />
          <Text
            label="關係"
            value={form.emergencyContactRelation}
            onChange={(v) => set("emergencyContactRelation", v)}
          />
          <Text
            label="電話"
            value={form.emergencyContactPhone}
            onChange={(v) => set("emergencyContactPhone", v)}
          />
        </div>
      </fieldset>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "儲存中…" : "儲存變更"}
        </button>
      </div>
    </form>
  );
}

function Text({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-slate-500">{label}</div>
      <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{value}</div>
    </div>
  );
}
