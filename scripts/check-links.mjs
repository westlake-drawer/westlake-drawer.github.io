import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

const root = path.join(process.cwd(), 'build');
const own = 'westlake-drawer.github.io';

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = await walk(root);
const links = new Map();
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/href="(https?:\/\/[^"#?]+)/g)) {
    const url = match[1].replace(/\/$/, '');
    if (url.includes(own)) continue;
    links.set(url, (links.get(url) ?? 0) + 1);
  }
}

const urls = [...links.keys()];
const failures = [];
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const response = await fetch(url, {method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000)});
      if (!response.ok) {
        // some hosts reject HEAD; retry with GET before reporting
        const retry = await fetch(url, {method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000)});
        if (!retry.ok) failures.push([url, retry.status]);
      }
    } catch (error) {
      failures.push([url, error.name === 'TimeoutError' ? 'timeout' : 'error']);
    }
  }
}
await Promise.all(Array.from({length: 8}, worker));

console.log(`checked ${urls.length} external links across ${files.length} pages`);
if (failures.length) {
  console.log(`unreachable: ${failures.length}`);
  for (const [url, status] of failures.sort()) console.log(`  ${status}  ${url}`);
  process.exitCode = 1;
} else {
  console.log('all external links reachable');
}
