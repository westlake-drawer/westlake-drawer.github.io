import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {contentRoot} from '../lib/content-source.mjs';
import {DEFAULT_PARSE_FRONT_MATTER} from '@docusaurus/utils';
import {loadLocalTabSources} from '../lib/local-repository-tabs.mjs';

const root = contentRoot;
const notesRoot = path.join(root, 'docs/notes');
const publishedSlugs = [
  '/notes/chemistry/general-chemistry',
  '/notes/math/calculus',
  '/notes/math/fundamental-algebra-analysis',
  '/notes/math/linear-algebra',
  '/notes/math/measure-theory-real-analysis',
  '/notes/math/ordinary-differential-equations',
  '/notes/math/partial-differential-equations',
  '/notes/math/probability-theory',
  '/notes/physics/quantum-mechanics',
];

async function introductions() {
  const filenames = await readdir(notesRoot, {recursive: true});
  return Promise.all(filenames.filter((filename) =>
    filename.split(path.sep).length > 2 && filename.endsWith('.md')).map(async (filename) => {
    const filePath = path.join(notesRoot, filename);
    const fileContent = await readFile(filePath, 'utf8');
    return {
      parts: filename.split(path.sep),
      ...(await DEFAULT_PARSE_FRONT_MATTER({filePath, fileContent})),
    };
  }));
}

test('note introductions use subject/course/term/source directories and preserve published URLs', async () => {
  const pages = await introductions();
  const slugs = pages.map(({frontMatter}) => frontMatter.slug).filter(Boolean);
  for (const slug of publishedSlugs) assert.ok(slugs.includes(slug), slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const {parts, frontMatter} of pages) {
    assert.equal(parts.length, 5, parts.join('/'));
    assert.equal(parts[4], 'index.md');
    assert.match(parts[2], /^(?:undated|\d{4}-(?:fall|spring)(?:-\d{4}-(?:fall|spring))?)$/);
    assert.ok(frontMatter.title);
    assert.ok(frontMatter.sidebar_label);
    assert.equal(frontMatter.sidebar_position, undefined);
  }
});

test('course and term listing routes are distinct from legacy introduction routes', async () => {
  const pages = await introductions();
  const routes = new Set(publishedSlugs);
  const categories = new Set();
  for (const {parts} of pages) {
    for (const depth of [2, 3]) {
      const directory = parts.slice(0, depth).join('/');
      if (categories.has(directory)) continue;
      categories.add(directory);
      const category = JSON.parse(await readFile(path.join(notesRoot, directory, '_category_.json'), 'utf8'));
      assert.ok(category.label);
      assert.equal(category.position, undefined);
      assert.equal(category.link.type, 'generated-index');
      assert.equal(category.link.slug, `/notes/${directory}${depth === 2 ? '/editions' : ''}`);
      assert.ok(!routes.has(category.link.slug), category.link.slug);
      routes.add(category.link.slug);
    }
  }
});

test('local tab sources mirror the owning note-set directory', async () => {
  const sources = loadLocalTabSources();
  const pages = await introductions();
  const prefixes = pages.map(({parts}) =>
    `content/repository-tabs/${parts.slice(0, -1).join('/')}/`);
  for (const filename of Object.keys(sources)) {
    assert.ok(prefixes.some((prefix) => filename.startsWith(prefix)), filename);
  }
  for (const {frontMatter} of pages) {
    for (const tab of frontMatter.repositoryTabs ?? []) {
      for (const document of tab.documents ?? [tab]) {
        assert.ok(Object.hasOwn(sources, document.file), document.file);
      }
    }
  }
});

test('contributed tools have independent introductions and use automatic repository documents', async () => {
  const filePath = path.join(root, 'docs/tools/ai-tools/plugin/chelate-shell/index.md');
  const fileContent = await readFile(filePath, 'utf8');
  const {frontMatter} = await DEFAULT_PARSE_FRONT_MATTER({filePath, fileContent});
  assert.equal(frontMatter.slug, '/tools/chelate-shell');
  assert.equal(frontMatter.sidebar_position, undefined);
  assert.equal(frontMatter.repositoryTabs, undefined);
  assert.match(fileContent, /https:\/\/github\.com\/JiamingShi-JsPhys\/chelate-shell/);
  assert.doesNotMatch(fileContent, /\[reference:\d+\]/);
  const category = JSON.parse(await readFile(path.join(root, 'docs/tools/ai-tools/plugin/_category_.json'), 'utf8'));
  assert.equal(category.label, 'Plugins');
  assert.equal(category.position, undefined);
});
