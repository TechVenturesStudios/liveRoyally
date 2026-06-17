CREATE TABLE IF NOT EXISTS "authorized_representative_assignments" (
  "assignment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "principal_user_id" UUID NOT NULL,
  "represented_user_id" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "authorized_representative_assignments_pkey" PRIMARY KEY ("assignment_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_authorized_rep_principal_represented"
ON "authorized_representative_assignments"("principal_user_id", "represented_user_id");

CREATE INDEX IF NOT EXISTS "idx_authorized_rep_principal"
ON "authorized_representative_assignments"("principal_user_id");

CREATE INDEX IF NOT EXISTS "idx_authorized_rep_represented"
ON "authorized_representative_assignments"("represented_user_id");

CREATE INDEX IF NOT EXISTS "idx_authorized_rep_active"
ON "authorized_representative_assignments"("is_active");

ALTER TABLE "authorized_representative_assignments"
ADD CONSTRAINT "authorized_representative_assignments_principal_user_id_fkey"
FOREIGN KEY ("principal_user_id")
REFERENCES "users"("user_id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "authorized_representative_assignments"
ADD CONSTRAINT "authorized_representative_assignments_represented_user_id_fkey"
FOREIGN KEY ("represented_user_id")
REFERENCES "users"("user_id")
ON DELETE CASCADE ON UPDATE NO ACTION;
