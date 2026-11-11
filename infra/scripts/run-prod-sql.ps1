# Runs SQL against the prod database from inside the VPC (the database has no
# public endpoint) and prints each statement's rows or affected-row count.
# Statements run in one transaction: if any fails, none of them apply.
#
#   .\infra\scripts\run-prod-sql.ps1 "SELECT count(*) FROM network_codes"
#   .\infra\scripts\run-prod-sql.ps1 -File .\admin-user.sql
#
# Separate statements with a semicolon at the end of a line.
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Sql,
  [string]$File
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($File) { $Sql = Get-Content -Raw $File }
if ([string]::IsNullOrWhiteSpace($Sql)) { throw "Pass SQL as the first argument or with -File." }

$sqlBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($Sql))

# Runs in the migrate image, which has the generated Prisma client and DATABASE_URL.
$runner = @'
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const sql = Buffer.from(process.argv[1], "base64").toString("utf8");
const statements = sql.split(/;[ \t]*(?:\r?\n|$)/).map((s) => s.trim()).filter(Boolean);
const returnsRows = (s) => /^(select|with|show|explain)\b/i.test(s) || /\breturning\b/i.test(s);
const json = (v) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x), 2);
prisma
  .$transaction(async (tx) => {
    for (const statement of statements) {
      console.log(`> ${statement}`);
      if (returnsRows(statement)) console.log(json(await tx.$queryRawUnsafe(statement)));
      else console.log(`${await tx.$executeRawUnsafe(statement)} row(s) affected`);
    }
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
'@

& (Join-Path $PSScriptRoot "run-prod-db-task.ps1") -Command @("node", "-e", $runner, $sqlBase64)
exit $LASTEXITCODE
