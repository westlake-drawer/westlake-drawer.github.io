import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, writeFile, rm, readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {collectSiteInputs} from '../lib/pages-inputs.mjs';
import {siteFingerprint} from '../lib/pages-build.mjs';
import legacyProjectRedirects, {redirectHtml} from '../plugins/legacy-project-redirects.mjs';

test('build planning detects both repositories without including content-repository documentation or control files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'content-boundary-'));
  try {
    const engine = path.join(root, 'engine');
    const content = path.join(root, 'content');
    for (const directory of [engine, content]) {
      await mkdir(directory);
      execFileSync('git', ['init', '--quiet'], {cwd: directory});
    }
    const save = async (directory, filename, value) => {
      await mkdir(path.dirname(path.join(directory, filename)), {recursive: true});
      await writeFile(path.join(directory, filename), value);
      execFileSync('git', ['add', filename], {cwd: directory});
    };
    await save(engine, 'src/app.js', 'engine');
    await save(engine, 'README.md', 'engine guide');
    await save(content, 'docs/research/index.md', '# Research');
    await save(content, 'content/repository-tabs/notes.toc', 'outline');
    await save(content, 'static/map.webp', 'image');
    await save(content, 'README.md', 'author guide');
    await save(content, 'package.json', '{}');
    const fingerprint = async () => siteFingerprint(await collectSiteInputs(engine, content));
    const before = await fingerprint();
    await save(content, 'README.md', 'updated author guide');
    await save(content, 'package.json', '{"ignored":true}');
    assert.equal(await fingerprint(), before);
    await save(content, 'docs/research/index.md', '# Updated research');
    const edited = await fingerprint();
    assert.notEqual(edited, before);
    await save(engine, 'src/app.js', 'updated engine');
    assert.notEqual(await fingerprint(), edited);
    const withDocument = await fingerprint();
    await rm(path.join(content, 'docs/research/index.md'));
    execFileSync('git', ['add', '-u'], {cwd: content});
    assert.notEqual(await fingerprint(), withDocument);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('legacy project routes redirect to the root domain without losing tab queries or fragments', async () => {
  assert.match(redirectHtml('/notes/math/'), /location\.replace\("\/notes\/math\/"\+location.search\+location.hash\)/);
  assert.doesNotMatch(redirectHtml('/</script>/'), /location\.replace\("\/<\/script>/);
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-paths-'));
  try {
    await legacyProjectRedirects().postBuild({
      outDir: root, routesPaths: ['/', '/notes/math/', '/404.html'],
    });
    assert.match(await readFile(path.join(root, 'notes-index/index.html'), 'utf8'), /location.replace/);
    assert.match(await readFile(path.join(root, 'notes-index/notes/math/index.html'), 'utf8'), /\/notes\/math\//);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
