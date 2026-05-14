/**
 * 特休計算（到職週年日制） — 依勞基法第 38 條
 *
 *   滿 6 個月 ~ 1 年    → 3 天
 *   1 ~ 2 年            → 7 天
 *   2 ~ 3 年            → 10 天
 *   3 ~ 5 年            → 14 天
 *   5 ~ 10 年           → 15 天
 *   10 年以上            → 每年 +1，上限 30
 */

import { addYears, differenceInCalendarDays, isBefore, subDays } from "date-fns";

export type AnniversaryYear = {
  /** 第幾個年度，從 1 開始；0 代表「滿 6 個月但不滿 1 年」的過渡期 */
  yearIndex: number;
  /** 該年度起始日（含） */
  start: Date;
  /** 該年度結束日（含），即下一個週年日前一天 */
  end: Date;
  /** 該年度法定特休天數 */
  entitlement: number;
};

/**
 * 取得指定日期當下所屬的「特休年度」。
 * 若尚未滿 6 個月則回傳 null（無特休）。
 */
export function getCurrentAnniversaryYear(
  hireDate: Date,
  asOf: Date = new Date(),
): AnniversaryYear | null {
  if (isBefore(asOf, hireDate)) return null;

  const sixMonth = addMonths(hireDate, 6);
  if (isBefore(asOf, sixMonth)) return null;

  // 第一個週年日
  const firstAnniversary = addYears(hireDate, 1);

  if (isBefore(asOf, firstAnniversary)) {
    // 滿 6 個月但未滿 1 年 — 視為 yearIndex 0，3 天
    return {
      yearIndex: 0,
      start: sixMonth,
      end: subDays(firstAnniversary, 1),
      entitlement: 3,
    };
  }

  // 已滿一年以上：找到 asOf 所在的週年區間
  let yearIndex = 1;
  let start = firstAnniversary;
  while (true) {
    const nextStart = addYears(start, 1);
    if (isBefore(asOf, nextStart)) {
      return {
        yearIndex,
        start,
        end: subDays(nextStart, 1),
        entitlement: entitlementForYear(yearIndex),
      };
    }
    start = nextStart;
    yearIndex += 1;
  }
}

/** 第 N 個年度（已滿 N 年，未滿 N+1 年）對應的法定天數 */
export function entitlementForYear(yearIndex: number): number {
  if (yearIndex < 1) return 3; // 6 個月 ~ 1 年
  if (yearIndex < 2) return 7; // 1 ~ 2
  if (yearIndex < 3) return 10; // 2 ~ 3
  if (yearIndex < 5) return 14; // 3 ~ 5
  if (yearIndex < 10) return 15; // 5 ~ 10
  // 10 年以上：每滿一年 +1，上限 30
  return Math.min(30, 15 + (yearIndex - 9));
}

/** date-fns 的 addMonths 處理週期較複雜，這邊自己寫一個保守版本（用於 6 個月判定） */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // 處理月底邊界：若新月份沒有該日，setMonth 會跳到下個月，這裡修正回月底
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return d;
}

/**
 * 計算「整段日期區間」的請假天數（含起訖兩端）。
 * 不扣除週末（公司若需扣除請另算）。
 */
export function countLeaveDays(start: Date, end: Date, isHalfDay: boolean): number {
  if (isHalfDay) return 0.5;
  return differenceInCalendarDays(end, start) + 1;
}
