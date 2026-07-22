ALTER TABLE "member_vouchers"
ADD COLUMN "qr_code_payload" TEXT;

CREATE INDEX "idx_member_vouchers_qr_code_payload"
ON "member_vouchers"("qr_code_payload");

UPDATE "member_vouchers" mv
SET "qr_code_payload" = json_build_object(
  'voucherId', v.voucher_id,
  'eventId', COALESCE(v.event_id, ''),
  'useCaseId', COALESCE(v.type, 'N'),
  'networkId', COALESCE(pp.network_code, ''),
  'userId', mv.member_id::text
)::text
FROM vouchers v
JOIN provider_profiles pp
  ON pp.user_id = v.provider_id
WHERE mv.voucher_id = v.voucher_id
  AND mv.qr_code_payload IS NULL;
