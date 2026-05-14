"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0a84ff", "#5e5ce6", "#bf5af2", "#ff375f", "#ff9f0a", "#30d158", "#64d2ff"];

export function MonthlyApprovedChart({ data }: { data: { month: string; days: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5e5ce6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#0a84ff" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="month" stroke="rgb(148,163,184)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="rgb(148,163,184)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "16px",
              fontSize: 12,
              color: "#0f172a",
            }}
            cursor={{ fill: "rgba(94,92,230,0.1)" }}
            formatter={(v) => [`${v} 天`, "已核准"]}
          />
          <Bar dataKey="days" radius={[8, 8, 0, 0]} fill="url(#barFill)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeptPieChart({ data }: { data: { department: string; days: number }[] }) {
  const total = data.reduce((s, d) => s + d.days, 0);
  return (
    <div className="grid h-64 grid-cols-2 items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="days"
            nameKey="department"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "16px",
              fontSize: 12,
              color: "#0f172a",
            }}
            formatter={(v, n) => [`${v} 天 (${total ? Math.round((Number(v) / total) * 100) : 0}%)`, n]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-2 pl-2 text-xs">
        {data.map((d, i) => (
          <li key={d.department} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-slate-700">{d.department}</span>
            </span>
            <span className="font-semibold text-slate-900">{d.days}</span>
          </li>
        ))}
        {data.length === 0 && <li className="text-slate-500">尚無資料</li>}
      </ul>
    </div>
  );
}
