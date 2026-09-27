import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(".");
const output = resolve(root, "processEmailJobs.zip");
const compiled = resolve(root, "lambda-build", "dist", "processEmailJobs.js");
const dependencies = resolve(root, "lambda-build", "node_modules");

if (!existsSync(compiled)) {
  throw new Error(`Compiled handler not found: ${compiled}`);
}

if (!existsSync(dependencies)) {
  throw new Error(`Lambda dependencies not found: ${dependencies}`);
}

if (existsSync(output)) unlinkSync(output);

const result = spawnSync(
  "tar",
  [
    "-a",
    "-c",
    "-f",
    output,
    "-C",
    resolve(root, "lambda-build", "dist"),
    "processEmailJobs.js",
    "-C",
    resolve(root, "lambda-build"),
    "node_modules",
  ],
  { stdio: "inherit", shell: false },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`Created ${output}`);
