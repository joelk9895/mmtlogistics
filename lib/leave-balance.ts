export type LeaveLike = {
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Number of calendar days in a leave that fall in the supplied calendar year. */
export function leaveDaysInYear(leave: Pick<LeaveLike, 'startDate' | 'endDate'>, year: number) {
  const start = Math.max(startOfUtcDay(leave.startDate), Date.UTC(year, 0, 1));
  const end = Math.min(startOfUtcDay(leave.endDate), Date.UTC(year, 11, 31));
  return end < start ? 0 : Math.floor((end - start) / DAY_MS) + 1;
}

export function leaveBalance(leaves: LeaveLike[], annualAllowance: number, year = new Date().getUTCFullYear()) {
  const counted = leaves.filter((leave) => leave.status !== 'REJECTED');
  const approved = leaves
    .filter((leave) => leave.status === 'APPROVED')
    .reduce((total, leave) => total + leaveDaysInYear(leave, year), 0);
  const pending = leaves
    .filter((leave) => leave.status === 'PENDING')
    .reduce((total, leave) => total + leaveDaysInYear(leave, year), 0);
  const reserved = counted.reduce((total, leave) => total + leaveDaysInYear(leave, year), 0);

  return {
    year,
    allowance: annualAllowance,
    approved,
    pending,
    reserved,
    remaining: Math.max(0, annualAllowance - reserved),
  };
}
