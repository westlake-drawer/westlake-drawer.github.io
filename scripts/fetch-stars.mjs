import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const factsFile = path.join(process.cwd(), 'src', 'data', 'resources.json');
const outFile = path.join(process.cwd(), 'src', 'data', 'stars.json');

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

const stars = {...previous};
for (const repo of repos) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) continue;
    const data = await response.json();
    if (typeof data.stargazers_count === 'number') stars[repo] = data.stargazers_count;
  } catch {
    // keep the previous value when the request fails
  }
}

await writeFile(outFile, JSON.stringify(stars, null, 2));
console.log(`stars: ${Object.keys(stars).length}/${repos.length} repos resolved`);
