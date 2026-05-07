import { spawn } from "node:child_process";

const startedAt = new Date();
console.log(`[build-debug] start ${startedAt.toISOString()}`);

const child = spawn("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  const endedAt = new Date();
  console.log(`[build-debug] end ${endedAt.toISOString()}`);
  if (signal) {
    console.error(`[build-debug] terminated by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

