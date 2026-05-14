"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const href = `/api/admin/export?${params.toString()}`;

  return (
    <div className="glass-strong space-y-5 rounded-3xl p-7 animate-fade-in">
      <p className="text-sm text-slate-600">
        匯出區間內所有申請（依「起始日」過濾）。CSV 含 BOM，Excel 可直接開啟。
      </p>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">起 (含)</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">迄 (含)</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
      </div>
      <a href={href} className="btn-primary w-full py-2.5">
        <Download className="h-4 w-4" />
        下載 CSV
      </a>
      <p className="text-xs text-slate-500">不填日期則匯出全部紀錄。</p>
    </div>
  );
}
