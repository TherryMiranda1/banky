import { BadRequestError } from "../../errors/AppError.js";

export interface PeriodRange {
  period: string;
  from: string;
  to: string;
  label: string;
  dateRangeLabel: string;
}

const MONTH_NAMES_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

export class BillingCycleService {
  /**
   * Validate that cutoffDay is an integer between 1 and 31, defaulting to 1 if null/undefined.
   */
  public static validateCutoffDay(cutoffDay: number | unknown): number {
    if (cutoffDay === undefined || cutoffDay === null || cutoffDay === "") {
      return 1;
    }
    const parsed = typeof cutoffDay === "number" ? cutoffDay : parseInt(String(cutoffDay), 10);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
      throw new BadRequestError("cutoffDay must be an integer between 1 and 31");
    }
    return parsed;
  }

  /**
   * Validate and parse YYYY-MM string into year and month (1-indexed).
   */
  public static parsePeriod(period: string): { year: number; month: number } {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(period);
    if (!match) {
      throw new BadRequestError("Period must be in YYYY-MM format (e.g. 2026-02)");
    }
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10)
    };
  }

  /**
   * Returns the total number of days in a given month of a given year.
   */
  public static getDaysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  /**
   * Calculates the exact ISO date range [from, to] for a financial period YYYY-MM and cutoffDay.
   */
  public static getPeriodRange(period: string, cutoffDay: number): PeriodRange {
    this.validateCutoffDay(cutoffDay);
    const { year, month } = this.parsePeriod(period);

    let startYear: number;
    let startMonth: number;
    let startDay: number;

    let endYear: number;
    let endMonth: number;
    let endDay: number;

    if (cutoffDay === 1) {
      startYear = year;
      startMonth = month;
      startDay = 1;

      endYear = year;
      endMonth = month;
      endDay = this.getDaysInMonth(year, month);
    } else {
      // Starts in previous month (month - 1) on (cutoffDay + 1)
      if (month === 1) {
        startYear = year - 1;
        startMonth = 12;
      } else {
        startYear = year;
        startMonth = month - 1;
      }

      const daysInPrevMonth = this.getDaysInMonth(startYear, startMonth);
      startDay = Math.min(cutoffDay + 1, daysInPrevMonth);

      // Ends in current month (month) on cutoffDay
      endYear = year;
      endMonth = month;
      const daysInCurrentMonth = this.getDaysInMonth(endYear, endMonth);
      endDay = Math.min(cutoffDay, daysInCurrentMonth);
    }

    const startMonthStr = String(startMonth).padStart(2, "0");
    const startDayStr = String(startDay).padStart(2, "0");
    const from = `${startYear}-${startMonthStr}-${startDayStr}T00:00:00.000Z`;

    const endMonthStr = String(endMonth).padStart(2, "0");
    const endDayStr = String(endDay).padStart(2, "0");
    const to = `${endYear}-${endMonthStr}-${endDayStr}T23:59:59.999Z`;

    const monthName = MONTH_NAMES_ES[month - 1];
    const label = `${monthName} ${year}`;

    let dateRangeLabel: string;
    if (cutoffDay === 1) {
      dateRangeLabel = `1 ${monthName} - ${endDay} ${monthName}`;
    } else {
      const prevMonthName = MONTH_NAMES_ES[startMonth - 1];
      dateRangeLabel = `${startDay} ${prevMonthName} - ${endDay} ${monthName}`;
    }

    return {
      period,
      from,
      to,
      label,
      dateRangeLabel
    };
  }

  /**
   * Determines the active cycle period (YYYY-MM) for a given date and cutoffDay.
   */
  public static getCurrentPeriod(cutoffDay: number, date: Date = new Date()): string {
    this.validateCutoffDay(cutoffDay);

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // 1-indexed
    const day = date.getUTCDate();

    if (cutoffDay === 1) {
      return `${year}-${String(month).padStart(2, "0")}`;
    }

    // If current day > cutoffDay, we are in the cycle ending in next month
    if (day > cutoffDay) {
      if (month === 12) {
        return `${year + 1}-01`;
      }
      return `${year}-${String(month + 1).padStart(2, "0")}`;
    }

    // If day <= cutoffDay, cycle ends in current month
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  /**
   * Generates a sequence of adjacent periods around a central period.
   */
  public static getAdjacentPeriods(
    basePeriod: string,
    pastCount = 5,
    futureCount = 1
  ): string[] {
    const { year, month } = this.parsePeriod(basePeriod);
    const periods: string[] = [];

    for (let i = -pastCount; i <= futureCount; i++) {
      let targetMonth = month + i;
      let targetYear = year;

      while (targetMonth < 1) {
        targetMonth += 12;
        targetYear -= 1;
      }

      while (targetMonth > 12) {
        targetMonth -= 12;
        targetYear += 1;
      }

      periods.push(`${targetYear}-${String(targetMonth).padStart(2, "0")}`);
    }

    return periods;
  }
}
