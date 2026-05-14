"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdjustForm({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const n = parseFloat(days);
    if (isNaN(n) || n === 0) {
      setError("請輸入非零數字（可正可負）");
      return;
    }
    if (!reason.trim()) {
      setError("請填寫原因");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/balance-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days: n, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "失敗");
        return;
      }
      setOpen(false);
      setDays("");
      setReason("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
      >
        調整
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md bg-slate-50 p-3">
      <div className="text-xs font-medium">調整 {userName}</div>
      <input
        type="number"
        step="0.5"
        placeholder="±天數"
        value={days}
        onChange={(e) => setDays(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <input
        placeholder="原因"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="flex gap-1">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "…" : "確認"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
        >
          取消
        </button>
      </div>
    </div>
  );
}
