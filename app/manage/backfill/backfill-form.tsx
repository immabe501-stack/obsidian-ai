"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Sub = {
  id: string;
  employeeNo: string;
  name: string;
  department: string | null;
  hireDate: Date | string;
};

function countDays(start: string, end: string, half: boolean): number {
  if (!start || !end) return 0;
  if (half) return 0.5;
  const a = new Date(start);
  const b = new Date(end);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.max(1, Math.floor((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function BackfillForm({
  subordinates,
  initialUserId,
}: {
  subordinates: Sub[];
  initialUserId?: string;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(initialUserId ?? subordinates[0]?.id ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<"AM" | "PM">("AM");
  const [reason, setReason] = useState("補登");
  const [pending, setPending] = useState(false);

  const days = useMemo(
    () => countDays(startDate, isHalfDay ? startDate : endDate, isHalfDay),
    [startDate, endDate, isHalfDay],
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) {
      toast.error("請選擇員工");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/manager/backfill-leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          startDate,
          endDate: isHalfDay ? startDate : endDate,
          isHalfDay,
          halfDayPeriod: isHalfDay ? halfDayPeriod : null,
          reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "補登失敗");
        return;
      }
      toast.success(`已補登 ${days} 天特休`);
      router.replace(`/leave/${data.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-amber-50/60 px-4 py-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        ⚠ 補登的紀錄會立即扣除員工特休餘額並標記為「已核准」。請確認日期與天數無誤再送出。
      </div>

      <Field label="員工 *">
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="input" required>
          {subordinates.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}（{u.employeeNo}） · {u.department ?? "—"}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="起始日 *">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" required />
        </Field>
        <Field label="結束日 *">
          <input
            type="date"
            value={isHalfDay ? startDate : endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
            disabled={isHalfDay}
            required
          />
        </Field>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} className="h-4 w-4 rounded" />
        半天假
      </label>

      {isHalfDay && (
        <Field label="時段">
          <select value={halfDayPeriod} onChange={(e) => setHalfDayPeriod(e.target.value as "AM" | "PM")} className="input">
            <option value="AM">上午</option>
            <option value="PM">下午</option>
          </select>
        </Field>
      )}

      <Field label="事由（會記錄在請假單上）">
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="input" maxLength={500} />
      </Field>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">
          將扣除 <strong className="text-gradient text-base">{days}</strong> 天特休
        </span>
        <button type="submit" disabled={pending || !days} className="btn-primary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
          {pending ? "送出中…" : "確認補登"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
