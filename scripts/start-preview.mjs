import { spawn } from "node:child_process";

const port = process.env.PORT || "4173";

const command = `npx vite preview --host 0.0.0.0 --port ${port}`;

const child = spawn(command, {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
