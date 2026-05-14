import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Briefcase, CreditCard, Lock, User } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decryptPII, maskPII } from "@/lib/crypto";
import { GlassCard } from "@/components/glass-card";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

const employmentLabels: Record<string, string> = {
  FULL_TIME: "正職",
  PART_TIME: "兼職",
  CONTRACT: "約聘",
  INTERN: "實習",
};

const roleLabels: Record<string, string> = {
  EMPLOYEE: "員工",
  MANAGER: "主管",
  ADMIN: "HR / Admin",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      manager: { select: { name: true } },
      profile: true,
    },
  });
  if (!user) redirect("/login");

  const nationalIdMasked = maskPII(decryptPII(user.profile?.nationalIdEncrypted));
  const bankAccountMasked = maskPII(decryptPII(user.profile?.bankAccountEncrypted));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="個人手冊"
        subtitle="基本資料與聯絡方式。標示「HR 維護」者請聯繫人資。"
        back={{ href: "/", label: "回首頁" }}
      />

      <Section icon={<Briefcase className="h-4 w-4" />} title="任職資料" hint="HR 維護">
        <Grid>
          <ReadField label="員工編號" value={user.employeeNo} />
          <ReadField label="角色" value={roleLabels[user.role] ?? user.role} />
          <ReadField label="姓名" value={user.name} />
          <ReadField label="Email" value={user.email} />
          <ReadField label="部門" value={user.department ?? "—"} />
          <ReadField label="職稱" value={user.jobTitle ?? "—"} />
          <ReadField label="雇用類型" value={employmentLabels[user.employmentType] ?? user.employmentType} />
          <ReadField label="到職日" value={format(user.hireDate, "yyyy-MM-dd")} />
          <ReadField label="直屬主管" value={user.manager?.name ?? "—"} />
        </Grid>
      </Section>

      <Section icon={<User className="h-4 w-4" />} title="個人資料 / 聯絡方式" hint="可自行更新">
        <ProfileForm
          initial={{
            chineseName: user.profile?.chineseName ?? "",
            englishName: user.profile?.englishName ?? "",
            birthDate: user.profile?.birthDate ? format(user.profile.birthDate, "yyyy-MM-dd") : "",
            gender: user.profile?.gender ?? null,
            maritalStatus: user.profile?.maritalStatus ?? null,
            phone: user.profile?.phone ?? "",
            mobile: user.profile?.mobile ?? "",
            registeredAddress: user.profile?.registeredAddress ?? "",
            mailingAddress: user.profile?.mailingAddress ?? "",
            emergencyContactName: user.profile?.emergencyContactName ?? "",
            emergencyContactRelation: user.profile?.emergencyContactRelation ?? "",
            emergencyContactPhone: user.profile?.emergencyContactPhone ?? "",
          }}
        />
      </Section>

      <Section icon={<Lock className="h-4 w-4" />} title="薪資 / 證件資料" hint="僅 HR 可修改">
        <Grid>
          <ReadField label="身分證字號" value={nationalIdMasked || "—"} sensitive />
          <ReadField label="銀行" value={user.profile?.bankName ?? "—"} />
          <ReadField label="薪轉帳戶" value={bankAccountMasked || "—"} sensitive icon={<CreditCard className="h-3.5 w-3.5" />} />
        </Grid>
        <p className="mt-4 text-xs text-slate-500">
          若需更新身分證或銀行帳號，請聯繫 HR。
        </p>
      </Section>
    </main>
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
    <GlassCard variant="strong" className="mb-6 p-7 animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-ios-blue">{icon}</span>}
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        {hint && (
          <span className="rounded-full bg-slate-100/70 px-2.5 py-0.5 text-xs text-slate-600 backdrop-blur">
            {hint}
          </span>
        )}
      </div>
      {children}
    </GlassCard>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>;
}

function ReadField({
  label,
  value,
  sensitive,
  icon,
}: {
  label: string;
  value: string;
  sensitive?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <div className={sensitive ? "text-sm font-mono text-slate-700" : "text-sm text-slate-900"}>
        {value}
      </div>
    </div>
  );
}
