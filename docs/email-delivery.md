# Email delivery architecture

The application now uses a Postgres outbox plus an SQS-triggered AWS Lambda worker:

1. API routes call `queueEmail()` after the business transaction succeeds.
2. `email_jobs` stores a complete snapshot of the recipient, subject, rendered bodies, template key, scheduling metadata, and idempotency key.
3. `queueEmail()` sends the database job ID to SQS. Lambda receives SQS batches, claims each job with `FOR UPDATE`, sends through SES, and records the SES message ID or failure.
4. Jobs retry up to `EMAIL_MAX_ATTEMPTS` (default 5), with stale processing jobs becoming claimable again after 10 minutes.
5. Admins can inspect the log at `/dashboard/email-delivery`; the API is `/api/admin/email-jobs`.

## AWS wiring

- Apply the migration with `prisma migrate deploy`.
- Install the Lambda dependencies from `lambda-build/package.json` and deploy `processEmailJobs.handler`.
- Create a Standard SQS queue and a Standard dead-letter queue. Configure the main queue with a redrive policy of five receives, then add the main queue as the DLQ's allowed source queue.
- Add the SQS queue as a Lambda trigger with partial batch failure reporting enabled. Start with a batch size of 10 and a bounded Lambda concurrency.
- Give the application `sqs:SendMessage`, and give the Lambda `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`, `ses:SendEmail`, and `ses:SendRawEmail` permissions. The Lambda also needs network access to Postgres. If Postgres is private, place the Lambda in the VPC and allow its security group to connect to the database.
- Configure `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, `AWS_REGION`, `SES_FROM_EMAIL`, `EMAIL_QUEUE_URL`, `EMAIL_MAX_ATTEMPTS`, and optionally `EMAIL_CONCURRENCY`.
- Configure `EMAIL_SCHEDULER_SECRET` and invoke `POST /api/jobs/schedule-voucher-expiring` once daily from EventBridge Scheduler or an equivalent cron service. Send the secret as `Authorization: Bearer <secret>`.
- Invoke `POST /api/jobs/schedule-member-inactive` daily with the same scheduler secret to send the 30-day no-claims reminder.
- Invoke `POST /api/jobs/schedule-partner-inactive` daily with the same scheduler secret to send the 30-day no-event reminder.
- Invoke `POST /api/jobs/schedule-upcoming-event-reminders` daily with the same scheduler secret to send the 3-day event reminders to members with claimed vouchers, accepted providers, and event partners.
- Invoke `POST /api/jobs/schedule-campaign-results` daily with the same scheduler secret to send post-event results for events that ended the previous day. A dedicated report link will be added when the report route exists.
- Verify the sender/domain in SES. While the SES account is in sandbox, recipients must also be verified.

## Cognito password-reset email

Password resets are initiated with Cognito's `ForgotPassword` API, so the reset code must remain generated and validated by Cognito. To replace Cognito's default AWS email, deploy `lambda-deploy/custom-message/index.js` as a Lambda function and configure the Cognito user pool's **Custom message** trigger to invoke it.

The function only changes `CustomMessage_ForgotPassword` events. It preserves Cognito's `{####}` code placeholder, so Cognito injects the real verification code before delivery. Configure these Lambda environment variables:

- `APP_URL` or `NEXT_PUBLIC_APP_URL` — the public app URL used by the reset button.
- `SUPPORT_EMAIL` — optional support address shown in the email.

The Lambda needs a resource-based permission allowing the Cognito user pool to invoke it. After attaching the trigger, test **Forgot password** from the login screen and confirm the message uses the Local Metrics branding and that the code is accepted by the existing reset form.

Templates should eventually be centralized by `template_key` and rendered before `queueEmail()` is called. Keep the rendered HTML/text in the job so the delivery log accurately represents what was actually sent, even after a template changes.
