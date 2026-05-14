import { addYears, isBefore, subDays } from "date-fns";
import { LeaveStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { entitlementForYear } from "@/lib/leave";

export type PendingPayout = {
  userId: string;
  employeeNo: string;
  name: string;
  department: string | null;
  hireDate: Date;
  /** 已結束的週年度起始日（過去的某個週年日） */
  anniversaryYearStart: Date;
  /** 該週年度結束日（下一個週年日前一天） */
  anniversaryYearEnd: Date;
  /** 該年度未休完天數（含 admin 調整） */
  unusedDays: number;
};

/**
 * 找出所有「上一個週年度已結束、尚未結算、且仍有剩餘未休」的員工。
 * 「上一個週年度」= 員工最後一個已過完的週年度（end < today）。
 */
export async function findPendingPayouts(asOf: Date = new Date()): Promise<PendingPayout[]> {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, employeeNo: true, name: true, department: true, hireDate: true },
  });

  const result: PendingPayout[] = [];

  for (const u of users) {
    // 計算當下所屬週年度
    // 上一週年度的 yearIndex 必須 >= 1 才有意義（員工已滿至少 1 年）
    const elapsedYears = Math.floor(
      (asOf.getTime() - u.hireDate.getTime()) / (365.25 * 24 * 3600 * 1000),
    );
    if (elapsedYears < 1) continue;

    // 上一個週年度起始日 = hireDate + (elapsedYears - 1) 年
    const prevStart = addYears(u.hireDate, elapsedYears - 1);
    const prevEnd = subDays(addYears(prevStart, 1), 1);

    // 必須真的已結束
    if (!isBefore(prevEnd, asOf)) continue;

    // 已結算過？
    const existing = await prisma.leavePayout.findFirst({
      where: { userId: u.id, anniversaryYearStart: prevStart },
      select: { id: true },
    });
    if (existing) continue;

    // 計算未休完天數
    const yearIndexAtPrev = elapsedYears - 1;
    const entitlement = entitlementForYear(yearIndexAtPrev);

    const [adjAgg, usedAgg] = await Promise.all([
      prisma.balanceAdjustment.aggregate({
        where: { userId: u.id, anniversaryYearStart: prevStart },
        _sum: { days: true },
      }),
      prisma.leaveRequest.aggregate({
        where: {
          requesterId: u.id,
          status: LeaveStatus.APPROVED,
          startDate: { gte: prevStart, lte: prevEnd },
        },
        _sum: { days: true },
      }),
    ]);

    const adjustments = adjAgg._sum.days ?? 0;
    const used = usedAgg._sum.days ?? 0;
    const unused = entitlement + adjustments - used;
    if (unused <= 0) continue;

    result.push({
      userId: u.id,
      employeeNo: u.employeeNo,
      name: u.name,
      department: u.department,
      hireDate: u.hireDate,
      anniversaryYearStart: prevStart,
      anniversaryYearEnd: prevEnd,
      unusedDays: unused,
    });
  }

  return result;
}
