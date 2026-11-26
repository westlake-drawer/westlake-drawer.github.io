import {readFile, writeFile, readdir, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {contentRoot} from '../lib/content-source.mjs';

const docsRoot = path.join(contentRoot, 'docs');
const outFile = path.join(process.cwd(), 'static', 'search-index.json');
const dataFile = path.join(process.cwd(), 'src', 'data', 'resources.json');

const SKIP_SECTIONS = new Set(['legal', 'explore']);

function frontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    data[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return data;
}

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const labels = new Map();
async function collectLabels(dir, prefix = '') {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const file = path.join(dir, entry.name, '_category_.json');
    try {
      const meta = JSON.parse(await readFile(file, 'utf8'));
      if (meta.label) labels.set(rel, meta.label);
    } catch {}
    await collectLabels(path.join(dir, entry.name), rel);
  }
}

const label = (value) => labels.get(value) ?? value.split('/').pop().replaceAll('-', ' ').replace(/(^|\s)\S/g, (m) => m.toUpperCase());

function classify(rel) {
  const parts = rel.split('/');
  if (SKIP_SECTIONS.has(parts[0])) return null;
  const isSectionIndex = /^[^/]+\/index\.mdx?$/.test(rel) || /^[^/]+\/[^/]+\/index\.mdx?$/.test(rel);
  if (isSectionIndex) return null;
  if (parts[0] === 'notes') {
    return {kind: 'notes', group: 'Course Notes', subject: label(parts.slice(0, 2).join('/')), course: label(parts.slice(0, 3).join('/'))};
  }
  if (parts[0] === 'tools') {
    const slug = parts.at(-2) ?? '';
    return {kind: 'tool', group: 'Tools', subject: '', course: label(parts.slice(0, 2).join('/'))};
  }
  return null;
}

await collectLabels(docsRoot);
const files = await walk(docsRoot);
const entries = [];
for (const file of files) {
  const rel = path.relative(docsRoot, file).split(path.sep).join('/');
  const info = classify(rel);
  if (!info) continue;
  const text = await readFile(file, 'utf8');
  const fm = frontMatter(text);
  const slug = (fm.slug || '').trim();
  const dirRel = rel.replace(/\/?index\.mdx?$/, '').replace(/\.mdx?$/, '');
  const url = slug.startsWith('/') ? slug : `/${dirRel}`;
  const repoMatch = text.match(/github\.com\/([A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)/);
  entries.push({
    repo: repoMatch ? repoMatch[1].replace(/\.git$/, '') : '',
    title: fm.title || fm.sidebar_label || dirRel.split('/').pop() || rel,
    description: fm.description || '',
    url: url.endsWith('/') ? url : `${url}/`,
    kind: info.kind,
    group: info.group,
    subject: info.subject,
    course: info.course,
    path: rel,
  });
}

entries.sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title));
await mkdir(path.dirname(outFile), {recursive: true});
const payload = {generatedAt: new Date().toISOString(), entries};
await writeFile(outFile, JSON.stringify(payload, null, 0));
const byUrl = Object.fromEntries(entries.map((entry) => [entry.url, {
  title: entry.title, kind: entry.kind, group: entry.group,
  subject: entry.subject, course: entry.course, repo: entry.repo,
}]));
await writeFile(dataFile, JSON.stringify(byUrl, null, 2));
console.log(`search index: ${entries.length} entries -> ${path.relative(process.cwd(), outFile)}`);
