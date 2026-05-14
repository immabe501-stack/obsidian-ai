"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";

export function CancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm("確定要取消這筆申請嗎？取消後不可恢復。")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/leave-requests/${id}/cancel`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "取消失敗");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button onClick={handleCancel} disabled={pending} className="btn-danger">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
        {pending ? "取消中…" : "取消這筆申請"}
      </button>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </>
  );
}
