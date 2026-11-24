import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import remarkRepositoryTabs from '../plugins/remark-repository-tabs.mjs';
import {loadLocalTabSources} from '../lib/local-repository-tabs.mjs';
import {documentViews, resolveDocumentView} from '../src/features/repositories/documents.mjs';
import {parseLatexToc} from '../lib/latex-toc.mjs';
import {contentRoot} from '../lib/content-source.mjs';
import {DEFAULT_PARSE_FRONT_MATTER} from '@docusaurus/utils';

const filename = 'content/repository-tabs/guide.md';
const tab = {id: 'guide', label: 'Reading Guide', file: filename};
const sources = {[filename]: '# Guide\n\n## Sequence\n[Overview](/notes/)\n![Map](/img/map.png)\n[Sequence](#sequence)'};
const file = (tabs) => ({data: {frontMatter: {
  githubRepositories: ['owner/repo'], repositoryTabs: tabs,
}}});

test('Quantum Mechanics TOC preserves all PDF topics, hierarchy, numbers, and printed pages', async () => {
  const tabFile = 'content/repository-tabs/physics/quantum-mechanics/2025-fall/jietexue/quantum-mechanics-notes.toc';
  const sources = loadLocalTabSources();
  const allEntries = parseLatexToc(sources[tabFile]);
  const flatten = (entries) => entries.flatMap((entry) => {
    assert.deepEqual(Object.keys(entry).filter((key) => key !== 'id').sort(), ['children', 'number', 'page', 'title']);
    return [entry, ...flatten(entry.children)];
  });
  assert.equal(allEntries.length, 18);
  assert.equal(flatten(allEntries).length, 54);
  assert.deepEqual(allEntries.map(({number, page}) => `${number}:${page}`), [
    '1:1', '2:1', '3:2', '4:2', '5:5', '6:5', '7:6', '8:6', '9:9',
    '10:11', '11:12', '12:13', '13:17', '14:21', '15:29', '16:32', '17:42', '18:44',
  ]);
  assert.deepEqual(flatten(allEntries).filter(({number}) => number.includes('.'))
    .map(({number, page}) => `${number}:${page}`), [
    '4.1:2', '4.2:3', '8.1:7', '8.2:7', '8.3:8', '8.4:8', '8.5:8', '8.6:9',
    '12.1:14', '12.2:15', '12.3:16', '12.4:17',
    '13.1:17', '13.2:19', '13.2.1:19', '13.2.2:20',
    '14.1:21', '14.2:22', '14.3:23', '14.4:25', '14.5:27', '14.6:28', '14.7:28', '14.7.1:29',
    '15.1:29', '15.2:30', '15.3:32', '16.1:32', '16.2:34', '16.3:36', '16.4:38', '16.5:40',
    '17.1:42', '17.2:43', '17.3:43', '18.1:45',
  ]);
  assert.deepEqual(allEntries.map((entry) => typeof entry === 'string' ? entry : entry.title), [
    'Quantization', "Heisenberg's Breakthrough", "De Broglie's & Schrödinger's Equation",
    "Dirac's Notation", 'Commutator and Anticommutator', 'Compatible Observables',
    'Uncertainty Relation', 'Position and Momentum', 'Schrödinger Equation',
    'Probability Density and Probability Current', 'Exponential Operators and Baker-Hausdorff Lemma',
    'Harmonic Oscillator', 'Gauge Transformations in Electromagnetism', 'Angular Momentum',
    'Discrete Symmetry', 'Approximation Methods', 'Path Integral', 'Scattering Theory',
  ]);
  assert.deepEqual(allEntries[12].children[1].children.map(({title}) => title), ['Landau Gauge', 'Symmetrical Gauge']);
  assert.deepEqual(allEntries[13].children[6].children.map(({title}) => title), ['Clebsch-Gordan Coefficients']);
  assert.equal(allEntries[15].children[0].title, 'Time-independent Perturbation Theory: Non-degenerate Case');
  assert.equal(allEntries[15].children[1].title, 'Time-independent Perturbation Theory: Degenerate Case');
  const data = file([{id: 'toc', label: 'TOC', file: tabFile}]);
  await remarkRepositoryTabs({sources})(null, data);
  assert.equal(data.data.frontMatter.repositoryTabDocuments[0].outline.chapters.length, 18);
  assert.equal(data.data.frontMatter.repositoryTabDocuments[0].outline.chapters[13].id,
    'toc-owner-repo-angular-momentum');
  assert.equal(data.data.frontMatter.repositoryTabDocuments[0].html, undefined);
  assert.equal(data.data.frontMatter.repositoryTabDocuments[0].toc.filter(({level}) => level === 2).length, 18);
  assert.equal(data.data.frontMatter.repositoryTabDocuments[0].toc[14].value, '14 Angular Momentum');
  assert.deepEqual(flatten(data.data.frontMatter.repositoryTabDocuments[0].outline.chapters)
    .map(({number, page}) => `${number}:${page}`),
  flatten(allEntries).map(({number, page}) => `${number}:${page}`));
  const overview = await readFile(path.join(contentRoot, 'docs/notes/physics/quantum-mechanics/2025-fall/jietexue/index.md'), 'utf8');
  assert.ok(overview.includes(`file: ${tabFile}`));
  assert.equal(data.data.frontMatter.repositoryTabDocuments[0].path, tabFile);
  assert.match(overview, /https:\/\/github\.com\/JieteXue\/quantum-mechanics-notes/);
});

