ALTER TABLE "provider_profiles"
ADD COLUMN IF NOT EXISTS "partner_id" UUID;

UPDATE "provider_profiles" provider
SET
  "partner_id" = partner."user_id"
FROM "partner_profiles" partner
WHERE provider."partner_id" IS NULL
  AND provider."network_code" IS NOT NULL
  AND provider."network_code" = partner."network_code";

CREATE INDEX IF NOT EXISTS "idx_provider_profiles_partner"
ON "provider_profiles"("partner_id");

ALTER TABLE "provider_profiles"
ADD CONSTRAINT "provider_profiles_partner_id_fkey"
FOREIGN KEY ("partner_id")
REFERENCES "users"("user_id")
ON DELETE SET NULL
ON UPDATE NO ACTION;
