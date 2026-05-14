import { prisma } from "@/lib/prisma";
import { LeaveStatus, type HalfDayPeriod } from "@prisma/client";
import { isAfter, isBefore, startOfDay } from "date-fns";
import { countLeaveDays, getCurrentAnniversaryYear } from "@/lib/leave";
import { getBalance } from "@/lib/balance";

export type CreateLeaveInput = {
  startDate: Date;
  endDate: Date;
  isHalfDay: boolean;
  halfDayPeriod: HalfDayPeriod | null;
  reason: string;
};

export type ValidationResult =
  | { ok: true; days: number }
  | { ok: false; error: string };

/**
 * 驗證一筆新申請是否合法。回傳實際天數（伺服器自行計算，不信任 client）。
 */
export async function validateLeaveRequest(
  userId: string,
  input: CreateLeaveInput,
): Promise<ValidationResult> {
  const today = startOfDay(new Date());
  const start = startOfDay(input.startDate);
  const end = startOfDay(input.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { ok: false, error: "日期格式不正確" };
  }
  if (isBefore(end, start)) {
    return { ok: false, error: "結束日不能早於起始日" };
  }
  if (isBefore(start, today)) {
    return { ok: false, error: "不能申請過去的日期" };
  }
  if (!input.reason.trim()) {
    return { ok: false, error: "請填寫事由" };
  }

  if (input.isHalfDay) {
    if (start.getTime() !== end.getTime()) {
      return { ok: false, error: "半天假的起訖日必須相同" };
    }
    if (!input.halfDayPeriod) {
      return { ok: false, error: "半天假請選擇上午或下午" };
    }
  }

  const days = countLeaveDays(start, end, input.isHalfDay);

  // 取得使用者到職日，計算本年度週年期
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hireDate: true },
  });
  if (!user) return { ok: false, error: "查無使用者" };

  const startYear = getCurrentAnniversaryYear(user.hireDate, start);
  const endYear = getCurrentAnniversaryYear(user.hireDate, end);
  if (!startYear || !endYear) {
    return { ok: false, error: "申請日期不在可請假的特休年度內（可能尚未滿 6 個月）" };
  }
  if (startYear.start.getTime() !== endYear.start.getTime()) {
    return { ok: false, error: "申請不可跨越特休週年度，請拆成兩筆" };
  }

  // 餘額檢查
  const balance = await getBalance(userId, start);
  if (days > balance.remaining) {
    return {
      ok: false,
      error: `特休不足：可申請 ${balance.remaining} 天，本次需 ${days} 天`,
    };
  }

  // 重疊檢查（同一人 PENDING / APPROVED 不可重疊）
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      requesterId: userId,
      status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      // overlap 條件：NOT(existing.end < new.start OR existing.start > new.end)
      AND: [{ endDate: { gte: start } }, { startDate: { lte: end } }],
    },
  });
  if (overlap) {
    return { ok: false, error: "與既有申請日期重疊" };
  }

  return { ok: true, days };
}

/** 確認申請屬於指定使用者，且為可取消狀態 */
export function canCancel(
  request: { requesterId: string; status: LeaveStatus },
  userId: string,
): boolean {
  return request.requesterId === userId && request.status === LeaveStatus.PENDING;
}

/** 將狀態變動寫入 audit log */
export async function logAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/** 將 ISO date string (YYYY-MM-DD) 轉成 UTC midnight Date，避免時區飄移 */
export function parseDateInput(s: string): Date {
  // Date input value is already YYYY-MM-DD
  const d = new Date(`${s}T00:00:00.000Z`);
  return d;
}

// re-export for convenience
export { isAfter };
