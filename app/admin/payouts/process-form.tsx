"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProcessForm({
  userId,
  userName,
  anniversaryYearStart,
  unusedDays,
}: {
  userId: string;
  userName: string;
  anniversaryYearStart: string;
  unusedDays: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const amountNum = amount ? parseFloat(amount) : null;
    if (amount && (isNaN(amountNum!) || amountNum! < 0)) {
      setError("折發金額需為非負數字");
      setPending(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          anniversaryYearStart,
          unusedDays,
          payoutAmount: amountNum,
          note: note || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "失敗");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
      >
        結算
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md bg-slate-50 p-3">
      <div className="text-xs font-medium">結算 {userName}（{unusedDays} 天）</div>
      <input
        type="number"
        step="1"
        placeholder="折發金額（NT$，可空）"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <input
        placeholder="備註（可空）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="flex gap-1">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "…" : "確認結算"}
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
