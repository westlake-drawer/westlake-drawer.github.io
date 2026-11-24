import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import path from 'node:path';
import {validatePdfSource} from './course-outline.mjs';

export const maxPdfBytes = 32 * 1024 * 1024;

export function pdfAssetPath(url) {
  return `pdf-previews/${createHash('sha256').update(url).digest('hex')}.pdf`;
}

export async function cachePdf(source, directory, {fetchImpl = fetch, now = Date.now()} = {}) {
  validatePdfSource(source);
  const asset = pdfAssetPath(source.url);
  const filename = path.join(directory, asset);
  let previous;
  try {
    previous = JSON.parse(await readFile(`${filename}.json`, 'utf8'));
    await readFile(filename);
  } catch {
    previous = undefined;
  }
  if (previous && now - previous.checkedAt < 24 * 60 * 60 * 1000) return asset;
  const headers = previous?.etag ? {'If-None-Match': previous.etag} : {};
  try {
    const response = await fetchImpl(source.url, {headers, signal: AbortSignal.timeout(30_000)});
    if (response.status !== 304 || !previous) {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (Number(response.headers.get('content-length')) > maxPdfBytes) {
        throw new Error('PDF exceeds the 32 MB preview limit');
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > maxPdfBytes) {
          throw new Error('PDF exceeds the 32 MB preview limit');
        }
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks);
      if (!bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))) {
        throw new Error('The source did not return a PDF');
      }
      await mkdir(path.dirname(filename), {recursive: true});
      await writeFile(`${filename}.tmp`, bytes);
      await rename(`${filename}.tmp`, filename);
      previous = {etag: response.headers.get('etag')};
    }
    await writeFile(`${filename}.json`, JSON.stringify({...previous, checkedAt: now}));
    return asset;
  } catch (error) {
    if (previous) {
      console.warn(`[PDF preview] Using cached PDF for ${source.url}: ${error.message}`);
      return asset;
    }
    throw error;
  }
}
