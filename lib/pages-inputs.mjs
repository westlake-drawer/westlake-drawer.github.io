import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {isSiteInput} from './pages-build.mjs';

export async function collectSiteInputs(engineRoot, contentRoot) {
  const tracked = (cwd) => execFileSync('git', ['ls-files', '-z'], {cwd, encoding: 'utf8'})
    .split('\0').filter(Boolean);
  const files = [
    ...tracked(engineRoot).filter(isSiteInput).map((name) => [name, path.join(engineRoot, name)]),
    ...tracked(contentRoot).filter((name) => /^(docs|content|static)\//.test(name))
      .map((name) => [`content-source/${name}`, path.join(contentRoot, name)]),
  ];
  return Promise.all(files.map(async ([name, filename]) => [name, await readFile(filename)]));
}
