export const BED_STATUS = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  INACTIVE: "Inactive",
} as const;

export const RESIDENT_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  RESERVED: "Reserved",
  NOTICE_PERIOD: "Notice Period",
  CHECKED_OUT: "Checked Out",
  ARCHIVED: "Archived",
} as const;

export type ResidentStatus =
  (typeof RESIDENT_STATUS)[keyof typeof RESIDENT_STATUS];

const PRESERVED_RESIDENT_STATUSES = new Set<ResidentStatus>([
  RESIDENT_STATUS.RESERVED,
  RESIDENT_STATUS.NOTICE_PERIOD,
  RESIDENT_STATUS.CHECKED_OUT,
  RESIDENT_STATUS.ARCHIVED,
]);

export function getOperationalResidentStatus(
  profileStatus: ResidentStatus,
  hasActiveAdmission: boolean,
): ResidentStatus {
  if (PRESERVED_RESIDENT_STATUSES.has(profileStatus)) return profileStatus;

  return hasActiveAdmission
    ? RESIDENT_STATUS.ACTIVE
    : RESIDENT_STATUS.INACTIVE;
}

export type BedStatus = (typeof BED_STATUS)[keyof typeof BED_STATUS];
export type ReadableBedStatus = BedStatus | "Available";

export const ALLOCATABLE_BED_STATUSES = [
  BED_STATUS.VACANT,
  "Available",
] as const;

export const OPERATIONAL_BED_STATUSES = [
  BED_STATUS.VACANT,
  BED_STATUS.OCCUPIED,
  "Available",
] as const;

export function isAllocatableBedStatus(
  status: string | null | undefined,
): status is "Vacant" | "Available" {
  return status === BED_STATUS.VACANT || status === "Available";
}

export function isVacantBedStatus(status: string | null | undefined) {
  return isAllocatableBedStatus(status);
}

export function isOperationalBedStatus(
  status: string | null | undefined,
) {
  return OPERATIONAL_BED_STATUSES.some((value) => value === status);
}
