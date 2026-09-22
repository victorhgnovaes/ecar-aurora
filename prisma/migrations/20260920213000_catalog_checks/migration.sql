ALTER TABLE vehicle_versions ADD CONSTRAINT vehicle_price_nonnegative CHECK (public_price_national >= 0 AND (public_price_zfm IS NULL OR public_price_zfm >= 0));
ALTER TABLE vehicle_versions ADD CONSTRAINT vehicle_source_page_positive CHECK (source_page > 0);
ALTER TABLE version_paint_colors ADD CONSTRAINT paint_price_nonnegative CHECK (additional_price_national >= 0 AND (additional_price_zfm IS NULL OR additional_price_zfm >= 0));
ALTER TABLE vehicle_models ADD CONSTRAINT model_year_valid CHECK (model_year BETWEEN 1900 AND 2200);
ALTER TABLE vehicle_images ADD CONSTRAINT vehicle_image_status_valid CHECK (status IN ('READY','MISSING'));
ALTER TABLE version_discounts ADD CONSTRAINT discount_rate_valid CHECK (rate BETWEEN 0 AND 1);
