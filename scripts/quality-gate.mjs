#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const extensions = new Set([".html", ".css", ".scss", ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".astro"]);
const ignoredDirectories = new Set([".git", "node_modules", "dist", "build", ".next", ".cache", ".history", ".verification", "_harness"]);

function locationFor(source, index) {
  return source.slice(0, index).split("\n").length;
}

function addMatches(findings, source, file, rule) {
  for (const match of source.matchAll(rule.pattern)) {
    findings.push({
      severity: rule.severity,
      rule: rule.id,
      file,
      line: locationFor(source, match.index ?? 0),
      message: rule.message,
      excerpt: match[0].replace(/\s+/g, " ").slice(0, 140),
    });
  }
}

export function scanSource(source, file = "<memory>") {
  const findings = [];
  const rules = [
    {
      id: "missing-img-alt",
      severity: "error",
      pattern: /<img\b(?![^>]*\balt\s*=)[^>]*>/gi,
      message: "Image is missing an alt attribute.",
    },
    {
      id: "generic-error-copy",
      severity: "warning",
      pattern: /\b(?:an error occurred|something went wrong|unknown error|invalid input|please try again)\b|(?:出错了|发生错误|未知错误|输入有误|请重试|操作失败)/gi,
      message: "Generic error copy does not explain the cause or recovery action.",
    },
    {
      id: "lorem-ipsum",
      severity: "error",
      pattern: /\blorem ipsum\b/gi,
      message: "Placeholder copy must be replaced with realistic content.",
    },
    {
      id: "omitted-code",
      severity: "error",
      pattern: /(?:\/\/|\/\*)\s*(?:TODO|rest of (?:the )?(?:code|component)|implement here|similar to above|add more as needed)/gi,
      message: "Delivered code contains an omission marker.",
    },
    {
      id: "window-alert",
      severity: "warning",
      pattern: /\b(?:window\.)?alert\s*\(/g,
      message: "Use an inline or contextual error/status message instead of alert().",
    },
    {
      id: "pure-black-surface",
      severity: "warning",
      pattern: /(?:background(?:-color)?|--[\w-]*(?:bg|background|surface)[\w-]*)\s*:\s*#000(?:000)?\b/gi,
      message: "Pure black surface detected; verify that a tinted near-black is not more appropriate.",
    },
    {
      id: "fixed-100vh",
      severity: "warning",
      pattern: /(?:height|min-height)\s*:\s*100vh\b/gi,
      message: "100vh can jump on mobile browsers; prefer 100dvh with a fallback.",
    },
    {
      id: "arbitrary-z-index",
      severity: "warning",
      pattern: /z-index\s*:\s*(?:[1-9]\d{3,})\b/gi,
      message: "Large z-index value suggests an unmanaged stacking scale.",
    },
    {
      id: "ai-cliche",
      severity: "warning",
      pattern: /\b(?:elevate|seamless|unleash|next-gen|game-changer|delve|tapestry)\b/gi,
      message: "AI-associated cliché detected; replace it with specific product language.",
    },
    {
      id: "zoom-disabled",
      severity: "error",
      pattern: /user-scalable\s*=\s*(?:no|0)\b|maximum-scale\s*=\s*1(?![\d.])|userScalable\s*:\s*false\b|maximumScale\s*:\s*1(?![\d.])/gi,
      message: "Viewport disables pinch zoom; users who need to enlarge text cannot.",
    },
    {
      id: "transition-all",
      severity: "warning",
      pattern: /transition(?:-property)?\s*:\s*all\b|\btransition-all\b/gi,
      message: "transition: all animates unintended properties; list the transitioned properties.",
    },
    {
      id: "paste-blocked",
      severity: "warning",
      pattern: /onpaste\s*=\s*["']?[^>]{0,80}?(?:return\s+false|preventDefault)|onPaste\s*=\s*\{[^}]{0,120}preventDefault|addEventListener\(\s*["']paste["'][\s\S]{0,160}?preventDefault/gi,
      message: "Paste is prevented; verify this is custom paste handling, not blocking password managers or pasted codes.",
    },
  ];

  for (const rule of rules) addMatches(findings, source, file, rule);

  // A selector's presence says nothing about its computed indicator or coverage.
  // Keep all outline removals reviewable, even with an unrelated focus rule.
  for (const match of source.matchAll(/outline\s*:\s*(?:none|0)\b/gi)) {
    findings.push({ severity: "warning", rule: "focus-outline-removed", file,
      line: locationFor(source, match.index),
      message: "Outline removed: keyboard-test this control's computed focus indicator; a focus-visible keyword is not proof.",
      excerpt: match[0] });
  }
  for (const match of source.matchAll(/[^{}]*:focus-visible[^{}]*\{[^{}]*outline\s*:\s*(?:none|0)\b[^{}]*\}/gi)) {
    findings.push({ severity: "warning", rule: "focus-visible-suppressed", file,
      line: locationFor(source, match.index),
      message: "Focus-visible rule suppresses the outline; verify a visible replacement on this element.", excerpt: match[0].trim().slice(0, 140) });
  }
  if (/requestAnimationFrame|\.animate\s*\(/.test(source) && !/matchMedia\s*\([\s\S]{0,100}prefers-reduced-motion/.test(source)) {
    findings.push({ severity: "warning", rule: "js-motion-review", file, line: 1,
      message: "JavaScript animation needs a runtime reduced-motion guard; CSS alone cannot cancel its loop.", excerpt: "JavaScript motion" });
  }

  const usesMotion = /(?:animation(?:-name)?|transition)\s*:/i.test(source);
  if (usesMotion && !/prefers-reduced-motion/i.test(source)) {
    const index = source.search(/(?:animation(?:-name)?|transition)\s*:/i);
    findings.push({
      severity: "warning",
      rule: "missing-reduced-motion",
      file,
      line: locationFor(source, index),
      message: "Motion is defined without a prefers-reduced-motion fallback in this file.",
      excerpt: source.slice(index, index + 100).replace(/\s+/g, " "),
    });
  }

  return findings;
}

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return extensions.has(path.extname(target).toLowerCase()) ? [target] : [];

  const files = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(child));
    else if (extensions.has(path.extname(entry.name).toLowerCase())) files.push(child);
  }
  return files;
}

