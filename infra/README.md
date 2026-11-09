# Production infrastructure

Everything for prod except DNS lives in the `live-royally-prod` CloudFormation
stack ([prod.yaml](prod.yaml)), in account 609948378142, us-east-2. The domain
`localmetrics.net` is on GoDaddy and still points at the GoDaddy site; the
stack is ready for it but does not change it.

| Piece | Resource |
| --- | --- |
| App | ECS service `live-royally-prod` (Fargate ARM, 0.5 vCPU / 1 GB) in `live-royally-cluster` |
| Routing | Target group `live-royally-prod`, rule priority 5 on the shared ALB's HTTPS listener for `localmetrics.net` and `www.localmetrics.net` |
| Database | RDS `live-royally-prod` (Postgres 18, db.t4g.micro, private, encrypted, 7-day backups, deletion protection) |
| DB credentials | Secrets Manager `live-royally/prod/database` (generated; never typed) |
| App config & secrets | SSM `/live-royally/prod/*` (created by [init-prod-params.ps1](scripts/init-prod-params.ps1)) |
| Email | SQS `live-royally-prod-email-jobs` (+ DLQ) → Lambda `live-royally-prod-email-worker` (in VPC) → SES via VPC endpoint |
| Daily jobs | Scheduler `live-royally-prod-daily-email-jobs` (08:00 Central) → Lambda `live-royally-prod-schedule-email-jobs`, **disabled until launch** |
| Password-reset email | Lambda `live-royally-prod-cognito-custom-message` |
| Auth | Existing Cognito pool `live-royally` (`us-east-2_SPfoA3iIC`), client `LiveRoyallySPA` |
| Logs | `/ecs/live-royally-prod` and `/aws/lambda/live-royally-prod-*`, 14-day retention |

Approximate cost: ~$22/mo with the app at 0 tasks (DB, SES endpoint, secret),
~$40/mo with one task running.

## Scripts

| Script | What it does |
| --- | --- |
| [deploy-prod.ps1](scripts/deploy-prod.ps1) | Packages Lambdas and deploys the stack. Omitted parameters keep their current values. A new `-AppImageTag` migrates the DB first (below). |
| [init-prod-params.ps1](scripts/init-prod-params.ps1) | Creates the SSM parameters. Re-runnable; `-Overwrite` to regenerate. |
| [run-prod-db-task.ps1](scripts/run-prod-db-task.ps1) | Runs a one-off command (default: the guarded migration) against the prod DB from inside the VPC. |
| [configure-prod-cognito.ps1](scripts/configure-prod-cognito.ps1) | Sends Cognito email through SES and attaches the custom-message trigger. |

## Releases and migrations

`.\scripts\publish-ecr.ps1 v45` pushes the app image `v45` and the matching
`v45-migrate` image (the Dockerfile's `migrate` target). Then
`.\infra\scripts\deploy-prod.ps1 -AppImageTag v45` does, in order:

1. Points the migrate task at `v45-migrate`. The running app is untouched.
2. Runs [scripts/safe-migrate.mjs](../scripts/safe-migrate.mjs) `--check`. If
   nothing is pending, it skips to step 5.
3. Takes an RDS snapshot `live-royally-prod-pre-migrate-<timestamp>` and keeps
   the newest 3.
4. Applies the migrations with `prisma migrate deploy`.
5. Rolls out `v45`. ECS waits for the new tasks to pass health checks and
   rolls back on its own if they don't.

If anything fails before step 5, the old version keeps serving.

Nothing in this flow can wipe the database:

- `prisma migrate deploy` only applies migration files that have not run yet.
  It never resets the database. Only `migrate dev` and `migrate reset` can do
  that, and the deploy path never calls either.
- `safe-migrate.mjs` refuses any pending migration whose SQL contains
  `DROP TABLE`, `DROP COLUMN`, `DROP SCHEMA`, `DROP DATABASE`, `TRUNCATE` or
  `DELETE FROM`. To apply one after reviewing it, name it:
  `-AllowDestructiveMigration 20261201000000_drop_old_table`.
- A snapshot is taken before every migration that runs.

The same guard works locally against any database:
`npm run prisma:deploy:safe` uses `DATABASE_URL`, and `--check` only reports.

ECR keeps the 20 newest tagged images
([ecr-lifecycle-policy.json](ecr-lifecycle-policy.json)). Redeploy a recent
build rather than rolling back to an older task definition revision.

## Finish setup (one time)

Migrations are already applied. Then:

```powershell
.\infra\scripts\init-prod-params.ps1
.\infra\scripts\run-prod-db-task.ps1 npx prisma db seed
.\infra\scripts\run-prod-db-task.ps1 node scripts/import-network-codes.mjs scripts/network-codes.csv
.\infra\scripts\configure-prod-cognito.ps1
```

The seed creates a placeholder "Live Royally" partner with a fake Cognito ID;
update it if that partner needs to log in.

## Smoke test without DNS

```powershell
.\infra\scripts\deploy-prod.ps1 -DesiredCount 1 -SkipLambdaBuild
$ip = (Resolve-DnsName live-royally-load-balancer-123999638.us-east-2.elb.amazonaws.com -Type A)[0].IPAddress
curl.exe -sS -o NUL -w "%{http_code}`n" --resolve "localmetrics.net:443:$ip" https://localmetrics.net/
```

`--resolve` sends real HTTPS for `localmetrics.net` to the ALB, so the
certificate, host rule and app are all exercised. Add `localmetrics.net` with
that IP to `C:\Windows\System32\drivers\etc\hosts` to click through in a
browser, and remove it afterwards. Scale back down when done:

```powershell
.\infra\scripts\deploy-prod.ps1 -DesiredCount 0 -SkipLambdaBuild
```

## Launch checklist

1. Production Square: create the production app/location, run
   `npm run square:seed-subscription-plans` against production, then update
   the `SQUARE_*` parameters with `aws ssm put-parameter --overwrite`
   (`SQUARE_ENVIRONMENT` = `production`). Register
   `https://localmetrics.net/api/square/oauth/callback` as the OAuth redirect and
   `https://localmetrics.net/api/webhooks/square` as the webhook, and put its
   signature key in `SQUARE_WEBHOOK_SIGNATURE_KEY`.
2. Build and push a release: `.\scripts\publish-ecr.ps1 <version>`.
3. `.\infra\scripts\deploy-prod.ps1 -AppImageTag <version> -DesiredCount 1 -SkipLambdaBuild`
   (this migrates the database first).
4. At GoDaddy, point `localmetrics.net` and `www` at
   `live-royally-load-balancer-123999638.us-east-2.elb.amazonaws.com`
   (CNAME for `www`; for the apex use GoDaddy forwarding to `www`, or move DNS
   to Route 53 for an alias record, $0.50/mo).
5. Once the site answers on the domain:
   `.\infra\scripts\deploy-prod.ps1 -EmailSchedules ENABLED -SkipLambdaBuild`

App config changes in SSM take effect on the next task start; force one with
`aws ecs update-service --cluster live-royally-cluster --service live-royally-prod --force-new-deployment`.
