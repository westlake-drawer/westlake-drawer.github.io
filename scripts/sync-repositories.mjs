import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {repositoriesFromMarkdown} from '../lib/github/repositories.mjs';
import {mergeSnapshots, syncRepositories} from '../lib/github/sync.mjs';
import {contentRoot} from '../lib/content-source.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'src/data/repository-contributors.json');
const readmeOutput = path.join(root, 'src/data/repository-documents.json');
const cache = path.join(root, '.cache/repositories');
const force = process.argv.includes('--force');
if (process.argv.slice(2).some((argument) => argument !== '--force')) {
  throw new Error('Usage: npm run sync:repositories -- [--force]');
}
async function collectRepositories(directory, repositories = new Set()) {
  const entries = await readdir(directory, {withFileTypes: true});
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectRepositories(filename, repositories);
    else if (/\.mdx?$/.test(entry.name)) {
      repositoriesFromMarkdown(await readFile(filename, 'utf8'))
        .forEach((repository) => repositories.add(repository));
    }
  }
  return repositories;
}

async function load(filename) {
  try {
    return JSON.parse(await readFile(filename, 'utf8')).repositories ?? {};
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

const cachedContributors = path.join(cache, 'contributors.json');
const cachedDocuments = path.join(cache, 'documents.json');
const result = await syncRepositories(await collectRepositories(path.join(contentRoot, 'docs')), {
  previousContributors: mergeSnapshots(await load(output), await load(cachedContributors), 'updatedAt'),
  previousDocuments: mergeSnapshots(await load(readmeOutput), await load(cachedDocuments), 'syncedAt'),
  force, token: process.env.GITHUB_TOKEN,
});
await mkdir(cache, {recursive: true});
await mkdir(path.dirname(output), {recursive: true});
await Promise.all([
  [output, result.contributors], [cachedContributors, result.contributors],
  [readmeOutput, result.documents], [cachedDocuments, result.documents],
].map(([filename, value]) => writeFile(filename, `${JSON.stringify(value, null, 2)}\n`)));
