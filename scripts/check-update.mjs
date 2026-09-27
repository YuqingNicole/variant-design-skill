#!/usr/bin/env node

import fs from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = "YuqingNicole/variant-design-skill";
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionFile = path.join(skillRoot, "VERSION");
const cacheFile = path.join(os.tmpdir(), "variant-design-update-check.json");
const cacheTtlMs = 24 * 60 * 60 * 1000;

function parseVersion(value) {
  const match = String(value).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) return null;
  return {
    raw: `${match[1]}.${match[2]}.${match[3]}${match[4] ? `-${match[4]}` : ""}`,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

function compareVersions(left, right) {
  for (const key of ["major", "minor", "patch"]) {
    if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1;
  }
  if (left.prerelease === right.prerelease) return 0;
  if (left.prerelease === null) return 1;
  if (right.prerelease === null) return -1;
  return left.prerelease.localeCompare(right.prerelease);
}

function readFreshCache() {
  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    if (Date.now() - cache.checkedAt < cacheTtlMs) return cache;
  } catch {
    // A missing or malformed cache simply triggers a fresh check.
  }
  return null;
}

function writeCache(value) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify({ checkedAt: Date.now(), ...value }));
  } catch {
    // Cache writes are optional and must never block skill use.
  }
}

function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const request = https.get(
      `https://api.github.com/repos/${repository}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "variant-design-update-check",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout: 3500,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { body += chunk; });
        response.on("end", () => {
          if (response.statusCode === 404) {
            resolve({ latestVersion: null, releaseUrl: null });
            return;
          }
          if (response.statusCode !== 200) {
            reject(new Error(`GitHub returned ${response.statusCode}`));
            return;
          }
          try {
            const payload = JSON.parse(body);
            resolve({
              latestVersion: String(payload.tag_name ?? "").replace(/^v/, "") || null,
              releaseUrl: payload.html_url ?? null,
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    request.on("timeout", () => request.destroy(new Error("Update check timed out")));
    request.on("error", reject);
  });
}

function updateCommand() {
  if (fs.existsSync(path.join(skillRoot, ".git"))) {
    return `git -C ${JSON.stringify(skillRoot)} pull --ff-only`;
  }
  return `claude skill install https://github.com/${repository}`;
}

function selfTest() {
  const cases = [
    ["1.0.1", "1.0.0", 1],
    ["1.0.0", "1.0.0", 0],
    ["0.9.9", "1.0.0", -1],
    ["v2.0.0", "1.9.9", 1],
    ["1.0.0", "1.0.0-beta.1", 1],
  ];
  for (const [left, right, expected] of cases) {
    const result = compareVersions(parseVersion(left), parseVersion(right));
    if (Math.sign(result) !== Math.sign(expected)) {
      console.error(`check-update self-test failed: ${left} vs ${right}`);
      process.exit(1);
    }
  }
  console.log("check-update self-test passed");
  process.exit(0);
}

const args = new Set(process.argv.slice(2));
if (args.has("--self-test")) selfTest();

const currentVersion = parseVersion(fs.readFileSync(versionFile, "utf8"));
if (!currentVersion) {
  console.error("Invalid VERSION file");
  process.exit(2);
}

let release;
try {
  release = args.has("--force") ? null : readFreshCache();
  if (!release) {
    release = await fetchLatestRelease();
    writeCache(release);
  }
} catch (error) {
  if (args.has("--json")) {
    console.log(JSON.stringify({ status: "offline", currentVersion: currentVersion.raw }));
  } else if (!args.has("--quiet")) {
    console.log(`variant-design v${currentVersion.raw} · update check unavailable`);
  }
  process.exit(0);
}

const latestVersion = release.latestVersion ? parseVersion(release.latestVersion) : null;
const updateAvailable = latestVersion && compareVersions(latestVersion, currentVersion) > 0;
const result = {
  status: updateAvailable ? "update-available" : "current",
  currentVersion: currentVersion.raw,
  latestVersion: latestVersion?.raw ?? null,
  releaseUrl: release.releaseUrl ?? null,
  updateCommand: updateAvailable ? updateCommand() : null,
};

if (args.has("--json")) {
  console.log(JSON.stringify(result));
} else if (updateAvailable) {
  console.log(`variant-design v${latestVersion.raw} is available (installed: v${currentVersion.raw})`);
  if (release.releaseUrl) console.log(`Release: ${release.releaseUrl}`);
  console.log(`Update: ${result.updateCommand}`);
} else if (!args.has("--quiet")) {
  console.log(`variant-design v${currentVersion.raw} is current`);
}
