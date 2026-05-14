import { prisma } from "@/lib/prisma";
import { getCurrentAnniversaryYear, type AnniversaryYear } from "@/lib/leave";
import { LeaveStatus } from "@prisma/client";

export type BalanceSummary = {
  year: AnniversaryYear | null;
  entitlement: number;
  adjustments: number;
  used: number; // 已核准
  pending: number; // 申請中（不含核准）
  remaining: number; // 可申請 = entitlement + adjustments - used - pending
  annualLeaveEnabled: boolean; // 員工是否享有特休
};

/**
 * 計算指定員工於指定基準日所在週年度的特休餘額。
 */
export async function getBalance(userId: string, asOf: Date = new Date()): Promise<BalanceSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hireDate: true, annualLeaveEnabled: true },
  });
  if (!user) {
    return {
      year: null,
      entitlement: 0,
      adjustments: 0,
      used: 0,
      pending: 0,
      remaining: 0,
      annualLeaveEnabled: false,
    };
  }

  // 不享特休（兼職、工讀等未開啟）→ 全部回零、不算週年度
  if (!user.annualLeaveEnabled) {
    return {
      year: null,
      entitlement: 0,
      adjustments: 0,
      used: 0,
      pending: 0,
      remaining: 0,
      annualLeaveEnabled: false,
    };
  }

  const year = getCurrentAnniversaryYear(user.hireDate, asOf);
  if (!year) {
    return {
      year: null,
      entitlement: 0,
      adjustments: 0,
      used: 0,
      pending: 0,
      remaining: 0,
      annualLeaveEnabled: true,
    };
  }

  const [adjustmentAgg, requestAgg] = await Promise.all([
    prisma.balanceAdjustment.aggregate({
      where: { userId, anniversaryYearStart: year.start },
      _sum: { days: true },
    }),
    prisma.leaveRequest.groupBy({
      by: ["status"],
      where: {
        requesterId: userId,
        status: { in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
        // 申請的起始日落在此週年度內
        startDate: { gte: year.start, lte: year.end },
      },
      _sum: { days: true },
    }),
  ]);

  const adjustments = adjustmentAgg._sum.days ?? 0;
  const used = requestAgg.find((r) => r.status === LeaveStatus.APPROVED)?._sum.days ?? 0;
  const pending = requestAgg.find((r) => r.status === LeaveStatus.PENDING)?._sum.days ?? 0;
  const remaining = year.entitlement + adjustments - used - pending;

  return {
    year,
    entitlement: year.entitlement,
    adjustments,
    used,
    pending,
    remaining,
    annualLeaveEnabled: true,
  };
}
