CREATE TABLE "partner_square_connections" (
    "user_id" UUID NOT NULL,
    "merchant_id" VARCHAR(100) NOT NULL,
    "location_id" VARCHAR(100),
    "access_token_ciphertext" TEXT,
    "refresh_token_ciphertext" TEXT,
    "access_token_expires_at" TIMESTAMP(6),
    "scopes" TEXT,
    "connected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_square_connections_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "idx_partner_square_connections_merchant" ON "partner_square_connections"("merchant_id");

ALTER TABLE "partner_square_connections" ADD CONSTRAINT "partner_square_connections_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
