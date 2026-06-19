/*
  Warnings:

  - A unique constraint covering the columns `[voucher_id]` on the table `event_provider_invites` will be added. If there are existing duplicate values, this will fail.

*/

-- If the database already has duplicate voucher references, keep the earliest
-- invite for each voucher_id and detach the rest before adding uniqueness.
WITH ranked_invites AS (
  SELECT
    invite_id,
    ROW_NUMBER() OVER (
      PARTITION BY voucher_id
      ORDER BY invited_at ASC NULLS LAST, invite_id ASC
    ) AS rn
  FROM event_provider_invites
  WHERE voucher_id IS NOT NULL
)
UPDATE event_provider_invites epi
SET voucher_id = NULL
FROM ranked_invites ri
WHERE epi.invite_id = ri.invite_id
  AND ri.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "event_provider_invites_voucher_id_key"
ON "event_provider_invites"("voucher_id");
