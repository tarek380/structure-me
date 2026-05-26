#!/usr/bin/env node
/**
 * patch-studio-paths.mjs
 *
 * Sanity builds the Studio with `basePath: '/studio'` configured in
 * sanity.config.ts and sanity.cli.ts, but it still emits a few asset
 * references in the generated index.html that point at `/static/...`
 * without the `/studio` prefix (favicon, manifest, apple-touch-icon).
 *
 * This script post-processes studio-app/index.html so that ALL asset
 * paths are properly prefixed with /studio/, ensuring the Studio works
 * when served at https://www.structureme.com.au/studio.
 *
 * It is safe to re-run: paths already prefixed with /studio/ are left
 * untouched.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const studioIndex = resolve(__dirname, "..", "studio-app", "index.html");

if (!existsSync(studioIndex)) {
  console.error(
    `[patch-studio-paths] studio-app/index.html not found at ${studioIndex} — did the studio build run?`
  );
  process.exit(1);
}

const before = readFileSync(studioIndex, "utf8");
let after = before;

// Replace bare /static/ references (those NOT already prefixed with /studio)
// in href="..." and src="..." attributes. Use a negative-lookbehind via
// a manual approach: split on the attribute boundary so we only rewrite
// inside attribute values.
//
// Strategy: do simple global replacements but guard against double-prefix
// by first replacing /studio/static/ with a sentinel, then doing the
// /static/ -> /studio/static/ replacement, then restoring the sentinel.

const SENTINEL = "\u0000STUDIO_STATIC\u0000";

after = after.split("/studio/static/").join(SENTINEL);
after = after.split('href="/static/').join('href="/studio/static/');
after = after.split('src="/static/').join('src="/studio/static/');
// Also catch manifest/og refs that may use bare /static/ in content="..."
after = after.split('content="/static/').join('content="/studio/static/');
after = after.split(SENTINEL).join("/studio/static/");

// Also patch any bare /favicon.ico references emitted by Sanity.
after = after.split('href="/favicon.ico"').join('href="/studio/favicon.ico"');
after = after.split('href="/favicon.svg"').join('href="/studio/favicon.svg"');
after = after.split('href="/manifest.webmanifest"').join('href="/studio/manifest.webmanifest"');

if (after === before) {
  console.log("[patch-studio-paths] No changes needed — paths already /studio-prefixed.");
} else {
  writeFileSync(studioIndex, after, "utf8");
  console.log("[patch-studio-paths] Patched studio-app/index.html → all asset paths now /studio-prefixed.");
}
