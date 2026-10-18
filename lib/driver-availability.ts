type ApprovedLeave = {
  startDate: Date;
  endDate: Date;
};

/** True only while an approved leave includes the supplied instant. */
export function isCurrentlyOnLeave(leaves: ApprovedLeave[], now = new Date()) {
  return leaves.some((leave) => leave.startDate <= now && leave.endDate >= now);
}

/** ON_LEAVE is derived from approved leave dates; other availability statuses remain administrative. */
export function effectiveDriverStatus<T extends string>(status: T, onLeave: boolean): T | 'ACTIVE' | 'ON_LEAVE' {
  if (status !== 'ACTIVE' && status !== 'ON_LEAVE') return status;
  return onLeave ? 'ON_LEAVE' : 'ACTIVE';
}
