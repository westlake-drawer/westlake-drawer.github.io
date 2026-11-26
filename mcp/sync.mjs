import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'mcp', 'data');
await mkdir(dataDir, {recursive: true});
await copyFile(path.join(root, 'static', 'search-index.json'), path.join(dataDir, 'search-index.json'));
await writeFile(path.join(dataDir, 'paths.json'), await readFile(path.join(root, 'src', 'data', 'paths.json')));
console.log('mcp data synced');
