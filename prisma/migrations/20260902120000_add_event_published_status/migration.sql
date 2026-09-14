ALTER TABLE "events"
ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "published_at" TIMESTAMP(6);

UPDATE "events"
SET "published" = true,
    "published_at" = COALESCE("published_at", "created_at")
WHERE LOWER(TRIM(COALESCE("status", ''))) = 'published';

CREATE INDEX "idx_events_published" ON "events"("published");
