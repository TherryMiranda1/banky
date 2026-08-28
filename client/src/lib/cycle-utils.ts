const MONTH_NAMES_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

export interface CyclePeriodInfo {
  period: string; // YYYY-MM
  label: string;  // e.g. "Feb 2026"
  rangeLabel: string; // e.g. "21 Ene - 20 Feb"
  isCurrent: boolean;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parsePeriod(period: string): { year: number; month: number } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(period);
  if (!match) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1
    };
  }
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10)
  };
}

export function getCurrentPeriod(cutoffDay = 1, date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if (cutoffDay <= 1) {
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

export function formatCyclePeriod(period: string, cutoffDay = 1): CyclePeriodInfo {
  const { year, month } = parsePeriod(period);
  const monthName = MONTH_NAMES_ES[month - 1];
  const label = `${monthName} ${year}`;
  const currentPeriod = getCurrentPeriod(cutoffDay);

  let rangeLabel: string;
  if (cutoffDay <= 1) {
    const endDay = getDaysInMonth(year, month);
    rangeLabel = `1 ${monthName} - ${endDay} ${monthName}`;
  } else {
    let startYear = year;
    let startMonth = month - 1;
    if (month === 1) {
      startYear = year - 1;
      startMonth = 12;
    }
    const daysInPrev = getDaysInMonth(startYear, startMonth);
    const startDay = Math.min(cutoffDay + 1, daysInPrev);
    const prevMonthName = MONTH_NAMES_ES[startMonth - 1];

    const daysInCurrent = getDaysInMonth(year, month);
    const endDay = Math.min(cutoffDay, daysInCurrent);

    rangeLabel = `${startDay} ${prevMonthName} - ${endDay} ${monthName}`;
  }

  return {
    period,
    label,
    rangeLabel,
    isCurrent: period === currentPeriod
  };
}

export function getAdjacentPeriod(basePeriod: string, offset: number): string {
  const { year, month } = parsePeriod(basePeriod);
  let targetMonth = month + offset;
  let targetYear = year;

  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }

  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
}

export function generateAdjacentPeriods(
  basePeriod: string,
  pastCount = 5,
  futureCount = 1
): string[] {
  const { year, month } = parsePeriod(basePeriod);
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
