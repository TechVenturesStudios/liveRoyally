CREATE TABLE IF NOT EXISTS "network_codes" (
  "zip_code" VARCHAR(10) PRIMARY KEY,
  "parish" VARCHAR(100),
  "network_name" VARCHAR(100) NOT NULL,
  "network_code" VARCHAR(50) NOT NULL,
  "state" VARCHAR(50),
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_network_codes_network_code" ON "network_codes" ("network_code");
CREATE INDEX IF NOT EXISTS "idx_network_codes_state" ON "network_codes" ("state");
