import {readFile, writeFile, appendFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {siteFingerprint, needsPreparation, needsBuild} from '../lib/pages-build.mjs';
import {contentRoot} from '../lib/content-source.mjs';
import {collectSiteInputs} from '../lib/pages-inputs.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, '.cache/pages');
const phase = process.argv[2];
if (!['source', 'build'].includes(phase)) throw new Error('Usage: node scripts/plan-pages.mjs source|build');
await mkdir(directory, {recursive: true});
async function load(name) {
  try {
    return JSON.parse(await readFile(path.join(directory, name), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return {};
    throw error;
  }
}
const published = await load('published.json');
const digest = siteFingerprint(await collectSiteInputs(root, contentRoot));
const options = {
  event: process.env.GITHUB_EVENT_NAME,
  refresh: process.env.REFRESH_REPOSITORIES === 'true',
  force: process.env.FORCE_BUILD === 'true',
};
const changed = phase === 'source'
  ? needsPreparation(digest, published, options)
  : needsBuild(digest, published, options);
const candidate = phase === 'source' ? {sourceDigest: digest} : {
  ...await load('candidate.json'), buildDigest: digest,
};
await writeFile(path.join(directory, 'candidate.json'), `${JSON.stringify(candidate)}\n`);
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `changed=${Boolean(changed)}\n`);
}
const message = `${phase}: ${changed ? 'work required' : 'unchanged; skipping'}`;
console.log(message);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `- ${message}\n`);
}
