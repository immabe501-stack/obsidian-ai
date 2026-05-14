"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, X, XCircle } from "lucide-react";
import { toast } from "sonner";

export function DecideButtons({ id }: { id: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const url = mode === "approve" ? `/api/approvals/${id}/approve` : `/api/approvals/${id}/reject`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "處理失敗");
        return;
      }
      toast.success(mode === "approve" ? "已核准" : "已退回");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (mode === "idle") {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode("approve")} className="btn-success">
          <Check className="h-4 w-4" />
          核准
        </button>
        <button onClick={() => setMode("reject")} className="btn-ghost text-rose-700 hover:text-rose-800">
          <XCircle className="h-4 w-4" />
          退回
        </button>
      </div>
    );
  }

  return (
    <div className="glass-subtle space-y-3 rounded-2xl p-4">
      <label className="block text-xs uppercase tracking-wide text-slate-600">
        {mode === "approve" ? "核准備註（選填）" : "退回原因（必填）"}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="input resize-none"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setMode("idle");
            setNote("");
          }}
          className="btn-ghost"
        >
          <X className="h-4 w-4" />
          取消
        </button>
        <button
          onClick={submit}
          disabled={pending || (mode === "reject" && !note.trim())}
          className={mode === "approve" ? "btn-success" : "btn-danger"}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "approve" ? (
            <Check className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {pending ? "處理中…" : mode === "approve" ? "確認核准" : "確認退回"}
        </button>
      </div>
    </div>
  );
}
