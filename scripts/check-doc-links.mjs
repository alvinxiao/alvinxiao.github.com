import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}
const files = [
  ...readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => join(root, entry.name)),
  ...markdownFiles(join(root, 'docs')),
];
const failures = [];
let checked = 0;
for (const file of files) {
  const markdown = readFileSync(file, 'utf8').replace(
    /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm,
    '',
  );
  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)/g)) {
    const target = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(target)) continue;
    const path = target.split(/[?#]/, 1)[0];
    if (!path) continue;
    checked += 1;
    if (!existsSync(resolve(dirname(file), decodeURIComponent(path)))) {
      failures.push(`${relative(root, file)}: ${target}`);
    }
  }
}
if (failures.length) {
  console.error(`Broken documentation links:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${checked} local links in ${files.length} documentation files.`);
}
