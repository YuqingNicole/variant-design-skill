#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const targetArg = process.argv[2];
if (!targetArg) {
  console.error("Usage: node scripts/open-preview.mjs <file-or-url>");
  process.exit(2);
}

const isUrl = /^[a-z]+:\/\//i.test(targetArg);
const target = isUrl ? targetArg : path.resolve(targetArg);
if (!isUrl && !fs.existsSync(target)) {
  console.error(`Preview target does not exist: ${target}`);
  process.exit(2);
}

const value = isUrl ? target : pathToFileURL(target).href;
const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
const args = process.platform === "win32" ? ["/c", "start", "", value] : [value];
const child = spawn(command, args, { detached: true, stdio: "ignore" });

child.once("error", (error) => {
  console.error(`Could not open preview: ${error.message}`);
  process.exit(1);
});
child.unref();
console.log(value);
