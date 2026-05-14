"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { creditedDays, formatService, suggestedHireDate, type Period } from "@/lib/service";

type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

type EditPeriod = {
  type: EmploymentType;
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd or ""
  countsTowardSeniority: boolean;
  note: string;
};

const typeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "正職",
  PART_TIME: "兼職",
  CONTRACT: "約聘",
  INTERN: "工讀 / 實習",
};

function toEdit(p: {
  type: EmploymentType;
  startDate: string;
  endDate: string | null;
  countsTowardSeniority: boolean;
  note: string | null;
}): EditPeriod {
  return {
    type: p.type,
    startDate: p.startDate.slice(0, 10),
    endDate: p.endDate ? p.endDate.slice(0, 10) : "",
    countsTowardSeniority: p.countsTowardSeniority,
    note: p.note ?? "",
  };
}

function toPeriod(e: EditPeriod): Period | null {
  if (!e.startDate) return null;
  return {
    type: e.type,
    startDate: new Date(e.startDate),
    endDate: e.endDate ? new Date(e.endDate) : null,
    countsTowardSeniority: e.countsTowardSeniority,
    note: e.note || null,
  };
}

export function EmploymentPeriods({
  userId,
  initial,
  hireDate,
  onSuggestHireDate,
}: {
  userId: string;
  initial: {
    type: EmploymentType;
    startDate: string;
    endDate: string | null;
    countsTowardSeniority: boolean;
    note: string | null;
  }[];
  hireDate: string;
  onSuggestHireDate?: (date: string) => void;
}) {
  const [rows, setRows] = useState<EditPeriod[]>(() => initial.map(toEdit));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setRows(initial.map(toEdit));
  }, [initial]);

  const summary = useMemo(() => {
    const valid = rows.map(toPeriod).filter((p): p is Period => p !== null);
    const days = creditedDays(valid);
    const suggested = suggestedHireDate(valid);
    return {
      days,
      label: formatService(days),
      suggested: suggested ? suggested.toISOString().slice(0, 10) : null,
    };
  }, [rows]);

  function update<K extends keyof EditPeriod>(idx: number, key: K, value: EditPeriod[K]) {
    setRows((r) => r.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));
  }

  function addRow() {
    const today = new Date().toISOString().slice(0, 10);
    setRows((r) => [
      ...r,
      {
        type: "FULL_TIME",
        startDate: today,
        endDate: "",
        countsTowardSeniority: true,
        note: "",
      },
    ]);
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  async function save() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/periods`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periods: rows.map((r) => ({
            type: r.type,
            startDate: r.startDate,
            endDate: r.endDate || null,
            countsTowardSeniority: r.countsTowardSeniority,
            note: r.note || null,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "儲存失敗");
        return;
      }
      toast.success("工作經歷已更新");
    } finally {
      setPending(false);
    }
  }

  const diffWithHireDate =
    summary.suggested && summary.suggested !== hireDate
      ? `目前到職日為 ${hireDate}，計入年資 ${summary.label}（建議到職日：${summary.suggested}）`
      : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        混合制資歷：可登記多段（如工讀 → 正職）；標示「計入年資」的時段會合併到特休年資計算。
      </p>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-slate-100/60 px-4 py-6 text-center text-xs text-slate-500 dark:bg-white/5">
          尚未登記任何工作經歷段。
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={i}
              className="glass-subtle grid grid-cols-1 gap-2 rounded-2xl p-3 md:grid-cols-[120px_140px_140px_auto_auto_36px] md:items-center"
            >
              <select
                value={r.type}
                onChange={(e) => update(i, "type", e.target.value as EmploymentType)}
                className="input !py-1.5 text-xs"
              >
                {Object.entries(typeLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                type="date"
                value={r.startDate}
                onChange={(e) => update(i, "startDate", e.target.value)}
                className="input !py-1.5 text-xs"
              />
              <input
                type="date"
                value={r.endDate}
                onChange={(e) => update(i, "endDate", e.target.value)}
                placeholder="至今"
                className="input !py-1.5 text-xs"
              />
              <input
                value={r.note}
                onChange={(e) => update(i, "note", e.target.value)}
                placeholder="備註（選填）"
                className="input !py-1.5 text-xs"
              />
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={r.countsTowardSeniority}
                  onChange={(e) => update(i, "countsTowardSeniority", e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                計入年資
              </label>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                aria-label="刪除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={addRow} className="btn-ghost text-xs">
          <Plus className="h-3.5 w-3.5" />
          新增一段
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-primary text-xs"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {pending ? "儲存中…" : "儲存經歷段"}
        </button>
      </div>

      {summary.days > 0 && (
        <div className="glass-subtle flex flex-col gap-2 rounded-2xl px-4 py-3 text-xs md:flex-row md:items-center md:justify-between">
          <div>
            <Calendar className="mr-1 inline h-3.5 w-3.5 text-ios-indigo" />
            計入年資合計：<strong className="text-gradient text-sm">{summary.label}</strong>
            （{summary.days} 天）
          </div>
          {diffWithHireDate && summary.suggested && onSuggestHireDate && (
            <button
              type="button"
              onClick={() => onSuggestHireDate(summary.suggested!)}
              className="btn-ghost text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              套用建議到職日 {summary.suggested}
            </button>
          )}
        </div>
      )}
      {diffWithHireDate && (
        <p className="text-[11px] text-slate-500">{diffWithHireDate}</p>
      )}
    </div>
  );
}
