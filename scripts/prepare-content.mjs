import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {contentRoot, contentRepository, contentBranch} from '../lib/content-source.mjs';

const update = process.argv.includes('--update');
if (process.argv.slice(2).some((argument) => argument !== '--update')) {
  throw new Error('Usage: node scripts/prepare-content.mjs [--update]');
}
if (!existsSync(contentRoot)) {
  if (process.env.NOTES_CONTENT_DIR) throw new Error(`Content checkout not found: ${contentRoot}`);
  execFileSync('git', ['clone', '--branch', contentBranch,
    `https://github.com/${contentRepository}.git`, contentRoot], {stdio: 'inherit'});
} else if (update) {
  if (execFileSync('git', ['status', '--porcelain'], {cwd: contentRoot, encoding: 'utf8'}).trim()) {
    throw new Error('Content checkout has local changes; commit them before updating.');
  }
  execFileSync('git', ['pull', '--ff-only'], {cwd: contentRoot, stdio: 'inherit'});
}
if (!existsSync(path.join(contentRoot, 'docs'))) {
  throw new Error(`Missing docs directory in content checkout: ${contentRoot}`);
}
console.log(`Content source: ${contentRoot}`);
