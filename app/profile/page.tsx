import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decryptPII, maskPII } from "@/lib/crypto";
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

      {/* 任職資料（唯讀） */}
      <Section title="任職資料" hint="HR 維護">
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

      {/* 個人基本資料（部分可編輯） */}
      <Section title="個人資料 / 聯絡方式" hint="可自行更新">
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

      {/* 敏感資料（遮罩） */}
      <Section title="薪資 / 證件資料" hint="僅 HR 可修改，您只看得到遮罩">
        <Grid>
          <ReadField label="身分證字號" value={nationalIdMasked || "—"} />
          <ReadField label="銀行" value={user.profile?.bankName ?? "—"} />
          <ReadField label="薪轉帳戶" value={bankAccountMasked || "—"} />
        </Grid>
        <p className="mt-3 text-xs text-slate-500">
          若需更新身分證或銀行帳號，請聯繫 HR。
        </p>
      </Section>
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
