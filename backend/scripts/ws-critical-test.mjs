#!/usr/bin/env node
import { spawn } from "node:child_process";

const REQUIRED_MARKERS = [
  "Start concurrent owner -> une seule partie active + question payload OK",
  "Reponse double idempotente OK",
  "Timer + fin de partie unique OK",
];

function runSmokeAndCapture() {
  return new Promise((resolve, reject) => {
    const scriptArgs = ["scripts/ws-smoke-test.mjs"];
    const child = spawn(process.execPath, scriptArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function main() {
  const result = await runSmokeAndCapture();

  if (result.code !== 0) {
    process.exit(result.code);
  }

  const missing = REQUIRED_MARKERS.filter((marker) => !result.stdout.includes(marker));

  if (missing.length > 0) {
    console.error("\n[KO] QA-05 critical scenarios missing in WS run:");
    for (const marker of missing) {
      console.error(` - ${marker}`);
    }
    process.exit(1);
  }

  console.log("\n[OK] QA-05 critical scenarios validated");
}

void main();
