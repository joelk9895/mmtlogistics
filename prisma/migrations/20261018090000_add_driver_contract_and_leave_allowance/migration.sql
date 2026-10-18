-- Track contract terms and give every driver a fixed annual leave allowance.
ALTER TABLE "Driver"
  ADD COLUMN "contractStartDate" TIMESTAMP(3),
  ADD COLUMN "contractEndDate" TIMESTAMP(3),
  ADD COLUMN "contractNumber" TEXT,
  ADD COLUMN "noticePeriodDays" INTEGER,
  ADD COLUMN "annualLeaveAllowance" INTEGER NOT NULL DEFAULT 21;
