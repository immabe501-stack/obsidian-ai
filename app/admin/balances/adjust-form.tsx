"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

export function AdjustForm({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const n = parseFloat(days);
    if (isNaN(n) || n === 0) {
      toast.error("請輸入非零數字（可正可負）");
      return;
    }
    if (!reason.trim()) {
      toast.error("請填寫原因");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/admin/balance-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days: n, reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "失敗");
        return;
      }
      toast.success(`已調整 ${userName} ${n > 0 ? "+" : ""}${n} 天`);
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
        className="inline-flex items-center gap-1 rounded-xl bg-white/60 px-2.5 py-1 text-xs text-slate-700 backdrop-blur transition-all hover:bg-white/90"
      >
        <Pencil className="h-3 w-3" />
        調整
      </button>
    );
  }

  return (
    <div className="glass-subtle space-y-2 rounded-2xl p-3">
      <div className="text-xs font-medium text-slate-700">調整 {userName}</div>
      <input
        type="number"
        step="0.5"
        placeholder="±天數"
        value={days}
        onChange={(e) => setDays(e.target.value)}
        className="input py-1.5 text-xs"
      />
      <input
        placeholder="原因"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input py-1.5 text-xs"
      />
      <div className="flex gap-1.5">
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-ios-blue to-ios-indigo px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          確認
        </button>
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/60 px-2 py-1 text-xs text-slate-700 hover:bg-white/90"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
