-- CreateTable
CREATE TABLE "source_documents" (
    "id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "document_date" DATE,
    "page_count" INTEGER NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "model_year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_versions" (
    "id" UUID NOT NULL,
    "vehicle_model_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "model_code" TEXT NOT NULL,
    "configuration_code" TEXT NOT NULL,
    "optional_code" TEXT NOT NULL,
    "engine" TEXT,
    "transmission" TEXT,
    "fuel" TEXT,
    "seat_count" INTEGER,
    "raw_content" TEXT NOT NULL,
    "public_price_national" DECIMAL(14,2) NOT NULL,
    "public_price_zfm" DECIMAL(14,2),
    "source_document_id" UUID NOT NULL,
    "source_page" INTEGER NOT NULL,
    "list_number" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "matching_rule" TEXT NOT NULL,
    "field_evidence" JSONB NOT NULL,
    "observations" TEXT,
    "sort_order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_configurations" (
    "id" UUID NOT NULL,
    "vehicle_version_id" UUID NOT NULL,
    "model_code" TEXT NOT NULL,
    "configuration_code" TEXT NOT NULL,
    "optional_code" TEXT NOT NULL,
    "source_page" INTEGER NOT NULL,
    "raw_content" TEXT NOT NULL,

    CONSTRAINT "vehicle_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paint_colors" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "hex_approximation" TEXT,
    "paint_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paint_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_paint_colors" (
    "id" UUID NOT NULL,
    "vehicle_version_id" UUID NOT NULL,
    "paint_color_id" UUID NOT NULL,
    "additional_price_national" DECIMAL(14,2) NOT NULL,
    "additional_price_zfm" DECIMAL(14,2),
    "available" BOOLEAN NOT NULL DEFAULT true,
    "allowed_optional_codes" TEXT[],
    "source_page" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "version_paint_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" UUID NOT NULL,
    "asset_key" TEXT NOT NULL,
    "vehicle_model_id" UUID NOT NULL,
    "vehicle_version_id" UUID,
    "paint_color_id" UUID,
    "view_name" TEXT NOT NULL,
    "local_path" TEXT,
    "original_source_url" TEXT,
    "source_domain" TEXT,
    "mime_type" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" CHAR(64),
    "status" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "source_sha256" TEXT NOT NULL,
    "models_found" INTEGER NOT NULL DEFAULT 0,
    "versions_found" INTEGER NOT NULL DEFAULT 0,
    "versions_imported" INTEGER NOT NULL DEFAULT 0,
    "ambiguous_matches" INTEGER NOT NULL DEFAULT 0,
    "missing_matches" INTEGER NOT NULL DEFAULT 0,
    "report_path" TEXT,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_documents_sha256_key" ON "source_documents"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_slug_key" ON "vehicle_models"("slug");

-- CreateIndex
CREATE INDEX "vehicle_models_active_category_idx" ON "vehicle_models"("active", "category");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_name_model_year_key" ON "vehicle_models"("name", "model_year");

-- CreateIndex
CREATE INDEX "vehicle_versions_active_public_price_national_idx" ON "vehicle_versions"("active", "public_price_national");

-- CreateIndex
CREATE INDEX "vehicle_versions_source_document_id_source_page_idx" ON "vehicle_versions"("source_document_id", "source_page");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_versions_vehicle_model_id_slug_model_code_configura_key" ON "vehicle_versions"("vehicle_model_id", "slug", "model_code", "configuration_code", "optional_code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_versions_vehicle_model_id_slug_key" ON "vehicle_versions"("vehicle_model_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_configurations_vehicle_version_id_model_code_config_key" ON "vehicle_configurations"("vehicle_version_id", "model_code", "configuration_code", "optional_code");

-- CreateIndex
CREATE UNIQUE INDEX "paint_colors_slug_key" ON "paint_colors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "version_paint_colors_vehicle_version_id_paint_color_id_key" ON "version_paint_colors"("vehicle_version_id", "paint_color_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_images_asset_key_key" ON "vehicle_images"("asset_key");

-- CreateIndex
CREATE INDEX "vehicle_images_vehicle_model_id_paint_color_id_status_idx" ON "vehicle_images"("vehicle_model_id", "paint_color_id", "status");

-- AddForeignKey
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_vehicle_model_id_fkey" FOREIGN KEY ("vehicle_model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "source_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_configurations" ADD CONSTRAINT "vehicle_configurations_vehicle_version_id_fkey" FOREIGN KEY ("vehicle_version_id") REFERENCES "vehicle_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_paint_colors" ADD CONSTRAINT "version_paint_colors_vehicle_version_id_fkey" FOREIGN KEY ("vehicle_version_id") REFERENCES "vehicle_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_paint_colors" ADD CONSTRAINT "version_paint_colors_paint_color_id_fkey" FOREIGN KEY ("paint_color_id") REFERENCES "paint_colors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_model_id_fkey" FOREIGN KEY ("vehicle_model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_version_id_fkey" FOREIGN KEY ("vehicle_version_id") REFERENCES "vehicle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_paint_color_id_fkey" FOREIGN KEY ("paint_color_id") REFERENCES "paint_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
