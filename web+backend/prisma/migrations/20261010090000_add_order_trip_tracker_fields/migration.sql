-- Support an ordered multi-stop route while retaining legacy pickup/drop-off
-- columns for existing records.
CREATE TYPE "LocationType" AS ENUM ('PICKUP', 'DROPOFF', 'INTERMEDIATE');

ALTER TABLE "Order"
  ALTER COLUMN "pickupLocation" DROP NOT NULL,
  ALTER COLUMN "dropoffLocation" DROP NOT NULL;

CREATE TABLE "OrderLocation" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "LocationType" NOT NULL DEFAULT 'PICKUP',
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "address" TEXT NOT NULL,
  "city" TEXT,
  "region" TEXT,
  "postalCode" TEXT,
  "country" TEXT DEFAULT 'SA',
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "contactName" TEXT,
  "contactPhone" TEXT,
  "contactEmail" TEXT,
  "scheduledDate" TIMESTAMP(3),
  "actualDate" TIMESTAMP(3),
  "instructions" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderLocation_orderId_sequence_key" ON "OrderLocation"("orderId", "sequence");
ALTER TABLE "OrderLocation" ADD CONSTRAINT "OrderLocation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add the commercial, trip, delivery, cost, and audit fields captured in the
-- operational trip tracker. All fields are optional so existing orders remain valid.
ALTER TABLE "Order"
  ADD COLUMN "waybillNumber" TEXT,
  ADD COLUMN "deliveryNoteNumber" TEXT,
  ADD COLUMN "invoiceNumber" TEXT,
  ADD COLUMN "rfqNumber" TEXT,
  ADD COLUMN "attachmentReferences" TEXT,
  ADD COLUMN "division" TEXT,
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "requestedBy" TEXT,
  ADD COLUMN "requestedDate" TIMESTAMP(3),
  ADD COLUMN "unloadingFinishedAt" TIMESTAMP(3),
  ADD COLUMN "deliveryDurationHours" DOUBLE PRECISION,
  ADD COLUMN "transitTime" TEXT,
  ADD COLUMN "serviceProvider" TEXT,
  ADD COLUMN "serviceProviderName" TEXT,
  ADD COLUMN "externalDriverName" TEXT,
  ADD COLUMN "externalVehicleNumber" TEXT,
  ADD COLUMN "externalVehicleType" TEXT,
  ADD COLUMN "additionalComments" TEXT,
  ADD COLUMN "waitingLabor" TEXT,
  ADD COLUMN "deliveryStatus" TEXT,
  ADD COLUMN "receiver" TEXT,
  ADD COLUMN "podStatus" TEXT,
  ADD COLUMN "costAmount" DOUBLE PRECISION,
  ADD COLUMN "driverTa" DOUBLE PRECISION,
  ADD COLUMN "tripCost" DOUBLE PRECISION,
  ADD COLUMN "handledBy" TEXT,
  ADD COLUMN "confirmedBy" TEXT,
  ADD COLUMN "auditPro" TEXT;

CREATE INDEX "Order_waybillNumber_idx" ON "Order"("waybillNumber");
CREATE INDEX "Order_deliveryNoteNumber_idx" ON "Order"("deliveryNoteNumber");
CREATE INDEX "Order_invoiceNumber_idx" ON "Order"("invoiceNumber");
