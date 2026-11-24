import test from 'node:test';
import assert from 'node:assert/strict';
import {siteFingerprint, needsBuild, needsPreparation} from '../lib/pages-build.mjs';

test('site fingerprints ignore repository documentation but include nested content, code, config, and assets', () => {
  const base = [['docs/tools/index.md', '# Tools'], ['README.md', '# Repository']];
  const digest = siteFingerprint(base);
  assert.equal(siteFingerprint([...base.slice(0, 1), ['README.md', '# Changed']]), digest);
  assert.equal(siteFingerprint(base.toReversed()), digest);
  for (const name of ['docs/tools/new.md', 'content/toc.toc', 'src/x.js', 'static/logo.svg',
    'plugins/x.mjs', 'lib/x.mjs', 'scripts/x.mjs', 'package-lock.json', 'sidebars.js',
    'docusaurus.config.js', '.github/workflows/pages.yml', 'new-build-helper.mjs', '.browserslistrc']) {
    assert.notEqual(siteFingerprint([...base, [name, 'new']]), digest, name);
  }
  assert.notEqual(siteFingerprint([]), digest);
});

test('snapshot freshness timestamps and object key ordering do not cause pointless builds', () => {
  const file = 'src/data/repository-documents.json';
  const snapshot = {repositories: {'owner/repo': {
    status: 'ready', syncedAt: 'old', html: '<p>README</p>',
    documents: {license: {status: 'missing', syncedAt: 'old'}},
  }}};
  const digest = siteFingerprint([[file, JSON.stringify(snapshot)]]);
  snapshot.repositories['owner/repo'].syncedAt = 'new';
  snapshot.repositories['owner/repo'].documents.license.syncedAt = 'new';
  assert.equal(siteFingerprint([[file, JSON.stringify(snapshot)]]), digest);
  snapshot.repositories['owner/repo'].stale = true;
  assert.notEqual(siteFingerprint([[file, JSON.stringify(snapshot)]]), digest);
  assert.notEqual(siteFingerprint([[file, '{"repositories":{}}']]), digest);
  const contributorFile = 'src/data/repository-contributors.json';
  const before = siteFingerprint([[contributorFile, '{"updatedAt":"old","info":{"stars":1,"forks":0}}']]);
  assert.equal(siteFingerprint([[contributorFile, '{"info":{"forks":0,"stars":1},"updatedAt":"new"}']]), before);
  assert.notEqual(siteFingerprint([[contributorFile, '{"info":{"forks":0,"stars":2},"updatedAt":"new"}']]), before);
  assert.notEqual(siteFingerprint([['docs/x.md', 'updatedAt: old']]),
    siteFingerprint([['docs/x.md', 'updatedAt: new']]));
});

test('unchanged manual runs skip preparation; daily refresh and PR validation still run', () => {
  const published = {sourceDigest: 'same', buildDigest: 'effective'};
  assert.equal(Boolean(needsPreparation('same', published)), false);
  assert.equal(needsPreparation('different', published), true);
  assert.equal(needsPreparation('same', {}), true);
  for (const options of [{event: 'schedule'}, {event: 'pull_request'}, {refresh: true}, {force: true}]) {
    assert.equal(needsPreparation('same', published, options), true);
  }
  assert.equal(Boolean(needsBuild('effective', published, {event: 'schedule'})), false);
  assert.equal(Boolean(needsBuild('effective', published, {refresh: true})), false);
  assert.equal(needsBuild('changed', published), true);
  assert.equal(needsBuild('effective', published, {event: 'pull_request'}), true);
  assert.equal(needsBuild('effective', published, {force: true}), true);
  assert.equal(needsBuild('effective', {}), true);
});
