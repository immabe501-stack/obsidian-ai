"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Wallet, X } from "lucide-react";
import { toast } from "sonner";

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

  async function submit() {
    const amountNum = amount ? parseFloat(amount) : null;
    if (amount && (isNaN(amountNum!) || amountNum! < 0)) {
      toast.error("折發金額需為非負數字");
      return;
    }
    setPending(true);
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
        toast.error(data.error ?? "失敗");
        return;
      }
      toast.success(`${userName} 已結算 ${unusedDays} 天`);
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
        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-br from-ios-blue to-ios-indigo px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
      >
        <Wallet className="h-3 w-3" />
        結算
      </button>
    );
  }

  return (
    <div className="glass-subtle space-y-2 rounded-2xl p-3">
      <div className="text-xs font-medium text-slate-700">
        結算 {userName}（{unusedDays} 天）
      </div>
      <input
        type="number"
        step="1"
        placeholder="折發金額（NT$）"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input py-1.5 text-xs"
      />
      <input
        placeholder="備註（可空）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input py-1.5 text-xs"
      />
      <div className="flex gap-1.5">
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-br from-ios-blue to-ios-indigo px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          結算
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
