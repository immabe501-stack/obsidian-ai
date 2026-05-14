"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DecideButtons({ id }: { id: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const url = mode === "approve" ? `/api/approvals/${id}/approve` : `/api/approvals/${id}/reject`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "處理失敗");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (mode === "idle") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setMode("approve")}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          核准
        </button>
        <button
          onClick={() => setMode("reject")}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          退回
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md bg-slate-50 p-3">
      <label className="block text-xs text-slate-600">
        {mode === "approve" ? "核准備註（選填）" : "退回原因（必填）"}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setMode("idle");
            setNote("");
            setError(null);
          }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          取消
        </button>
        <button
          onClick={submit}
          disabled={pending || (mode === "reject" && !note.trim())}
          className={
            mode === "approve"
              ? "rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              : "rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          }
        >
          {pending ? "處理中…" : mode === "approve" ? "確認核准" : "確認退回"}
        </button>
      </div>
    </div>
  );
}
