import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const factsFile = path.join(process.cwd(), 'src', 'data', 'resources.json');
const outFile = path.join(process.cwd(), 'src', 'data', 'releases.json');

let token = process.env.GITHUB_TOKEN || '';
if (!token) {
  try {
    token = execFileSync('gh', ['auth', 'token'], {encoding: 'utf8'}).trim();
  } catch {}
}

const facts = JSON.parse(await readFile(factsFile, 'utf8'));
const repos = [...new Set(Object.values(facts).map((item) => item.repo).filter(Boolean))];
let previous = {};
try {
  previous = JSON.parse(await readFile(outFile, 'utf8'));
} catch {}
// keep previously resolved tags when a fetch fails (offline or rate-limited)
const releases = {...previous};

for (const repo of repos) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) continue;
    const data = await response.json();
    if (data.tag_name) releases[repo] = {tag: data.tag_name, publishedAt: data.published_at};
  } catch {
    // offline or rate-limited: leave the repo out, pages fall back to a dash
  }
}

await writeFile(outFile, JSON.stringify(releases, null, 2));
console.log(`releases: ${Object.keys(releases).length}/${repos.length} repos resolved`);
