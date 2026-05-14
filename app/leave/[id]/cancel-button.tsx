"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <button
        onClick={handleCancel}
        disabled={pending}
        className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "取消中…" : "取消這筆申請"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
