import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {sortSidebarByStars} from '../lib/sidebar-stars.mjs';
import createStarSortedSidebarGenerator from '../plugins/sidebar-stars.mjs';

const doc = (id) => ({type: 'doc', id});
const category = (label, items, extra = {}) => ({type: 'category', label, items, ...extra});
const snapshots = (values) => Object.fromEntries(Object.entries(values)
  .map(([repository, stars]) => [repository, {info: {stars}}]));

test('recursively ranks categories by deduplicated repository stars, not summed child scores', () => {
  const items = [
    category('Repeated', [
      category('2025', [doc('old')]),
      category('2026', [doc('new')]),
    ]),
    category('Independent', [doc('other')]),
  ];
  const original = structuredClone(items);
  const repositories = new Map([
    ['old', ['OWNER/shared', 'owner/shared']],
    ['new', ['owner/shared']],
    ['other', ['owner/independent']],
  ]);
  const sorted = sortSidebarByStars(items, repositories,
    snapshots({'owner/shared': 6, 'owner/independent': 9}));
  assert.deepEqual(sorted.map(({label}) => label), ['Independent', 'Repeated']);
  assert.deepEqual(sorted[1].items.map(({label}) => label), ['2025', '2026']);
  assert.deepEqual(items, original);
});

test('ranks source documents and all nested levels, counting multiple repository links', () => {
  const items = [category('Course', [
    category('2025', [doc('one')]),
    category('2026', [doc('two'), doc('three')]),
  ])];
  const repositories = new Map([
    ['one', ['owner/a']],
    ['two', ['owner/b']],
    ['three', ['owner/c', 'owner/d']],
  ]);
  const sorted = sortSidebarByStars(items, repositories,
    snapshots({'owner/a': 4, 'owner/b': 1, 'owner/c': 2, 'owner/d': 3}));
  assert.deepEqual(sorted[0].items.map(({label}) => label), ['2026', '2025']);
  assert.deepEqual(sorted[0].items[0].items.map(({id}) => id), ['three', 'two']);
});

test('includes a category linked introduction and deduplicates it against descendants', () => {
  const items = [
    category('Linked', [doc('child')], {link: {type: 'doc', id: 'intro'}, customProps: {keep: true}}),
    category('Generated', [doc('other')], {link: {type: 'generated-index', slug: '/generated'}}),
  ];
  const repositories = new Map([
    ['intro', ['owner/a', 'owner/b']],
    ['child', ['owner/a']],
    ['other', ['owner/c']],
  ]);
  const sorted = sortSidebarByStars(items, repositories,
    snapshots({'owner/a': 5, 'owner/b': 2, 'owner/c': 8}));
  assert.equal(sorted[0].label, 'Generated');
  assert.deepEqual(sorted[1].link, items[0].link);
  assert.deepEqual(sorted[1].customProps, {keep: true, repositoryStats: {stars: 7, forks: 0}});
});

test('keeps the root overview first and sorts equal totals alphabetically, ignoring native order', () => {
  const items = [doc('index'), category('Z', [doc('z')]), category('A', [doc('a')])];
  const repositories = new Map([['z', ['owner/z']], ['a', ['owner/a']]]);
  const sorted = sortSidebarByStars(items, repositories,
    snapshots({'owner/z': 2, 'owner/a': 2}), new Set(['index']));
  assert.equal(sorted[0].id, 'index');
  assert.deepEqual(sorted.slice(1).map(({label}) => label), ['A', 'Z']);
});

test('missing, zero, negative, fractional, and nonnumeric stars rank as zero', () => {
  const values = {'owner/missing': undefined, 'owner/zero': 0, 'owner/negative': -2,
    'owner/fraction': 1.5, 'owner/string': '9', 'owner/infinite': Infinity, 'owner/known': 1};
  const items = Object.keys(values).map(doc);
  const repositories = new Map(Object.keys(values).map((repository) => [repository, [repository]]));
  const sorted = sortSidebarByStars(items, repositories, snapshots(values));
  assert.equal(sorted[0].id, 'owner/known');
  assert.deepEqual(sorted.slice(1).map(({id}) => id), [
    'owner/fraction', 'owner/infinite', 'owner/missing', 'owner/negative', 'owner/string', 'owner/zero',
  ]);
  assert.deepEqual(sortSidebarByStars([...items].reverse(), repositories, {}), sortSidebarByStars(items, repositories, {}));
});

test('ties use fork totals, then open issue totals, then the visible English label', () => {
  const items = [doc('alpha'), doc('beta'), doc('gamma'), doc('delta')];
  const repositories = new Map(items.map(({id}) => [id, [`owner/${id}`]]));
  const data = {
    'owner/alpha': {info: {stars: 2, forks: 1, openIssues: 0}},
    'owner/beta': {info: {stars: 2, forks: 0, openIssues: 99}},
    'owner/gamma': {info: {stars: 2, forks: 1, openIssues: 3}},
    'owner/delta': {info: {stars: 2, forks: 1, openIssues: 3}},
  };
  const labels = new Map([['gamma', 'A Source'], ['delta', 'Z Source']]);
  const sorted = sortSidebarByStars(items, repositories, data, new Set(), labels);
  assert.deepEqual(sorted.map(({id}) => id), ['gamma', 'delta', 'alpha', 'beta']);
});

test('fork and issue totals deduplicate repeated repositories across nested editions', () => {
  const items = [
    category('Repeated', [doc('first'), doc('second')]),
    category('Distinct', [doc('third')]),
  ];
  const repositories = new Map([
    ['first', ['owner/shared']], ['second', ['owner/shared']], ['third', ['owner/other']],
  ]);
  for (const metric of ['forks', 'openIssues']) {
    const data = {
      'owner/shared': {info: {stars: 0, forks: 0, openIssues: 0, [metric]: 2}},
      'owner/other': {info: {stars: 0, forks: 0, openIssues: 0, [metric]: 3}},
    };
    assert.equal(sortSidebarByStars(items, repositories, data)[0].label, 'Distinct');
  }
});

