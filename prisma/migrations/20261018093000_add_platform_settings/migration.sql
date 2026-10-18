-- Organization-wide defaults. Existing leave values become inherited defaults.
ALTER TABLE "Driver"
  ALTER COLUMN "annualLeaveAllowance" DROP NOT NULL,
  ALTER COLUMN "annualLeaveAllowance" DROP DEFAULT,
  ADD COLUMN "usePlatformLeaveAllowance" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "monthlyAllowance" DOUBLE PRECISION;

CREATE TABLE "PlatformSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "companyName" TEXT NOT NULL DEFAULT 'MMT Logistics',
  "supportEmail" TEXT,
  "supportPhone" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'SAR',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  "defaultAnnualLeaveDays" INTEGER NOT NULL DEFAULT 21,
  "defaultMonthlyAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "defaultNoticePeriodDays" INTEGER NOT NULL DEFAULT 30,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformSettings" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
