#!/usr/bin/env node
/**
 * Verifies the ACTUAL payload `npm publish` would send to the registry —
 * not the source tree, not the build output on disk, but the exact file
 * list `npm pack` reports.
 *
 * Implements the CDA npm Library Profile v1 "Package verification" /
 * verify-pack contract: catches the case where source compiles and tests
 * pass, but the published tarball itself would be missing/incomplete
 * (dist/ not built, `files` misconfigured, an export target renamed
 * without updating package.json) or would leak files it never should
 * (source, tests, repo tooling).
 *
 * This script is deliberately generic: it derives the list of required
 * build outputs from package.json's own `exports` map instead of
 * hardcoding filenames, so it stays correct as a derived library's
 * public API surface grows or changes shape.
 *
 * Usage: node scripts/verify-pack.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

/** Directories that must never appear in the published tarball. */
const FORBIDDEN_PREFIXES = ['src/', 'tests/', 'test/', 'scripts/', '.github/'];

/** Individual files that must never appear in the published tarball. */
const FORBIDDEN_FILES = [
  'tsconfig.json',
  'tsconfig.build.json',
  'vitest.config.ts',
  'eslint.config.mjs',
  '.releaserc.json',
];

/** Files every published package must carry, if present in the repo. */
const EXPECTED_METADATA = ['package.json', 'README.md', 'LICENSE'];

function collectExportTargets(exportsField, acc = new Set()) {
  if (typeof exportsField === 'string') {
    acc.add(exportsField.replace(/^\.\//, ''));
    return acc;
  }
  if (exportsField && typeof exportsField === 'object') {
    for (const value of Object.values(exportsField)) {
      collectExportTargets(value, acc);
    }
  }
  return acc;
}

function main() {
  const exportTargets = collectExportTargets(pkg.exports);
  if (exportTargets.size === 0) {
    console.error('FAIL: package.json has no `exports` map to derive required files from.');
    process.exit(1);
  }

  // For every declared .js export target, a sibling .d.ts is expected too,
  // matching the "types" condition CDA's package contract requires.
  const requiredFiles = new Set(exportTargets);
  for (const target of exportTargets) {
    if (target.endsWith('.js')) {
      requiredFiles.add(target.replace(/\.js$/, '.d.ts'));
    }
  }

  const raw = execSync('npm pack --json --dry-run', { cwd: repoRoot, encoding: 'utf8' });
  const pack = JSON.parse(raw.trim()).at(-1);
  const packedFiles = (pack.files || []).map((f) => f.path);

  console.log(`tarball: ${pack.filename} (${pack.size} bytes, ${pack.entryCount} entries)`);

  const missing = [...requiredFiles].filter((f) => !packedFiles.includes(f));
  if (missing.length > 0) {
    console.error(`FAIL: the pack payload is missing required files: ${missing.join(', ')}`);
    console.error('present files:');
    for (const f of packedFiles) console.error(`  ${f}`);
    process.exit(1);
  }

  const leakedByPrefix = packedFiles.filter((f) =>
    FORBIDDEN_PREFIXES.some((prefix) => f.startsWith(prefix)),
  );
  const leakedByName = packedFiles.filter((f) => FORBIDDEN_FILES.includes(f));
  const leaked = [...leakedByPrefix, ...leakedByName];
  if (leaked.length > 0) {
    console.error(`FAIL: the pack payload leaks files that must never be published: ${leaked.join(', ')}`);
    process.exit(1);
  }

  const missingMetadata = EXPECTED_METADATA.filter((f) => !packedFiles.includes(f));
  if (missingMetadata.length > 0) {
    console.error(`FAIL: the pack payload is missing expected metadata files: ${missingMetadata.join(', ')}`);
    process.exit(1);
  }

  console.log(`PASS: pack payload contains all ${requiredFiles.size} required export file(s):`);
  for (const f of requiredFiles) console.log(`  ${f}`);
  console.log('PASS: no source/test/tooling files leaked into the payload.');
  console.log(`PASS: metadata files present: ${EXPECTED_METADATA.join(', ')}`);
}

main();