test('exposes the same deduplicated totals on every directory and repository card', () => {
  const items = [
    category('Course', [
      category('2025', [doc('first')]),
      category('2026', [doc('second')]),
    ], {link: {type: 'doc', id: 'intro'}, customProps: {keep: true}}),
    doc('missing'),
  ];
  const repositories = new Map([
    ['intro', ['owner/shared']],
    ['first', ['OWNER/shared', 'owner/extra']],
    ['second', ['owner/shared']],
    ['missing', ['owner/unknown']],
  ]);
  const result = sortSidebarByStars(items, repositories, {
    'owner/shared': {info: {stars: 12, forks: 3}},
    'owner/extra': {info: {stars: 2, forks: 1}},
  });
  assert.deepEqual(result[0].customProps, {
    keep: true, repositoryStats: {stars: 14, forks: 4},
  });
  assert.deepEqual(result[0].items[0].customProps.repositoryStats, {stars: 14, forks: 4});
  assert.deepEqual(result[0].items[0].items[0].customProps.repositoryStats, {stars: 14, forks: 4});
  assert.deepEqual(result[0].items[1].customProps.repositoryStats, {stars: 12, forks: 3});
  assert.deepEqual(result[1].customProps.repositoryStats, {stars: 0, forks: 0});
});

test('equal visible names fall back to stable IDs, not input order', () => {
  const items = [doc('z'), doc('a')];
  const labels = new Map([['z', 'Same Author'], ['a', 'Same Author']]);
  assert.deepEqual(sortSidebarByStars(items, new Map(), {}, new Set(), labels).map(({id}) => id), ['a', 'z']);
});

test('generator reads current sources and snapshots while retaining the native overview and custom IDs', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'sidebar-stars-'));
  try {
    await mkdir(path.join(root, 'notes'), {recursive: true});
    const firstFile = path.join(root, 'notes/first.md');
    await writeFile(firstFile, '[First](https://github.com/Owner/First)');
    await writeFile(path.join(root, 'notes/second.md'), '[Second](https://github.com/Owner/Second)');
    await writeFile(path.join(root, 'notes/index.md'), '# Overview');
    const snapshotPath = path.join(root, 'snapshots.json');
    const saveStars = async (first, second) => writeFile(snapshotPath,
      JSON.stringify({repositories: snapshots({'owner/first': first, 'owner/second': second})}));
    const docs = [
      {id: 'overview', source: '@site/docs/notes/index.md', sourceDirName: 'notes'},
      {id: 'custom-first', source: '@site/docs/notes/first.md', sourceDirName: 'notes'},
      {id: 'custom-second', source: '@site/docs/notes/second.md', sourceDirName: 'notes'},
    ];
    const items = docs.map(({id}) => doc(id));
    const args = {
      item: {type: 'autogenerated', dirName: 'notes'}, docs,
      version: {contentPath: root},
      isCategoryIndex: ({fileName}) => fileName === 'index',
      defaultSidebarItemsGenerator: async () => items,
    };
    const generate = createStarSortedSidebarGenerator({snapshotPath});
    await saveStars(1, 4);
    assert.deepEqual((await generate(args)).map(({id}) => id),
      ['overview', 'custom-second', 'custom-first']);
    await saveStars(5, 4);
    assert.deepEqual((await generate(args)).map(({id}) => id),
      ['overview', 'custom-first', 'custom-second']);
    await writeFile(firstFile, '# First without a repository');
    assert.deepEqual((await generate(args)).map(({id}) => id),
      ['overview', 'custom-second', 'custom-first']);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('Tools use the same aggregation and tie-break rules while pinning their root overview', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tools-sidebar-'));
  try {
    const entries = [
      ['tools/index', 'tools', '# Tools'],
      ['tools/ai-tools/index', 'tools/ai-tools', '# AI Tools'],
      ['tools/ai-tools/plugin/a', 'tools/ai-tools/plugin', '[A](https://github.com/owner/a)'],
      ['tools/ai-tools/plugin/b', 'tools/ai-tools/plugin', '[B](https://github.com/owner/b)'],
    ];
    for (const [id, directory, content] of entries) {
      await mkdir(path.join(root, directory), {recursive: true});
      await writeFile(path.join(root, `${id}.md`), content);
    }
    const snapshotPath = path.join(root, 'snapshot.json');
    await writeFile(snapshotPath, JSON.stringify({repositories: {
      'owner/a': {info: {stars: 1, forks: 0, openIssues: 0}},
      'owner/b': {info: {stars: 1, forks: 1, openIssues: 0}},
    }}));
    const items = [
      category('AI Tools', [category('Plugins', [
        doc('tools/ai-tools/plugin/a'), doc('tools/ai-tools/plugin/b'),
      ])], {link: {type: 'doc', id: 'tools/ai-tools/index'}}),
      doc('tools/index'),
    ];
    const result = await createStarSortedSidebarGenerator({snapshotPath})({
      item: {dirName: 'tools'}, version: {contentPath: root},
      docs: entries.map(([id, sourceDirName]) => ({
        id, sourceDirName, source: `@site/docs/${id}.md`,
      })),
      isCategoryIndex: ({fileName}) => fileName === 'index',
      defaultSidebarItemsGenerator: async () => items,
    });
    assert.equal(result[0].id, 'tools/index');
    assert.deepEqual(result[1].items[0].items.map(({id}) => id),
      ['tools/ai-tools/plugin/b', 'tools/ai-tools/plugin/a']);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
