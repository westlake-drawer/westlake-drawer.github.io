import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {cachePdf, maxPdfBytes, pdfAssetPath} from '../lib/pdf-previews.mjs';

const source = {label: 'Notes', url: 'https://example.org/notes.pdf'};
const pdf = '%PDF-1.7\nlocal test';

test('PDF previews cache validated bytes, skip fresh downloads and revalidate expired ETags', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pdf-preview-'));
  try {
    let calls = 0;
    const fetchImpl = async (_url, {headers}) => {
      calls++;
      if (calls === 1) return new Response(pdf, {headers: {etag: '"v1"'}});
      assert.equal(headers['If-None-Match'], '"v1"');
      return new Response(null, {status: 304});
    };
    const asset = await cachePdf(source, directory, {fetchImpl, now: 0});
    assert.equal(asset, pdfAssetPath(source.url));
    assert.equal(await readFile(path.join(directory, asset), 'utf8'), pdf);
    await cachePdf(source, directory, {fetchImpl, now: 1000});
    assert.equal(calls, 1);
    await cachePdf(source, directory, {fetchImpl, now: 86_400_001});
    assert.equal(calls, 2);
    await cachePdf(source, directory, {
      now: 172_800_002, fetchImpl: async () => {throw new Error('Offline');},
    });
    assert.equal(await readFile(path.join(directory, asset), 'utf8'), pdf);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('PDF previews reject insecure URLs, HTML, HTTP errors and oversized bodies', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pdf-preview-'));
  try {
    await assert.rejects(cachePdf({...source, url: 'http://example.org/a.pdf'}, directory), /HTTPS/);
    for (const response of [
      new Response('<html>Not a PDF</html>'),
      new Response(null, {status: 404}),
      new Response(pdf, {headers: {'content-length': `${maxPdfBytes + 1}`}}),
      new Response(new Uint8Array(maxPdfBytes + 1)),
    ]) {
      await assert.rejects(cachePdf(source, directory, {fetchImpl: async () => response}));
    }
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