function selfTest() {
  const good = `
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.5">
    <main><img src="cover.jpg" alt="Product dashboard"></main>
    <style>
      button:focus-visible { outline: 2px solid blue; }
      .card { transition: transform 200ms ease; }
      @media (prefers-reduced-motion: reduce) { .card { transition: none; } }
    </style>`;
  const bad = `
    <img src="cover.jpg">
    <meta name="viewport" content="width=device-width, maximum-scale=1">
    <p>Lorem ipsum</p><p>出错了，请重试</p><input onpaste="return false">
    <style>button { outline: none; animation: pop 1s; background: #000; transition: all 200ms; }</style>`;

  const goodFindings = scanSource(good);
  const badRules = new Set(scanSource(bad).map((finding) => finding.rule));
  const expected = ["missing-img-alt", "lorem-ipsum", "generic-error-copy", "focus-outline-removed", "missing-reduced-motion", "pure-black-surface", "zoom-disabled", "transition-all", "paste-blocked"];

  if (goodFindings.length || expected.some((rule) => !badRules.has(rule))) {
    console.error("quality-gate self-test failed");
    console.error(JSON.stringify({ goodFindings, badRules: [...badRules] }, null, 2));
    process.exit(1);
  }
  console.log("quality-gate self-test passed");
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
const args = process.argv.slice(2);
if (args.includes("--self-test")) selfTest();

const json = args.includes("--json");
const strict = args.includes("--strict");
const targetArg = args.find((arg) => !arg.startsWith("--"));

if (!targetArg) {
  console.error("Usage: node scripts/quality-gate.mjs <file-or-directory> [--strict] [--json]");
  process.exit(2);
}

const target = path.resolve(targetArg);
if (!fs.existsSync(target)) {
  console.error(`Target does not exist: ${target}`);
  process.exit(2);
}

const files = collectFiles(target);
const findings = files.flatMap((file) => scanSource(fs.readFileSync(file, "utf8"), path.relative(process.cwd(), file)));
const errors = findings.filter((finding) => finding.severity === "error").length;
const warnings = findings.filter((finding) => finding.severity === "warning").length;

if (json) {
  console.log(JSON.stringify({ target: targetArg, files: files.length, errors, warnings, findings }, null, 2));
} else {
  for (const finding of findings) {
    console.log(`${finding.severity.toUpperCase()} ${finding.rule} ${finding.file}:${finding.line}`);
    console.log(`  ${finding.message}`);
    console.log(`  ${finding.excerpt}`);
  }
  console.log(`Quality gate: ${files.length} files · ${errors} errors · ${warnings} warnings`);
}

process.exit(errors > 0 || (strict && warnings > 0) ? 1 : 0);

}
