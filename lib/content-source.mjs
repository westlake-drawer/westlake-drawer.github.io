import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const siteRoot = fileURLToPath(new URL('../', import.meta.url));
export const contentRoot = path.resolve(siteRoot, process.env.NOTES_CONTENT_DIR || '.content-source');
export const contentRepository = 'westlake-drawer/notes-index';
export const contentBranch = 'main';