test('FAA renders both declared volumes in one TOC tab with a document selector', async () => {
  const filePath = path.join(contentRoot, 'docs/notes/math/fundamental-algebra-analysis/2025-fall-2026-spring/westlake-noter/index.md');
  const overview = await readFile(filePath, 'utf8');
  const {frontMatter} = await DEFAULT_PARSE_FRONT_MATTER({filePath, fileContent: overview});
  const declared = frontMatter.repositoryTabs.find(({id}) => id === 'toc');
  assert.deepEqual(declared.documents.map(({id}) => id), ['volume-i', 'volume-ii']);
  const [first, second] = declared.documents.map(({file}) => file);
  const localSources = loadLocalTabSources();
  assert.match(overview, /id: toc\n\s+label: TOC\n\s+documents:/);
  assert.doesNotMatch(overview, /## Volume I|Basic Logic|Language of Category Theory/);
  assert.match(overview, /## Instructors/);
  assert.match(overview, /## Overview/);
  const data = file([declared]);
  await remarkRepositoryTabs({
    sources: localSources,
    sourceBase: 'https://github.com/owner/site/blob/main/',
  })(null, data);
  const [{documents}] = data.data.frontMatter.repositoryTabDocuments;
  assert.equal(documents.length, 2);
  for (const [index, filename] of [first, second].entries()) {
    assert.ok(overview.includes(`file: ${filename}`));
    assert.equal(documents[index].path, filename);
    assert.ok(documents[index].sourceUrl.endsWith(`/${filename}`));
  }
  const rendered = documents.map((document) =>
    document.html ?? JSON.stringify(document.outline));
  assert.match(rendered[0], /Basic Logic/);
  assert.doesNotMatch(rendered[0], /Language of Category Theory/);
  assert.match(rendered[1], /Language of Category Theory/);
  assert.match(rendered[1], /Fourier transform/i);
  assert.ok(documents[1].toc.some(({id}) => id.startsWith('toc--volume-ii-owner-repo-')));
});

test('a single TOC tab can mix Markdown and LaTeX documents with independent PDF sources and anchors', async () => {
  const tocFile = 'content/repository-tabs/second.toc';
  const pdf = (name) => ({label: name, url: `https://example.com/${name}.pdf`});
  const documents = [
    {id: 'first', label: 'Volume I', file: filename, source: pdf('first')},
    {id: 'second', label: 'Volume II', file: tocFile, source: pdf('second')},
  ];
  const data = file([{id: 'toc', label: 'TOC', documents}]);
  await remarkRepositoryTabs({
    sources: {...sources, [tocFile]: '\\contentsline{section}{\\numberline{1}Guide}{5}'},
  })(null, data);
  const [tab] = data.data.frontMatter.repositoryTabDocuments;
  assert.equal(tab.documents[0].pdfSource.url, pdf('first').url);
  assert.match(tab.documents[0].html, /toc--first-owner-repo-guide/);
  assert.equal(tab.documents[1].outline.source.url, pdf('second').url);
  assert.equal(tab.documents[1].outline.chapters[0].id, 'toc--second-owner-repo-guide');
  assert.equal(tab.documents[1].outline.chapters[0].page, '5');
});

test('rejects ambiguous, empty, duplicate, nested, and colliding document groups', async () => {
  const child = {id: 'first', label: 'First', file: filename};
  for (const tabs of [
    [{id: 'toc', label: 'TOC', documents: []}],
    [{id: 'toc', label: 'TOC', documents: {}}],
    [{id: 'toc', label: 'TOC', file: filename, documents: [child]}],
    [{id: 'toc', label: 'TOC', source: {}, documents: [child]}],
    [{id: 'toc', label: 'TOC', documents: [child, child]}],
    [{id: 'toc', label: 'TOC', documents: [{...child, id: undefined}]}],
    [{id: 'toc', label: 'TOC', documents: [{...child, label: ''}]}],
    [{id: 'toc', label: 'TOC', documents: [{...child, documents: [child]}]}],
    [{id: 'toc', label: 'TOC', documents: [{...child, file: '../private.md'}]}],
    [{id: 'toc', label: 'TOC', documents: [child]}, {...tab, id: 'toc--first'}],
  ]) await assert.rejects(remarkRepositoryTabs({sources})(null, file(tabs)), /Invalid repositoryTabs/);
});

test('LaTeX tabs reuse the outline renderer and validate optional PDF sources', async () => {
  const filename = 'content/repository-tabs/example.toc';
  const sources = {[filename]: '\\contentsline{section}{A \\& B}{7}{section.1}'};
  const source = {label: 'PDF', url: 'https://example.com/notes.pdf'};
  const data = file([{id: 'toc', label: 'TOC', file: filename, source}]);
  await remarkRepositoryTabs({sources, sourceBase: 'https://github.com/owner/site/blob/main/'})(null, data);
  const [document] = data.data.frontMatter.repositoryTabDocuments;
  assert.deepEqual(document.outline.source, source);
  assert.equal(document.outline.chapters[0].title, 'A & B');
  assert.equal(document.sourceUrl, `https://github.com/owner/site/blob/main/${filename}`);
  await assert.rejects(remarkRepositoryTabs({sources})(null,
    file([{id: 'toc', label: 'TOC', file: filename, source: {label: 'Bad', url: 'file:///etc/passwd'}}])),
  /Invalid course outline/);
});

test('renders declared custom tabs with scoped headings and deployment-aware local links', async () => {
  const data = file([tab]);
  await remarkRepositoryTabs({
    sources, baseUrl: '/notes-index/',
    sourceBase: 'https://github.com/owner/site/blob/main/',
  })(null, data);
  const [document] = data.data.frontMatter.repositoryTabDocuments;
  assert.equal(document.id, 'guide');
  assert.equal(document.label, 'Reading Guide');
  assert.equal(document.local, true);
  assert.equal(document.sourceUrl, 'https://github.com/owner/site/blob/main/content/repository-tabs/guide.md');
  assert.match(document.html, /id="guide-owner-repo-sequence"/);
  assert.match(document.html, /href="\/notes-index\/notes\/"/);
  assert.match(document.html, /src="\/notes-index\/img\/map.png"/);
  assert.match(document.html, /href="#guide-owner-repo-sequence"/);
});

test('rejects duplicate/reserved IDs, unknown files, invalid labels, and missing repository context', async () => {
  const transform = remarkRepositoryTabs({sources});
  for (const tabs of [
    [{...tab, id: 'readme'}], [tab, tab], [{...tab, id: undefined}],
    [{...tab, label: ''}], [{...tab, file: '../private.md'}],
    [{...tab, layout: 'unknown'}],
  ]) {
    await assert.rejects(transform(null, file(tabs)), /Invalid repositoryTabs/);
  }
  await assert.rejects(transform(null, file({})), /must be an array/);
  const data = file([tab]);
  data.data.frontMatter.githubRepositories = [];
  await assert.rejects(transform(null, data), /requires a page/);
});

test('custom tab URLs and scoped fragments resolve without changing builtin tab order', () => {
  const views = [...documentViews, {value: 'readme-guide', label: 'Guide'}];
  assert.equal(resolveDocumentView(['owner/repo'], '?view=readme-guide', '', views).view, 'readme-guide');
  assert.equal(resolveDocumentView(['owner/repo'], '', '#readme-guide-owner-repo-notes', views).view, 'readme-guide');
  assert.deepEqual(documentViews.map(({value}) => value),
    ['overview', 'pdf', 'readme', 'contributing', 'license']);
});

test('loads Markdown, LaTeX TOC, and legacy JSON sources, reflecting changes for cache invalidation', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'repository-tabs-'));
  try {
    assert.deepEqual(loadLocalTabSources(root), {});
    await mkdir(path.join(root, 'content/repository-tabs'), {recursive: true});
    await writeFile(path.join(root, filename), '# First');
    await writeFile(path.join(root, 'content/repository-tabs/ignored.txt'), 'Skip');
    assert.deepEqual(loadLocalTabSources(root), {[filename]: '# First'});
    await writeFile(path.join(root, filename), '# Updated');
    assert.deepEqual(loadLocalTabSources(root), {[filename]: '# Updated'});
    await writeFile(path.join(root, 'content/repository-tabs/example.toc.json'), '{"title":"Contents"}');
    await writeFile(path.join(root, 'content/repository-tabs/ignored.json'), '{}');
    assert.equal(Object.keys(loadLocalTabSources(root)).length, 2);
    const tocFile = 'content/repository-tabs/physics/quantum-mechanics/notes.toc';
    await mkdir(path.dirname(path.join(root, tocFile)), {recursive: true});
    await writeFile(path.join(root, tocFile), '\\contentsline{section}{Topic}{1}');
    assert.equal(loadLocalTabSources(root)[tocFile], '\\contentsline{section}{Topic}{1}');
    await writeFile(path.join(root, tocFile), '\\contentsline{section}{Updated}{1}');
    assert.equal(loadLocalTabSources(root)[tocFile], '\\contentsline{section}{Updated}{1}');
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('same course and filename remain independent across terms and note sets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'repository-tab-editions-'));
  try {
    const entries = [
      ['fall-2025-alice', '2025-fall/alice', 'Original notes'],
      ['fall-2026-alice', '2026-fall/alice', 'Revised notes'],
      ['fall-2026-bob', '2026-fall/bob', 'Independent notes'],
    ];
    const documents = [];
    for (const [id, edition, title] of entries) {
      const filename = `content/repository-tabs/physics/quantum-mechanics/${edition}/notes.toc`;
      await mkdir(path.dirname(path.join(root, filename)), {recursive: true});
      await writeFile(path.join(root, filename), `\\contentsline{section}{${title}}{1}`);
      documents.push({id, label: edition, file: filename});
    }
    const sources = loadLocalTabSources(root);
    assert.equal(Object.keys(sources).length, 3);
    const data = file([{id: 'toc', label: 'TOC', documents}]);
    await remarkRepositoryTabs({
      sources, sourceBase: 'https://github.com/owner/site/blob/main/',
    })(null, data);
    const rendered = data.data.frontMatter.repositoryTabDocuments[0].documents;
    assert.deepEqual(rendered.map(({outline}) => outline.chapters[0].title),
      entries.map(([, , title]) => title));
    for (const [index, document] of rendered.entries()) {
      assert.equal(document.path, documents[index].file);
      assert.equal(document.sourceUrl, `https://github.com/owner/site/blob/main/${document.path}`);
      assert.equal(document.scope, `toc--${entries[index][0]}`);
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
