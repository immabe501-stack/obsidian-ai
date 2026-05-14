"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Send, X } from "lucide-react";

function diffDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(`${start}T00:00:00.000Z`).getTime();
  const e = new Date(`${end}T00:00:00.000Z`).getTime();
  if (e < s) return 0;
  return Math.round((e - s) / 86_400_000) + 1;
}

export function LeaveForm({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"AM" | "PM">("AM");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const computedDays = useMemo(() => {
    if (isHalfDay) return 0.5;
    return diffDays(startDate, endDate);
  }, [startDate, endDate, isHalfDay]);

  const overBudget = computedDays > 0 && computedDays > remaining;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate: isHalfDay ? startDate : endDate,
          isHalfDay,
          halfDayPeriod: isHalfDay ? halfDayPeriod : null,
          reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "送出失敗");
        return;
      }
      router.replace(`/leave/${data.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-strong space-y-6 rounded-3xl p-7 animate-fade-in"
    >
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isHalfDay}
          onChange={(e) => setIsHalfDay(e.target.checked)}
          className="h-4 w-4 rounded accent-ios-blue"
        />
        申請半天假
      </label>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="startDate">
            起始日
          </label>
          <input
            id="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </div>
        {isHalfDay ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="halfDayPeriod">
              時段
            </label>
            <select
              id="halfDayPeriod"
              value={halfDayPeriod}
              onChange={(e) => setHalfDayPeriod(e.target.value as "AM" | "PM")}
              className="input"
            >
              <option value="AM">上午</option>
              <option value="PM">下午</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="endDate">
              結束日
            </label>
            <input
              id="endDate"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="input"
            />
          </div>
        )}
      </div>

      <div className="glass-subtle rounded-2xl px-5 py-3.5 text-sm">
        本次申請天數：
        <span className={`ml-2 text-lg font-bold ${overBudget ? "text-rose-600" : "text-gradient"}`}>
          {computedDays} 天
        </span>
        {overBudget && <span className="ml-2 text-xs text-rose-600">超過剩餘特休（{remaining} 天）</span>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="reason">
          事由
        </label>
        <textarea
          id="reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input resize-none"
          placeholder="例如：家庭旅遊、健康檢查"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200/50 bg-rose-50/60 px-4 py-2.5 text-sm text-rose-700 backdrop-blur">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          <X className="h-4 w-4" />
          取消
        </button>
        <button
          type="submit"
          disabled={pending || overBudget || computedDays === 0}
          className="btn-primary"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {pending ? "送出中…" : "送出申請"}
        </button>
      </div>
    </form>
  );
}
