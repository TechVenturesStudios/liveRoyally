import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: command.includes("npm") ? "lambda-build" : undefined,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.platform === "win32" ? "npm.cmd" : "npm", [
  "install",
  "--omit=dev",
  "--workspaces=false",
]);

run(process.platform === "win32" ? "npx.cmd" : "npx", [
  "tsc",
  "-p",
  "tsconfig.lambda.json",
]);
