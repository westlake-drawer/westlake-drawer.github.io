import {createHash} from 'node:crypto';

const snapshotFiles = new Set([
  'src/data/repository-contributors.json',
  'src/data/repository-documents.json',
]);

export function isSiteInput(filename) {
  if (filename.startsWith('tests/')) return false;
  if (filename.startsWith('.github/')) return filename === '.github/workflows/pages.yml';
  if (!filename.includes('/') && (/\.md$/i.test(filename)
    || /^(LICENSE(?:\..*)?|\.gitignore|\.gitattributes|\.editorconfig)$/.test(filename))) return false;
  // Unknown tracked inputs are included, so new config/assets cannot silently skip publishing.
  return true;
}

function canonicalSnapshot(value) {
  if (Array.isArray(value)) return value.map(canonicalSnapshot);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort()
      .filter((key) => key !== 'updatedAt' && key !== 'syncedAt')
      .map((key) => [key, canonicalSnapshot(value[key])]));
  }
  return value;
}

export function siteFingerprint(files) {
  const hash = createHash('sha256').update('pages-input-v1\0');
  for (const [filename, content] of [...files].filter(([name]) => isSiteInput(name))
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const bytes = snapshotFiles.has(filename)
      ? Buffer.from(JSON.stringify(canonicalSnapshot(JSON.parse(content.toString()))))
      : Buffer.from(content);
    hash.update(`${filename.length}:${filename}:${bytes.length}:`).update(bytes);
  }
  return hash.digest('hex');
}

export function needsPreparation(sourceDigest, published, {event, refresh, force} = {}) {
  return event === 'pull_request' || event === 'schedule' || refresh || force
    || sourceDigest !== published?.sourceDigest;
}

export function needsBuild(buildDigest, published, {event, force} = {}) {
  return event === 'pull_request' || force || buildDigest !== published?.buildDigest;
}
