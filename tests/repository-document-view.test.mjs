import test from 'node:test';
import assert from 'node:assert/strict';
import {getDocumentViews, getPdfDocuments, resolveCustomDocument, resolveDocumentView} from '../src/features/repositories/documents.mjs';

const repositories = ['owner/first', 'owner/second'];

test('defaults to Overview and validates requested views and repositories', () => {
  assert.deepEqual(resolveDocumentView(repositories, '', ''), {
    view: 'overview', repository: 'owner/first',
  });
  assert.deepEqual(resolveDocumentView(repositories, '?view=invalid&repo=unknown/repo', ''), {
    view: 'overview', repository: 'owner/first',
  });
});

test('refreshable URLs select README, Contributing, and License for the requested repository', () => {
  for (const view of ['readme', 'contributing', 'license']) {
    assert.deepEqual(resolveDocumentView(repositories, `?view=${view}&repo=owner%2Fsecond`, ''), {
      view, repository: 'owner/second',
    });
  }
});

test('scoped document anchors select the matching tab and repository', () => {
  assert.deepEqual(resolveDocumentView(repositories, '', '#license-owner-second-mit'), {
    view: 'license', repository: 'owner/second',
  });
  assert.deepEqual(resolveDocumentView(repositories, '?view=license', '#readme-owner-first-notes'), {
    view: 'readme', repository: 'owner/first',
  });
  assert.equal(resolveDocumentView(repositories, '', '#overview').view, 'overview');
});

const customDocuments = [
  {id: 'guide', label: 'Guide'},
  {id: 'toc', label: 'TOC', documents: [
    {id: 'volume-i', label: 'Volume I', scope: 'toc--volume-i'},
    {id: 'volume-ii', label: 'Volume II', scope: 'toc--volume-ii'},
  ]},
];

test('TOC appears between Overview and README regardless of custom declaration order', () => {
  assert.deepEqual(getDocumentViews(customDocuments).map(({value}) => value),
    ['overview', 'toc', 'readme', 'contributing', 'license', 'guide']);
  assert.deepEqual(getDocumentViews().map(({value}) => value),
    ['overview', 'readme', 'contributing', 'license']);
});

test('document groups default to their first document and restore query selections', () => {
  assert.equal(resolveCustomDocument(customDocuments, 'toc', '', '').selectedDocument, 'volume-i');
  assert.equal(resolveCustomDocument(customDocuments, 'toc', '?document=volume-ii', '').documentData.label, 'Volume II');
  assert.equal(resolveCustomDocument(customDocuments, 'toc', '?document=invalid', '').selectedDocument, 'volume-i');
  assert.equal(resolveCustomDocument(customDocuments, 'guide', '', '').documentData.id, 'guide');
  assert.equal(resolveCustomDocument(customDocuments, 'readme', '', '').documentData, undefined);
});

test('scoped grouped anchors select the correct tab and document, overriding a stale query', () => {
  const hash = '#toc--volume-ii-owner-first-table-of-contents';
  const views = getDocumentViews(customDocuments);
  assert.equal(resolveDocumentView(repositories, '', hash, views).view, 'toc');
  assert.equal(resolveCustomDocument(customDocuments, 'toc', '?document=volume-i', hash).selectedDocument, 'volume-ii');
  const overlapping = [{id: 'toc', documents: [
    {id: 'a', scope: 'toc--a'}, {id: 'a-b', scope: 'toc--a-b'},
  ]}];
  assert.equal(resolveCustomDocument(overlapping, 'toc', '', '#toc--a-b-owner-first-notes').selectedDocument, 'a-b');
});

test('PDF previews reuse declared sources, deduplicate URLs and restore multi-document selection', () => {
  const source = {label: 'Volume I PDF', url: 'https://example.org/one.pdf'};
  const tabs = [{id: 'toc', documents: [
    {id: 'one', scope: 'toc--one', pdfSource: source},
    {id: 'duplicate', scope: 'toc--duplicate', outline: {source}},
    {id: 'two', scope: 'toc--two', outline: {source: {
      label: 'Volume II PDF', url: 'https://example.org/two.pdf',
    }}},
  ]}];
  assert.deepEqual(getPdfDocuments(tabs).map(({id}) => id), ['toc--one', 'toc--two']);
  const views = getDocumentViews(tabs);
  assert.deepEqual(views.map(({value}) => value),
    ['overview', 'toc', 'pdf', 'readme', 'contributing', 'license']);
  assert.equal(resolveDocumentView(repositories, '?view=pdf', '', views).view, 'pdf');
  assert.equal(resolveCustomDocument(tabs, 'pdf', '', '').selectedDocument, 'toc--one');
  assert.equal(resolveCustomDocument(tabs, 'pdf', '?document=toc--two', '')
    .documentData.pdfSource.url, 'https://example.org/two.pdf');
  assert.ok(!getDocumentViews(customDocuments).some(({value}) => value === 'pdf'));
});
