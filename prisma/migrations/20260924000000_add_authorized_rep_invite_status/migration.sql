ALTER TABLE "authorized_representative_assignments"
ADD COLUMN IF NOT EXISTS "invite_status" VARCHAR(20) NOT NULL DEFAULT 'accepted';

ALTER TABLE "authorized_representative_assignments"
ADD COLUMN IF NOT EXISTS "responded_at" TIMESTAMP(6);

UPDATE "authorized_representative_assignments"
SET "invite_status" = CASE WHEN "is_active" THEN 'accepted' ELSE 'declined' END
WHERE "invite_status" = 'accepted';

ALTER TABLE "authorized_representative_assignments"
DROP CONSTRAINT IF EXISTS "authorized_rep_invite_status_check";

ALTER TABLE "authorized_representative_assignments"
ADD CONSTRAINT "authorized_rep_invite_status_check"
CHECK ("invite_status" IN ('pending', 'accepted', 'declined'));

CREATE INDEX IF NOT EXISTS "idx_authorized_rep_invite_status"
ON "authorized_representative_assignments"("invite_status");
