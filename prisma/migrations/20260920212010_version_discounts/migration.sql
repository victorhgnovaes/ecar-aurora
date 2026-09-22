-- CreateTable
CREATE TABLE "version_discounts" (
    "id" UUID NOT NULL,
    "vehicle_version_id" UUID NOT NULL,
    "rate" DECIMAL(9,6) NOT NULL,
    "source_file_name" TEXT NOT NULL,
    "source_sha256" CHAR(64) NOT NULL,
    "source_sheet" TEXT NOT NULL,
    "source_cell" TEXT NOT NULL,
    "source_row" INTEGER NOT NULL,
    "source_title" TEXT NOT NULL,
    "raw_rate" TEXT NOT NULL,
    "calculation_rule" TEXT NOT NULL,
    "audit" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "version_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "version_discounts_vehicle_version_id_key" ON "version_discounts"("vehicle_version_id");

-- AddForeignKey
ALTER TABLE "version_discounts" ADD CONSTRAINT "version_discounts_vehicle_version_id_fkey" FOREIGN KEY ("vehicle_version_id") REFERENCES "vehicle_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
