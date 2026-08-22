#!/usr/bin/env node
/**
 * Verifies the package the way an actual npm consumer would: install the
 * packed tarball into a brand-new project (outside this source tree),
 * import only through the package's declared public entry points (never
 * via a relative path into src/ or dist/), and confirm both the runtime
 * behavior and the published TypeScript declarations work.
 *
 * Implements the CDA npm Library Profile v1 "Package verification" /
 * packaged-consumption contract. Running the source-tree test suite
 * (`npm test`) is not sufficient — it never proves the *published shape*
 * of the package is actually importable by someone who only has the
 * registry tarball in node_modules.
 *
 * Steps: build -> npm pack -> temp consumer project -> install tarball ->
 * import via package name -> run -> typecheck against published .d.ts ->
 * clean up.
 *
 * Usage: node scripts/verify-package-consumption.mjs
 */

import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const pkgName = pkg.name;

if (!pkgName) {
  console.error('FAIL: package.json has no `name` to import in the consumer fixture.');
  process.exit(1);
}

console.log('--- build ---');
execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });

console.log('--- npm pack ---');
const packRaw = execSync('npm pack --json', { cwd: repoRoot, encoding: 'utf8' });
const packInfo = JSON.parse(packRaw.trim()).at(-1);
const tarballName = packInfo.filename;
const tarballPath = join(repoRoot, tarballName);
console.log(`packed: ${tarballName}`);

let consumerDir;
try {
  consumerDir = mkdtempSync(join(tmpdir(), 'cda-pkg-consumption-'));
  console.log(`--- consumer fixture: ${consumerDir} ---`);

  writeFileSync(
    join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'consumption-fixture', version: '0.0.0', private: true, type: 'module' }, null, 2),
  );

  console.log('--- installing packed tarball into the fixture ---');
  execSync(`npm install ${JSON.stringify(tarballPath)} --no-save --no-audit --no-fund`, {
    cwd: consumerDir,
    stdio: 'inherit',
  });

  // Runtime consumption: import ONLY via the package name, never a
  // relative path into this repo's src/ or dist/.
  const runtimeCheckPath = join(consumerDir, 'runtime-check.mjs');
  writeFileSync(
    runtimeCheckPath,
    [
      `import { add } from ${JSON.stringify(pkgName)};`,
      '',
      'const result = add(2, 3);',
      'if (result !== 5) {',
      '  console.error(`FAIL: expected add(2, 3) === 5, got ${result}`);',
      '  process.exit(1);',
      '}',
      "console.log('PASS: runtime import + call succeeded via the package name.');",
      '',
    ].join('\n'),
  );

  console.log('--- runtime consumption check ---');
  execFileSync(process.execPath, [runtimeCheckPath], { cwd: consumerDir, stdio: 'inherit' });

  // Type-level consumption: the published .d.ts must be resolvable and
  // usable by a consumer's own TypeScript compiler, not just internally.
  const typeCheckPath = join(consumerDir, 'type-check.ts');
  writeFileSync(
    typeCheckPath,
    [
      `import { add } from ${JSON.stringify(pkgName)};`,
      '',
      'const sum: number = add(2, 3);',
      'void sum;',
      '',
    ].join('\n'),
  );

  console.log('--- packaged type-declaration check ---');
  // Invoke TypeScript's own JS entry point via the current Node binary
  // rather than the platform-specific node_modules/.bin shim (a .cmd
  // wrapper on Windows, a shell script elsewhere) — this runs identically
  // on every OS without needing a shell.
  const tscEntry = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(
    process.execPath,
    [tscEntry, '--noEmit', '--strict', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', typeCheckPath],
    { cwd: consumerDir, stdio: 'inherit' },
  );

  console.log('PASS: published .d.ts resolved and type-checked from a real consumer.');
  console.log('PASS: packaged consumption verified end to end.');
} finally {
  if (consumerDir) rmSync(consumerDir, { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
}
