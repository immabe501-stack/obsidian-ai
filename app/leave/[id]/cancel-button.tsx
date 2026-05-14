"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function CancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleCancel() {
    if (!confirm("確定要取消這筆申請嗎？取消後不可恢復。")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/leave-requests/${id}/cancel`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "取消失敗");
        return;
      }
      toast.success("已取消這筆申請");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button onClick={handleCancel} disabled={pending} className="btn-danger">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
      {pending ? "取消中…" : "取消這筆申請"}
    </button>
  );
}
