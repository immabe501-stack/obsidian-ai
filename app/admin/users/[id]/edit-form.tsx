"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Briefcase, Check, Clock, CreditCard, Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { EmploymentPeriods } from "./employment-periods";

type PeriodInitial = {
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  startDate: string;
  endDate: string | null;
  countsTowardSeniority: boolean;
  note: string | null;
};

type Manager = { id: string; name: string; employeeNo: string };

type UserState = {
  id: string;
  employeeNo: string;
  email: string;
  name: string;
  role: string;
  hireDate: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  managerId: string;
  active: boolean;
  annualLeaveEnabled: boolean;
};

type ProfileState = {
  chineseName: string;
  englishName: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  phone: string;
  mobile: string;
  registeredAddress: string;
  mailingAddress: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  bankName: string;
  nationalId: string;
  bankAccount: string;
};

export function EditUserForm({
  managers,
  periods,
  user: initialUser,
  profile: initialProfile,
}: {
  managers: Manager[];
  periods: PeriodInitial[];
  user: UserState;
  profile: ProfileState;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  function setU<K extends keyof UserState>(k: K, v: UserState[K]) {
    setUser((u) => ({ ...u, [k]: v }));
  }
  function setP<K extends keyof ProfileState>(k: K, v: ProfileState[K]) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const body: Record<string, unknown> = {
        name: user.name,
        email: user.email,
        role: user.role,
        hireDate: user.hireDate,
        department: user.department || null,
        jobTitle: user.jobTitle || null,
        employmentType: user.employmentType,
        managerId: user.managerId || null,
        active: user.active,
        annualLeaveEnabled: user.annualLeaveEnabled,
        profile: {
          chineseName: profile.chineseName || null,
          englishName: profile.englishName || null,
          birthDate: profile.birthDate || null,
          gender: profile.gender || null,
          maritalStatus: profile.maritalStatus || null,
          phone: profile.phone || null,
          mobile: profile.mobile || null,
          registeredAddress: profile.registeredAddress || null,
          mailingAddress: profile.mailingAddress || null,
          emergencyContactName: profile.emergencyContactName || null,
          emergencyContactRelation: profile.emergencyContactRelation || null,
          emergencyContactPhone: profile.emergencyContactPhone || null,
          bankName: profile.bankName || null,
          nationalId: profile.nationalId,
          bankAccount: profile.bankAccount,
        },
      };
      if (password) body.password = password;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "更新失敗");
        return;
      }
      toast.success("員工資料已更新");
      setPassword("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section icon={<Briefcase className="h-4 w-4" />} title="任職資料">
        <Grid>
          <ReadOnly label="員工編號" value={user.employeeNo} />
          <Field label="姓名"><input value={user.name} onChange={(e) => setU("name", e.target.value)} className="input" /></Field>
          <Field label="Email"><input type="email" value={user.email} onChange={(e) => setU("email", e.target.value)} className="input" /></Field>
          <Field label="重設密碼（留空表示不變）">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 字元" minLength={password ? 8 : 0} className="input" />
          </Field>
          <Field label="角色與權限">
            <select value={user.role} onChange={(e) => setU("role", e.target.value)} className="input">
              <option value="EMPLOYEE">員工（一般權限）</option>
              <option value="MANAGER">主管（可審核 / 新增 / 補登屬下）</option>
              <option value="ADMIN">HR / Admin（最高權限）</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              HR / Admin 擁有後台所有權限；主管可審核屬下、新增員工、補登請假
            </p>
          </Field>
          <Field label="雇用類型">
            <select value={user.employmentType} onChange={(e) => setU("employmentType", e.target.value)} className="input">
              <option value="FULL_TIME">正職</option>
              <option value="PART_TIME">兼職</option>
              <option value="CONTRACT">約聘</option>
              <option value="INTERN">實習</option>
            </select>
          </Field>
          <Field label="到職日">
            <input type="date" value={user.hireDate} onChange={(e) => setU("hireDate", e.target.value)} className="input" />
          </Field>
          <Field label="直屬主管">
            <select value={user.managerId} onChange={(e) => setU("managerId", e.target.value)} className="input">
              <option value="">— 無 —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}（{m.employeeNo}）</option>
              ))}
            </select>
          </Field>
          <Field label="部門"><input value={user.department} onChange={(e) => setU("department", e.target.value)} className="input" /></Field>
          <Field label="職稱"><input value={user.jobTitle} onChange={(e) => setU("jobTitle", e.target.value)} className="input" /></Field>
          <Field label="在職狀態">
            <label className="inline-flex items-center gap-2 text-sm py-2.5">
              <input type="checkbox" checked={user.active} onChange={(e) => setU("active", e.target.checked)} className="h-4 w-4 rounded accent-ios-blue" />
              在職中
            </label>
          </Field>
          <Field label="特休資格">
            <label className="inline-flex items-center gap-2 text-sm py-2.5">
              <input
                type="checkbox"
                checked={user.annualLeaveEnabled}
                onChange={(e) => setU("annualLeaveEnabled", e.target.checked)}
                className="h-4 w-4 rounded accent-ios-blue"
              />
              享有特休（請假申請、餘額計算啟用）
            </label>
            <p className="mt-1 text-[11px] text-slate-400">
              預設正職享有、其他類型不享有；可手動開啟（例如長期工讀生）
            </p>
          </Field>
        </Grid>
      </Section>

      <Section icon={<Clock className="h-4 w-4" />} title="工作經歷段（混合制資歷）" hint="工讀＋正職等可多段登記">
        <EmploymentPeriods
          userId={user.id}
          initial={periods}
          hireDate={user.hireDate}
          onSuggestHireDate={(d) => setU("hireDate", d)}
        />
      </Section>

      <Section icon={<User className="h-4 w-4" />} title="個人基本資料">
        <Grid>
          <Field label="中文姓名"><input value={profile.chineseName} onChange={(e) => setP("chineseName", e.target.value)} className="input" /></Field>
          <Field label="英文姓名"><input value={profile.englishName} onChange={(e) => setP("englishName", e.target.value)} className="input" /></Field>
          <Field label="出生日期"><input type="date" value={profile.birthDate} onChange={(e) => setP("birthDate", e.target.value)} className="input" /></Field>
          <Field label="性別">
            <select value={profile.gender} onChange={(e) => setP("gender", e.target.value)} className="input">
              <option value="">—</option>
              <option value="MALE">男</option>
              <option value="FEMALE">女</option>
              <option value="OTHER">其他</option>
              <option value="PREFER_NOT_TO_SAY">不願透露</option>
            </select>
          </Field>
          <Field label="婚姻狀況">
            <select value={profile.maritalStatus} onChange={(e) => setP("maritalStatus", e.target.value)} className="input">
              <option value="">—</option>
              <option value="SINGLE">未婚</option>
              <option value="MARRIED">已婚</option>
              <option value="DIVORCED">離婚</option>
              <option value="WIDOWED">喪偶</option>
              <option value="PREFER_NOT_TO_SAY">不願透露</option>
            </select>
          </Field>
        </Grid>
      </Section>

      <Section icon={<Mail className="h-4 w-4" />} title="聯絡資訊">
        <Grid>
          <Field label="市話"><input value={profile.phone} onChange={(e) => setP("phone", e.target.value)} className="input" /></Field>
          <Field label="手機"><input value={profile.mobile} onChange={(e) => setP("mobile", e.target.value)} className="input" /></Field>
          <Field label="戶籍地址" full><input value={profile.registeredAddress} onChange={(e) => setP("registeredAddress", e.target.value)} className="input" /></Field>
          <Field label="通訊地址" full><input value={profile.mailingAddress} onChange={(e) => setP("mailingAddress", e.target.value)} className="input" /></Field>
          <Field label="緊急聯絡人姓名"><input value={profile.emergencyContactName} onChange={(e) => setP("emergencyContactName", e.target.value)} className="input" /></Field>
          <Field label="緊急聯絡人關係"><input value={profile.emergencyContactRelation} onChange={(e) => setP("emergencyContactRelation", e.target.value)} className="input" /></Field>
          <Field label="緊急聯絡人電話"><input value={profile.emergencyContactPhone} onChange={(e) => setP("emergencyContactPhone", e.target.value)} className="input" /></Field>
        </Grid>
      </Section>

      <Section icon={<Lock className="h-4 w-4" />} title="敏感資料 (PII)" hint="加密欄位，留空表示不變更">
        <Grid>
          <Field label="身分證字號（明碼，加密儲存）">
            <input value={profile.nationalId} onChange={(e) => setP("nationalId", e.target.value)} className="input font-mono" />
          </Field>
          <Field label="銀行名稱"><input value={profile.bankName} onChange={(e) => setP("bankName", e.target.value)} className="input" /></Field>
          <Field label="薪轉帳號（明碼，加密儲存）" full>
            <div className="relative">
              <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={profile.bankAccount} onChange={(e) => setP("bankAccount", e.target.value)} className="input pl-10 font-mono" />
            </div>
          </Field>
        </Grid>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary px-6 py-2.5">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {pending ? "儲存中…" : "儲存所有變更"}
        </button>
      </div>
    </form>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-strong rounded-3xl p-7 animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-ios-blue">{icon}</span>}
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {hint && (
          <span className="rounded-full bg-amber-100/70 px-2.5 py-0.5 text-xs text-amber-800 backdrop-blur">
            {hint}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>;
}
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="rounded-2xl bg-white/40 px-4 py-2.5 text-sm text-slate-600">{value}</div>
    </div>
  );
}
