import { format } from "date-fns";
import { Cake, CalendarCheck, PartyPopper } from "lucide-react";
import type { UpcomingAnniversary, UpcomingBirthday, UpcomingLeave } from "@/lib/widgets";
import { GlassCard } from "@/components/glass-card";
import { Avatar } from "@/components/avatar";

export function BirthdayWidget({ items }: { items: UpcomingBirthday[] }) {
  return (
    <Widget icon={<Cake className="h-4 w-4" />} title="即將生日" accent="pink">
      {items.length === 0 ? (
        <Empty text="未來兩週沒有生日壽星" />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((b) => (
            <li key={b.userId} className="flex items-center gap-3">
              <Avatar name={b.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{b.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {b.department ?? "—"} · {format(b.date, "MM-dd")}
                </div>
              </div>
              <DayChip days={b.daysAway} />
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

export function AnniversaryWidget({ items }: { items: UpcomingAnniversary[] }) {
  return (
    <Widget icon={<PartyPopper className="h-4 w-4" />} title="即將週年" accent="purple">
      {items.length === 0 ? (
        <Empty text="未來兩週沒有週年" />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((a) => (
            <li key={a.userId} className="flex items-center gap-3">
              <Avatar name={a.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {a.department ?? "—"} ·{" "}
                  <span className="text-gradient font-semibold">{a.years} 週年</span>
                </div>
              </div>
              <DayChip days={a.daysAway} />
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

export function UpcomingLeavesWidget({ items }: { items: UpcomingLeave[] }) {
  return (
    <Widget icon={<CalendarCheck className="h-4 w-4" />} title="本週請假" accent="blue">
      {items.length === 0 ? (
        <Empty text="未來一週無人請假" />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((l) => (
            <li key={l.id} className="flex items-center gap-3">
              <Avatar name={l.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{l.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {format(l.startDate, "MM-dd")}
                  {l.startDate.getTime() !== l.endDate.getTime() &&
                    ` ~ ${format(l.endDate, "MM-dd")}`}
                  {l.isHalfDay && " 半天"}
                </div>
              </div>
              <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                {l.days} 天
              </span>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

const accents = {
  pink: "from-rose-400 to-pink-500",
  purple: "from-violet-400 to-purple-500",
  blue: "from-sky-400 to-blue-500",
};

function Widget({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: keyof typeof accents;
  children: React.ReactNode;
}) {
  return (
    <GlassCard variant="strong" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br text-white ${accents[accent]}`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </GlassCard>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-2 text-center text-xs text-slate-500">{text}</p>;
}

function DayChip({ days }: { days: number }) {
  const label = days === 0 ? "今天 🎉" : days === 1 ? "明天" : `${days} 天後`;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        days === 0
          ? "bg-amber-100/80 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          : "bg-slate-100/80 text-slate-600 dark:bg-white/10 dark:text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}
