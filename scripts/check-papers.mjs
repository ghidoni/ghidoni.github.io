#!/usr/bin/env node
/**
 * Fails (in CI) when a published paper analysis still contains the generated
 * "My take" placeholder. Local builds only warn, so `npm run build` stays usable
 * while a page is in progress.
 *
 * Set STRICT_TAKES=1 to turn the warning into a non-zero exit.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dir = 'src/content/papers';
const marker = 'take:pending';
const strict = process.env.STRICT_TAKES === '1';

let files = [];
try {
  files = (await readdir(dir)).filter((file) => file.endsWith('.md'));
} catch {
  console.log('No src/content/papers directory; skipping take check.');
  process.exit(0);
}

const offenders = [];

for (const file of files) {
  const raw = await readFile(path.join(dir, file), 'utf8');
  if (!raw.includes(marker)) continue;

  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const isDraft = /^draft:\s*true\s*$/m.test(frontmatter);

  if (!isDraft) offenders.push(file);
}

if (offenders.length === 0) {
  console.log(`✓ take check passed (${files.length} paper analyses)`);
  process.exit(0);
}

const heading = strict ? '✗ Deploy blocked' : '⚠ Warning';
console.error(`\n${heading}: published papers still have the placeholder "My take" section:\n`);
for (const file of offenders) {
  console.error(`  ${path.join(dir, file)}`);
}
console.error(
  '\nWrite your opinion and delete the <!-- take:pending --> marker, or set `draft: true`.\n',
);

process.exit(strict ? 1 : 0);
